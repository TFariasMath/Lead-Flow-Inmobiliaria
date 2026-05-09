"""
Lead Flow - Models
==================
Modelos principales del sistema de gestión de leads inmobiliarios.

Decisiones de diseño:
- original_email es INMUTABLE y con UNIQUE constraint. Es la clave de
  identidad usada para resolver webhooks y evitar duplicados.
- contact_email es editable por el vendedor para comunicación real.
- Se usa django-simple-history para auditoría automática de cambios.
"""

import uuid  # Utilizado para generar identificadores únicos universales (UUID)
from django.db import models  # Motor de base de datos de Django
from django.contrib.auth.models import User  # Modelo de usuario estándar de Django
from simple_history.models import HistoricalRecords  # Plugin para auditoría de cambios en modelos


# ─── Catálogo de Fuentes ──────────────────────────────────────────────────────

class Source(models.Model):
    """
    Catálogo de fuentes de donde pueden llegar los leads.
    Ejemplos: Web, Calendly, Mailchimp, Manual, Facebook.
    """
    name = models.CharField(max_length=100, unique=True)  # Nombre legible de la fuente
    slug = models.SlugField(max_length=100, unique=True)  # Identificador único para URLs y servicios
    description = models.TextField(blank=True, default="") # Notas internas sobre la fuente
    is_active = models.BooleanField(default=True)        # Permite desactivar fuentes sin borrar datos
    created_at = models.DateTimeField(auto_now_add=True) # Marca de tiempo de creación

    class Meta:
        ordering = ["name"]                # Orden predeterminado por nombre alfabético
        verbose_name = "Fuente"            # Nombre amigable en singular
        verbose_name_plural = "Fuentes"    # Nombre amigable en plural

    def __str__(self):
        return self.name  # Representación textual del objeto (ej: "Facebook")


# ─── Campañas de Marketing ───────────────────────────────────────────────────

class Campaign(models.Model):
    """
    Campañas de marketing asociadas a la captación de leads.
    Incluye datos dinámicos para la personalización de brochures (PDF).
    """
    name = models.CharField(max_length=150, unique=True) # Nombre único de la campaña
    slug = models.SlugField(max_length=150, unique=True) # ID corto para tracking
    budget = models.DecimalField(max_digits=10, decimal_places=2, default=0) # Presupuesto asignado
    
    # ── Contenido dinámico para Brochure (PDF) ──
    brochure_title = models.CharField(
        max_length=200, 
        blank=True, 
        default="", 
        help_text="Título principal en la portada del PDF generado automáticamente."
    )
    brochure_description = models.TextField(
        blank=True, 
        default="", 
        help_text="Breve introducción o descripción que aparecerá en el PDF."
    )
    brochure_features = models.JSONField(
        default=list, 
        blank=True, 
        help_text="Lista de características (ej: ['Vista al mar', 'Seguridad 24/7'])."
    )
    
    is_active = models.BooleanField(default=True)        # Control de vigencia de la campaña
    start_date = models.DateField(null=True, blank=True) # Cuándo inicia la campaña
    end_date = models.DateField(null=True, blank=True)   # Cuándo finaliza
    
    # ── Relación con Propiedades (Catálogo) ──
    properties = models.ManyToManyField(
        "Property", 
        blank=True, 
        related_name="campaigns",
        help_text="Selecciona las propiedades que se mostrarán en el brochure de esta campaña."
    )
    
    created_at = models.DateTimeField(auto_now_add=True) # Registro de creación

    class Meta:
        ordering = ["-created_at"]         # Mostrar las campañas más nuevas primero
        verbose_name = "Campaña"
        verbose_name_plural = "Campañas"

    def __str__(self):
        return self.name


# ─── Gestión de Medios ────────────────────────────────────────────────────────

class MediaAsset(models.Model):
    """
    Biblioteca de medios centralizada para imágenes y archivos usados en Landings.
    """
    title = models.CharField(max_length=200, blank=True)   # Título descriptivo
    file = models.ImageField(upload_to="landings/media/") # Archivo físico en el servidor
    alt_text = models.CharField(max_length=200, blank=True) # Texto alternativo para SEO
    created_at = models.DateTimeField(auto_now_add=True)    # Registro de subida

    def __str__(self):
        return self.title or self.file.name


# ─── Catálogo de Propiedades / Proyectos ─────────────────────────────────────

