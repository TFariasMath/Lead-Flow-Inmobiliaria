import uuid
from django.test import TestCase, override_settings
from django.core import mail
from django.contrib.auth.models import User
from .models import Lead, Interaction, SentEmail
from .email_backends import DatabaseEmailBackend

class CommunicationInfrastructureTests(TestCase):
    """
    Pruebas exhaustivas para el sistema de comunicaciones y Sandbox de emails.
    """

    def setUp(self):
        self.vendedor = User.objects.create_user(username="test_vendedor", email="v@test.com")
        self.lead = Lead.objects.create(
            original_email="cliente@test.com",
            first_name="Pedro",
            last_name="Test",
            assigned_to=self.vendedor
        )

    @override_settings(EMAIL_BACKEND='leads.email_backends.DatabaseEmailBackend')
    def test_send_email_success_persistence(self):
        """Verifica que un email enviado se guarde en DB y cree una interacción."""
        subject = "Test Subject"
        body = "Hello test body"
        mail.send_mail(
            subject,
            body,
            "from@crm.com",
            ["cliente@test.com"],
            html_message="<p>Hello HTML</p>"
        )

        # Verificar SentEmail
        sent = SentEmail.objects.get(to_email="cliente@test.com")
        self.assertEqual(sent.subject, subject)
        self.assertEqual(sent.body_text, body)
        self.assertEqual(sent.body_html, "<p>Hello HTML</p>")
        self.assertEqual(sent.lead, self.lead)

        # Verificar Interacción en el Timeline
        interaction = Interaction.objects.filter(lead=self.lead, type=Interaction.Type.EMAIL_SENT).first()
        self.assertIsNotNone(interaction)
        self.assertIn(subject, interaction.notes)

    @override_settings(EMAIL_BACKEND='leads.email_backends.DatabaseEmailBackend')
    def test_send_email_no_lead_found(self):
        """Verifica que si el lead no existe, el email se guarde pero sin vínculo de FK."""
        mail.send_mail(
            "Desconocido",
            "Cuerpo",
            "from@crm.com",
            ["desconocido@noexiste.com"]
        )

        sent = SentEmail.objects.get(to_email="desconocido@noexiste.com")
        self.assertIsNone(sent.lead)
        # No debería haber interacción si no hay lead
        self.assertEqual(Interaction.objects.count(), 0)

    @override_settings(EMAIL_BACKEND='leads.email_backends.DatabaseEmailBackend')
    def test_adverse_empty_recipients(self):
        """Prueba de robustez ante falta de destinatarios."""
        # Django mail.send_mail suele validar esto, pero probamos el backend directamente
        backend = DatabaseEmailBackend()
        from django.core.mail import EmailMessage
        msg = EmailMessage("Sub", "Body", "from@test.com", [])
        
        result = backend.send_messages([msg])
        self.assertEqual(result, 0)
        self.assertEqual(SentEmail.objects.count(), 0)

    @override_settings(EMAIL_BACKEND='leads.email_backends.DatabaseEmailBackend')
    def test_adverse_lead_deleted_during_process(self):
        """Escenario: El lead es borrado justo antes de que el backend lo procese."""
        from django.core.mail import EmailMessage
        msg = EmailMessage("Sub", "Body", "from@test.com", ["cliente@test.com"])
        
        # Simulamos el borrado
        self.lead.delete()
        
        backend = DatabaseEmailBackend()
        backend.send_messages([msg])
        
        # El correo debe guardarse (como auditoría) pero sin FK al lead
        sent = SentEmail.objects.get(to_email="cliente@test.com")
        self.assertIsNone(sent.lead)

    @override_settings(EMAIL_BACKEND='leads.email_backends.DatabaseEmailBackend')
    def test_adverse_corrupted_html(self):
        """Verifica que el sistema no explote con contenido HTML nulo o mal formado."""
        from django.core.mail import EmailMultiAlternatives
        msg = EmailMultiAlternatives("Sub", "Body", "from@test.com", ["cliente@test.com"])
        # Adjuntamos algo que no es texto/html pero tiene contenido
        msg.attach_alternative("%PDF-1.4...", "application/pdf")
        
        backend = DatabaseEmailBackend()
        backend.send_messages([msg])
        
        sent = SentEmail.objects.get(to_email="cliente@test.com")
        self.assertEqual(sent.body_html, "") # Debe ser string vacío porque no encontró 'text/html'

    @override_settings(EMAIL_BACKEND='leads.email_backends.DatabaseEmailBackend')
    def test_multiple_recipients_tracking(self):
        """Verifica comportamiento con múltiples destinatarios (solo se trackea el primero)."""
        mail.send_mail(
            "Masivo",
            "Contenido",
            "from@test.com",
            ["cliente@test.com", "otro@test.com"]
        )
        
        # Debe haber un registro para el envío
        self.assertEqual(SentEmail.objects.count(), 1)
        sent = SentEmail.objects.first()
        self.assertEqual(sent.to_email, "cliente@test.com")
