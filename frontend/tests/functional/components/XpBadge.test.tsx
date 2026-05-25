import { createRef } from 'react'
import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { XpBadge } from '@/components/ui/XpBadge'

describe('XpBadge Component', () => {
  it('renders as an SVG element with standard viewBox and layout', () => {
    const { container } = render(<XpBadge />)
    const svgElement = container.firstChild as SVGSVGElement
    
    expect(svgElement).toBeInTheDocument()
    expect(svgElement.tagName).toBe('svg')
    expect(svgElement).toHaveAttribute('viewBox', '0 0 24 24')
    expect(svgElement).toHaveAttribute('fill', 'none')
  })

  it('applies outline style classes and defaults to type="icon"', () => {
    const { container } = render(<XpBadge type="icon" variant="primary" />)
    const svgElement = container.firstChild as SVGSVGElement
    
    expect(svgElement).toHaveClass('text-primary-500')
    // Should have outline shield path and letters (5 paths in layout + 1 inside defs mask)
    const paths = svgElement.querySelectorAll('path')
    expect(paths.length).toBe(6)
  })

  it('applies variant colors correctly for type="icon"', () => {
    const { container, rerender } = render(<XpBadge variant="primary" type="icon" />)
    expect(container.firstChild).toHaveClass('text-primary-500')

    rerender(<XpBadge variant="amber" type="icon" />)
    expect(container.firstChild).toHaveClass('text-amber-500')
  })

  it('applies size classes correctly', () => {
    const { container, rerender } = render(<XpBadge size="sm" />)
    expect(container.firstChild).toHaveClass('h-4', 'w-4')

    rerender(<XpBadge size="md" />)
    expect(container.firstChild).toHaveClass('h-5', 'w-5')

    rerender(<XpBadge size="lg" />)
    expect(container.firstChild).toHaveClass('h-6', 'w-6')

    rerender(<XpBadge size="xl" />)
    expect(container.firstChild).toHaveClass('h-8', 'w-8')
  })

  it('renders filled badge assets and defs when type is badge', () => {
    const { container, rerender } = render(<XpBadge type="badge" variant="primary" />)
    const svgElement = container.firstChild as SVGSVGElement
    
    // Check thatdefs are present
    const defs = svgElement.querySelector('defs')
    expect(defs).toBeInTheDocument()

    // Check filled shield path is present with reference to primary gradient
    const filledShield = svgElement.querySelector('path[fill="url(#xp-primary-gradient)"]')
    expect(filledShield).toBeInTheDocument()

    rerender(<XpBadge type="badge" variant="amber" />)
    const filledShieldAmber = svgElement.querySelector('path[fill="url(#xp-amber-gradient)"]')
    expect(filledShieldAmber).toBeInTheDocument()
  })

  it('renders sweeping shimmer transform tag when animated is true inside type="badge"', () => {
    const { container, rerender } = render(<XpBadge type="badge" animated={true} />)
    const svgElement = container.firstChild as SVGSVGElement
    
    const shimmerAnimate = svgElement.querySelector('animateTransform')
    expect(shimmerAnimate).toBeInTheDocument()
    expect(shimmerAnimate).toHaveAttribute('attributeName', 'transform')

    rerender(<XpBadge type="badge" animated={false} />)
    const noShimmer = container.querySelector('animateTransform')
    expect(noShimmer).not.toBeInTheDocument()
  })

  it('merges custom class names cleanly without duplicating layout styles', () => {
    const { container } = render(<XpBadge className="custom-class shadow-md" />)
    const svgElement = container.firstChild as SVGSVGElement
    
    expect(svgElement).toHaveClass('custom-class', 'shadow-md', 'shrink-0')
  })

  it('forwards React DOM refs correctly to the SVGSVGElement node', () => {
    const ref = createRef<SVGSVGElement>()
    render(<XpBadge ref={ref} />)
    
    expect(ref.current).toBeInstanceOf(SVGSVGElement)
    expect(ref.current?.tagName).toBe('svg')
  })
})
