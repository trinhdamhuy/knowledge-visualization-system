## Knowledge Visualization System

A full-stack application that enables users to create, visualize, and interact with knowledge diagrams through AI-powered chat assistance. The system combines a FastAPI backend for intelligent document processing with a Next.js frontend for collaborative diagram editing.

### 📋 Overview

This project provides a collaborative platform for knowledge management and visualization through interactive diagrams. Users can upload documents, chat with an AI assistant to extract insights, and create visual representations of complex information using mind maps and flowcharts.

### 🏗️ High‑Level Architecture

The project is organized into three main components:

- **`backend/`**: FastAPI + LangChain/LangGraph service for AI chat, retrieval and document processing
- **`frontend/`**: Next.js app for diagram editing, collaboration, authentication and file management
- **`nginx/`**: Nginx configuration for Reverse Proxy, Load Balancing and HTTPS

**Infrastructure Services:**

- **`docker-compose.yml`** (root): Orchestrates all services (backend, frontend, nginx, pgvector, main database, Ollama, Cloudflare tunnel)
- **`scripts/`**: Utility scripts (e.g., `run-ollama.sh` for starting Ollama service with model pre-loading)

#### `backend/`

The backend API handles AI-powered chat functionality and document processing. Built with FastAPI and LangChain, it provides:

- **AI Chat Engine**: RAG (Retrieval-Augmented Generation) pipeline for context-aware responses
- **Document Processing**: PDF and text file parsing with intelligent chunking
- **Vector Storage**: PGVector-based semantic search for document retrieval
- **Workflow Management**: LangGraph-powered conversational workflows with PostgreSQL checkpointing
- **Non‑streaming Chat API**: `/api/chat`, `/api/chat-history`, and deletion endpoints for history & vector store

#### `frontend/`

The web application provides the user interface for diagram creation and collaboration. Built with Next.js and React, it offers:

- **Diagram Editor**: Interactive canvas for creating mind maps and flowcharts using React Flow (`@xyflow/react`)
- **Real-time Collaboration**: Multi-user editing with Liveblocks
- **Authentication**: Secure user management with NextAuth.js (Google OAuth)
- **File Management**: AWS S3-compatible storage (frontend) and Supabase Storage (backend) for document upload & retrieval
- **Team Workspaces**: Organize diagrams in folders and teams with permission controls
- **Internationalization**: Multi-language support (English, Japanese, Vietnamese)

## ✨ Key Features

- **AI-Powered Chat**: Interact with an intelligent chatbot to analyze uploaded documents
- **Token Usage Tracking**: Weekly token limit tracking with visual progress indicator
- **Document Upload**: Support for PDF and text files with automatic processing
- **Knowledge Extraction**: RAG-based retrieval for accurate, context-aware answers
- **Visual Diagrams**: Create mind maps and flowcharts from AI-generated insights
- **Real-time Collaboration**: Multiple users can edit diagrams simultaneously
- **Team Management**: Share diagrams and folders with granular permissions (Owner, Editor, Viewer)
- **Cloud Storage**: Secure document storage with AWS S3 (frontend) and Supabase Storage (backend)
- **Responsive Design**: Modern UI with dark mode support
- **Multilingual**: Interface available in multiple languages (EN/JA/VI)
- **Secure Access**: HTTPS enabled with Nginx Reverse Proxy and Cloudflare Tunnel
- **Scalable**: Frontend load balancing with Nginx and Docker Replicas

## 🛠️ Tech Stack

### Backend

- **Framework**: FastAPI (async Python web framework)
- **AI/ML & Orchestration**:
  - LangChain (`langchain-core`, `langchain-community`)
  - LangGraph (workflow management, PostgreSQL checkpoint/store)
  - Google Generative AI (Gemini models) via `langchain-google-genai`
  - HuggingFace Endpoint Embeddings via `langchain-huggingface` (for document embeddings)
- **Vector Store**: PostgreSQL with PGVector extension (`langchain-postgres`)
- **Document Processing**: `pypdf`, `unstructured`
- **Storage**: Supabase Storage (`supabase` client) for file downloads
- **Other Services**: HTTP client (`httpx`) for external API calls
- **Deployment**: Docker & Docker Compose

