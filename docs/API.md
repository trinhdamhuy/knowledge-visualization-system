# API Documentation

## Backend API (FastAPI)

Base URL: `http://localhost:8000` (development) or `https://yourdomain.com/api/backend` (production)

### Authentication

Currently, the API does not require authentication tokens, but this may be added in the future.

### Endpoints

#### 1. Health Check

```http
GET /
```

**Response:**
```
"The chatbot is running"
```

---

#### 2. Get Chat History

Get chat history with pagination.

```http
GET /api/chat-history?diagram_id={diagram_id}&user_id={user_id}&limit={limit}&offset={offset}
```

**Query Parameters:**
- `diagram_id` (required): Diagram ID
- `user_id` (optional): User ID (if not provided, uses shared diagram_id)
- `limit` (optional, default: 10): Number of messages per page
- `offset` (optional, default: 0): Offset for pagination

**Response:**
```json
{
  "status": 200,
  "messages": [
    {
      "type": "human",
      "content": "User message"
    },
    {
      "type": "ai",
      "content": "AI response"
    }
  ],
  "has_more": true,
  "total": 25
}
```

**Notes:**
- Messages are returned in chronological order (oldest first)
- `has_more`: `true` if there are more messages on the next page
- `total`: Total number of messages in history

---

#### 3. Send Chat Message (Non-streaming)

Send a message and receive a complete response.

```http
POST /api/chat
Content-Type: application/json
```

**Request Body:**
```json
{
  "user_id": "user_123",
  "diagram_id": "diagram_456",
  "file_url": "https://example.com/file.pdf",
  "messages": [
    {
      "type": "human",
      "content": "What is this document about?"
    }
  ],
  "mindmap_data": {
    "nodes": [],
    "edges": []
  },
  "need_initialize_data": false
}
```

**Request Fields:**
- `user_id` (required): User ID
- `diagram_id` (required): Diagram ID
- `file_url` (optional): URL of the file to process
- `messages` (required): Array of messages (only the last message is needed)
- `mindmap_data` (optional): Current mindmap data for context
- `need_initialize_data` (optional, default: false): 
  - `true`: Reload file and add to vector store
  - `false`: Only retrieve and generate answer

**Response:**
```json
{
  "status": 200,
  "message": "Chat request processed successfully"
}
```

**Workflow:**
1. If `need_initialize_data = true`:
   - Load file from `file_url`
   - Parse and chunk document
   - Add to vector store (PGVector)
   - Retrieve relevant documents
   - Generate answer with context
2. If `need_initialize_data = false`:
   - Retrieve relevant documents from vector store
   - Generate answer with context

**Error Response:**
```json
{
  "status": 400,
  "message": "Error message"
}
```

---

#### 4. Send Chat Message (Streaming)

Send a message and receive response as Server-Sent Events (SSE).

```http
POST /api/chat/stream
Content-Type: application/json
```

**Request Body:** (Same as `/api/chat`)

**Response:** 
Stream with `text/event-stream` content type

**Event Format:**
```
data: {"node": "generate_answer", "chunk": "Hello"}
data: {"node": "generate_answer", "chunk": " world"}
event: stream_complete
data: {}
```

**Event Types:**
- `data`: Response chunk from LangGraph nodes
- `error`: Error event if an error occurs
- `stream_complete`: Stream has completed

**Client Usage (JavaScript):**
```javascript
const response = await fetch('/api/chat/stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(requestBody)
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  // Parse SSE format and process chunks
}
```

---

#### 5. Cancel Chat Request

Cancel an ongoing chat request.

```http
POST /api/chat/cancel
Content-Type: application/json
```

**Request Body:**
```json
{
  "diagram_id": "diagram_456"
}
```

**Response:**
```json
{
  "status": 200,
  "message": "Chat cancellation requested"
}
```

**Notes:**
- Sets cancel flag for diagram_id
- Workflow will check flag and stop processing
- Response will be "Chat request cancelled"

---

#### 6. Delete Chat History

Delete chat history for a user and diagram.

```http
DELETE /api/delete-chat-history
Content-Type: application/json
```

**Request Body:**
```json
{
  "diagram_id": "diagram_456",
  "user_id": "user_123"
}
```

**Request Fields:**
- `diagram_id` (required): Diagram ID
- `user_id` (required): User ID

**Response:**
```json
{
  "status": 200,
  "message": "Chat history deleted successfully"
}
```

