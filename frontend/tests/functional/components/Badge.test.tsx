import { createRef } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Badge } from '@/components/ui/Badge'

describe('Badge Component', () => {
  it('renders children text content correctly', () => {
    render(<Badge>Beta Feature</Badge>)
    const badge = screen.getByText('Beta Feature')
    
    expect(badge).toBeInTheDocument()
    expect(badge.tagName).toBe('SPAN')
    // Default styles are applied
    expect(badge).toHaveClass('inline-flex', 'items-center', 'font-medium', 'rounded-full')
  })

  it('applies variant classes correctly', () => {
    const { rerender } = render(<Badge variant="primary">Primary</Badge>)
    expect(screen.getByText('Primary')).toHaveClass('bg-primary-100')

    rerender(<Badge variant="success">Success</Badge>)
    expect(screen.getByText('Success')).toHaveClass('bg-green-100')

    rerender(<Badge variant="warning">Warning</Badge>)
    expect(screen.getByText('Warning')).toHaveClass('bg-yellow-100')

    rerender(<Badge variant="error">Error</Badge>)
    expect(screen.getByText('Error')).toHaveClass('bg-red-100')

    rerender(<Badge variant="outline">Outline</Badge>)
    const outlineBadge = screen.getByText('Outline')
    expect(outlineBadge).toHaveClass('bg-transparent', 'border', 'border-neutral-200')
  })

  it('applies size classes correctly', () => {
    const { rerender } = render(<Badge size="sm">Small</Badge>)
    expect(screen.getByText('Small')).toHaveClass('px-2', 'py-0.5', 'text-xs')

    rerender(<Badge size="md">Medium</Badge>)
    expect(screen.getByText('Medium')).toHaveClass('px-2.5', 'py-0.5', 'text-sm')

    rerender(<Badge size="lg">Large</Badge>)
    expect(screen.getByText('Large')).toHaveClass('px-3', 'py-1', 'text-sm')
  })

  it('renders a dot notification indicator when dot is true', () => {
    const { container, rerender } = render(<Badge dot variant="primary" />)
    
    // Dot indicator has no children and has distinct layout class
    const dotElement = container.querySelector('span')
    expect(dotElement).toBeInTheDocument()
    expect(dotElement).toHaveClass('inline-block', 'w-2', 'h-2', 'rounded-full', 'bg-primary-500')
    expect(dotElement).not.toHaveClass('inline-flex', 'items-center', 'px-2.5')

    rerender(<Badge dot variant="success" />)
    expect(container.querySelector('span')).toHaveClass('bg-green-500')

    rerender(<Badge dot variant="error" />)
    expect(container.querySelector('span')).toHaveClass('bg-red-500')

    rerender(<Badge dot variant="default" />)
    expect(container.querySelector('span')).toHaveClass('bg-neutral-400')
  })

  it('merges custom class names cleanly without duplicating layout styles', () => {
    render(<Badge className="custom-class shadow-md">Labeled</Badge>)
    const badge = screen.getByText('Labeled')
    
    expect(badge).toHaveClass('custom-class', 'shadow-md', 'inline-flex', 'font-medium')
  })

  it('forwards React DOM refs correctly to the span node', () => {
    const ref = createRef<HTMLSpanElement>()
    render(<Badge ref={ref}>Ref Check</Badge>)
    
    expect(ref.current).toBeInstanceOf(HTMLSpanElement)
    expect(ref.current?.textContent).toBe('Ref Check')
  })

  it('forwards React DOM refs correctly when rendered as a dot indicator', () => {
    const ref = createRef<HTMLSpanElement>()
    render(<Badge dot ref={ref} />)
    
    expect(ref.current).toBeInstanceOf(HTMLSpanElement)
    expect(ref.current).toHaveClass('w-2', 'h-2')
  })
})
