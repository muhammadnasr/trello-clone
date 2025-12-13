import { describe, it, expect } from 'vitest'
import React from 'react'
import { render, screen } from '@testing-library/react'
import { StyledComponent } from '../src/components/StyledComponent'

describe('StyledComponent', () => {
  it('renders with Tailwind classes applied', () => {
    const { container } = render(<StyledComponent />)
    const element = screen.getByText('Tailwind CSS is working!')
    expect(element).toBeTruthy()
    
    // Verify Tailwind classes are present in the DOM
    const div = container.querySelector('div')
    expect(div?.className).toContain('bg-blue-500')
    expect(div?.className).toContain('text-white')
    expect(div?.className).toContain('p-4')
    expect(div?.className).toContain('rounded-lg')
  })
})

