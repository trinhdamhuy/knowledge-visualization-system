# Knowledge Visualization System Architecture

## Overview

The Knowledge Visualization system is a full-stack application that enables users to create, manage, and collaborate on knowledge diagrams with AI assistance.

## Overall Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Layer (Browser)                    │
│                  Next.js Frontend (React)                     │
└────────────────────────────┬─────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│              Nginx (Reverse Proxy + Load Balancer)           │
│         HTTPS, Gzip, Security Headers, Load Balancing       │
└────────────────────────────┬─────────────────────────────────┘
                             │
                ┌────────────┴────────────┐
                ▼                        ▼
┌──────────────────────┐    ┌─────────────────────────────┐
│  Frontend Replicas   │    │    FastAPI Backend          │
│  (Next.js x3)        │    │    (AI Chat + RAG)          │
└──────────────────────┘    └────────────┬────────────────┘
                                         │
                    ┌────────────────────┴────────────────────┐
                    ▼                                          ▼
        ┌────────────────────┐                    ┌─────────────────────┐
        │  PostgreSQL        │                    │  LLM Providers      │
        │  (App DB)          │                    │  (Gemini, Ollama)   │
        └────────────────────┘                    └─────────────────────┘
                    │                                          │
                    ▼                                          ▼
        ┌────────────────────┐                    ┌─────────────────────┐
        │  PGVector          │                    │  Supabase Storage   │
        │  (Vector Search)   │                    │  (File Storage)     │
        └────────────────────┘                    └─────────────────────┘
```

## Main Components

### 1. Frontend (Next.js 16)

#### Directory Structure
```
frontend/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Authentication routes
│   ├── (main)/             # Main application pages
│   ├── (diagram-editor)/   # Diagram editing interface
│   ├── _actions/           # Server Actions
│   │   └── token/          # Token usage actions
│   ├── _components/        # Shared components
│   └── api/                # API routes
├── components/             # Reusable UI components
│   └── ui/                 # UI primitives
│       └── circular-progress.tsx  # Token usage indicator
├── prisma/                 # Database schema
├── lib/                    # Utilities & configs
│   └── token-counter.ts    # Token calculation utilities
├── hooks/                  # Custom React hooks
├── stores/                 # Zustand stores
├── types/                 # TypeScript types
└── languages/             # i18n messages
```

#### Technologies Used
- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **State Management**: 
  - Zustand for global state
  - React hooks for local state
  - Liveblocks for real-time collaboration state
- **UI Libraries**:
  - shadcn/ui components
  - Radix UI primitives
  - React Flow for diagram editor
- **Forms**: React Hook Form + Zod
- **Authentication**: NextAuth.js 5
- **Database**: Prisma ORM
- **Real-time**: Liveblocks
- **Storage**: AWS S3 SDK

#### Data Flow

1. **User Actions** → Server Actions → Database (Prisma)
2. **Real-time Updates** → Liveblocks → Zustand Store → UI
3. **AI Chat** → API Route → Backend → LangGraph → Response → Token Calculation → Database
4. **File Upload** → S3 Presigned URL → Direct Upload → S3
5. **Token Usage** → Calculate after chat → Update database → Refresh UI

### 2. Backend (FastAPI)

#### Directory Structure
```
backend/
├── src/
│   ├── main.py             # FastAPI app entry point
│   ├── edges.py            # LangGraph workflow nodes
│   ├── models/             # Data models
│   │   ├── vector_store.py # PGVector integration
│   │   ├── chat_model.py   # LLM model config
│   │   └── ...
│   └── schemas/            # Pydantic schemas
│       ├── requests.py     # Request models
│       ├── responses.py    # Response models
│       └── states.py       # LangGraph state
├── requirements.txt
└── Dockerfile
```

#### LangGraph Workflow

```
START
  │
  ├─[need_initialize_data?]
  │
  ├─ YES → load_file
  │         │
  │         ▼
  │      add_documents (to vector store)
  │         │
  │         ▼
  │      retrieve_documents
  │         │
  │         ▼
  │      generate_answer
  │         │
  │         ▼
  │        END
  │
  └─ NO → retrieve_documents
            │
            ▼
         generate_answer
            │
            ▼
           END
