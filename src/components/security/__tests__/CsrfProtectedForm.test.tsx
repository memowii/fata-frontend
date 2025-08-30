/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CsrfProtectedForm, useCsrfFormState, CsrfStatus } from '../CsrfProtectedForm';

// Mock the useCsrfToken hook
jest.mock('../../hooks/useCsrfToken', () => ({
  useCsrfToken: jest.fn(),
  useCsrfProtectionStatus: jest.fn(),
}));

import { useCsrfToken, useCsrfProtectionStatus } from '../../hooks/useCsrfToken';

const mockUseCsrfToken = useCsrfToken as jest.MockedFunction<typeof useCsrfToken>;
const mockUseCsrfProtectionStatus = useCsrfProtectionStatus as jest.MockedFunction<
  typeof useCsrfProtectionStatus
>;

// Test wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  
  Wrapper.displayName = 'QueryClientWrapper';
  return Wrapper;
};

describe('CsrfProtectedForm', () => {
  const mockRefreshToken = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockRefreshToken.mockClear();

    // Default mock implementations
    mockUseCsrfToken.mockReturnValue({
      csrfToken: 'csrf-token-123',
      isLoading: false,
      isError: false,
      error: null,
      isRefreshing: false,
      isExpired: false,
      refreshToken: mockRefreshToken,
      getValidToken: jest.fn().mockResolvedValue('csrf-token-123'),
      invalidateToken: jest.fn(),
      clearToken: jest.fn(),
    });

    mockUseCsrfProtectionStatus.mockReturnValue({
      isAvailable: true,
      isChecking: false,
      hasFailed: false,
    });
  });

  it('should render children when CSRF protection is available', () => {
    render(
      <CsrfProtectedForm>
        <div data-testid="form-content">Form content</div>
      </CsrfProtectedForm>,
      { wrapper: createWrapper() }
    );

    expect(screen.getByTestId('form-content')).toBeInTheDocument();
  });

  it('should show loading state when CSRF is being checked', () => {
    mockUseCsrfProtectionStatus.mockReturnValue({
      isAvailable: false,
      isChecking: true,
      hasFailed: false,
    });

    render(
      <CsrfProtectedForm showCsrfLoading>
        <div data-testid="form-content">Form content</div>
      </CsrfProtectedForm>,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Securing form...')).toBeInTheDocument();
    expect(screen.queryByTestId('form-content')).not.toBeInTheDocument();
  });

  it('should show custom loading message', () => {
    mockUseCsrfProtectionStatus.mockReturnValue({
      isAvailable: false,
      isChecking: true,
      hasFailed: false,
    });

    render(
      <CsrfProtectedForm showCsrfLoading loadingMessage="Custom loading message">
        <div data-testid="form-content">Form content</div>
      </CsrfProtectedForm>,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Custom loading message')).toBeInTheDocument();
  });

  it('should show error state when CSRF protection fails', () => {
    mockUseCsrfProtectionStatus.mockReturnValue({
      isAvailable: false,
      isChecking: false,
      hasFailed: true,
    });

    render(
      <CsrfProtectedForm showCsrfError>
        <div data-testid="form-content">Form content</div>
      </CsrfProtectedForm>,
      { wrapper: createWrapper() }
    );

    expect(
      screen.getByText('Security features are temporarily unavailable. Please refresh the page.')
    ).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
    expect(screen.queryByTestId('form-content')).not.toBeInTheDocument();
  });

  it('should show custom error message', () => {
    mockUseCsrfProtectionStatus.mockReturnValue({
      isAvailable: false,
      isChecking: false,
      hasFailed: true,
    });

    render(
      <CsrfProtectedForm showCsrfError errorMessage="Custom error message">
        <div data-testid="form-content">Form content</div>
      </CsrfProtectedForm>,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Custom error message')).toBeInTheDocument();
  });

  it('should call refreshToken when retry button is clicked', async () => {
    mockUseCsrfProtectionStatus.mockReturnValue({
      isAvailable: false,
      isChecking: false,
      hasFailed: true,
    });

    render(
      <CsrfProtectedForm showCsrfError>
        <div data-testid="form-content">Form content</div>
      </CsrfProtectedForm>,
      { wrapper: createWrapper() }
    );

    const retryButton = screen.getByText('Try Again');
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(mockRefreshToken).toHaveBeenCalledTimes(1);
    });
  });

  it('should call onCsrfError when CSRF error occurs', () => {
    const mockOnCsrfError = jest.fn();
    const mockError = new Error('CSRF error');

    mockUseCsrfToken.mockReturnValue({
      csrfToken: null,
      isLoading: false,
      isError: true,
      error: mockError,
      isRefreshing: false,
      isExpired: false,
      refreshToken: mockRefreshToken,
      getValidToken: jest.fn(),
      invalidateToken: jest.fn(),
      clearToken: jest.fn(),
    });

    mockUseCsrfProtectionStatus.mockReturnValue({
      isAvailable: false,
      isChecking: false,
      hasFailed: true,
    });

    render(
      <CsrfProtectedForm onCsrfError={mockOnCsrfError}>
        <div data-testid="form-content">Form content</div>
      </CsrfProtectedForm>,
      { wrapper: createWrapper() }
    );

    expect(mockOnCsrfError).toHaveBeenCalledWith(mockError);
  });

  it('should not show loading/error states when flags are false', () => {
    mockUseCsrfProtectionStatus.mockReturnValue({
      isAvailable: false,
      isChecking: true,
      hasFailed: false,
    });

    render(
      <CsrfProtectedForm showCsrfLoading={false}>
        <div data-testid="form-content">Form content</div>
      </CsrfProtectedForm>,
      { wrapper: createWrapper() }
    );

    expect(screen.getByTestId('form-content')).toBeInTheDocument();
    expect(screen.queryByText('Securing form...')).not.toBeInTheDocument();
  });
});

