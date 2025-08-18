# Royal Gambit Development Tasks

# Default recipe - show available commands
default:
    @just --list

# Initial project setup (already completed)
setup:
    @echo "✅ Project already set up! Use other commands to work with the project."

# Start development server
dev:
    devbox run -- pnpm dev

# Build for production
build:
    devbox run -- pnpm build

# Run tests
test:
    devbox run -- pnpm test:unit

# Run linting
lint:
    devbox run -- pnpm lint

# Format code
format:
    devbox run -- pnpm format

# Install dependencies
install:
    devbox run -- pnpm install

# Clean node_modules and reinstall
clean-install:
    rm -rf node_modules pnpm-lock.yaml
    devbox run -- pnpm install

# Preview production build
preview:
    devbox run -- pnpm preview

# Check TypeScript types
typecheck:
    devbox run -- pnpm type-check

# Run Power Chain technical spike
test-power-chains:
    @echo "🔗 Testing Power Chain mechanics..."
    devbox run -- pnpm dev &
    @echo "Open http://localhost:5173 and click 'Test Power Chains' button"