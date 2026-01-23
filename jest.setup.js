// Learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";

// Polyfill for Request/Response (needed for Next.js API route tests)
// Next.js server modules require these globals to be available
// We use a simple mock since Next.js will provide the real implementations at runtime
if (typeof global.Request === 'undefined') {
  // Minimal polyfill - Next.js will provide real implementations
  global.Request = class Request {
    constructor(url, init = {}) {
      this.url = url
      this.method = init.method || 'GET'
      this.headers = new Map()
      if (init.headers) {
        Object.entries(init.headers).forEach(([key, value]) => {
          this.headers.set(key, value)
        })
      }
    }
    async json() {
      return {}
    }
    async text() {
      return ''
    }
  }
  
  global.Response = class Response {
    constructor(body, init = {}) {
      this.body = body
      this.status = init.status || 200
      this.statusText = init.statusText || 'OK'
      this.headers = new Map()
      if (init.headers) {
        Object.entries(init.headers).forEach(([key, value]) => {
          this.headers.set(key, value)
        })
      }
    }
    async json() {
      return typeof this.body === 'string' ? JSON.parse(this.body || '{}') : this.body
    }
    async text() {
      return typeof this.body === 'string' ? this.body : JSON.stringify(this.body || {})
    }
  }
  
  global.Headers = class Headers {
    constructor(init = {}) {
      this.map = new Map()
      if (init) {
        Object.entries(init).forEach(([key, value]) => {
          this.map.set(key.toLowerCase(), value)
        })
      }
    }
    get(name) {
      return this.map.get(name.toLowerCase())
    }
    set(name, value) {
      this.map.set(name.toLowerCase(), value)
    }
    has(name) {
      return this.map.has(name.toLowerCase())
    }
  }
}

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      pathname: "/",
      query: {},
      asPath: "/",
    };
  },
  useParams() {
    return {};
  },
  usePathname() {
    return "/";
  },
  useSearchParams() {
    return new URLSearchParams();
  },
}));

// Mock Prisma - must be done before any imports
jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    careTeamMember: {
      findFirst: jest.fn(),
    },
    careTeam: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    task: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    routine: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    routineInstance: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
    },
    mood: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    note: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

// Mock Clerk - must be done before any imports that use it
jest.mock("@clerk/nextjs/server", () => ({
  auth: jest.fn(() => Promise.resolve({ userId: "test-user-id" })),
  clerkClient: jest.fn(),
}));

jest.mock("@clerk/nextjs", () => ({
  auth: jest.fn(() => Promise.resolve({ userId: "test-user-id" })),
  useUser: jest.fn(() => ({
    user: {
      id: "test-user-id",
      emailAddresses: [{ emailAddress: "test@example.com" }],
    },
    isLoaded: true,
  })),
  useAuth: jest.fn(() => ({
    userId: "test-user-id",
    isLoaded: true,
  })),
  ClerkProvider: ({ children }) => children,
}));

// Mock environment variables
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
process.env.CLERK_SECRET_KEY = "test-secret-key";
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "test-publishable-key";
process.env.NODE_ENV = "test";

// Mock pino logger
jest.mock("pino", () => {
  const mockLogger = {
    trace: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    fatal: jest.fn(),
    child: jest.fn(() => mockLogger),
  };
  const mockPino = jest.fn(() => mockLogger);
  // Add stdTimeFunctions for compatibility
  mockPino.stdTimeFunctions = {
    isoTime: () => new Date().toISOString(),
  };
  return mockPino;
});
