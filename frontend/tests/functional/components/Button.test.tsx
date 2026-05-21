import { fireEvent, render, screen } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import { Button } from '@/components/ui/Button'

describe('Button', () => {
  it('renders label and handles clicks', () => {
    const onClick = vi.fn()

    render(<Button onClick={onClick}>Save</Button>)

    const button = screen.getByRole('button', { name: /save/i })
    fireEvent.click(button)

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('renders icons when provided', () => {
    render(
      <Button leftIcon={<span data-testid="left-icon" />} rightIcon={<span data-testid="right-icon" />}>
        Continue
      </Button>
    )

    expect(screen.getByTestId('left-icon')).toBeInTheDocument()
    expect(screen.getByTestId('right-icon')).toBeInTheDocument()
  })

  it('shows a loading state and disables the button', () => {
    render(<Button isLoading>Saving</Button>)

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })
})
