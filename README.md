# 🧠 Memory — AI Caregiver Platform

> A compassionate, AI-powered digital caregiver for individuals with dementia, Alzheimer's, or memory-impairing conditions.

---

## ✨ What Does This App Do?

Memory is a full-stack web application with **two interfaces**:

- **🏥 Patient Interface** — Voice-first, large-font, warm UI for the memory-impaired patient
- **🛡️ Guardian Dashboard** — Standard dashboard for family members and caregivers

### Core Features
| Feature | Description |
|---|---|
| 🎙️ Voice Diary | Record your day with your voice; AI transcribes and stores it |
| 👥 People Registry | Know who your loved ones are; tap any card to hear who they are |
| ✅ Daily Tasks | Morning briefing read aloud; tap to complete tasks |
| 💬 AI Chat | Ask Memory anything — it answers from your diary and people data |
| 🆘 LOST Mode | Emergency button that captures GPS and alerts guardians |
| 📊 Guardian Dashboard | View task completion, mood trends, diary entries, and LOST events |

---

## 🛠️ Tech Stack (100% Free)

| Layer | Technology | Cost |
|---|---|---|
| Framework | Next.js 14 (App Router) | Free |
| Database | SQLite via Prisma | Free |
| Auth | NextAuth.js | Free |
| AI Chat & Embeddings | Google Gemini 1.5 Flash | **Free** (1,500 req/day) |
| Voice Transcription | Groq Whisper | **Free** (2,000 req/day) |
| Text-to-Speech | Browser Web Speech API | Free (built-in) |
| Maps | OpenStreetMap (no key needed) | Free |
| Styling | Tailwind CSS | Free |

---

## 📋 Prerequisites — What You Need Before Running

### Step 1: Node.js
Make sure you have **Node.js 18 or higher** installed.

Check by running:
```bash
node --version
```

If not installed, download from: https://nodejs.org

---

### Step 2: Get Your 2 Free API Keys

#### 🔑 API Key 1 — Google Gemini (for AI Chat, Morning Briefing, Person Descriptions)

1. Go to **https://aistudio.google.com**
2. Sign in with your Google account (completely free)
3. Click **"Get API Key"** in the top menu
4. Click **"Create API key"**
5. Copy the key — it looks like: `AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`

**Free Tier Limits:** 1,500 requests/day, 15 requests/minute — more than enough for personal use.

#### 🔑 API Key 2 — Groq (for Voice Transcription / Speech-to-Text)

1. Go to **https://console.groq.com**
2. Sign up (completely free, no credit card required)
3. Click **"API Keys"** in the left sidebar
4. Click **"Create API Key"**
5. Copy the key — it looks like: `gsk_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`

**Free Tier Limits:** 2,000 voice transcription requests/day — no credit card needed.

> **💡 Can I use the app without these API keys?**
> YES! The app works without API keys — it runs in "demo mode" with pre-written responses and mock AI features. The UI, tasks, people registry, diary, and LOST mode all work without any API key. You only need the keys for live AI responses.

---

### Step 3: Generate a Secret Key for Auth

You need a random secret for NextAuth. Run this command:

```bash
# On Windows PowerShell:
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))

# On Mac/Linux:
openssl rand -base64 32
```

Or use this website: **https://generate-secret.vercel.app/32**

---

## 🚀 How to Run the Project

### 1. Navigate to the project folder

```bash
cd "d:\Project Memory\memory-app"
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up your environment variables

Copy the example file:
```bash
copy .env.local.example .env.local
```

Then open `.env.local` in any text editor (Notepad works fine) and fill in your values:

```env
# ─── Required (works as-is for local SQLite) ───
DATABASE_URL="file:./dev.db"

# ─── Required (generate a random string) ───────
NEXTAUTH_SECRET="paste-your-generated-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# ─── Optional (for live AI features) ──────────
GEMINI_API_KEY="AIzaSyXXXXXXXXXXXXXX"    # From aistudio.google.com
GROQ_API_KEY="gsk_XXXXXXXXXXXXXXXXXXXX"   # From console.groq.com
```

### 4. Set up the database

Push the schema and seed with demo data:

```bash
# Push schema to SQLite
$env:DATABASE_URL="file:./dev.db"; npx prisma db push

