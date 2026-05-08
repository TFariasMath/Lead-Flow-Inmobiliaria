"""
Lead Flow - Communication Tests
===============================
Pruebas especializadas para el motor de emails y el Sandbox de base de datos.
Garantiza que cada correo enviado a un cliente quede registrado correctamente
en su historial (Timeline).
"""

import uuid
from django.test import TestCase, override_settings
from django.core import mail
from django.contrib.auth.models import User
from .models import Lead, Interaction, SentEmail
from .email_backends import DatabaseEmailBackend

class CommunicationInfrastructureTests(TestCase):
    """
    Validación de la infraestructura de mensajería.
    """

    def setUp(self):
        # Setup: Vendedor y Lead vinculados para las pruebas de envío
        self.vendedor = User.objects.create_user(username="test_vendedor", email="v@test.com")
        self.lead = Lead.objects.create(
            original_email="cliente@test.com",
            first_name="Pedro",
            last_name="Test",
            assigned_to=self.vendedor
        )

    @override_settings(EMAIL_BACKEND='leads.email_backends.DatabaseEmailBackend')
    def test_send_email_success_persistence(self):
        """
        Prueba el flujo completo de persistencia:
        1. Se 'envía' un correo mediante Django.
        2. El backend lo intercepta y lo guarda en SentEmail.
        3. Se crea una Interacción automática en el Lead.
        """
        subject = "Bienvenido a Lead Flow"
        body = "Estamos felices de tenerte aquí."
        mail.send_mail(
            subject,
            body,
            "hola@leadflow.dev",
            ["cliente@test.com"],
            html_message="<p>Versión <b>HTML</b> del mensaje</p>"
        )

        # Validación: El registro existe en la tabla de auditoría de mails
        sent = SentEmail.objects.get(to_email="cliente@test.com")
        self.assertEqual(sent.subject, subject)
        self.assertEqual(sent.body_html, "<p>Versión <b>HTML</b> del mensaje</p>")
        self.assertEqual(sent.lead, self.lead)

        # Validación: El timeline del lead ahora muestra este envío
        interaction = Interaction.objects.filter(lead=self.lead, type=Interaction.Type.EMAIL_SENT).first()
        self.assertIsNotNone(interaction)
        self.assertIn(subject, interaction.notes)

    @override_settings(EMAIL_BACKEND='leads.email_backends.DatabaseEmailBackend')
    def test_send_email_no_lead_found(self):
        """
        Caso Borde: El correo se envía a alguien que NO es un lead registrado.
        Debe guardarse el mail para auditoría, pero sin asociación de Lead.
        """
        mail.send_mail(
            "Asunto Desconocido",
            "Cuerpo",
            "from@crm.com",
            ["extraño@gmail.com"]
        )

        sent = SentEmail.objects.get(to_email="extraño@gmail.com")
        self.assertIsNone(sent.lead)
        # Sin lead -> No hay interacción en timeline
        self.assertEqual(Interaction.objects.count(), 0)

    @override_settings(EMAIL_BACKEND='leads.email_backends.DatabaseEmailBackend')
    def test_adverse_empty_recipients(self):
        """Prueba de robustez: Envío sin destinatarios."""
        backend = DatabaseEmailBackend()
        from django.core.mail import EmailMessage
        msg = EmailMessage("Sub", "Body", "from@test.com", [])
        
        result = backend.send_messages([msg])
        # El backend debe retornar 0 mensajes enviados y no explotar
        self.assertEqual(result, 0)
        self.assertEqual(SentEmail.objects.count(), 0)

    @override_settings(EMAIL_BACKEND='leads.email_backends.DatabaseEmailBackend')
    def test_adverse_lead_deleted_during_process(self):
        """Escenario: El lead es eliminado por otro usuario mientras se enviaba el mail."""
        from django.core.mail import EmailMessage
        msg = EmailMessage("Sub", "Body", "from@test.com", ["cliente@test.com"])
        
        # Simulamos eliminación concurrente
        self.lead.delete()
        
        backend = DatabaseEmailBackend()
        backend.send_messages([msg])
        
        # El mail debe guardarse igual como 'huérfano' (auditoría forense)
        sent = SentEmail.objects.get(to_email="cliente@test.com")
        self.assertIsNone(sent.lead)

    @override_settings(EMAIL_BACKEND='leads.email_backends.DatabaseEmailBackend')
    def test_adverse_corrupted_html(self):
        """Verifica que el sistema sea resiliente a formatos no soportados."""
        from django.core.mail import EmailMultiAlternatives
        msg = EmailMultiAlternatives("Sub", "Body", "from@test.com", ["cliente@test.com"])
        # Intentamos adjuntar un binario como si fuera HTML alternativo
        msg.attach_alternative("%PDF-1.4...", "application/pdf")
        
        backend = DatabaseEmailBackend()
        backend.send_messages([msg])
        
        sent = SentEmail.objects.get(to_email="cliente@test.com")
        # No encontró text/html, por lo tanto el campo body_html debe quedar vacío
        self.assertEqual(sent.body_html, "")

    @override_settings(EMAIL_BACKEND='leads.email_backends.DatabaseEmailBackend')
    def test_multiple_recipients_tracking(self):
        """Verifica el comportamiento con copias o múltiples destinatarios."""
        mail.send_mail(
            "Masivo",
            "Contenido",
            "from@test.com",
            ["cliente@test.com", "otro@test.com"]
        )
        
        # Por simplicidad de tracking, el sistema registra el evento para el primer destinatario.
        self.assertEqual(SentEmail.objects.count(), 1)
        sent = SentEmail.objects.first()
        self.assertEqual(sent.to_email, "cliente@test.com")


