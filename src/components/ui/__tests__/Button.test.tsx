import { describe, it, expect, jest } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '../Button'

describe('Button', () => {
  describe('Rendering', () => {
    it('should render with children text', () => {
      render(<Button>Click me</Button>)
      expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
    })

    it('should render with different variants', () => {
      const { rerender } = render(<Button variant="primary">Primary</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-primary')

      rerender(<Button variant="secondary">Secondary</Button>)
      expect(button).toHaveClass('bg-secondary')

      rerender(<Button variant="outline">Outline</Button>)
      expect(button).toHaveClass('border')

      rerender(<Button variant="ghost">Ghost</Button>)
      expect(button).toHaveClass('hover:bg-accent')

      rerender(<Button variant="destructive">Destructive</Button>)
      expect(button).toHaveClass('bg-destructive')
    })

    it('should render with different sizes', () => {
      const { rerender } = render(<Button size="sm">Small</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('h-9', 'px-3')

      rerender(<Button size="md">Medium</Button>)
      expect(button).toHaveClass('h-10', 'px-4')

      rerender(<Button size="lg">Large</Button>)
      expect(button).toHaveClass('h-11', 'px-8')

      rerender(<Button size="icon">Icon</Button>)
      expect(button).toHaveClass('h-10', 'w-10')
    })

    it('should render full width when specified', () => {
      render(<Button fullWidth>Full Width</Button>)
      expect(screen.getByRole('button')).toHaveClass('w-full')
    })

    it('should render with left and right addons', () => {
      render(
        <Button
          leftIcon={<span data-testid="left-icon">←</span>}
          rightIcon={<span data-testid="right-icon">→</span>}
        >
          Button
        </Button>
      )
      
      expect(screen.getByTestId('left-icon')).toBeInTheDocument()
      expect(screen.getByTestId('right-icon')).toBeInTheDocument()
    })

    it('should render as a different element when asChild is true', () => {
      render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>
      )
      
      const link = screen.getByRole('link', { name: /link button/i })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/test')
    })
  })

  describe('States', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>)
      const button = screen.getByRole('button')
      
      expect(button).toBeDisabled()
      expect(button).toHaveClass('opacity-50', 'cursor-not-allowed')
    })

    it('should show loading state', () => {
      render(<Button isLoading loadingText="Loading...">Submit</Button>)
      const button = screen.getByRole('button')
      
      expect(button).toBeDisabled()
      expect(button).toHaveAttribute('aria-busy', 'true')
      expect(button).toHaveTextContent('Loading...')
      expect(screen.getByRole('status')).toBeInTheDocument() // Loading spinner
    })

    it('should use default loading text when not specified', () => {
      render(<Button isLoading>Submit</Button>)
      expect(screen.getByRole('button')).toHaveTextContent('Loading...')
    })

    it('should be disabled during loading', async () => {
      const onClick = jest.fn()
      const user = userEvent.setup()
      
      render(
        <Button isLoading onClick={onClick}>
          Submit
        </Button>
      )
      
      const button = screen.getByRole('button')
      await user.click(button)
      
      expect(onClick).not.toHaveBeenCalled()
      expect(button).toBeDisabled()
    })
  })

  describe('Interactions', () => {
    it('should call onClick when clicked', async () => {
      const onClick = jest.fn()
      const user = userEvent.setup()
      
      render(<Button onClick={onClick}>Click me</Button>)
      
      const button = screen.getByRole('button')
      await user.click(button)
      
      expect(onClick).toHaveBeenCalledTimes(1)
    })

    it('should not call onClick when disabled', async () => {
      const onClick = jest.fn()
      const user = userEvent.setup()
      
      render(
        <Button disabled onClick={onClick}>
          Click me
        </Button>
      )
      
      const button = screen.getByRole('button')
      await user.click(button)
      
      expect(onClick).not.toHaveBeenCalled()
    })

    it('should support keyboard navigation', async () => {
      const onClick = jest.fn()
      const user = userEvent.setup()
      
      render(<Button onClick={onClick}>Click me</Button>)
      
      const button = screen.getByRole('button')
      button.focus()
      
      await user.keyboard('{Enter}')
      expect(onClick).toHaveBeenCalledTimes(1)
      
      await user.keyboard(' ')
      expect(onClick).toHaveBeenCalledTimes(2)
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes when loading', () => {
      render(<Button isLoading>Submit</Button>)
      const button = screen.getByRole('button')
      
      expect(button).toHaveAttribute('aria-busy', 'true')
      expect(button).toHaveAttribute('aria-disabled', 'true')
    })

    it('should have proper ARIA attributes when disabled', () => {
      render(<Button disabled>Submit</Button>)
      const button = screen.getByRole('button')
      
      expect(button).toHaveAttribute('aria-disabled', 'true')
    })

    it('should support aria-label', () => {
      render(<Button aria-label="Custom label">Icon</Button>)
      expect(screen.getByRole('button', { name: /custom label/i })).toBeInTheDocument()
    })

    it('should support aria-describedby', () => {
      render(
        <>
          <Button aria-describedby="helper-text">Submit</Button>
          <span id="helper-text">Click to submit the form</span>
        </>
      )
      
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-describedby', 'helper-text')
    })
  })

  describe('Custom Props', () => {
    it('should forward additional props', () => {
      render(
        <Button data-testid="custom-button" className="custom-class">
          Button
        </Button>
      )
      
      const button = screen.getByTestId('custom-button')
      expect(button).toHaveClass('custom-class')
    })

    it('should support form attributes', () => {
      render(
        <Button type="submit" form="test-form">
          Submit
        </Button>
      )
      
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('type', 'submit')
      expect(button).toHaveAttribute('form', 'test-form')
    })
  })
})