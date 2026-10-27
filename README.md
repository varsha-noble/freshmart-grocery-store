# FreshMart MERN Stack Grocery Store

A full-stack MERN (MongoDB, Express, React, Node.js) grocery application featuring dynamic unit pricing (kg, liter, dozen), real-time inventory management, and an AI-powered pricing & unit conversion assistant.

## Project Structure

```text
├── backend/                  # Backend Node.js / Express code
│   ├── data/                 # Seed catalog and persistent NoSQL storage
│   ├── chatService.ts        # Conversational pricing & inventory AI assistant
│   ├── db.ts                 # MongoDB database connection & CRUD operations
│   ├── server.ts             # Express REST API routes
│   └── unitConverter.ts      # Unit conversion engine (kg, g, L, ml, dozen, ₹ budget)
│
├── frontend/                 # Frontend React SPA
│   ├── src/                  # React source code
│   │   ├── components/       # UI components (Navbar, ProductCard, Chatbot, etc.)
│   │   ├── services/         # API client for backend routes
│   │   ├── types/            # TypeScript interfaces
│   │   ├── App.tsx           # Main application view
│   │   └── main.tsx          # Application entry point
│   └── index.html            # Frontend HTML entry point
│
├── server.ts                 # Full-stack dev runner
├── package.json              # Dependencies and scripts
└── vite.config.ts            # Vite bundler configuration
```

## How to Run on Your Local System

### Prerequisites
- **Node.js**: v18 or higher (v20+ recommended)
- **npm** or **bun** / **yarn**
- *(Optional)* MongoDB: Local `mongod` or free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) connection string. If omitted, the app automatically runs an embedded, persistent NoSQL document engine.

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the project root:
```bash
# Optional: MongoDB connection string (leave blank to use the built-in NoSQL engine)
MONGODB_URI=""

# Optional: Gemini API key for natural language conversational responses
GEMINI_API_KEY=""

# Port (defaults to 3000)
PORT=3000
```

### 3. Start the Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 4. Build for Production
```bash
npm run build
npm start
```
