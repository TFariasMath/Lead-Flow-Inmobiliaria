"""
Lead Flow - Service Layer
=========================
Capa de servicios que encapsula toda la lógica de dominio y negocio.
Las vistas (api.py) delegan en esta capa para mantener el código limpio y testeable.

Decisiones técnicas:
- Concurrencia: Se usa select_for_update() para evitar que dos leads con 
  el mismo email se creen al mismo tiempo desde distintas fuentes.
- Persistencia: Cada paso del proceso se registra en WebhookLog para trazabilidad.
"""

import logging             # Registro de errores y actividad técnica
from typing import Optional # Sugerencias de tipo para mejor legibilidad

from django.contrib.auth.models import User       # Modelo de usuarios (vendedores)
from django.db import transaction, IntegrityError # Gestión de transacciones y errores de BD
from django.utils import timezone                  # Manejo de fechas con zona horaria
from django_q.tasks import async_task             # Motor de tareas en segundo plano

from .models import Lead, Source, Interaction, WebhookLog, RoundRobinState, SystemAlert

# Configuración del logger para seguimiento en consola
logger = logging.getLogger(__name__)


# ─── Procesador de Webhooks (Ingesta de Leads) ───────────────────────────────

class WebhookProcessor:
    """
    Cerebro del sistema de captura. Se encarga de recibir basura (JSON crudo)
    y transformarla en un Lead calificado y asignado.
    """

    # Campos que el sistema puede actualizar si el lead ya existe pero no tiene datos
    MERGEABLE_FIELDS = ["first_name", "last_name", "phone", "address", "company"]

    def __init__(self, source_type: str, raw_body: dict):
        self.source_type = source_type # Ej: 'facebook', 'web-v1'
        self.raw_body = raw_body       # El JSON tal cual llegó de internet
        self.webhook_log: Optional[WebhookLog] = None

    def create_log(self) -> WebhookLog:
        """
        Paso Inicial: Guarda una copia de seguridad de la petición.
        Si algo falla después, el administrador tiene la evidencia aquí.
        """
        self.webhook_log = WebhookLog.objects.create(
            source_type=self.source_type,
            raw_body=self.raw_body,
            status=WebhookLog.Status.PENDING,
        )
        return self.webhook_log

    def process(self) -> WebhookLog:
        """
        Orquestador del flujo: Extraer -> Validar -> Resolver Entidad -> Automatizar.
        """
        if not self.webhook_log:
            self.create_log()

        try:
            # 1. Identificar la clave de identidad (Email)
            email = self._extract_email()
            if not email:
                raise ValueError("No se encontró un email válido en el payload.")

            # 2. Identificar el origen
            source = self._resolve_source()
            
            # 3. Preparar los datos sanitizados
            lead_data = self._extract_lead_data()

            # 4. Sincronizar con la base de datos (Upsert)
            lead, interaction = self._upsert_lead(email, source, lead_data)

            # 5. Actualizar log con éxito
            self.webhook_log.status = WebhookLog.Status.SUCCESS
            self.webhook_log.lead = lead
            self.webhook_log.processed_at = timezone.now()
            self.webhook_log.save()

            logger.info(f"Éxito: Lead {lead.id} capturado desde {self.source_type}")

        except Exception as exc:
            # Si algo falla, el log se marca como error para revisión manual
            self.webhook_log.status = WebhookLog.Status.FAILED
            self.webhook_log.error_message = str(exc)
            self.webhook_log.processed_at = timezone.now()
            self.webhook_log.save()
            logger.error(f"Error procesando webhook: {exc}")

        return self.webhook_log

    def _extract_email(self) -> Optional[str]:
        """
        Busca el email intentando varias combinaciones comunes de nombres de campo.
        """
        body = self.webhook_log.edited_body or self.raw_body
        # Intentamos llaves comunes para máxima compatibilidad
        for key in ("email", "Email", "EMAIL", "correo", "mail"):
            if key in body and body[key]:
                val = body[key]
                if isinstance(val, str):
                    return val.strip().lower() # Normalizamos a minúsculas
        return None

    def _resolve_source(self) -> Source:
        """Garantiza que la fuente exista en nuestro catálogo."""
        source, _ = Source.objects.get_or_create(
            slug=self.source_type.lower().strip(),
            defaults={"name": self.source_type.title()},
        )
        return source

    def _safe_str(self, value, max_length=None) -> str:
        """Sanitización: Convierte cualquier dato a texto seguro y trunca si es necesario."""
        if value is None: return ""
        
        # Si envían un objeto/lista por error, lo convertimos a JSON string
        if isinstance(value, (dict, list)):
            import json
            val_str = json.dumps(value, ensure_ascii=False)
        else:
            val_str = str(value).strip()
            
        if max_length and len(val_str) > max_length:
            return val_str[:max_length]
        return val_str

    def _extract_lead_data(self) -> dict:
        """
        Extrae y normaliza los campos de contacto del JSON.
        Mapea nombres en español (nombre, apellido) a los campos del modelo.
        """
        body = self.webhook_log.edited_body or self.raw_body
        return {
            "first_name": self._safe_str(body.get("first_name", body.get("nombre", "")), 150),
            "last_name": self._safe_str(body.get("last_name", body.get("apellido", "")), 150),
            "phone": self._safe_str(body.get("phone", body.get("telefono", body.get("tel", ""))), 50),
            "address": self._safe_str(body.get("address", body.get("direccion", ""))), # TextField (sin límite)
            "company": self._safe_str(body.get("company", body.get("empresa", "")), 200),
        }

    def _upsert_lead(self, email: str, source: Source, data: dict):
        """
        Lógica de 'Update or Insert' atómica.
        Utiliza bloqueos de base de datos para garantizar la integridad en alta concurrencia.
        """
        try:
            with transaction.atomic():
                # select_for_update() bloquea la fila en PostgreSQL hasta que termine la transacción.
                # Esto evita que otro proceso intente actualizar el mismo lead simultáneamente.
                try:
                    lead = (
                        Lead.objects
                        .select_for_update()
                        .get(original_email=email)
                    )
                    # El lead ya existe -> Solo llenamos los campos que estén vacíos
                    self._merge_fields(lead, data)
                    lead.save()

                except Lead.DoesNotExist:
                    # El lead es nuevo -> Lo creamos y disparamos automatizaciones
                    lead = Lead.objects.create(
                        original_email=email,
                        contact_email=email,
                        first_source=source,
                        **{k: v for k, v in data.items() if v},
                    )
                    
                    # 1. Asignación automática a un vendedor (Carrusel)
                    LeadDistributionService.assign(lead)
                    
                    # 2. Email de bienvenida (si tiene buen score de completitud)
                    if getattr(lead, 'score', 0) >= 70:
                        async_task('leads.tasks.task_send_welcome_email', str(lead.id))

                # Registrar el evento en el historial (Timeline)
                interaction = Interaction.objects.create(
                    lead=lead,
                    source=source,
                    raw_payload=self.raw_body,
                )
                return lead, interaction

        except IntegrityError:
            # Caso borde: Dos procesos intentaron crear el mismo email exacto a la milésima.
            # Capturamos el error de integridad y simplemente recuperamos el que ganó la carrera.
            lead = Lead.objects.get(original_email=email)
            interaction = Interaction.objects.create(lead=lead, source=source, raw_payload=self.raw_body)
            return lead, interaction

    def _merge_fields(self, lead: Lead, data: dict):
        """
        Política de 'Merge No Destructivo'.
        NUNCA sobreescribe datos que el vendedor ya pudo haber corregido manualmente.
        Solo llena 'huecos' (campos vacíos).
        """
        for field in self.MERGEABLE_FIELDS:
            current_value = getattr(lead, field, "")
            new_value = data.get(field, "")
            if not current_value and new_value:
                setattr(lead, field, new_value)