# Seed with demo data
npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts
```

> **On Windows PowerShell**, use single-quotes around the JSON like this:
> ```powershell
> npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts
> ```

### 5. Start the development server

```bash
npm run dev
```

### 6. Open in your browser

Go to: **http://localhost:3000**

---

## 🎯 Demo Accounts (Pre-loaded)

After seeding the database, you can log in immediately with these accounts:

| Role | Email | Password |
|---|---|---|
| 🛡️ **Guardian** (Priya Sharma) | `guardian@memory.app` | `guardian123` |
| 🏥 **Patient** (Ramesh Kumar) | `patient@memory.app` | `patient123` |

The demo data includes:
- ✅ 5 pre-configured daily tasks (medicine, exercise, meals, family calls)
- 👥 5 people in the registry (daughter, grandson, granddaughter, doctor, son)
- 📖 3 sample diary entries (with different moods)

---

## 📁 Project Structure

```
memory-app/
├── app/
│   ├── (patient)/           # Patient-facing pages
│   │   ├── home/            # Morning briefing + task list
│   │   ├── people/          # People cards (tap to hear)
│   │   ├── memories/        # Voice diary
│   │   └── talk/            # AI chat interface
│   ├── (guardian)/          # Guardian dashboard
│   │   ├── dashboard/       # Overview + stats
│   │   └── guardian/
│   │       ├── tasks/       # Task manager
│   │       ├── people/      # People registry manager
│   │       └── alerts/      # LOST mode events
│   ├── api/                 # All API endpoints
│   │   ├── auth/            # NextAuth
│   │   ├── chat/            # RAG-powered AI chat
│   │   ├── diary/           # Diary CRUD
│   │   ├── tasks/           # Tasks CRUD
│   │   ├── people/          # People CRUD
│   │   ├── transcribe/      # Groq Whisper STT
│   │   ├── lost/            # LOST mode trigger/resolve
│   │   └── guardian/        # Guardian overview data
│   ├── login/               # Login page
│   ├── register/            # Registration page
│   └── globals.css          # Design system
├── components/
│   └── Providers.tsx        # NextAuth session provider
├── lib/
│   ├── db.ts                # Prisma SQLite client
│   ├── gemini.ts            # Google Gemini AI client
│   ├── groq.ts              # Groq Whisper client
│   └── vectorSearch.ts      # Cosine similarity search
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── seed.ts              # Demo data seeder
├── public/uploads/          # Uploaded photos (local)
├── middleware.ts            # Route protection
├── .env.local               # Your environment variables
├── .env.local.example       # Template for env vars
└── prisma.config.ts         # Prisma 7 configuration
```

---

## 💡 How Each Feature Works

### 🎙️ Voice Diary
1. Patient taps **"Start Recording"**
2. Browser captures audio via MediaRecorder API
3. Audio is sent to **Groq Whisper** for transcription
4. Patient confirms the transcript
5. **Gemini AI** analyzes: mood, people mentioned, places mentioned
6. Entry is saved with an **embedding** for future semantic search
7. Patient can tap any past entry to hear it read aloud (Web Speech API)

### 👥 People Registry
1. Guardian adds a person with name, relationship, key facts, and optional photo
2. Person is stored in SQLite with JSON facts array
3. Patient taps a person's card
4. **Gemini AI** generates a warm description ("Arjun is your grandson...")
5. **Web Speech API** reads the description aloud automatically

### 💬 AI Chat (RAG)
1. Patient types or speaks their question
2. System classifies intent (person / task / memory / general)
3. Relevant context is fetched:
   - **Diary entries** via cosine similarity search on stored embeddings
   - **People** via direct SQLite lookup
   - **Tasks** via scheduled time query
4. **Gemini AI** generates a warm, personalized response
5. Response is spoken aloud via **Web Speech API**

### 🆘 LOST Mode
1. Patient presses the always-visible red **"I AM LOST"** button
2. Confirmation dialog appears (to prevent accidents)
3. On confirm: GPS captured via `navigator.geolocation`
4. LOST event created in database with coordinates
5. Calming overlay appears: "Help is on the way. You are safe."
6. Web Speech reads the message repeatedly
7. Guardian sees the event in their dashboard with an OpenStreetMap link
8. Guardian resolves the event → logged with timestamp

---

## 🔧 Useful Commands

```bash
# Start development server
npm run dev

# Push database schema changes
$env:DATABASE_URL="file:./dev.db"; npx prisma db push

# Re-seed demo data (WARNING: clears existing data)
npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts

# Generate Prisma client (after schema changes)
$env:DATABASE_URL="file:./dev.db"; npx prisma generate

# View the database in Prisma Studio
$env:DATABASE_URL="file:./dev.db"; npx prisma studio

# Build for production
npm run build
```

---

## 🌐 Deploying to Vercel (Optional)

1. Push your code to GitHub
2. Go to **vercel.com** and import your GitHub repository
3. Add these **Environment Variables** in Vercel's dashboard:
   ```
   DATABASE_URL        = file:./dev.db  (or a hosted DB like Supabase)
   NEXTAUTH_SECRET     = your-secret
   NEXTAUTH_URL        = https://your-app.vercel.app
   GEMINI_API_KEY      = your-gemini-key
   GROQ_API_KEY        = your-groq-key
   ```
4. Click **Deploy**

> **Note**: For Vercel deployment, replace SQLite with a hosted PostgreSQL (e.g., [Supabase](https://supabase.com) free tier) by changing `DATABASE_URL` and updating `prisma.config.ts`.

---

## 🆓 Cost Summary

| Service | Free Tier | What It Powers |
|---|---|---|
| Google Gemini | 1,500 req/day | AI Chat, Morning Briefing, Descriptions |
| Groq Whisper | 2,000 req/day | Voice-to-text transcription |
| Web Speech API | Unlimited | Text-to-speech (browser built-in) |
| SQLite | Unlimited | All data storage |
| NextAuth | Unlimited | Authentication |
| OpenStreetMap | Unlimited | LOST mode maps |
| Vercel | Unlimited hobby | Hosting |

**Total monthly cost: $0** 🎉

---

## 🤝 License

MIT License — Free for personal and educational use.

---

*Built with ❤️ for dementia caregiving. Memory — always here, always patient.*
