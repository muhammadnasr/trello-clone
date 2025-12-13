import { describe, it, expect } from 'vitest'
import React from 'react'
import { render, screen } from '@testing-library/react'
import { HelloWorld } from '../src/components/HelloWorld'

describe('HelloWorld', () => {
  it('renders "Hello World"', () => {
    render(<HelloWorld />)
    expect(screen.getByText('Hello World')).toBeTruthy()
  })
})