### Frontend

- **Framework**: Next.js 16 (React 19, App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Diagram Library**: React Flow (`@xyflow/react`)
- **Collaboration**: Liveblocks
- **Authentication**: NextAuth.js 5
- **ORM**: Prisma (PostgreSQL)
- **Forms**: React Hook Form with Zod validation
- **UI Components**: Radix UI, shadcn/ui, custom components
- **Animations**: Framer Motion, GSAP, `motion`
- **State Management**: Zustand
- **Markdown**: React Markdown with syntax highlighting
- **Storage**: AWS SDK (`@aws-sdk/client-s3`) for S3 file uploads
- **i18n**: `next-intl` with language messages in `frontend/languages/messages`

### Infrastructure

- **Reverse Proxy**: Nginx (handling HTTPS, Gzip, Header security)
- **Load Balancing**: Nginx + Docker DNS Round Robin
- **Tunneling**: Cloudflare Tunnel (expose local service to internet securely)

## 🏛️ System Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                        │
│                    (Next.js Frontend)                       │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐ │
│  │  Diagram       │  │  Chat          │  │  File          │ │
│  │  Editor        │  │  Interface     │  │  Management    │ │
│  └────────────────┘  └────────────────┘  └────────────────┘ │
└──────────────┬──────────────────┬────────────────┬──────────┘
               │                  │                │
               ▼                  ▼                ▼
┌─────────────────────────────────────────────────────────────┐
│                    Nginx (Reverse Proxy)                    │
│           (HTTPS, Load Balancing, Security Headers)         │
└─────────────────────────────┬───────────────────────────────┘
                              │
               ┌──────────────┴──────────────┐
               ▼                             ▼
┌──────────────────────┐      ┌─────────────────────────────┐
│  Frontend Replicas   │      │      FastAPI Backend        │
│  (Next.js x3)        │      │      (AI Chat + RAG)        │
└──────────────────────┘      └──────────────┬──────────────┘
                                             │
                       ┌─────────────────────┴────────────────┐
                       ▼                                      ▼
            ┌────────────────────┐                 ┌─────────────────────┐
            │  PostgreSQL        │                 │  LLM Providers      │
            │  (App DB, Prisma)  │                 │  (Gemini, Ollama)   │
            └────────────────────┘                 └─────────────────────┘
                       │                                      │
                       ▼                                      ▼
            ┌────────────────────┐                 ┌─────────────────────┐
            │  PGVector          │                 │  Supabase Storage   │
            │  (Vector Search)   │                 │  (Backend)          │
            └────────────────────┘                 └─────────────────────┘
```

## 📦 Installation

### Prerequisites

- **Node.js** 20+ and npm/yarn/pnpm
- **Python** 3.10+
- **Docker** 20.10+ and Docker Compose 2.0+
- (Optional for local, if not using Docker) **PostgreSQL** 16+ with PGVector extension
- **AWS Account** (for S3 storage - used by frontend for file uploads)
- **Supabase Account** (for Supabase Storage - used by backend for file downloads)
- **Google Cloud Account** (for OAuth and Gemini AI)
- **HuggingFace Account** (for embeddings API - used by backend for document embeddings)
- **Liveblocks Account** (for real-time collaboration)
- **Cloudflare Account** (optional, for tunnel)

### Root `.env` for Docker Compose

At the project root, create a `.env` file to configure services used by `docker-compose.yml`:

```env
# Vector store (pgvector service)
POSTGRES_USER=vector_user
POSTGRES_PASSWORD=vector_password
POSTGRES_DB=vector_db
POSTGRES_PORT=5433
PGVECTOR_DATA_DIR=./.data/pgvector
POSTGRES_HOST=pgvector

# Application database (database service)
DATABASE_USER=app_user
DATABASE_PASSWORD=app_password
DATABASE_NAME=app_db
DATABASE_PORT=5434
DATABASE_DATA_DIR=./.data/database

# Frontend / auth
NEXT_PUBLIC_APP_URL=http://localhost  # Access via Nginx (port 80/443)
AUTH_URL=http://localhost             # Access via Nginx
NEXTAUTH_URL=http://localhost         # Access via Nginx
AUTH_SECRET=your_auth_secret
AUTH_GOOGLE_ID=your_google_oauth_client_id
AUTH_GOOGLE_SECRET=your_google_oauth_client_secret
DISABLE_ERD=true

# S3 / object storage (used by frontend for file uploads)
AWS_ENDPOINT=
AWS_BUCKET=
AWS_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=

# Liveblocks & email
LIVEBLOCKS_SECRET_KEY=
RESEND_API_KEY=

# LLM providers
GOOGLE_API_KEY=your_google_api_key
HUGGINGFACE_API_KEY=your_huggingface_api_key
OLLAMA_DATA_DIR=./.data/ollama

# Backend integrations (Supabase Storage for file downloads)
SUPABASE_URL=
SUPABASE_KEY=

# Cloudflare tunnel (optional)
TUNNEL_TOKEN=
```

> **Note**: `NEXT_PUBLIC_APP_URL`, `AUTH_URL`, `NEXTAUTH_URL` should point to `http://localhost` (or your domain) because Nginx handles port 80/443.

### SSL Certificate Setup

Before running Nginx, you need to set up SSL certificates in `nginx/ssl/`.

**Option 1: Self-signed (Local Development)**
Run this command to generate a self-signed certificate:

```bash
mkdir -p nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem \
  -subj "/C=VN/ST=HCM/L=HCM/O=Knovion/CN=localhost"
```

**Option 2: Cloudflare Origin Certificate (Production)**

1. Go to Cloudflare Dashboard -> SSL/TLS -> Origin Server.
2. Create Certificate.
3. Save as `cert.pem` and `key.pem` in `nginx/ssl/`.

### Backend Setup (local development)

1. Navigate to the backend directory:

```bash
cd backend
```

2. Create a `.env` file in `backend/` (if you don't already have one) with at least:

```env
FRONTEND_URL=http://localhost:3000

POSTGRES_USER=vector_user
POSTGRES_PASSWORD=vector_password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=vector_db

GOOGLE_API_KEY=your_google_api_key
HUGGINGFACE_API_KEY=your_huggingface_api_key
OLLAMA_BASE_URL=http://localhost:11434
SUPABASE_URL=
SUPABASE_KEY=
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

### Frontend Setup (local development)

1. Navigate to the frontend directory:

```bash
cd frontend
```

2. Create a `.env` file in `frontend/` with at least:

```env
# NextAuth base URL (critical for Google OAuth redirect_uri)
AUTH_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000

AUTH_SECRET=your_auth_secret
AUTH_GOOGLE_ID=your_google_oauth_client_id
AUTH_GOOGLE_SECRET=your_google_oauth_client_secret

DISABLE_ERD=true

DATABASE_URL=postgresql://app_user:app_password@localhost:5434/app_db

AWS_ENDPOINT=
AWS_BUCKET=
AWS_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=

LIVEBLOCKS_SECRET_KEY=
RESEND_API_KEY=

NEXT_PUBLIC_APP_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000
```

3. Install dependencies:

```bash
npm install
```

4. Generate Prisma client and run migrations:

```bash
npx prisma generate
npx prisma migrate dev
```

## 🚀 Running the Application

### Option 1: Full stack with Docker (recommended)

From the project root:

```bash
docker-compose up -d --build
```

When all services are healthy:

- **Web App**: `https://localhost` (Nginx handles HTTPS)
  - Accepts self-signed cert warning on local.
- **Backend API**: `http://localhost:8000` (Direct access) or `https://localhost/api/backend` (via Nginx)
  - Swagger docs: `http://localhost:8000/docs`
- **Ollama**: `http://localhost:11434`

### Scaling Frontend

To scale the frontend to multiple instances (e.g., 3 replicas) for load balancing:

```bash
docker-compose up -d --scale frontend=3
```

Nginx will automatically load balance requests between these instances.

### Option 2: Local development (backend & frontend separately)

#### Backend (without Docker)

1. Ensure PostgreSQL with PGVector extension is running and matches your backend `.env`
2. Start the FastAPI server:

```bash
cd backend
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend

```bash
cd frontend
npm run dev
```

The web app will be available at `http://localhost:3000`.

## 📁 Folder Structure

### Root

```text
.
├── backend/              # FastAPI + LangGraph backend
├── frontend/             # Next.js 16 frontend
├── nginx/                # Nginx configuration & SSL
│   ├── ssl/              # Certificate files (gitignored)
│   └── nginx.conf        # Nginx config file
├── docker-compose.yml    # Orchestration for all services
└── README.md
```

### Backend

```text
backend/
├── src/
│   ├── models/           # Data models (vector store, chat, embeddings, text splitter)
│   ├── schemas/          # Pydantic schemas (requests, responses, states)
│   ├── edges.py          # LangGraph workflow nodes & RAG pipeline
│   └── main.py           # FastAPI application entry point
├── requirements.txt      # Python dependencies
└── Dockerfile            # Backend Docker configuration
```

### Frontend

```text
frontend/
├── app/
│   ├── (auth)/           # Authentication pages
│   ├── (main)/           # Main application pages
│   ├── (diagram-editor)/ # Diagram editing interface
│   ├── _actions/         # Server actions (file, folder, team, diagram, chat)
│   ├── _components/      # Shared React components
│   └── api/              # API routes (NextAuth, Liveblocks, S3, chat proxy)
├── components/           # Reusable UI components & sections
├── prisma/               # Database schema
├── lib/                  # Utility functions & configuration
├── hooks/                # Custom React hooks
├── stores/               # Zustand state stores
├── languages/            # i18n setup & message catalogs
├── types/                # TypeScript type definitions
├── public/               # Static assets
└── Dockerfile            # Frontend Docker configuration
```

## 💡 Usage Examples

### 1. Upload and Chat with Documents

1. Create a new diagram in the web interface
2. Upload a PDF or text file
3. Ask questions about the document, for example:
   ```text
   User: "Summarize the key concepts in this document"
   AI: [Provides summary based on document content]
   ```

### 2. Generate Mind Maps

1. Upload a document to a diagram
2. Ask the AI to create a mind map:
   ```text
   User: "Create a mind map of the main topics"
   AI: [Generates structured mind map data]
   ```
3. Visualize and refine the generated structure in the diagram editor

### 3. Collaborate in Real-time

1. Share a diagram with team members
2. Multiple users can:
   - Edit nodes and edges simultaneously
   - See live cursors and selections
   - Chat about the diagram content

### 4. Organize with Teams and Folders

1. Create teams for different projects
2. Organize diagrams in folders
3. Set permissions (Owner, Editor, Viewer) for members

## 🗺️ Future Roadmap

- [ ] **Export Features**: Export diagrams as PNG, SVG, or PDF
- [ ] **Additional Diagram Types**: Support for UML, ER diagrams, and more
- [ ] **Advanced AI Features**:
  - Multi-document analysis
  - Automatic diagram generation from text
  - Smart suggestions for diagram improvements
- [ ] **Enhanced Collaboration**:
  - Video/audio calls within the app
  - Comments and annotations
  - Version history and rollback
- [ ] **Mobile App**: Native iOS and Android applications
- [ ] **API Integrations**: Connect with Notion, Google Docs, Confluence
- [ ] **Custom Templates**: Pre-built diagram templates
- [ ] **Analytics**: Usage insights and diagram analytics
- [ ] **Offline Mode**: Work without internet connection
- [ ] **Advanced Search**: Full-text search across all diagrams
- [ ] **Workflow Automation**: Trigger actions based on diagram changes

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software. All rights reserved.

## 🙏 Acknowledgments

- **LangChain** for the powerful LLM framework
- **Vercel** for Next.js and hosting
- **Liveblocks** for real-time collaboration infrastructure
- **React Flow** for the diagram editor library
- **shadcn/ui** for beautiful UI components

---

For questions or support, please open an issue on GitHub.
