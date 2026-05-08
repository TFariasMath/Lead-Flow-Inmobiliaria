import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import BenefitEditor from '../BenefitEditor';

const mockBenefits = [
  { id: '1', icon: 'Star', title: 'Calidad Premium' },
  { id: '2', icon: 'Shield', title: 'Seguridad Garantizada' },
];

describe('BenefitEditor', () => {
  it('debe renderizar la lista de beneficios correctamente', () => {
    render(<BenefitEditor benefits={mockBenefits} onChange={() => {}} />);
    
    expect(screen.getByDisplayValue('Calidad Premium')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Seguridad Garantizada')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Star')).toBeInTheDocument();
  });

  it('debe llamar a onChange al añadir un nuevo beneficio', () => {
    const handleChange = jest.fn();
    render(<BenefitEditor benefits={mockBenefits} onChange={handleChange} />);
    
    const addButton = screen.getByText(/Añadir Beneficio/i);
    fireEvent.click(addButton);
    
    expect(handleChange).toHaveBeenCalledTimes(1);
    const newBenefits = handleChange.mock.calls[0][0];
    expect(newBenefits).toHaveLength(3);
    expect(newBenefits[2].title).toBe('Nuevo Beneficio');
  });

  it('debe llamar a onChange al eliminar un beneficio', () => {
    const handleChange = jest.fn();
    render(<BenefitEditor benefits={mockBenefits} onChange={handleChange} />);
    
    // Buscamos los botones de eliminar (Trash2)
    // En el componente tienen la clase 'group-hover:opacity-100'
    const removeButtons = screen.getAllByRole('button').filter(btn => 
      btn.querySelector('svg')?.classList.contains('lucide-trash-2') || 
      btn.innerHTML.includes('lucide-trash-2')
    );

    // Nota: lucide-react renderiza SVGs. A veces es difícil encontrarlos por rol.
    // Usaremos un selector de clase o data-testid si fuera necesario.
    // Pero fireEvent sobre el primer botón de eliminar encontrado:
    fireEvent.click(removeButtons[0]);
    
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange.mock.calls[0][0]).toHaveLength(1);
  });

  it('debe llamar a onChange al editar un campo', () => {
    const handleChange = jest.fn();
    render(<BenefitEditor benefits={mockBenefits} onChange={handleChange} />);
    
    const titleInput = screen.getByDisplayValue('Calidad Premium');
    fireEvent.change(titleInput, { target: { value: 'Ultra Calidad' } });
    
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange.mock.calls[0][0][0].title).toBe('Ultra Calidad');
  });
});
