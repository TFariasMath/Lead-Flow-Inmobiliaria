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

    # ── Timestamps ────────────────────────────────────────────────────
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
