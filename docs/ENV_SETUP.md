# Environment Variables Setup Guide

## Overview

The project uses many environment variables for different services. This file describes all required variables.

## Root `.env` (for Docker Compose)

Create a `.env` file in the root directory with the following content:

```env
# ============================================
# Vector Store (PGVector Service)
# ============================================
POSTGRES_USER=vector_user
POSTGRES_PASSWORD=vector_password
POSTGRES_DB=vector_db
POSTGRES_PORT=5433
PGVECTOR_DATA_DIR=./.data/pgvector
POSTGRES_HOST=pgvector

# ============================================
# Application Database (PostgreSQL)
# ============================================
DATABASE_USER=app_user
DATABASE_PASSWORD=app_password
DATABASE_NAME=app_db
DATABASE_PORT=5434
DATABASE_DATA_DIR=./.data/database

# ============================================
# Frontend / Authentication
# ============================================
NEXT_PUBLIC_APP_URL=http://localhost
AUTH_URL=http://localhost
NEXTAUTH_URL=http://localhost
AUTH_SECRET=your_auth_secret_here
AUTH_GOOGLE_ID=your_google_oauth_client_id
AUTH_GOOGLE_SECRET=your_google_oauth_client_secret
DISABLE_ERD=true

# ============================================
# AWS S3 / Object Storage
# ============================================
AWS_ENDPOINT=
AWS_BUCKET=
AWS_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=

# ============================================
# Liveblocks & Email
# ============================================
LIVEBLOCKS_SECRET_KEY=
RESEND_API_KEY=

# ============================================
# LLM Providers
# ============================================
GOOGLE_API_KEY=your_google_api_key
HUGGINGFACE_API_KEY=your_huggingface_api_key

# ============================================
# Backend Integrations
# ============================================
SUPABASE_URL=
SUPABASE_KEY=

# ============================================
# Cloudflare Tunnel (Optional)
# ============================================
TUNNEL_TOKEN=

# ============================================
# Nginx Configuration
# ============================================
NGINX_SERVER_NAME=localhost
```

## Frontend `.env` (for local development)

Create a `.env` file in the `frontend/` directory:

```env
# NextAuth Configuration
AUTH_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
AUTH_SECRET=your_auth_secret_here
AUTH_GOOGLE_ID=your_google_oauth_client_id
AUTH_GOOGLE_SECRET=your_google_oauth_client_secret

# Database
DATABASE_URL=postgresql://app_user:app_password@localhost:5434/app_db
DISABLE_ERD=true

# AWS S3 Configuration
AWS_ENDPOINT=
AWS_BUCKET=
AWS_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=

# Liveblocks & Email
LIVEBLOCKS_SECRET_KEY=
RESEND_API_KEY=

# Application URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000
```

## Backend `.env` (for local development)

Create a `.env` file in the `backend/` directory:

```env
# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# PostgreSQL (PGVector)
POSTGRES_USER=vector_user
POSTGRES_PASSWORD=vector_password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=vector_db

# LLM Providers
GOOGLE_API_KEY=your_google_api_key
HUGGINGFACE_API_KEY=your_huggingface_api_key
OLLAMA_BASE_URL=http://localhost:11434

# Supabase Storage
SUPABASE_URL=
SUPABASE_KEY=
```

## Variable Details

### Authentication

#### `AUTH_SECRET`
- **Description**: Secret key for NextAuth.js
- **How to generate**: `openssl rand -base64 32`
- **Required**: Yes

#### `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`
- **Description**: Google OAuth credentials
- **How to get**: 
  1. Go to https://console.cloud.google.com/
  2. Create a new project or select existing project
  3. Enable Google+ API
  4. Create OAuth 2.0 credentials
  5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
- **Required**: Yes (if using Google OAuth)

### Database

#### `DATABASE_URL` (Frontend)
- **Format**: `postgresql://user:password@host:port/database`
- **Description**: Connection string for Prisma
- **Required**: Yes

#### PostgreSQL Variables (Backend)
- **Description**: Connection info for PGVector
- **Required**: Yes

### AWS S3

- **Description**: Credentials for S3-compatible storage
- **How to get**: From AWS Console or S3-compatible service
- **Required**: Yes (for file uploads)

### Liveblocks

- **Description**: Secret key for Liveblocks real-time collaboration
- **How to get**: https://liveblocks.io/dashboard
- **Required**: Yes (for collaboration features)

### Resend

- **Description**: API key for email service
- **How to get**: https://resend.com/api-keys
- **Required**: Optional (for email features)

### Google API Key

- **Description**: API key for Google Gemini (used for chat/LLM)
- **How to get**: https://makersuite.google.com/app/apikey
- **Required**: Yes (for AI chat features)

### HuggingFace API Key

- **Description**: API key for HuggingFace Endpoint Embeddings (used for document embeddings)
- **How to get**: 
  1. Go to https://huggingface.co/
  2. Create an account or sign in
  3. Go to Settings → Access Tokens
  4. Create a new token with "Read" permissions
- **Required**: Yes (for document embeddings and vector search)
- **Model**: `mixedbread-ai/mxbai-embed-large-v1` (configured in backend)

### Supabase

- **Description**: Supabase project URL and anon key
- **How to get**: https://supabase.com/dashboard
- **Required**: Yes (for backend file downloads)

### Cloudflare Tunnel

- **Description**: Token for Cloudflare Tunnel
- **How to get**: https://one.dash.cloudflare.com/
- **Required**: Optional (only when exposing local service)

## Security Notes

1. **Never commit `.env` files**:
   - Add `.env` to `.gitignore`
   - Only commit `.env.example` (if available)

2. **Generate strong secrets**:
   - Use random generators
   - Minimum length 32 characters

3. **Rotate secrets regularly**:
   - Especially for production
   - Update all services when rotating

4. **Use different values for different environments**:
   - Development
   - Staging
   - Production

## Validation

After setup, verify:

1. **Frontend**: `npm run dev` has no errors about missing env vars
2. **Backend**: `uvicorn src.main:app` has no errors about missing env vars
3. **Docker**: `docker-compose up` has no errors about missing env vars

## Troubleshooting

### Error "Environment variable not set"
- Check that `.env` file exists
- Check variable name is correct (case-sensitive)
- Check for no extra spaces

### Error "Connection refused"
- Check database/service is running
- Check host and port are correct
- Check credentials are correct

### Error "Invalid credentials"
- Verify API keys/credentials
- Check permissions
- Check not expired