class Property(models.Model):
    """
    Catálogo maestro de proyectos inmobiliarios.
    Contiene la información técnica que se inyecta en los Brochures PDF.
    """
    name = models.CharField(max_length=200, unique=True)
    slug = models.SlugField(max_length=200, unique=True)
    description = models.TextField(blank=True, default="")
    location = models.CharField(max_length=255, help_text="Ej: Punta Cana, República Dominicana")
    address = models.CharField(max_length=255, blank=True, null=True, help_text="Calle, Número, Oficina/Depto")
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    
    # Datos de Inversión (Estilo 'Somos Rentable')
    min_investment = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        default=0,
        help_text="Monto mínimo de inversión inicial."
    )
    estimated_return = models.CharField(
        max_length=100, 
        blank=True, 
        default="", 
        help_text="Ej: 8% - 12% Anual"
    )
    delivery_date = models.CharField(
        max_length=100, 
        blank=True, 
        default="", 
        help_text="Ej: Diciembre 2025"
    )
    
    # Características & Media
    amenities = models.JSONField(
        default=list, 
        blank=True, 
        help_text="Lista de amenidades (ej: ['Piscina', 'Playa privada'])."
    )
    main_image = models.ForeignKey(
        MediaAsset, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name="properties",
        help_text="Imagen principal que aparecerá en el PDF."
    )
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Propiedad"
        verbose_name_plural = "Propiedades"

    def __str__(self):
        return self.name


# ─── Páginas de Aterrizaje Dinámicas ─────────────────────────────────────────

class LandingPage(models.Model):
    """
    Generador de páginas de aterrizaje dinámicas con contenido modular.
    """
    title = models.CharField(max_length=200)             # Título de la página
    slug = models.SlugField(max_length=200, unique=True) # Dirección URL única (ej: "depas-centro")
    
    # ── Contenido y Estética ──
    subtitle = models.TextField(blank=True, default="")  # Texto de apoyo bajo el título
    description = models.TextField(blank=True, default="Déjanos tus datos y te contactaremos a la brevedad.")
    
    benefits = models.JSONField(
        default=list, 
        blank=True, 
        help_text="Lista modular de beneficios con icono y título en formato JSON."
    )
    
    form_config = models.JSONField(
        default=dict, 
        blank=True, 
        help_text="Define qué campos pedir (teléfono, empresa, etc) y cuáles son obligatorios."
    )
    
    # ── Call to Action (CTA) ──
    cta_text = models.CharField(max_length=50, default="Quiero más información →")
    success_message = models.TextField(default="¡Listo! Hemos recibido tu información. Uno de nuestros asesores se pondrá en contacto contigo a la brevedad.")
    
    primary_color = models.CharField(max_length=20, default="#3b82f6", help_text="Color HEX para el botón y detalles.")
    image_url = models.URLField(blank=True, default="") # Link a imagen externa
    
    # ── Coordenadas (Override opcional para el mapa) ──
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    image_asset = models.ForeignKey(
        MediaAsset, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name="used_in_landings"
    ) # Relación con la biblioteca interna de medios
    
    # ── Tracking y Relaciones ──
    campaign = models.ForeignKey(Campaign, on_delete=models.SET_NULL, null=True, blank=True, related_name="landing_pages")
    source = models.ForeignKey(Source, on_delete=models.SET_NULL, null=True, blank=True, help_text="Fuente asignada a los leads de esta landing.")
    
    visits_count = models.PositiveIntegerField(default=0) # Métrica básica de visitas acumuladas
    
    is_active = models.BooleanField(default=True)        # Permite apagar la página temporalmente
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Landing Page"
        verbose_name_plural = "Landing Pages"

    def __str__(self):
        return self.title

    @property
    def conversion_rate(self):
        """Calcula el rendimiento de la página (% de visitas que dejan sus datos)."""
        if self.visits_count == 0:
            return 0
        leads = Lead.objects.filter(first_source=self.source).count()
        return round((leads / self.visits_count) * 100, 2)


# ─── Auditoría de Visitas ────────────────────────────────────────────────────

class LandingPageVisit(models.Model):
    """
    Registro individual de cada visita para análisis de comportamiento y tráfico.
    """
    landing_page = models.ForeignKey(LandingPage, on_delete=models.CASCADE, related_name="visits")
    ip_address = models.GenericIPAddressField(null=True, blank=True) # Ubicación IP (anónima)
    user_agent = models.TextField(null=True, blank=True)           # Navegador y dispositivo
    referer = models.TextField(null=True, blank=True)              # De dónde venía el usuario
    created_at = models.DateTimeField(auto_now_add=True)


# ─── Perfil de Vendedor ──────────────────────────────────────────────────────

