# Knowledge Visualization System

A full-stack application that enables users to create, visualize, and interact with knowledge diagrams through AI-powered chat assistance. The system combines a FastAPI backend for intelligent document processing with a Next.js frontend for collaborative diagram editing.

## 📋 Overview

This project provides a collaborative platform for knowledge management and visualization through interactive diagrams. Users can upload documents, chat with an AI assistant to extract insights, and create visual representations of complex information using mind maps and flowcharts.

## 🏗️ Architecture

The project is organized into two main directories:

### `backend/`

The backend API handles AI-powered chat functionality and document processing. Built with FastAPI and LangChain, it provides:

- **AI Chat Engine**: RAG (Retrieval-Augmented Generation) pipeline for context-aware responses
- **Document Processing**: PDF and text file parsing with intelligent chunking
- **Vector Storage**: PGVector-based semantic search for document retrieval
- **Workflow Management**: LangGraph-powered conversational workflows
- **Real-time Streaming**: Server-sent events for live chat responses

### `frontend/`

The web application provides the user interface for diagram creation and collaboration. Built with Next.js and React, it offers:

- **Diagram Editor**: Interactive canvas for creating mind maps and flowcharts using React Flow
- **Real-time Collaboration**: Multi-user editing with Liveblocks
- **Authentication**: Secure user management with NextAuth.js (Google OAuth)
- **File Management**: AWS S3 integration for document storage
- **Team Workspaces**: Organize diagrams in folders and teams with permission controls
- **Internationalization**: Multi-language support (English, Japanese)

## ✨ Key Features

- **AI-Powered Chat**: Interact with an intelligent chatbot to analyze uploaded documents
- **Document Upload**: Support for PDF and text files with automatic processing
- **Knowledge Extraction**: RAG-based retrieval for accurate, context-aware answers
- **Visual Diagrams**: Create mind maps and flowcharts from AI-generated insights
- **Real-time Collaboration**: Multiple users can edit diagrams simultaneously
- **Team Management**: Share diagrams and folders with granular permissions (Owner, Editor, Viewer)
- **Cloud Storage**: Secure document storage with AWS S3
- **Responsive Design**: Modern UI with dark mode support
- **Multilingual**: Interface available in multiple languages

## 🛠️ Tech Stack

### Backend

- **Framework**: FastAPI (async Python web framework)
- **AI/ML**:
  - LangChain (LLM orchestration)
  - LangGraph (workflow management)
  - Google Generative AI (Gemini models)
  - Cohere (embeddings and reranking)
- **Database**: PostgreSQL with PGVector extension
- **Document Processing**: PyPDF, Unstructured
- **Storage**: Boto3 (AWS S3)
- **Deployment**: Docker & Docker Compose

### Frontend

