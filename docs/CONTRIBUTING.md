# Contributing Guide

Thank you for your interest in contributing to the Knowledge Visualization project!

## Contribution Process

### 1. Fork and Clone

```bash
# Fork the repository on GitHub
# Clone your fork
git clone https://github.com/your-username/knowledge-visualization.git
cd knowledge-visualization

# Add upstream remote
git remote add upstream https://github.com/original-repo/knowledge-visualization.git
```

### 2. Create Branch

```bash
# Create a new branch from main
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 3. Development Setup

#### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your values
npx prisma generate
npx prisma migrate dev
npm run dev
```

#### Backend Setup

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your values
# Ensure PostgreSQL with PGVector is running
uvicorn src.main:app --reload
```

#### Docker Setup (Recommended)

```bash
# From root directory
cp .env.example .env
# Edit .env with your values
docker-compose up -d --build
```

### 4. Coding Standards

#### TypeScript/JavaScript (Frontend)

- **Formatting**: Use Prettier (if configured)
- **Linting**: ESLint with Next.js config
- **Type Safety**: 
  - Strict TypeScript mode
  - Don't use `any` type
  - Proper type definitions
- **Naming**:
  - Components: PascalCase (`MyComponent.tsx`)
  - Functions/Variables: camelCase (`myFunction`)
  - Constants: UPPER_SNAKE_CASE (`API_BASE_URL`)
  - Files: kebab-case or camelCase

**Example:**
```typescript
// ✅ Good
interface UserProfile {
  id: string;
  name: string;
}

export function getUserProfile(userId: string): Promise<UserProfile> {
  // ...
}

// ❌ Bad
function getUser(id: any): any {
  // ...
}
```

#### Python (Backend)

- **Formatting**: Black (if configured)
- **Linting**: pylint or ruff
- **Type Hints**: Required for function parameters and return types
- **Docstrings**: Google style or NumPy style
- **Naming**:
  - Functions/Variables: snake_case (`get_user_profile`)
  - Classes: PascalCase (`UserProfile`)
  - Constants: UPPER_SNAKE_CASE (`API_BASE_URL`)

**Example:**
```python
# ✅ Good
from typing import Optional

async def get_user_profile(user_id: str) -> Optional[dict]:
    """
    Get user profile by user ID.
    
    Args:
        user_id: The user ID to lookup
        
    Returns:
        User profile dict or None if not found
    """
    # ...

# ❌ Bad
def getUser(id):
    # ...
```

### 5. Code Structure

#### Frontend Components

```typescript
// Component structure
'use client'; // Only when needed

import { useState } from 'react';
import type { ComponentProps } from './types';

interface MyComponentProps {
  title: string;
  onAction: () => void;
}

export function MyComponent({ title, onAction }: MyComponentProps) {
  // Hooks
  const [state, setState] = useState<string>('');
  
  // Handlers
  const handleClick = () => {
    // Logic
    onAction();
  };
  
  // Render
  return (
    <div>
      <h1>{title}</h1>
      <button onClick={handleClick}>Action</button>
    </div>
  );
}
```

#### Backend Endpoints

```python
from fastapi import FastAPI
from pydantic import BaseModel

class RequestModel(BaseModel):
    """Request schema."""
    field: str

@app.post("/api/endpoint")
async def my_endpoint(request: RequestModel):
    """
    Endpoint description.
    
    Args:
        request: Request model
        
    Returns:
        Response model
    """
    # Logic
    return {"status": 200, "message": "Success"}
```

### 6. Testing

#### Frontend Tests

```bash
# Unit tests (if setup)
npm test

# E2E tests (if setup)
npm run test:e2e
```

#### Backend Tests

```bash
# Unit tests (if setup)
pytest

# Integration tests
pytest tests/integration
```

### 7. Database Migrations

#### Frontend (Prisma)

```bash
# Create migration after schema changes
npx prisma migrate dev --name your_migration_name

# Generate Prisma client
npx prisma generate
```

**Notes:**
- Review migration files before committing
- Don't commit migration files containing sensitive data
- Test migrations locally first

### 8. Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding/updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(diagram): add export to PNG feature
fix(chat): resolve streaming response issue
docs(api): update API documentation
refactor(auth): simplify authentication flow
```

### 9. Pull Request

1. **Update branch**: 
   ```bash
   git checkout main
   git pull upstream main
   git checkout your-branch
   git rebase main
   ```

2. **Push changes**:
   ```bash
   git push origin your-branch
   ```

3. **Create PR on GitHub**:
   - Title: Clear and descriptive
   - Description: 
     - Describe changes
     - Link to related issues
     - Screenshots (if UI changes)
     - Checklist:
       - [ ] Code follows style guidelines
       - [ ] Tests pass
       - [ ] Documentation updated
       - [ ] No breaking changes (or document breaking changes)

### 10. Code Review

- Respond to review comments promptly
- Make requested changes
- Keep PR focused (one feature/fix per PR)
- Keep PR size reasonable (< 500 lines if possible)

## Coding Guidelines

### General

1. **Clean Code**:
   - Functions should do one thing
   - Keep functions short (< 50 lines if possible)
   - Meaningful variable names
   - Avoid deep nesting (< 3 levels)

2. **Error Handling**:
   - Always handle errors properly
   - Provide meaningful error messages
   - Log errors appropriately

3. **Performance**:
   - Optimize database queries
   - Use lazy loading when needed
   - Avoid unnecessary re-renders
   - Profile code if performance issues

4. **Security**:
   - Validate all user inputs
   - Sanitize data before storing
   - Use parameterized queries
   - Never commit secrets

### Frontend Specific

1. **React Best Practices**:
   - Use Server Components when possible
   - Minimize Client Components
   - Proper key props for lists
   - Memoization when needed (useMemo, useCallback)

2. **State Management**:
   - Local state with useState
   - Global state with Zustand
   - Server state with React Query (if available)

3. **Accessibility**:
   - Semantic HTML
   - ARIA labels when needed
   - Keyboard navigation
   - Screen reader support

### Backend Specific

1. **Async/Await**:
   - Always use async/await for I/O operations
   - Proper error handling with try/except

2. **Database**:
   - Use connection pooling
   - Optimize queries
   - Use transactions when needed
   - Proper indexing

3. **API Design**:
   - RESTful conventions
   - Proper HTTP status codes
   - Consistent response format
   - API versioning (if needed)

## Documentation

### Code Comments

- **English**: Code comments must be in English
- **Docstrings**: Required for public functions/classes

### Updating Documentation

When changing:
- API endpoints → Update `API.md`
- Architecture → Update `ARCHITECTURE.md`
- Setup instructions → Update `README.md`
- New features → Update relevant docs

## Questions?

If you have questions, please:
1. Check existing documentation
2. Search existing issues/PRs
3. Open a new issue with label `question`

## License

By contributing, you agree that your contributions will be licensed under the project's license.

---

Thank you for contributing! 🎉