describe('useCsrfFormState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return form state based on CSRF protection status', () => {
    mockUseCsrfProtectionStatus.mockReturnValue({
      isAvailable: true,
      isChecking: false,
      hasFailed: false,
    });

    const TestComponent = () => {
      const formState = useCsrfFormState();
      return (
        <div>
          <span data-testid="should-disable">{formState.shouldDisableForm.toString()}</span>
          <span data-testid="is-initializing">{formState.isInitializing.toString()}</span>
          <span data-testid="has-failed">{formState.hasProtectionFailed.toString()}</span>
        </div>
      );
    };

    render(<TestComponent />, { wrapper: createWrapper() });

    expect(screen.getByTestId('should-disable')).toHaveTextContent('false');
    expect(screen.getByTestId('is-initializing')).toHaveTextContent('false');
    expect(screen.getByTestId('has-failed')).toHaveTextContent('false');
  });

  it('should disable form when CSRF protection is not available', () => {
    mockUseCsrfProtectionStatus.mockReturnValue({
      isAvailable: false,
      isChecking: false,
      hasFailed: true,
    });

    const TestComponent = () => {
      const formState = useCsrfFormState();
      return <span data-testid="should-disable">{formState.shouldDisableForm.toString()}</span>;
    };

    render(<TestComponent />, { wrapper: createWrapper() });

    expect(screen.getByTestId('should-disable')).toHaveTextContent('true');
  });
});

describe('CsrfStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show initializing status', () => {
    mockUseCsrfProtectionStatus.mockReturnValue({
      isAvailable: false,
      isChecking: true,
      hasFailed: false,
    });

    render(<CsrfStatus />, { wrapper: createWrapper() });

    expect(screen.getByText('Initializing security...')).toBeInTheDocument();
  });

  it('should show failed status', () => {
    mockUseCsrfProtectionStatus.mockReturnValue({
      isAvailable: false,
      isChecking: false,
      hasFailed: true,
    });

    render(<CsrfStatus />, { wrapper: createWrapper() });

    expect(screen.getByText('Security unavailable')).toBeInTheDocument();
  });

  it('should show secured status', () => {
    mockUseCsrfProtectionStatus.mockReturnValue({
      isAvailable: true,
      isChecking: false,
      hasFailed: false,
    });

    render(<CsrfStatus />, { wrapper: createWrapper() });

    expect(screen.getByText('Secured')).toBeInTheDocument();
  });

  it('should render nothing when no clear status', () => {
    mockUseCsrfProtectionStatus.mockReturnValue({
      isAvailable: false,
      isChecking: false,
      hasFailed: false,
    });

    const { container } = render(<CsrfStatus />, { wrapper: createWrapper() });

    expect(container.firstChild).toBeNull();
  });
});