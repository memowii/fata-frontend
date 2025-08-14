import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { screen, waitFor } from '@testing-library/react'
import { RegisterForm } from '../RegisterForm'
import { render } from '@/test/utils/test-utils'
import { 
  fillForm, 
  expectValidationError,
  expectButtonState,
  expectAccessibleForm,
} from '@/test/utils/test-helpers'

describe('RegisterForm', () => {
  const mockOnSubmit = jest.fn<(data: any) => Promise<void>>()
  
  beforeEach(() => {
    mockOnSubmit.mockClear()
  })

  describe('Rendering', () => {
    it('should render all form elements correctly', () => {
      render(<RegisterForm onSubmit={mockOnSubmit} />)
      
      expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument()
      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/agree to terms/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
    })

    it('should render optional login link when enabled', () => {
      render(<RegisterForm onSubmit={mockOnSubmit} showLoginLink />)
      expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument()
    })

    it('should not render login link when disabled', () => {
      render(<RegisterForm onSubmit={mockOnSubmit} showLoginLink={false} />)
      expect(screen.queryByRole('link', { name: /sign in/i })).not.toBeInTheDocument()
    })

    it('should display password strength indicator', async () => {
      const { user } = render(<RegisterForm onSubmit={mockOnSubmit} />)
      
      const passwordInput = screen.getByLabelText(/^password$/i)
      await user.type(passwordInput, 'weak')
      
      expect(screen.getByText(/password strength/i)).toBeInTheDocument()
    })

    it('should have proper form accessibility attributes', () => {
      const { container } = render(<RegisterForm onSubmit={mockOnSubmit} />)
      const form = container.querySelector('form')
      
      expect(form).toHaveAttribute('noValidate')
      expectAccessibleForm(form!)
    })
  })

  describe('Form Validation', () => {
    it('should show validation errors for empty fields', async () => {
      const { user } = render(<RegisterForm onSubmit={mockOnSubmit} />)
      
      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument()
        expect(screen.getByText(/email is required/i)).toBeInTheDocument()
        expect(screen.getByText(/password is required/i)).toBeInTheDocument()
        expect(screen.getByText(/please confirm your password/i)).toBeInTheDocument()
        expect(screen.getByText(/you must accept the terms/i)).toBeInTheDocument()
      })
      
      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('should validate email format', async () => {
      const { user } = render(<RegisterForm onSubmit={mockOnSubmit} />)
      
      await fillForm(user, {
        'email address': 'invalid-email',
      })
      
      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expectValidationError('email', 'Please enter a valid email address')
      })
    })

    it('should validate password requirements', async () => {
      const { user } = render(<RegisterForm onSubmit={mockOnSubmit} />)
      
      await fillForm(user, {
        'password': 'weak',
      })
      
      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument()
      })
    })

    it('should validate password confirmation match', async () => {
      const { user } = render(<RegisterForm onSubmit={mockOnSubmit} />)
      
      await fillForm(user, {
        'password': 'Password123!',
        'confirm password': 'DifferentPassword123!',
      })
      
      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expectValidationError('confirm password', 'Passwords do not match')
      })
    })

    it('should validate name length', async () => {
      const { user } = render(<RegisterForm onSubmit={mockOnSubmit} />)
      
      await fillForm(user, {
        'full name': 'ab',
      })
      
      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expectValidationError('full name', 'Name must be at least 3 characters')
      })
    })

    it('should require terms acceptance', async () => {
      const { user } = render(<RegisterForm onSubmit={mockOnSubmit} />)
      
      await fillForm(user, {
        'full name': 'Test User',
        'email address': 'test@example.com',
        'password': 'Password123!',
        'confirm password': 'Password123!',
      })
      
      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/you must accept the terms/i)).toBeInTheDocument()
      })
      
      expect(mockOnSubmit).not.toHaveBeenCalled()
    })
  })

  describe('Form Submission', () => {
    it('should submit form with valid data', async () => {
      mockOnSubmit.mockResolvedValueOnce(undefined)
      const { user } = render(<RegisterForm onSubmit={mockOnSubmit} />)
      
      await fillForm(user, {
        'full name': 'Test User',
        'email address': 'test@example.com',
        'password': 'Password123!',
        'confirm password': 'Password123!',
      })
      
      const termsCheckbox = screen.getByLabelText(/agree to terms/i)
      await user.click(termsCheckbox)
      
      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          name: 'Test User',
          email: 'test@example.com',
          password: 'Password123!',
          confirmPassword: 'Password123!',
          acceptTerms: true,
        })
      })
    })

    it('should handle submission errors', async () => {
      const errorMessage = 'Email already exists'
      mockOnSubmit.mockRejectedValueOnce(new Error(errorMessage))
      
      const { user } = render(<RegisterForm onSubmit={mockOnSubmit} />)
      
      await fillForm(user, {
        'full name': 'Test User',
        'email address': 'test@example.com',
        'password': 'Password123!',
        'confirm password': 'Password123!',
      })
      
      const termsCheckbox = screen.getByLabelText(/agree to terms/i)
      await user.click(termsCheckbox)
      
      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(errorMessage)
      })
    })

    it('should show loading state during submission', async () => {
      mockOnSubmit.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
      
      const { user } = render(<RegisterForm onSubmit={mockOnSubmit} />)
      
      await fillForm(user, {
        'full name': 'Test User',
        'email address': 'test@example.com',
        'password': 'Password123!',
        'confirm password': 'Password123!',
      })
      
      const termsCheckbox = screen.getByLabelText(/agree to terms/i)
      await user.click(termsCheckbox)
      
      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)
      
      expectButtonState(submitButton, 'loading')
      expect(submitButton).toHaveTextContent(/creating account/i)
      
      await waitFor(() => {
        expectButtonState(submitButton, 'enabled')
        expect(submitButton).toHaveTextContent(/create account/i)
      })
    })
  })

  describe('Password Strength Indicator', () => {
    it('should show weak password strength', async () => {
      const { user } = render(<RegisterForm onSubmit={mockOnSubmit} />)
      
      const passwordInput = screen.getByLabelText(/^password$/i)
      await user.type(passwordInput, 'weak')
      
      expect(screen.getByText(/weak/i)).toBeInTheDocument()
      expect(screen.getByText(/weak/i)).toHaveClass('text-destructive')
    })

    it('should show medium password strength', async () => {
      const { user } = render(<RegisterForm onSubmit={mockOnSubmit} />)
      
      const passwordInput = screen.getByLabelText(/^password$/i)
      await user.type(passwordInput, 'Password1')
      
      expect(screen.getByText(/medium/i)).toBeInTheDocument()
      expect(screen.getByText(/medium/i)).toHaveClass('text-warning')
    })

    it('should show strong password strength', async () => {
      const { user } = render(<RegisterForm onSubmit={mockOnSubmit} />)
      
      const passwordInput = screen.getByLabelText(/^password$/i)
      await user.type(passwordInput, 'StrongPassword123!')
      
      expect(screen.getByText(/strong/i)).toBeInTheDocument()
      expect(screen.getByText(/strong/i)).toHaveClass('text-success')
    })

    it('should show password requirements', async () => {
      const { user } = render(<RegisterForm onSubmit={mockOnSubmit} />)
      
      const passwordInput = screen.getByLabelText(/^password$/i)
      await user.type(passwordInput, 'test')
      
      expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument()
      expect(screen.getByText(/uppercase letter/i)).toBeInTheDocument()
      expect(screen.getByText(/number/i)).toBeInTheDocument()
    })
  })

  describe('Password Visibility Toggle', () => {
    it('should toggle password visibility', async () => {
      const { user } = render(<RegisterForm onSubmit={mockOnSubmit} />)
      
      const passwordInput = screen.getByLabelText(/^password$/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
      
      expect(passwordInput).toHaveAttribute('type', 'password')
      expect(confirmPasswordInput).toHaveAttribute('type', 'password')
      
      const toggleButtons = screen.getAllByRole('button', { name: /show password/i })
      
      // Toggle first password field
      await user.click(toggleButtons[0])
      expect(passwordInput).toHaveAttribute('type', 'text')
      
      // Toggle confirm password field
      await user.click(toggleButtons[1])
      expect(confirmPasswordInput).toHaveAttribute('type', 'text')
    })
  })

  describe('Terms and Conditions', () => {
    it('should open terms modal when clicking terms link', async () => {
      const { user } = render(<RegisterForm onSubmit={mockOnSubmit} />)
      
      const termsLink = screen.getByRole('link', { name: /terms and conditions/i })
      await user.click(termsLink)
      
      // In a real app, this would open a modal or navigate to terms page
      expect(termsLink).toHaveAttribute('href', '/terms')
    })

    it('should open privacy policy when clicking privacy link', async () => {
      const { user } = render(<RegisterForm onSubmit={mockOnSubmit} />)
      
      const privacyLink = screen.getByRole('link', { name: /privacy policy/i })
      await user.click(privacyLink)
      
      expect(privacyLink).toHaveAttribute('href', '/privacy')
    })
  })

  describe('Error Handling', () => {
    it('should dismiss error alert', async () => {
      const { user } = render(
        <RegisterForm onSubmit={mockOnSubmit} error="Test error" />
      )
      
      const alert = screen.getByRole('alert')
      expect(alert).toHaveTextContent('Test error')
      
      const dismissButton = screen.getByRole('button', { name: /dismiss/i })
      await user.click(dismissButton)
      
      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      })
    })

    it('should focus first invalid field on error', async () => {
      const { user } = render(<RegisterForm onSubmit={mockOnSubmit} />)
      
      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        const nameInput = screen.getByLabelText(/full name/i)
        expect(document.activeElement).toBe(nameInput)
      })
    })
  })
})