**Error Response:**
```json
{
  "status": 400,
  "message": "user_id is required to delete chat history"
}
```

**Notes:**
- Deletes thread in LangGraph checkpoint store
- Thread ID format: `{diagram_id}_{user_id}`

---

#### 7. Delete Diagram Vector Store

Delete all documents in vector store for a diagram.

```http
DELETE /api/delete-diagram-store
Content-Type: application/json
```

**Request Body:**
```json
{
  "diagram_id": "diagram_456"
}
```

**Response:**
```json
{
  "status": 200,
  "message": "Diagram store deleted successfully. 15 documents removed."
}
```

**Notes:**
- Deletes all embeddings and documents related to diagram_id
- Does not require user_id (shared for all users)

---

## Frontend API Routes (Next.js)

Base URL: `http://localhost:3000` (development)

### 1. NextAuth Routes

- `/api/auth/signin` - Sign in page
- `/api/auth/signout` - Sign out
- `/api/auth/callback/google` - Google OAuth callback
- `/api/auth/session` - Get current session

### 2. Liveblocks Routes

- `/api/liveblocks-auth` - Liveblocks authentication

### 3. S3 Routes

- `/api/s3/upload` - Generate presigned URL for file upload

### 4. Chat Proxy

- `/api/chat/*` - Proxy requests to backend API

---

## Data Models

### ChatRequest

```typescript
interface ChatRequest {
  user_id: string;
  diagram_id: string;
  file_url?: string;
  messages?: BaseMessage[];
  mindmap_data?: {
    nodes: any[];
    edges: any[];
  };
  need_initialize_data?: boolean;
}
```

### DeleteRequest

```typescript
interface DeleteRequest {
  diagram_id: string;
  user_id?: string;
}
```

### BaseResponse

```typescript
interface BaseResponse {
  status: 200 | 400 | 500;
  message: string;
}
```

### HistoryResponse

```typescript
interface HistoryResponse {
  status: 200 | 400 | 500;
  messages: BaseMessage[];
  has_more: boolean;
  total: number;
}
```

---

## Error Handling

### HTTP Status Codes

- `200`: Success
- `400`: Bad Request (validation error, missing required field)
- `500`: Internal Server Error

### Error Response Format

```json
{
  "status": 400,
  "message": "Error description"
}
```

---

## Rate Limiting

Currently, there is no rate limiting at the API level, but token usage limits are enforced per user on a weekly basis. See [Token Usage Documentation](./TOKEN_USAGE.md) for details.

---

## CORS

Backend only accepts requests from `FRONTEND_URL` configured in environment variables.

---

## Examples

### Example 1: Initialize Document and Chat

```bash
# Step 1: Upload file and get file_url
# Step 2: Initialize document
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user_123",
    "diagram_id": "diagram_456",
    "file_url": "https://example.com/document.pdf",
    "messages": [{
      "type": "human",
      "content": "Summarize this document"
    }],
    "need_initialize_data": true
  }'

# Step 3: Continue chatting (no need to initialize)
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user_123",
    "diagram_id": "diagram_456",
    "messages": [{
      "type": "human",
      "content": "What are the main topics?"
    }],
    "need_initialize_data": false
  }'
```

### Example 2: Get Chat History

```bash
curl "http://localhost:8000/api/chat-history?diagram_id=diagram_456&user_id=user_123&limit=20&offset=0"
```

### Example 3: Streaming Chat

```javascript
const response = await fetch('http://localhost:8000/api/chat/stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_id: 'user_123',
    diagram_id: 'diagram_456',
    messages: [{ type: 'human', content: 'Hello' }],
    need_initialize_data: false
  })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();
let buffer = '';

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  buffer += decoder.decode(value, { stream: true });
  const lines = buffer.split('\n');
  buffer = lines.pop() || '';
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));
      console.log('Chunk:', data);
    } else if (line.startsWith('event: ')) {
      const event = line.slice(7);
      console.log('Event:', event);
    }
  }
}
```

---

## Future API Improvements

1. **Authentication**: JWT tokens or API keys
2. **Rate Limiting**: Prevent abuse
3. **Webhooks**: Event notifications
4. **GraphQL**: Unified query interface
5. **Versioning**: API versioning (`/api/v1/...`)
6. **Documentation**: OpenAPI/Swagger auto-generated docs