class ReprocessWebhook:
    """
    Servicio para re-ejecutar un webhook que falló (ej: por falta de datos).
    """
    @staticmethod
    def reprocess(webhook_log: WebhookLog, edited_body: dict, user=None) -> WebhookLog:
        """Guarda los cambios realizados por el admin y vuelve a procesar."""
        webhook_log.edited_body = edited_body
        webhook_log.edited_by = user
        webhook_log.status = WebhookLog.Status.PENDING
        webhook_log.error_message = ""
        webhook_log.save()

        processor = WebhookProcessor(source_type=webhook_log.source_type, raw_body=webhook_log.raw_body)
        processor.webhook_log = webhook_log
        return processor.process()


class LeadDistributionService:
    """
    Sistema de reparto equitativo de leads (Carrusel / Round Robin).
    """

    @staticmethod
    def assign(lead: Lead) -> Lead:
        """
        Asigna el lead al siguiente vendedor disponible.
        """
        # 1. Identificar quiénes están aptos para recibir leads hoy
        active_vendors = list(User.objects.filter(
            is_active=True, 
            is_staff=False, # Solo vendedores, no admins
            vendor_profile__is_available_for_leads=True # Solo si están 'en línea'
        ).order_by('id'))
        
        if not active_vendors:
            logger.warning(f"No hay vendedores disponibles para el lead {lead.id}")
            SystemAlert.objects.create(
                level=SystemAlert.Level.CRITICAL,
                title="Fallo de Asignación: Escasez de Vendedores",
                description=f"El lead {lead.original_email} ha quedado sin asignar porque no hay vendedores activos y disponibles en el sistema.",
                content_type="Lead",
                object_id=str(lead.id)
            )
            return lead

        # 2. Gestionar el turno de forma atómica para evitar asignaciones dobles
        with transaction.atomic():
            # Singleton que guarda quién fue el último en recibir un lead
            state = RoundRobinState.objects.select_for_update().get_or_create(id=1)[0]
            
            next_vendor = active_vendors[0] # Por defecto, el primero de la lista
            
            if state.last_assigned_user:
                # Buscar la posición del último vendedor asignado
                last_index = -1
                for i, vendor in enumerate(active_vendors):
                    if vendor.id == state.last_assigned_user.id:
                        last_index = i
                        break
                
                # El siguiente es el (i + 1), volviendo a 0 si llegamos al final de la lista
                next_index = (last_index + 1) % len(active_vendors)
                next_vendor = active_vendors[next_index]
            
            # 3. Aplicar asignación
            lead.assigned_to = next_vendor
            lead.save(update_fields=['assigned_to'])
            
            # 4. Actualizar el estado para la próxima vez
            state.last_assigned_user = next_vendor
            state.save()
            
            # 5. Notificar al vendedor mediante tarea asíncrona
            async_task('leads.tasks.task_send_vendor_alert', str(lead.id), next_vendor.id)
        
        return lead


