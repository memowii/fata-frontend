// Jest setup file - runs before each test suite
import '@testing-library/jest-dom'
import 'whatwg-fetch'

// Polyfills for MSW in Jest environment
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util')
  global.TextEncoder = TextEncoder
  global.TextDecoder = TextDecoder
}

// Add ReadableStream polyfill if needed
if (typeof global.ReadableStream === 'undefined') {
  const { ReadableStream } = require('stream/web')
  global.ReadableStream = ReadableStream
}

// Add TransformStream polyfill
if (typeof global.TransformStream === 'undefined') {
  global.TransformStream = class TransformStream {
    constructor() {
      this.readable = new ReadableStream()
      this.writable = new WritableStream()
    }
  }
}

// Add WritableStream polyfill if needed
if (typeof global.WritableStream === 'undefined') {
  global.WritableStream = class WritableStream {
    constructor() {}
    getWriter() {
      return {
        write: () => Promise.resolve(),
        close: () => Promise.resolve(),
        abort: () => Promise.resolve(),
        releaseLock: () => {},
      }
    }
  }
}

// Add BroadcastChannel polyfill
if (typeof global.BroadcastChannel === 'undefined') {
  global.BroadcastChannel = class BroadcastChannel {
    constructor(name) {
      this.name = name
      this.onmessage = null
      this.onmessageerror = null
    }
    postMessage() {}
    close() {}
    addEventListener() {}
    removeEventListener() {}
    dispatchEvent() { return true }
  }
}

// Import MSW server after polyfills are defined
const { server } = require('./src/test/mocks/server')

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  usePathname() {
    return ''
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  useParams() {
    return {}
  },
  redirect: jest.fn(),
  notFound: jest.fn(),
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
  takeRecords() {
    return []
  }
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.sessionStorage = sessionStorageMock

// Establish API mocking before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

// Reset any request handlers that we may add during the tests,
// so they don't affect other tests
afterEach(() => {
  server.resetHandlers()
  jest.clearAllMocks()
  localStorageMock.getItem.mockClear()
  localStorageMock.setItem.mockClear()
  localStorageMock.removeItem.mockClear()
  localStorageMock.clear.mockClear()
  sessionStorageMock.getItem.mockClear()
  sessionStorageMock.setItem.mockClear()
  sessionStorageMock.removeItem.mockClear()
  sessionStorageMock.clear.mockClear()
})

// Clean up after the tests are finished
afterAll(() => server.close())

// Suppress console errors in tests (optional)
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Not implemented: navigation') ||
       args[0].includes('Warning: ReactDOM.render'))
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})