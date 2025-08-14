import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { screen, waitFor, fireEvent } from '@testing-library/react'
import { LoginForm } from '../LoginForm'
import { render } from '@/test/utils/test-utils'
import { 
  fillForm, 
  expectValidationError,
  expectButtonState,
  expectAccessibleForm,
} from '@/test/utils/test-helpers'

describe('LoginForm', () => {
  const mockOnSubmit = jest.fn<(data: any) => Promise<void>>()
  
  beforeEach(() => {
    mockOnSubmit.mockClear()
  })

  describe('Rendering', () => {
    it('should render all form elements correctly', () => {
      render(<LoginForm onSubmit={mockOnSubmit} />)
      
      expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument()
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/remember me/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    })

    it('should render optional links when enabled', () => {
      render(
        <LoginForm
          onSubmit={mockOnSubmit}
          showRegisterLink
          showForgotPasswordLink
        />
      )
      
      expect(screen.getByRole('link', { name: /forgot password/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /create account/i })).toBeInTheDocument()
    })

    it('should not render optional links when disabled', () => {
      render(
        <LoginForm
          onSubmit={mockOnSubmit}
          showRegisterLink={false}
          showForgotPasswordLink={false}
        />
      )
      
      expect(screen.queryByRole('link', { name: /forgot password/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('link', { name: /create account/i })).not.toBeInTheDocument()
    })

    it('should display external error message', () => {
      const errorMessage = 'Invalid credentials'
      render(<LoginForm onSubmit={mockOnSubmit} error={errorMessage} />)
      
      expect(screen.getByRole('alert')).toHaveTextContent(errorMessage)
    })

    it('should have proper form accessibility attributes', () => {
      const { container } = render(<LoginForm onSubmit={mockOnSubmit} />)
      const form = container.querySelector('form')
      
      expect(form).toHaveAttribute('noValidate')
      expectAccessibleForm(form!)
    })
  })

  describe('Form Validation', () => {
    it('should show validation errors for empty fields', async () => {
      const { user } = render(<LoginForm onSubmit={mockOnSubmit} />)
      
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument()
        expect(screen.getByText(/password is required/i)).toBeInTheDocument()
      })
      
      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('should validate email format', async () => {
      const { user } = render(<LoginForm onSubmit={mockOnSubmit} />)
      
      await fillForm(user, {
        'email address': 'invalid-email',
        'password': 'password123',
      })
      
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expectValidationError('email', 'Please enter a valid email address')
      })
      
      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('should validate password minimum length', async () => {
      const { user } = render(<LoginForm onSubmit={mockOnSubmit} />)
      
      await fillForm(user, {
        'email address': 'test@example.com',
        'password': '123',
      })
      
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expectValidationError('password', 'Password must be at least 8 characters')
      })
      
      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('should clear validation errors when corrected', async () => {
      const { user } = render(<LoginForm onSubmit={mockOnSubmit} />)
      
      // Submit with invalid data
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument()
      })
      
      // Fix the errors
      await fillForm(user, {
        'email address': 'test@example.com',
        'password': 'password123',
      })
      
      await waitFor(() => {
        expect(screen.queryByText(/email is required/i)).not.toBeInTheDocument()
        expect(screen.queryByText(/password is required/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Form Submission', () => {
    it('should submit form with valid data', async () => {
      mockOnSubmit.mockResolvedValueOnce(undefined)
      const { user } = render(<LoginForm onSubmit={mockOnSubmit} />)
      
      await fillForm(user, {
        'email address': 'test@example.com',
        'password': 'password123',
      })
      
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        })
      })
    })

    it('should handle submission errors', async () => {
      const errorMessage = 'Network error occurred'
      mockOnSubmit.mockRejectedValueOnce(new Error(errorMessage))
      
      const { user } = render(<LoginForm onSubmit={mockOnSubmit} />)
      
      await fillForm(user, {
        'email address': 'test@example.com',
        'password': 'password123',
      })
      
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(errorMessage)
      })
    })

    it('should show loading state during submission', async () => {
      mockOnSubmit.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
      
      const { user } = render(<LoginForm onSubmit={mockOnSubmit} />)
      
      await fillForm(user, {
        'email address': 'test@example.com',
        'password': 'password123',
      })
      
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      await user.click(submitButton)
      
      expectButtonState(submitButton, 'loading')
      expect(submitButton).toHaveTextContent(/signing in/i)
      
      await waitFor(() => {
        expectButtonState(submitButton, 'enabled')
        expect(submitButton).toHaveTextContent(/sign in/i)
      })
    })

    it('should disable form during external loading state', () => {
      render(<LoginForm onSubmit={mockOnSubmit} isLoading />)
      
      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/^password$/i)
      const submitButton = screen.getByRole('button', { name: /sign/i })
      
      expect(emailInput).toBeDisabled()
      expect(passwordInput).toBeDisabled()
      expectButtonState(submitButton, 'loading')
    })
  })

  describe('Remember Me Feature', () => {
    it('should save remember me preference to localStorage', async () => {
      mockOnSubmit.mockResolvedValueOnce(undefined)
      const { user } = render(<LoginForm onSubmit={mockOnSubmit} />)
      
      const rememberCheckbox = screen.getByLabelText(/remember me/i)
      await user.click(rememberCheckbox)
      
      await fillForm(user, {
        'email address': 'test@example.com',
        'password': 'password123',
      })
      
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(localStorage.setItem).toHaveBeenCalledWith('rememberMe', 'true')
      })
    })

    it('should remove remember me from localStorage when unchecked', async () => {
      mockOnSubmit.mockResolvedValueOnce(undefined)
      const { user } = render(<LoginForm onSubmit={mockOnSubmit} />)
      
      await fillForm(user, {
        'email address': 'test@example.com',
        'password': 'password123',
      })
      
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(localStorage.removeItem).toHaveBeenCalledWith('rememberMe')
      })
    })
  })

  describe('Error Handling', () => {
    it('should dismiss error alert when clicking dismiss button', async () => {
      const { user } = render(
        <LoginForm onSubmit={mockOnSubmit} error="Test error" />
      )
      
      const alert = screen.getByRole('alert')
      expect(alert).toHaveTextContent('Test error')
      
      const dismissButton = screen.getByRole('button', { name: /dismiss/i })
      await user.click(dismissButton)
      
      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      })
    })

    it('should clear submit error when resubmitting', async () => {
      mockOnSubmit
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValueOnce(undefined)
      
      const { user } = render(<LoginForm onSubmit={mockOnSubmit} />)
      
      await fillForm(user, {
        'email address': 'test@example.com',
        'password': 'password123',
      })
      
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      
      // First submission with error
      await user.click(submitButton)
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('First error')
      })
      
      // Second submission should clear error
      await user.click(submitButton)
      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      })
    })
  })

  describe('Password Visibility Toggle', () => {
    it('should toggle password visibility', async () => {
      const { user } = render(<LoginForm onSubmit={mockOnSubmit} />)
      
      const passwordInput = screen.getByLabelText(/^password$/i)
      expect(passwordInput).toHaveAttribute('type', 'password')
      
      // Find and click the visibility toggle button
      const toggleButton = screen.getByRole('button', { name: /show password/i })
      await user.click(toggleButton)
      
      expect(passwordInput).toHaveAttribute('type', 'text')
      
      await user.click(toggleButton)
      expect(passwordInput).toHaveAttribute('type', 'password')
    })
  })

  describe('Keyboard Navigation', () => {
    it('should submit form on Enter key press', async () => {
      mockOnSubmit.mockResolvedValueOnce(undefined)
      const { user } = render(<LoginForm onSubmit={mockOnSubmit} />)
      
      await fillForm(user, {
        'email address': 'test@example.com',
        'password': 'password123',
      })
      
      const passwordInput = screen.getByLabelText(/^password$/i)
      await user.type(passwordInput, '{Enter}')
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled()
      })
    })

    it('should support Tab navigation through form elements', async () => {
      const { user } = render(<LoginForm onSubmit={mockOnSubmit} />)
      
      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/^password$/i)
      const rememberCheckbox = screen.getByLabelText(/remember me/i)
      const forgotLink = screen.getByRole('link', { name: /forgot password/i })
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      
      emailInput.focus()
      expect(document.activeElement).toBe(emailInput)
      
      await user.tab()
      expect(document.activeElement).toBe(passwordInput)
      
      await user.tab()
      expect(document.activeElement).toBe(rememberCheckbox)
      
      await user.tab()
      expect(document.activeElement).toBe(forgotLink)
      
      await user.tab()
      expect(document.activeElement).toBe(submitButton)
    })
  })

  describe('Redirect Handling', () => {
    it('should include redirect URL as hidden input when provided', () => {
      const redirectUrl = '/dashboard'
      render(
        <LoginForm 
          onSubmit={mockOnSubmit} 
          redirectTo={redirectUrl}
        />
      )
      
      const hiddenInput = document.querySelector('input[name="redirectTo"]') as HTMLInputElement
      expect(hiddenInput).toBeInTheDocument()
      expect(hiddenInput.value).toBe(redirectUrl)
      expect(hiddenInput.type).toBe('hidden')
    })
  })
})