class BrochureService:
    """
    Servicio especializado en la orquestación de materiales de marketing (PDF/HTML).
    Centraliza la lógica de previsualización y generación técnica.
    """

    @staticmethod
    def get_mock_lead_for_user(user) -> object:
        """
        Crea un objeto simulado de Lead para que el motor de brochures 
        tenga datos que renderizar (ej: nombre del asesor).
        """
        class MockUser:
            def __init__(self, u):
                self.username = getattr(u, 'username', 'asesor')
                self.email = getattr(u, 'email', 'asesor@leadflow.dev')
                self.first_name = getattr(u, 'first_name', '')
                self.last_name = getattr(u, 'last_name', '')
            def get_full_name(self):
                return f"{self.first_name} {self.last_name}".strip() or self.username

        class MockLead:
            def __init__(self, u):
                self.first_name = "Inversionista"
                self.assigned_to = MockUser(u)
        
        return MockLead(user)

    @staticmethod
    def validate_jwt_token(token: str) -> Optional[User]:
        """
        Valida un token JWT de forma manual (útil para iframes y descargas directas).
        """
        from rest_framework_simplejwt.tokens import AccessToken
        
        if not token: return None
        if token.startswith('Bearer '):
            token = token.split(' ')[1]

        try:
            valid_token = AccessToken(token)
            user_id = valid_token['user_id']
            return User.objects.get(id=user_id)
        except Exception as e:
            logger.error(f"Error validando token de brochure: {e}")
            return None

    @classmethod
    def get_preview_html(cls, campaign, user) -> str:
        """
        Genera el HTML del brochure para previsualización.
        """
        from .utils_pdf import get_brochure_context
        from django.template.loader import render_to_string
        
        mock_lead = cls.get_mock_lead_for_user(user)
        context = get_brochure_context(mock_lead, campaign)
        context['is_preview'] = True
        
        return render_to_string('leads/brochure_template.html', context)

    @classmethod
    def generate_pdf_content(cls, campaign, user) -> tuple[Optional[bytes], str]:
        """
        Genera el binario del PDF y retorna (contenido, nombre_archivo).
        """
        from .utils_playwright import generate_campaign_brochure_playwright
        
        mock_lead = cls.get_mock_lead_for_user(user)
        pdf_bytes = generate_campaign_brochure_playwright(mock_lead, campaign)
        
        date_str = timezone.now().strftime("%Y-%m-%d")
        clean_name = "".join([c for c in campaign.name if c.isalnum() or c in (' ', '_')]).replace(' ', '_')
        filename = f"Brochure_{clean_name}_{date_str}.pdf"
        
        return pdf_bytes, filename
