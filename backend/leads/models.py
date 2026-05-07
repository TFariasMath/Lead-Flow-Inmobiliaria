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

import uuid
from django.db import models
from django.contrib.auth.models import User
from simple_history.models import HistoricalRecords


class Source(models.Model):
    """
    Catálogo de fuentes de donde pueden llegar los leads.
    Ejemplos: Web, Calendly, Mailchimp, Manual.
    """
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)
    description = models.TextField(blank=True, default="")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "Fuente"
        verbose_name_plural = "Fuentes"

    def __str__(self):
        return self.name


class VendorProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="vendor_profile")
    is_available_for_leads = models.BooleanField(
        default=True, 
        help_text="Si está apagado, el Round Robin saltará a este vendedor."
    )

    def __str__(self):
        return f"Perfil de {self.user.username}"


# Signal to auto-create VendorProfile for new Users
from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=User)
def create_or_update_vendor_profile(sender, instance, created, **kwargs):
    if created:
        VendorProfile.objects.create(user=instance)
    else:
        # In case the profile doesn't exist for some reason
        VendorProfile.objects.get_or_create(user=instance)


class SessionAudit(models.Model):
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


class Lead(models.Model):
    """
    Contacto principal. El original_email es la clave de identidad
    inmutable utilizada para la resolución de webhooks.
    """

    class Status(models.TextChoices):
        NUEVO = "nuevo", "Nuevo"
        CONTACTADO = "contactado", "Contactado"
        EN_CALIFICACION = "en_calificacion", "En Calificación"
        PROPUESTA_ENVIADA = "propuesta_enviada", "Propuesta Enviada"
        CIERRE_GANADO = "cierre_ganado", "Cierre Ganado"
        CIERRE_PERDIDO = "cierre_perdido", "Cierre Perdido"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # ── Identidad (inmutable para resolución de webhooks) ─────────────
    original_email = models.EmailField(
        unique=True,
        db_index=True,
        help_text="Email original de entrada. Inmutable. Usado para unificar webhooks.",
    )

    # ── Datos de contacto (editables por el vendedor) ─────────────────
    contact_email = models.EmailField(
        blank=True,
        default="",
        help_text="Email de contacto editable por el vendedor.",
    )
    first_name = models.CharField(max_length=150, blank=True, default="")
    last_name = models.CharField(max_length=150, blank=True, default="")
    phone = models.CharField(max_length=50, blank=True, default="")
    address = models.TextField(blank=True, default="")
    company = models.CharField(max_length=200, blank=True, default="")

    # ── Pipeline comercial ────────────────────────────────────────────
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
        help_text="Vendedor asignado a este lead.",
    )

    # ── Fuente primaria (primera fuente que lo trajo) ─────────────────
    first_source = models.ForeignKey(
        Source,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="leads",
    )

    # ── Timestamps y Score ────────────────────────────────────────────
    score = models.IntegerField(
        default=0,
        help_text="Calidad del lead (0-100) basado en completitud de datos."
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # ── Historial de cambios (django-simple-history) ──────────────────
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
        return f"{self.first_name} {self.last_name}".strip()

    def calculate_score(self):
        """Calcula la calidad del lead (0-100)"""
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
        self.score = self.calculate_score()
        super().save(*args, **kwargs)


class Interaction(models.Model):
    """
    Registro de cada vez que un lead llega por una fuente.
    Forma el timeline / historial del viaje del contacto.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    lead = models.ForeignKey(
        Lead,
        on_delete=models.CASCADE,
        related_name="interactions",
    )
    source = models.ForeignKey(
        Source,
        on_delete=models.SET_NULL,
        null=True,
        related_name="interactions",
    )
    raw_payload = models.JSONField(
        default=dict,
        help_text="Payload original recibido del webhook.",
    )
    notes = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Interacción"
        verbose_name_plural = "Interacciones"

    def __str__(self):
        return f"{self.lead} via {self.source} @ {self.created_at:%Y-%m-%d %H:%M}"


class WebhookLog(models.Model):
    """
    Registro de auditoría de cada petición webhook recibida.
    Permite inspeccionar fallos y re-procesar manualmente.
    """

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        SUCCESS = "success", "Success"
        FAILED = "failed", "Failed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    source_type = models.CharField(
        max_length=100,
        help_text="Tipo de fuente reportado en el webhook (ej: 'web', 'calendly').",
    )
    raw_body = models.JSONField(
        help_text="Body JSON completo tal como fue recibido.",
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
    edited_body = models.JSONField(
        null=True,
        blank=True,
        help_text="Body editado manualmente para re-procesamiento.",
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
        return f"[{self.status}] {self.source_type} @ {self.created_at:%Y-%m-%d %H:%M}"


class RoundRobinState(models.Model):
    """
    Singleton model to track the last assigned user for Round Robin distribution.
    """
    last_assigned_user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="El último vendedor al que se le asignó un lead."
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Round Robin State"
        verbose_name_plural = "Round Robin State"

    @classmethod
    def get_state(cls):
        state, _ = cls.objects.get_or_create(id=1)
        return state