class VendorProfile(models.Model):
    """
    Extensión del usuario de Django para controlar la lógica de ventas.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="vendor_profile")
    is_available_for_leads = models.BooleanField(
        default=True, 
        help_text="Si está apagado, el Round Robin saltará a este vendedor."
    )

    def __str__(self):
        return f"Perfil de {self.user.username}"


# ── Señales para mantenimiento automático de perfiles ──
from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=User)
def create_or_update_vendor_profile(sender, instance, created, **kwargs):
    """Garantiza que cada Usuario de Django tenga su perfil de Vendedor."""
    if created:
        VendorProfile.objects.create(user=instance)
    else:
        # En caso de que el perfil no exista por alguna razón
        VendorProfile.objects.get_or_create(user=instance)


# ─── Auditoría de Sesiones ───────────────────────────────────────────────────

class SessionAudit(models.Model):
    """
    Mantiene un historial de accesos de los vendedores para seguridad.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="session_audits")
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, default="")
    login_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-login_at"]
        verbose_name = "Auditoría de Sesión"
        verbose_name_plural = "Auditorías de Sesión"

    def __str__(self):
        return f"{self.user.username} - {self.login_at:%Y-%m-%d %H:%M} - {self.ip_address}"


# ─── El Modelo Lead (Corazón del Sistema) ────────────────────────────────────