class BrochureTests(TestCase):
    """Pruebas para la generación y descarga de Brochures PDF."""

    def setUp(self):
        from .models import Campaign, Source, LandingPage
        from django.urls import reverse
        self.source = Source.objects.create(name="Web", slug="web")
        self.campaign = Campaign.objects.create(
            name="Test Campaign", 
            slug="test-campaign",
            brochure_title="Brochure Especial",
            brochure_features=["Feature 1", "Feature 2"]
        )
        self.landing = LandingPage.objects.create(
            title="Landing Test",
            slug="landing-test",
            campaign=self.campaign,
            source=self.source,
            primary_color="#ff0000"
        )
        self.lead = Lead.objects.create(
            original_email="pdf@test.com",
            first_name="Juan",
            campaign=self.campaign,
            assigned_to=User.objects.create_user(username="asesor_test", email="asesor@test.com")
        )
        self.url = reverse('lead-brochure', kwargs={'lead_id': self.lead.id})

    def test_generate_brochure_utility(self):
        """Prueba la utilidad de generación de PDF directamente."""
        from .utils_pdf import generate_personalized_brochure
        pdf_content = generate_personalized_brochure(self.lead, self.campaign)
        
        self.assertIsNotNone(pdf_content)
        self.assertTrue(len(pdf_content) > 0)
        # Firma básica de PDF
        self.assertTrue(pdf_content.startswith(b"%PDF"))

    def test_lead_brochure_endpoint(self):
        """Prueba el endpoint de descarga del brochure."""
        from django.test import Client
        client = Client()
        response = client.get(self.url)
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'], 'application/pdf')
        self.assertIn('Content-Disposition', response)
        self.assertIn('Brochure_Juan_test-campaign.pdf', response['Content-Disposition'])

    def test_lead_brochure_no_campaign_returns_400(self):
        """Si el lead no tiene campaña, el endpoint debe fallar con 400."""
        self.lead.campaign = None
        self.lead.save()
        
        from django.test import Client
        client = Client()
        response = client.get(self.url)
        self.assertEqual(response.status_code, 400)
        self.assertIn("no tiene una campaña asociada", response.json()['error'])
