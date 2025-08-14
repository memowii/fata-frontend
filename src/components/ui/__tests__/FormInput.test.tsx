import { describe, it, expect, jest } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FormInput } from '../FormInput'

describe('FormInput', () => {
  describe('Rendering', () => {
    it('should render with label', () => {
      render(<FormInput label="Email" name="email" />)
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    })

    it('should render without label', () => {
      render(<FormInput name="email" placeholder="Enter email" />)
      expect(screen.getByPlaceholderText(/enter email/i)).toBeInTheDocument()
    })

    it('should render with helper text', () => {
      render(
        <FormInput
          label="Email"
          name="email"
          helperText="We'll never share your email"
        />
      )
      expect(screen.getByText(/we'll never share your email/i)).toBeInTheDocument()
    })

    it('should render with error message', () => {
      render(
        <FormInput
          label="Email"
          name="email"
          error="Email is required"
        />
      )
      expect(screen.getByText(/email is required/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toHaveAttribute('aria-invalid', 'true')
    })

    it('should render with left addon', () => {
      render(
        <FormInput
          label="Username"
          name="username"
          leftAddon={<span data-testid="left-addon">@</span>}
        />
      )
      expect(screen.getByTestId('left-addon')).toBeInTheDocument()
    })

    it('should render with right addon', () => {
      render(
        <FormInput
          label="Email"
          name="email"
          rightAddon={<span data-testid="right-addon">.com</span>}
        />
      )
      expect(screen.getByTestId('right-addon')).toBeInTheDocument()
    })

    it('should render required indicator', () => {
      render(<FormInput label="Email" name="email" required />)
      const label = screen.getByText(/email/i)
      expect(label.parentElement?.querySelector('.text-destructive')).toHaveTextContent('*')
    })

    it('should render different input types', () => {
      const { rerender } = render(<FormInput name="text" type="text" />)
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'text')

      rerender(<FormInput name="email" type="email" />)
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email')

      rerender(<FormInput name="number" type="number" />)
      expect(screen.getByRole('spinbutton')).toHaveAttribute('type', 'number')

      rerender(<FormInput name="tel" type="tel" />)
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'tel')
    })
  })

  describe('States', () => {
    it('should apply disabled state', () => {
      render(<FormInput label="Email" name="email" disabled />)
      const input = screen.getByLabelText(/email/i)
      
      expect(input).toBeDisabled()
      expect(input).toHaveClass('opacity-50', 'cursor-not-allowed')
    })

    it('should apply readonly state', () => {
      render(<FormInput label="Email" name="email" readOnly value="test@example.com" />)
      const input = screen.getByLabelText(/email/i)
      
      expect(input).toHaveAttribute('readonly')
      expect(input).toHaveValue('test@example.com')
    })

    it('should show error state styling', () => {
      render(<FormInput label="Email" name="email" error="Invalid email" />)
      const input = screen.getByLabelText(/email/i)
      
      expect(input).toHaveClass('border-destructive')
      expect(input).toHaveAttribute('aria-invalid', 'true')
      expect(input).toHaveAttribute('aria-describedby', expect.stringContaining('error'))
    })

    it('should show focus state', async () => {
      const user = userEvent.setup()
      render(<FormInput label="Email" name="email" />)
      const input = screen.getByLabelText(/email/i)
      
      await user.click(input)
      expect(input).toHaveFocus()
      expect(input).toHaveClass('focus:ring-2')
    })
  })

  describe('Interactions', () => {
    it('should handle text input', async () => {
      const onChange = jest.fn()
      const user = userEvent.setup()
      
      render(<FormInput label="Email" name="email" onChange={onChange} />)
      const input = screen.getByLabelText(/email/i)
      
      await user.type(input, 'test@example.com')
      
      expect(input).toHaveValue('test@example.com')
      expect(onChange).toHaveBeenCalled()
    })

    it('should handle controlled input', () => {
      const { rerender } = render(
        <FormInput label="Email" name="email" value="initial" onChange={() => {}} />
      )
      const input = screen.getByLabelText(/email/i)
      
      expect(input).toHaveValue('initial')
      
      rerender(
        <FormInput label="Email" name="email" value="updated" onChange={() => {}} />
      )
      
      expect(input).toHaveValue('updated')
    })

    it('should call onBlur when focus is lost', async () => {
      const onBlur = jest.fn()
      const user = userEvent.setup()
      
      render(<FormInput label="Email" name="email" onBlur={onBlur} />)
      const input = screen.getByLabelText(/email/i)
      
      await user.click(input)
      await user.tab()
      
      expect(onBlur).toHaveBeenCalled()
    })

    it('should call onFocus when focused', async () => {
      const onFocus = jest.fn()
      const user = userEvent.setup()
      
      render(<FormInput label="Email" name="email" onFocus={onFocus} />)
      const input = screen.getByLabelText(/email/i)
      
      await user.click(input)
      
      expect(onFocus).toHaveBeenCalled()
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      
      render(
        <>
          <FormInput label="First" name="first" />
          <FormInput label="Second" name="second" />
        </>
      )
      
      const firstInput = screen.getByLabelText(/first/i)
      const secondInput = screen.getByLabelText(/second/i)
      
      firstInput.focus()
      expect(document.activeElement).toBe(firstInput)
      
      await user.tab()
      expect(document.activeElement).toBe(secondInput)
      
      await user.tab({ shift: true })
      expect(document.activeElement).toBe(firstInput)
    })
  })

  describe('Validation', () => {
    it('should support HTML5 validation attributes', () => {
      render(
        <FormInput
          label="Email"
          name="email"
          type="email"
          required
          minLength={5}
          maxLength={50}
          pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
        />
      )
      
      const input = screen.getByLabelText(/email/i)
      
      expect(input).toHaveAttribute('required')
      expect(input).toHaveAttribute('minLength', '5')
      expect(input).toHaveAttribute('maxLength', '50')
      expect(input).toHaveAttribute('pattern')
    })

    it('should support number validation attributes', () => {
      render(
        <FormInput
          label="Age"
          name="age"
          type="number"
          min={18}
          max={100}
          step={1}
        />
      )
      
      const input = screen.getByLabelText(/age/i)
      
      expect(input).toHaveAttribute('min', '18')
      expect(input).toHaveAttribute('max', '100')
      expect(input).toHaveAttribute('step', '1')
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <FormInput
          label="Email"
          name="email"
          required
          error="Email is required"
          helperText="Enter your email address"
        />
      )
      
      const input = screen.getByLabelText(/email/i)
      
      expect(input).toHaveAttribute('aria-required', 'true')
      expect(input).toHaveAttribute('aria-invalid', 'true')
      expect(input).toHaveAttribute('aria-describedby')
      
      const describedBy = input.getAttribute('aria-describedby')
      expect(describedBy).toContain('error')
      expect(describedBy).toContain('helper')
    })

    it('should associate label with input', () => {
      render(<FormInput label="Email" name="email" />)
      
      const input = screen.getByLabelText(/email/i)
      const label = screen.getByText(/email/i)
      
      expect(label).toHaveAttribute('for', input.id)
    })

    it('should support aria-label when no visual label', () => {
      render(<FormInput name="email" aria-label="Email address" />)
      
      expect(screen.getByRole('textbox', { name: /email address/i })).toBeInTheDocument()
    })

    it('should announce errors to screen readers', () => {
      const { rerender } = render(<FormInput label="Email" name="email" />)
      const input = screen.getByLabelText(/email/i)
      
      expect(input).not.toHaveAttribute('aria-invalid')
      
      rerender(<FormInput label="Email" name="email" error="Email is required" />)
      
      expect(input).toHaveAttribute('aria-invalid', 'true')
      expect(screen.getByRole('alert')).toHaveTextContent('Email is required')
    })
  })

  describe('Custom Styling', () => {
    it('should apply custom className', () => {
      render(
        <FormInput
          label="Email"
          name="email"
          className="custom-class"
        />
      )
      
      const input = screen.getByLabelText(/email/i)
      expect(input).toHaveClass('custom-class')
    })

    it('should forward additional props', () => {
      render(
        <FormInput
          label="Email"
          name="email"
          data-testid="custom-input"
          autoComplete="email"
          autoFocus
        />
      )
      
      const input = screen.getByTestId('custom-input')
      expect(input).toHaveAttribute('autoComplete', 'email')
      expect(input).toHaveFocus()
    })
  })

  describe('Form Integration', () => {
    it('should work with form submission', async () => {
      const handleSubmit = jest.fn()
      const user = userEvent.setup()
      
      render(
        <form onSubmit={handleSubmit}>
          <FormInput label="Email" name="email" required />
          <button type="submit">Submit</button>
        </form>
      )
      
      const input = screen.getByLabelText(/email/i)
      const submitButton = screen.getByRole('button', { name: /submit/i })
      
      await user.type(input, 'test@example.com')
      await user.click(submitButton)
      
      expect(handleSubmit).toHaveBeenCalled()
    })

    it('should reset with form reset', async () => {
      const user = userEvent.setup()
      
      render(
        <form>
          <FormInput label="Email" name="email" />
          <button type="reset">Reset</button>
        </form>
      )
      
      const input = screen.getByLabelText(/email/i)
      const resetButton = screen.getByRole('button', { name: /reset/i })
      
      await user.type(input, 'test@example.com')
      expect(input).toHaveValue('test@example.com')
      
      await user.click(resetButton)
      expect(input).toHaveValue('')
    })
  })
})