```

#### RAG Pipeline

1. **Document Loading**: 
   - Load from Supabase Storage (PDF/text files)
   - Parse with `pypdf` or `unstructured`

2. **Chunking**:
   - Text splitter with overlap
   - Metadata extraction (diagram_id, file_url)

3. **Embedding**:
   - Generate embeddings with embedding model
   - Store in PGVector with metadata

4. **Retrieval**:
   - Semantic search with PGVector
   - Filter by diagram_id
   - Return top-k relevant chunks

5. **Generation**:
   - Context + User query → LLM
   - Support Gemini and Ollama
   - Stream response chunks

#### API Endpoints

- `GET /` - Health check
- `GET /api/chat-history` - Get chat history with pagination
- `POST /api/chat` - Non-streaming chat
- `POST /api/chat/stream` - Streaming chat (SSE)
- `POST /api/chat/cancel` - Cancel ongoing chat
- `DELETE /api/delete-chat-history` - Delete chat history
- `DELETE /api/delete-diagram-store` - Delete vector store for diagram

### 3. Database Layer

#### PostgreSQL (Application Database)
- **ORM**: Prisma
- **Schema**: See `frontend/prisma/schema.prisma`
- **Main Models**:
  - User, Account, Session (Authentication)
  - Diagram, Folder (Content)
  - Team, TeamMember (Collaboration)
  - Share (Permissions)
  - File (Attachments)
  - Notification (User notifications)
  - TokenUsage (Weekly token usage tracking)

#### PGVector (Vector Database)
- **Extension**: pgvector
- **Purpose**: Semantic search for RAG
- **Collections**: Documents with embeddings
- **Metadata**: diagram_id, file_url, chunk_index

### 4. Infrastructure

#### Docker Compose Services

1. **frontend**: Next.js app (3 replicas)
2. **backend**: FastAPI service
3. **database**: PostgreSQL 18 (app database)
4. **pgvector**: PostgreSQL with pgvector extension
5. **nginx**: Reverse proxy + load balancer
6. **ollama**: Local LLM service
7. **cloudflare-tunnel**: Secure tunnel (optional)

#### Nginx Configuration
- **HTTPS**: SSL termination
- **Load Balancing**: Round-robin for frontend replicas
- **Security Headers**: CORS, CSP, etc.
- **Gzip**: Compression
- **Routing**:
  - `/*` → Frontend

## Detailed Data Flows

### 1. Diagram Creation Flow

```
User → Create Diagram → Server Action → Prisma → Database
                                    ↓
                              Create Liveblocks Room
                                    ↓
                              Return Diagram ID
```

### 2. File Upload Flow

```
User → Upload File → Generate Presigned URL (S3)
                              ↓
                    Upload to S3 (Direct)
                              ↓
                    Save File Record (Prisma)
                              ↓
                    Notify Backend (Optional)
```

### 3. AI Chat Flow

```
User → Send Message → Check Token Limit
                              ↓
                    (Block if exceeded)
                              ↓
                    Frontend API Route
                              ↓
                    POST /api/chat/stream
                              ↓
                    Backend: LangGraph Workflow
                              ↓
                    ┌─────────┴─────────┐
                    ▼                   ▼
            Need Initialize?      Retrieve Documents
                    │                   │
                    ▼                   ▼
            Load File → Add to      Generate Answer
            Vector Store            (with context)
                    │                   │
                    └─────────┬─────────┘
                              ▼
                    Stream Response (SSE)
                              ▼
                    Calculate Tokens (Input + Output)
                              ▼
                    Update Token Usage (Database)
                              ▼
                    Update UI (Real-time + Token Progress)
```

### 4. Real-time Collaboration Flow

```
User A → Edit Node → Liveblocks → Zustand Store
                              ↓
                    Broadcast to All Clients
                              ↓
                    User B, C, D receive update
                              ↓
                    Update UI (Optimistic)
```

## Security

### Authentication
- **NextAuth.js**: Session management
- **Google OAuth**: Social login
- **JWT**: Token-based auth
- **Prisma Adapter**: Session storage

### Authorization
- **Permission System**: OWNER, EDITOR, VIEWER
- **Team-based**: Team members with permissions
- **Share System**: Individual sharing with permissions

### Data Protection
- **HTTPS**: SSL/TLS encryption
- **Environment Variables**: Secrets management
- **Input Validation**: Zod schemas
- **SQL Injection**: Prisma ORM protection
- **XSS**: React auto-escaping

## Scalability

### Horizontal Scaling
- **Frontend**: Multiple replicas (Docker)
- **Load Balancing**: Nginx round-robin
- **Database**: Connection pooling

### Vertical Scaling
- **Backend**: Async operations
- **Database**: Proper indexing
- **Caching**: Future implementation

## Monitoring & Logging

### Current
- **Error Logging**: Console logs
- **Health Checks**: `/` endpoints

### Future
- Structured logging
- Error tracking (Sentry)
- Performance monitoring
- Analytics

## Deployment

### Docker Compose
- All services containerized
- Network isolation
- Volume persistence
- Environment-based config

### Environment Variables
- Root `.env` for docker-compose
- `frontend/.env` for Next.js if needed for local development
- `backend/.env` for FastAPI if needed for local development

## Token Usage Tracking

### Overview
The system tracks token usage for AI chat interactions on a weekly basis. Each user has a configurable weekly token limit to control API costs.

### Database Schema

**TokenUsage Model:**
- `id`: Unique identifier
- `userId`: Foreign key to User
- `tokensUsed`: Total tokens used in the current week
- `weekStartDate`: Start date of the week (Monday)
- `createdAt`, `updatedAt`: Timestamps

**User Model (updated):**
- `weeklyTokenLimit`: Maximum tokens allowed per week (default: 10,000)

### Token Calculation

**Algorithm:**
- Uses improved estimation for Gemini models (SentencePiece tokenizer)
- Formula: Weighted average of character-based (40%), word-based (50%), and special tokens (10%)
- Estimates: ~3.5 characters per token, ~0.75 words per token
- Accounts for URLs, numbers, and punctuation

**Implementation:**
- Frontend: `frontend/lib/token-counter.ts` - Token estimation utilities
- Server Actions: `frontend/app/_actions/token/` - Get and update token usage
- UI Component: `frontend/components/ui/circular-progress.tsx` - Visual progress indicator

### Token Limit Enforcement

**Pre-send Validation:**
1. Estimate input tokens from user message
2. Estimate output tokens (conservative: input × 2.5)
3. Check if total would exceed remaining limit
4. Block sending if limit would be exceeded
5. Warn if close to limit (< 20% remaining)

**Post-stream Update:**
1. Calculate actual tokens from input + output
2. Update database (even if exceeds limit)
3. Show warning if limit exceeded
4. Block future messages until next week

### Weekly Reset

- Week starts on Monday (00:00:00)
- Automatically resets each Monday
- New `TokenUsage` record created for each week
- Previous week's data preserved for analytics

## Future Improvements

1. **Caching Layer**: Redis for frequently accessed data
2. **Token Usage**: Analytics dashboard, usage reports
3. **Message Queue**: RabbitMQ/Kafka for async tasks
4. **CDN**: Static assets delivery
5. **Monitoring**: Prometheus + Grafana
6. **CI/CD**: Automated testing and deployment
7. **Microservices**: Split backend services
8. **GraphQL**: Unified API layer
