# 💰 RAG Expense Assistant

AI-powered expense tracker using Next.js + Google Gemini. Upload your expense JSON and ask questions in natural language.

## Features
- Upload JSON expense data
- Natural language search using Gemini AI
- Keyword-based hybrid search
- Works without Supabase (local file storage)

## Setup

### 1. Clone & Install
```bash
git clone https://github.com/your-username/rag-expense-system.git
cd rag-expense-system
npm install
```

### 2. Environment Variables
```bash
cp .env.local.example .env.local
# Add your GEMINI_API_KEY
```

### 3. Run Locally
```bash
npm run dev
# Open http://localhost:3000
```

## Deploy to Vercel

1. Push to GitHub
2. Import repo on [vercel.com](https://vercel.com)
3. Add `GEMINI_API_KEY` in Vercel → Settings → Environment Variables
4. Deploy!

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | ✅ Yes | Google Gemini API key |
| `NEXT_PUBLIC_SUPABASE_URL` | ❌ Optional | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | ❌ Optional | Supabase service key |
