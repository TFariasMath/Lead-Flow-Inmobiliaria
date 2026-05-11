import logging
from django.contrib.auth.models import User
from django.db import transaction
from django_q.tasks import async_task
from ..models import Lead, RoundRobinState, SystemAlert

logger = logging.getLogger(__name__)

class LeadDistributionService:
    """
    Sistema de reparto equitativo de leads (Carrusel / Round Robin).
    """

    @staticmethod
    def assign(lead: Lead) -> Lead:
        """
        Asigna el lead al siguiente vendedor disponible.
        """
        active_vendors = list(User.objects.filter(
            is_active=True, 
            is_staff=False,
            vendor_profile__is_available_for_leads=True
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

        with transaction.atomic():
            state = RoundRobinState.objects.select_for_update().get_or_create(id=1)[0]
            next_vendor = active_vendors[0]
            
            if state.last_assigned_user:
                last_index = -1
                for i, vendor in enumerate(active_vendors):
                    if vendor.id == state.last_assigned_user.id:
                        last_index = i
                        break
                
                next_index = (last_index + 1) % len(active_vendors)
                next_vendor = active_vendors[next_index]
            
            lead.assigned_to = next_vendor
            lead.save(update_fields=['assigned_to'])
            
            state.last_assigned_user = next_vendor
            state.save()
            
            async_task('leads.tasks.task_send_vendor_alert', str(lead.id), next_vendor.id)
        
        return lead
