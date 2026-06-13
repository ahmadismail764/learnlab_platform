import { createRef } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Avatar } from '@/components/ui/Avatar'

describe('Avatar Component', () => {
  it('renders initials fallback when no image source is provided', () => {
    render(<Avatar name="John Doe" />)
    const initialsElement = screen.getByText('JD')
    
    expect(initialsElement).toBeInTheDocument()
    expect(initialsElement.tagName).toBe('DIV')
    expect(initialsElement).toHaveClass('rounded-full', 'flex', 'items-center', 'justify-center', 'font-medium')
  })

  it('renders image when src is provided', () => {
    render(<Avatar src="https://example.com/avatar.png" name="John Doe" alt="John's Avatar" />)
    const imgElement = screen.getByRole('img')
    
    expect(imgElement).toBeInTheDocument()
    expect(imgElement).toHaveAttribute('src', 'https://example.com/avatar.png')
    expect(imgElement).toHaveAttribute('alt', "John's Avatar")
    expect(imgElement).toHaveClass('rounded-full', 'object-cover')
  })

  it('applies sizes correctly', () => {
    const { rerender } = render(<Avatar size="xs" name="John Doe" />)
    expect(screen.getByText('JD')).toHaveClass('w-6', 'h-6', 'text-xs')

    rerender(<Avatar size="sm" name="John Doe" />)
    expect(screen.getByText('JD')).toHaveClass('w-8', 'h-8', 'text-sm')

    rerender(<Avatar size="md" name="John Doe" />)
    expect(screen.getByText('JD')).toHaveClass('w-10', 'h-10', 'text-sm')

    rerender(<Avatar size="lg" name="John Doe" />)
    expect(screen.getByText('JD')).toHaveClass('w-12', 'h-12', 'text-base')

    rerender(<Avatar size="xl" name="John Doe" />)
    expect(screen.getByText('JD')).toHaveClass('w-16', 'h-16', 'text-lg')
  })

  it('uses default name-based color background when avatarColor is omitted', () => {
    render(<Avatar name="Alice" />)
    const fallback = screen.getByText('A')
    
    // Default backgrounds are derived dynamically and applied via CSS classes
    expect(fallback.className).toContain('bg-')
    expect(fallback.style.backgroundColor).toBe('')
  })

  it('applies custom HSL avatarColor directly via inline styles when provided', () => {
    const customHsl = 'hsl(210, 70%, 50%)'
    render(<Avatar name="Alice" avatarColor={customHsl} />)
    const fallback = screen.getByText('A')
    
    // Dynamic avatarColor overrides the class-based background and sets style.backgroundColor.
    // JSDOM serializes the HSL inline style to its computed RGB equivalent.
    expect(fallback.style.backgroundColor).toBe('rgb(38, 128, 217)')
  })

  it('renders online status indicator when showStatus is true', () => {
    const { container, rerender } = render(<Avatar name="John Doe" showStatus={true} status="online" />)
    
    let indicator = container.querySelector('span')
    expect(indicator).toBeInTheDocument()
    expect(indicator).toHaveClass('bg-green-500', 'absolute', 'bottom-0', 'end-0', 'rounded-full')

    rerender(<Avatar name="John Doe" showStatus={true} status="offline" />)
    indicator = container.querySelector('span')
    expect(indicator).toHaveClass('bg-neutral-400')

    rerender(<Avatar name="John Doe" showStatus={true} status="away" />)
    indicator = container.querySelector('span')
    expect(indicator).toHaveClass('bg-yellow-500')

    rerender(<Avatar name="John Doe" showStatus={true} status="busy" />)
    indicator = container.querySelector('span')
    expect(indicator).toHaveClass('bg-red-500')
  })

  it('forwards React DOM refs correctly to the container node', () => {
    const ref = createRef<HTMLDivElement>()
    render(<Avatar name="John Doe" ref={ref} />)
    
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
    expect(ref.current?.querySelector('div')?.textContent).toBe('JD')
  })
})
