import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import LandingLayout, { LandingData } from '../LandingLayout';

const mockLandingData: LandingData = {
  title: 'Inversión en la Riviera Maya',
  subtitle: 'Apartamentos de lujo desde $150k',
  description: 'Completa el formulario para recibir el catálogo completo.',
  benefits: [
    { icon: 'Building', title: 'Alta Plusvalía' },
    { icon: 'DollarSign', title: 'Rentas Vacacionales' },
  ],
  cta_text: 'Recibir Catálogo',
  success_message: '¡Gracias por tu interés!',
  primary_color: '#3b82f6',
  image_url: 'https://example.com/image.jpg',
  form_config: { fields: ['first_name', 'phone'] }
};

describe('LandingLayout', () => {
  it('debe renderizar el título y subtítulo correctamente', () => {
    render(<LandingLayout data={mockLandingData} onSubmit={jest.fn()} />);
    
    expect(screen.getByText('Inversión en la Riviera Maya')).toBeInTheDocument();
    expect(screen.getByText('Apartamentos de lujo desde $150k')).toBeInTheDocument();
  });

  it('debe mostrar los beneficios configurados', () => {
    render(<LandingLayout data={mockLandingData} onSubmit={jest.fn()} />);
    
    expect(screen.getByText('Alta Plusvalía')).toBeInTheDocument();
    expect(screen.getByText('Rentas Vacacionales')).toBeInTheDocument();
  });

  it('debe llamar a onSubmit con los datos del formulario al hacer clic en el CTA', async () => {
    const handleSubmit = jest.fn();
    render(<LandingLayout data={mockLandingData} onSubmit={handleSubmit} />);
    
    // Rellenar campos
    fireEvent.change(screen.getByPlaceholderText('Nombre'), { target: { value: 'Carlos' } });
    fireEvent.change(screen.getByPlaceholderText('Correo electrónico'), { target: { value: 'carlos@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('Teléfono'), { target: { value: '123456789' } });
    
    // Enviar formulario
    const ctaButton = screen.getByText('Recibir Catálogo');
    fireEvent.click(ctaButton);
    
    expect(handleSubmit).toHaveBeenCalledWith({
      email: 'carlos@test.com',
      first_name: 'Carlos',
      last_name: '',
      phone: '123456789',
      company: ''
    });
  });

  it('debe mostrar el mensaje de éxito cuando submitted es true', () => {
    render(<LandingLayout data={mockLandingData} onSubmit={jest.fn()} submitted={true} />);
    
    expect(screen.getByText('¡Listo!')).toBeInTheDocument();
    expect(screen.getByText('¡Gracias por tu interés!')).toBeInTheDocument();
  });

  it('debe mostrar un mensaje de error si se proporciona la prop error', () => {
    render(<LandingLayout data={mockLandingData} onSubmit={jest.fn()} error="Email inválido" />);
    
    expect(screen.getByText('Email inválido')).toBeInTheDocument();
  });
});