class Lead(models.Model):
    """
    Entidad fundamental: El contacto o prospecto inmobiliario.
    Implementa scoring automático, auditoría de historial y resolución de identidad.
    """

    class Status(models.TextChoices):
        """Pipeline comercial: Etapas del embudo de ventas."""
        NUEVO = "nuevo", "Nuevo"
        CONTACTADO = "contactado", "Contactado"
        EN_CALIFICACION = "en_calificacion", "En Calificación"
        PROPUESTA_ENVIADA = "propuesta_enviada", "Propuesta Enviada"
        CIERRE_GANADO = "cierre_ganado", "Cierre Ganado"
        CIERRE_PERDIDO = "cierre_perdido", "Cierre Perdido"

    # UUID como clave primaria (más seguro y persistente en integraciones externas)
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # ── Identidad Inmutable ──
    original_email = models.EmailField(
        unique=True,
        db_index=True,
        help_text="Email de captura original. Inmutable. Se usa para unificar webhooks.",
    )

    # ── Datos de contacto (editables por el vendedor) ──
    contact_email = models.EmailField(
        blank=True,
        default="",
        help_text="Email de comunicación que el vendedor puede actualizar.",
    )
    first_name = models.CharField(max_length=150, blank=True, default="")
    last_name = models.CharField(max_length=150, blank=True, default="")
    phone = models.CharField(max_length=50, blank=True, default="")
    address = models.TextField(blank=True, default="")
    company = models.CharField(max_length=200, blank=True, default="")

    # ── Gestión Comercial ──
    status = models.CharField(
        max_length=30,
        choices=Status.choices,
        default=Status.NUEVO,
        db_index=True,
    )
    assigned_to = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_leads",
        help_text="Vendedor responsable del cierre de este lead.",
    )

    # ── Origen y Marketing (UTMs) ──
    first_source = models.ForeignKey(
        Source,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="leads",
    )
    campaign = models.ForeignKey(
        Campaign,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="leads",
    )
    utm_source = models.CharField(max_length=200, blank=True, default="")
    utm_medium = models.CharField(max_length=200, blank=True, default="")
    utm_campaign = models.CharField(max_length=200, blank=True, default="")
    utm_term = models.CharField(max_length=200, blank=True, default="")
    utm_content = models.CharField(max_length=200, blank=True, default="")

    # ── Calidad y Timestamps ──
    score = models.IntegerField(
        default=0,
        help_text="Calidad calculada del lead (0-100) según completitud de perfil."
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # ── Auditoría automática de cambios (simple-history) ──
    history = HistoricalRecords()

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Lead"
        verbose_name_plural = "Leads"

    def __str__(self):
        name = f"{self.first_name} {self.last_name}".strip()
        return name or self.original_email

    @property
    def full_name(self):
        """Retorna el nombre completo concatenado."""
        return f"{self.first_name} {self.last_name}".strip()

    def calculate_score(self):
        """
        Algoritmo determinista de scoring.
        Puntos: Teléfono (40), Email (30), Nombre Completo (20), Empresa (10).
        """
        s = 0
        if self.phone:
            s += 40
        if self.contact_email or self.original_email:
            s += 30
        if self.first_name and self.last_name:
            s += 20
        elif self.first_name:
            s += 10
        if self.company:
            s += 10
        return min(s, 100)

    def save(self, *args, **kwargs):
        """Re-calcula el score automáticamente antes de cada guardado en BD."""
        self.score = self.calculate_score()
        super().save(*args, **kwargs)


# ─── Historial de Interacciones ──────────────────────────────────────────────

class Interaction(models.Model):
    """
    Cronología de eventos relacionados con un lead.
    Forma el timeline / historial del viaje del contacto.
    """
    class Type(models.TextChoices):
        """Tipos de eventos que pueden ocurrir con un lead."""
        EMAIL_SENT = "email_sent", "Email Enviado"
        EMAIL_RECEIVED = "email_received", "Email Recibido"
        WEBHOOK = "webhook", "Webhook (Captura)"
        NOTE = "note", "Nota Manual"
        STATUS_CHANGE = "status_change", "Cambio de Estado"
        SYSTEM = "system", "Sistema"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    lead = models.ForeignKey(
        Lead,
        on_delete=models.CASCADE,
        related_name="interactions",
    )
    type = models.CharField(
        max_length=20,
        choices=Type.choices,
        default=Type.WEBHOOK,
        db_index=True,
    )
    source = models.ForeignKey(
        Source,
        on_delete=models.SET_NULL,
        null=True,
        related_name="interactions",
    )
    raw_payload = models.JSONField(
        default=dict,
        help_text="Datos técnicos asociados al evento (JSON original).",
    )
    notes = models.TextField(blank=True, default="") # Observaciones del vendedor o sistema
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Interacción"
        verbose_name_plural = "Interacciones"

    def __str__(self):
        return f"{self.type} - {self.lead} @ {self.created_at:%Y-%m-%d}"


# ─── Auditoría de Emails Enviados ────────────────────────────────────────────

class SentEmail(models.Model):
    """
    Registro permanente de todos los correos enviados por el sistema.
    Sirve como Sandbox local para previsualización y auditoría en producción.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    lead = models.ForeignKey(
        Lead, on_delete=models.SET_NULL, null=True, blank=True, related_name="sent_emails"
    )
    to_email = models.EmailField()   # Destinatario
    from_email = models.EmailField() # Remitente
    subject = models.CharField(max_length=255) # Asunto
    body_text = models.TextField()   # Cuerpo en texto plano
    body_html = models.TextField(null=True, blank=True) # Cuerpo en HTML (si aplica)
    
    # Metadatos para trazabilidad técnica
    headers = models.JSONField(default=dict, blank=True)
    status = models.CharField(max_length=20, default="sent") # 'sent' o 'failed'
    error_message = models.TextField(null=True, blank=True) # Detalle si hubo error en el envío
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Email Enviado"
        verbose_name_plural = "Emails Enviados"

    def __str__(self):
        return f"{self.subject} -> {self.to_email}"


# ─── Registro de Auditoría de Webhooks ───────────────────────────────────────

class WebhookLog(models.Model):
    """
    Caja negra de seguridad. Guarda cada petición externa (Facebook, Calendly, etc).
    Permite inspeccionar fallos y re-procesar datos manualmente si es necesario.
    """

    class Status(models.TextChoices):
        PENDING = "pending", "Pendiente"
        SUCCESS = "success", "Exitoso"
        FAILED = "failed", "Fallido"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    source_type = models.CharField(
        max_length=100,
        help_text="Tipo de fuente reportado en el webhook (ej: 'facebook').",
    )
    raw_body = models.JSONField(
        help_text="Cuerpo JSON completo tal como fue recibido del servidor externo.",
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True,
    )
    error_message = models.TextField(blank=True, default="")
    lead = models.ForeignKey(
        Lead,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="webhook_logs",
    )
    
    # Soporte para corrección manual de errores
    edited_body = models.JSONField(
        null=True,
        blank=True,
        help_text="JSON editado manualmente para corregir errores de captura.",
    )
    edited_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="edited_webhooks",
    )
    processed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Webhook Log"
        verbose_name_plural = "Webhook Logs"

    def __str__(self):
        return f"[{self.status}] {self.source_type} @ {self.created_at:%H:%M}"


# ─── Estado del Reparto (Round Robin) ────────────────────────────────────────

class RoundRobinState(models.Model):
    """
    Modelo Singleton que rastrea al último vendedor asignado.
    Garantiza que el reparto automático sea equitativo.
    """
    last_assigned_user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="El último vendedor al que se le asignó un lead automáticamente."
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Round Robin State"
        verbose_name_plural = "Round Robin State"

    @classmethod
    def get_state(cls):
        """Obtiene o crea el único registro de estado existente."""
        state, _ = cls.objects.get_or_create(id=1)
        return state


# ─── Alertas del Sistema ─────────────────────────────────────────────────────

class SystemAlert(models.Model):
    """
    Registro de eventos críticos que requieren atención del administrador.
    Ejemplo: No hay vendedores disponibles para asignar un lead.
    """
    class Level(models.TextChoices):
        INFO = "info", "Información"
        WARNING = "warning", "Advertencia"
        CRITICAL = "critical", "Crítico"

    level = models.CharField(max_length=10, choices=Level.choices, default=Level.WARNING)
    title = models.CharField(max_length=200)
    description = models.TextField()
    is_resolved = models.BooleanField(default=False)
    
    # Metadatos opcionales para vincular la alerta a un objeto
    content_type = models.CharField(max_length=100, blank=True, default="")
    object_id = models.CharField(max_length=100, blank=True, default="")
    
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Alerta del Sistema"
        verbose_name_plural = "Alertas del Sistema"

    def __str__(self):
        return f"[{self.level.upper()}] {self.title}"

