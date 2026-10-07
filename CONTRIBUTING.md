# Contributing to GrowMaster AI

Thank you for your interest in contributing to GrowMaster AI! This document provides guidelines and setup instructions for developers.

## Development Setup

### Prerequisites

- **Node.js** 22 or higher
- **pnpm** 9.12.0 or higher (recommended package manager)
- **MySQL** database
- **Git** for version control

### Initial Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd growmasterai-app
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Configure environment variables**
   - Copy `.env.example` to `.env`
   - Fill in required API keys and database credentials:
     ```bash
     cp .env.example .env
     ```
   - Required environment variables:
     - `DATABASE_URL` - MySQL connection string
     - `JWT_SECRET` - Secret for JWT token generation
     - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - OAuth credentials
     - AI provider keys (OpenAI, Gemini, Anthropic, etc.)

4. **Set up database**
   ```bash
   pnpm db:push
   ```

5. **Start development server**
   ```bash
   pnpm dev
   ```
   This runs both the backend server and Expo Metro bundler concurrently.

### Project Structure

```
growmasterai-app/
├── app/              # Expo Router pages (mobile & web UI)
├── components/       # Reusable React components
├── server/           # Backend API (tRPC routers, database)
│   ├── _core/       # Core server utilities (auth, LLM, etc.)
│   ├── db.ts        # Database queries
│   └── routers.ts   # tRPC API routes
├── shared/           # Shared types and utilities
├── tests/            # Unit and E2E tests
├── drizzle/          # Database schema and migrations
└── lib/              # Business logic libraries
```

## Development Workflow

### Code Quality Standards

We enforce strict code quality standards:

1. **TypeScript strict mode** - All code must pass `tsc --noEmit`
2. **ESLint** - Follow configured linting rules
3. **Prettier** - Code formatting is enforced
4. **Tests** - Critical features must have test coverage

### Pre-commit Hooks

The repository uses **Husky** for Git hooks. Before each commit:
- Linting and formatting are automatically applied to staged files
- TypeScript type checking runs
- Tests run for affected code

If the pre-commit hook fails, fix the issues before committing.

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test -- --coverage

# Run tests in watch mode
pnpm test -- --watch

# Run specific test file
pnpm test tests/e2e-critical-flows.test.ts
```

### Type Checking

```bash
# Type check without emitting files
pnpm check
```

### Linting

```bash
# Run ESLint
pnpm lint

# Auto-fix linting issues
pnpm lint --fix
```

### Code Formatting

```bash
# Format all files with Prettier
pnpm format
```

## Making Changes

### Branch Naming

Use descriptive branch names:
- `feature/add-new-diagnosis-feature`
- `fix/oauth-redirect-bug`
- `docs/update-readme`
- `test/add-coach-tests`

### Commit Messages

Follow conventional commit format:
```
type(scope): brief description

Longer description if needed

Fixes #123
```

Types: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`, `style`

Examples:
- `feat(coach): add voice response support`
- `fix(auth): resolve OAuth redirect URI issue`
- `test(diagnosis): add E2E tests for plant analysis`

### Pull Request Process

1. **Create a feature branch** from `main`
2. **Make your changes** following code quality standards
3. **Write/update tests** for new features
4. **Update documentation** if needed
5. **Ensure all checks pass**:
   - TypeScript compiles without errors
   - All tests pass
   - Linting passes
   - Build succeeds
6. **Submit a pull request** with:
   - Clear description of changes
   - Reference to related issues
   - Screenshots/videos for UI changes

### Continuous Integration

GitHub Actions automatically runs on every push and PR:
- **Type checking** (`pnpm check`)
- **Linting** (`pnpm lint`)
- **Tests** (`pnpm test`)
- **Build verification** (`pnpm build`)

All checks must pass before merging.

## Testing Guidelines

### Test Structure

We use **Vitest** for testing. Tests are located in the `tests/` directory.

```typescript
import { describe, expect, it } from "vitest";

describe("Feature Name", () => {
  it("should do something specific", () => {
    // Arrange
    const input = ...;
    
    // Act
    const result = someFunction(input);
    
    // Assert
    expect(result).toBe(expected);
  });
});
```

### E2E Test Coverage

Critical user flows must have E2E tests:
- **Authentication** (login, logout, session management)
- **Coach** (AI assistance questions)
- **Diagnosis** (plant health analysis)
- **Plants** (CRUD operations)
- **Community** (posts, comments)

### Mocking

Use Vitest's mocking capabilities for external dependencies:
```typescript
vi.mock("../server/_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({ ... })
}));
```

## API Development

### tRPC Routers

API endpoints are defined using tRPC in `server/routers.ts`:

```typescript
export const appRouter = router({
  myFeature: router({
    doSomething: protectedProcedure
      .input(z.object({ ... }))
      .mutation(async ({ input, ctx }) => {
        // Implementation
      }),
  }),
});
```

- Use `publicProcedure` for unauthenticated endpoints
- Use `protectedProcedure` for authenticated endpoints
- Use `adminProcedure` for admin-only endpoints
- Always validate inputs with Zod schemas

### Database Queries

Use Drizzle ORM for database operations:

```typescript
import { getDb } from "./db";
import { plants } from "../drizzle/schema";

const db = getDb();
const userPlants = await db.select()
  .from(plants)
  .where(eq(plants.userId, userId));
```

## Mobile Development

### Expo Development

```bash
# Start Expo dev client
pnpm dev

# Run on Android
pnpm android

# Run on iOS
pnpm ios
```

### Building

```bash
# Build for Android
eas build --platform android

# Build for iOS
eas build --platform ios
```

## Performance

### Performance Audits

```bash
# Run performance audit
pnpm perf:audit

# Apply quick fixes
pnpm perf:fix

# Run both
pnpm perf:all
```

## Getting Help

- **Issues**: Check existing issues or create a new one
- **Discussions**: Use GitHub Discussions for questions
- **Documentation**: Refer to README.md and inline code comments

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what's best for the project
- Welcome newcomers and help them get started

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

**Happy coding! 🌱**