- **Framework**: Next.js 16 (React 19, App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Diagram Library**: React Flow (xyflow)
- **Collaboration**: Liveblocks
- **Authentication**: NextAuth.js 5
- **ORM**: Prisma (PostgreSQL)
- **Forms**: React Hook Form with Zod validation
- **UI Components**: Radix UI, shadcn/ui
- **Animations**: Framer Motion, GSAP
- **State Management**: Zustand
- **Markdown**: React Markdown with syntax highlighting

## 🏛️ System Architecture

```
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
┌──────────────────────┐  ┌──────────────────┐  ┌─────────────┐
│  Liveblocks API      │  │  FastAPI Backend │  │  AWS S3     │
│  (Collaboration)     │  │  (AI Chat)       │  │  (Storage)  │
└──────────────────────┘  └────────┬─────────┘  └─────────────┘
                                   │
                     ┌─────────────┴──────────────┐
                     ▼                            ▼
          ┌────────────────────┐      ┌─────────────────────┐
          │  PostgreSQL        │      │  Google Gemini AI   │
          │  (Prisma ORM)      │      │  (LLM)              │
          └────────────────────┘      └─────────────────────┘
                     │
                     ▼
          ┌────────────────────┐
          │  PGVector          │
          │  (Vector Search)   │
          └────────────────────┘
```

## 📦 Installation

### Prerequisites

- **Node.js** 20+ and npm/yarn/pnpm
- **Python** 3.10+
- **Docker** 20.10+ and Docker Compose 2.0+
- **PostgreSQL** 16+ (or use Docker)
- **AWS Account** (for S3 storage)
- **Google Cloud Account** (for OAuth and Gemini AI)
- **Liveblocks Account** (for real-time collaboration)

### Backend Setup

1. Navigate to the backend directory:

```bash
cd backend
```

2. Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

3. Configure environment variables:

```env
FRONTEND_URL=http://localhost:3000

POSTGRES_USER=your_db_user
POSTGRES_PASSWORD=your_db_password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=knowledge_viz

GOOGLE_API_KEY=your_google_api_key
LIVEBLOCKS_SECRET_KEY=your_liveblocks_secret
```

4. Install dependencies:

```bash
pip install -r requirements.txt
```

### Frontend Setup

1. Navigate to the frontend directory:

```bash
cd frontend
```

2. Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

3. Configure environment variables:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000

# NextAuth base URL (critical for Google OAuth redirect_uri)
# - local dev: http://localhost:3000
# - production: https://your-domain.com
AUTH_URL=http://localhost:3000

AUTH_SECRET=your_auth_secret
AUTH_GOOGLE_ID=your_google_oauth_client_id
AUTH_GOOGLE_SECRET=your_google_oauth_client_secret

DATABASE_URL=postgresql://user:password@localhost:5432/knowledge_viz

AWS_BUCKET=your_s3_bucket_name
AWS_REGION=your_aws_region
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_ACCESS_SECRET=your_aws_secret_key

LIVEBLOCKS_SECRET_KEY=your_liveblocks_secret

DISABLE_ERD=true
```

#### Google OAuth Redirect URI (important)

In Google Cloud Console → OAuth 2.0 Client ID, add **Authorized redirect URIs** that match your `AUTH_URL`:

- `http://localhost:3000/api/auth/callback/google` (dev)
- `https://your-domain.com/api/auth/callback/google` (prod)

4. Install dependencies:

```bash
npm install
```

5. Generate Prisma client and run migrations:

```bash
npx prisma generate
npx prisma migrate dev
```

## 🚀 Running the Application

### Option 1: Docker (Recommended for Backend)

#### Backend with Docker

```bash
cd backend
docker-compose up --build
```

The API will be available at:

- API Base URL: `http://localhost:8000`
- API Documentation: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

#### Frontend (Local Development)

```bash
cd frontend
npm run dev
```

The web app will be available at `http://localhost:3000`

### Option 2: Local Development

#### Backend (without Docker)

1. Ensure PostgreSQL with PGVector extension is running
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

### Production Build

#### Backend

```bash
cd backend
docker-compose up -d --build
```

#### Frontend

```bash
cd frontend
npm run build
npm start
```

## 📁 Folder Structure

### Backend

```
backend/
├── src/
│   ├── models/          # Data models (vector store, chat, text splitter)
│   ├── schemas/         # Pydantic schemas (requests, responses, states)
│   ├── edges.py         # LangGraph workflow nodes
│   └── main.py          # FastAPI application entry point
├── requirements.txt     # Python dependencies
├── Dockerfile          # Docker configuration
├── docker-compose.yml  # Multi-container setup
└── .env.example        # Environment variables template
```

### Frontend

```
frontend/
├── app/
│   ├── (auth)/         # Authentication pages
│   ├── (main)/         # Main application pages
│   ├── (diagram-editor)/ # Diagram editing interface
│   ├── _actions/       # Server actions (file, folder, team, diagram)
│   ├── _components/    # Shared React components
│   └── api/            # API routes (NextAuth, Liveblocks)
├── components/         # Reusable UI components
├── prisma/            # Database schema and migrations
├── lib/               # Utility functions
├── hooks/             # Custom React hooks
├── stores/            # Zustand state stores
├── types/             # TypeScript type definitions
└── public/            # Static assets
```

## 💡 Usage Examples

### 1. Upload and Chat with Documents

1. Create a new diagram in the web interface
2. Upload a PDF or text file
3. Ask questions about the document:
   ```
   User: "Summarize the key concepts in this document"
   AI: [Provides summary based on document content]
   ```

### 2. Generate Mind Maps

1. Upload a document to a diagram
2. Ask the AI to create a mind map:
   ```
   User: "Create a mind map of the main topics"
   AI: [Generates structured mind map data]
   ```
3. Visualize the generated structure in the diagram editor

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
