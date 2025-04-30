# Chat AI API

This is a backend API for an AI Chat application that integrates OpenAI's GPT-4, Stream Chat, and PostgreSQL with Drizzle ORM.

## Features

- User registration and authentication
- AI-powered chat using OpenAI's GPT-4
- Chat history storage and retrieval
- Integration with Stream Chat for real-time messaging

## Tech Stack

- **Node.js** with **Express** for the server
- **TypeScript** for type safety
- **PostgreSQL** database hosted on Neon
- **Drizzle ORM** for database interactions
- **OpenAI API** for AI chat capabilities
- **Stream Chat API** for real-time messaging

## Setup

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (or Neon account)

### Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd chat-ai-api
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=8000
   STREAM_API_KEY=your_stream_api_key
   STREAM_API_SECRET=your_stream_api_secret
   OPENAI_API_KEY=your_openai_api_key
   DATABASE_URL=your_database_connection_string
   ```

### Database Setup

The project uses Drizzle ORM with PostgreSQL. Migrations are already set up in the `migrations` folder.

To apply migrations:

```bash
npx drizzle-kit push:pg
```

## Development

Start the development server:

```bash
npm run dev
```

## API Endpoints

### Register User

- **POST** `/register-user`
- Request body: `{ "name": "User Name", "email": "user@example.com" }`

### Send Chat Message

- **POST** `/chat`
- Request body: `{ "userId": "user_id", "message": "Your message here" }`

### Get Chat History

- **POST** `/get-messages`
- Request body: `{ "userId": "user_id" }`

## Building for Production

```bash
npm run build
```

This will compile TypeScript files to JavaScript in the `dist` directory.

## Running in Production

```bash
npm start
```

## Project Structure

- `src/server.ts` - Main server file with API endpoints
- `src/config/database.ts` - Database connection configuration
- `src/db/schema.ts` - Database schema definition using Drizzle ORM
- `migrations` - Database migration files

## License

MIT
