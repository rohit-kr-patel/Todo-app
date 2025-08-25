# Jarvis Todo Backend

Enhanced backend with AI-powered chatbot and voice assistant capabilities.

## Features

- ✅ User authentication with JWT
- ✅ Todo CRUD operations
- ✅ AI-powered chatbot using Hugging Face
- ✅ Voice command processing
- ✅ Intent recognition and NLP
- ✅ Real-time todo management

## Setup

### 1. Environment Variables

Create a `.env` file in the backend directory with:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key_here

# Hugging Face API Key (Get from https://huggingface.co/settings/tokens)
HF_API_KEY=your_huggingface_api_key_here

# Server Port
PORT=5000
```

### 2. Get Hugging Face API Key

1. Go to [Hugging Face](https://huggingface.co/settings/tokens)
2. Create a new token
3. Add it to your `.env` file

### 3. Install Dependencies

```bash
npm install
```

### 4. Start Server

```bash
npm start
# or
node server.js
```

## API Endpoints

### Authentication
- `POST /create` - Create user account
- `POST /login` - User login
- `POST /logout` - User logout
- `GET /me` - Get user profile
- `PUT /me` - Update user profile

### Todos
- `GET /items` - Get all todos
- `POST /items` - Create new todo
- `PUT /items/:id/complete` - Mark todo as complete
- `DELETE /items/:id` - Delete todo

### AI Chatbot
- `POST /api/chat` - Chat with AI assistant
- `POST /api/nlp` - NLP intent recognition
- `POST /api/translate` - Text translation

### Health
- `GET /health` - Service health check

## Voice Commands

The chatbot understands natural language commands:

- "Show pending todos" - List incomplete tasks
- "Add todo: Buy groceries" - Create new task
- "Mark buy groceries as done" - Complete task
- "Show all todos" - List all tasks
- "What can you do?" - Get help

## Technologies Used

- Node.js + Express
- MySQL database
- JWT authentication
- Hugging Face AI models
- WebSocket for real-time updates
