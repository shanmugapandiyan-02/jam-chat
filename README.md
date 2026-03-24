# VibeConnect - Random Video Chat App (OmeTV/Uhmegle Clone)

A modern, fast, and feature-rich random video chat web application built with Next.js, WebRTC, and Socket.io.

## 🚀 Key Features

*   **Random Matching**: Queue-based pairing for high-speed connections.
*   **WebRTC Integration**: Low-latency, peer-to-peer video/audio.
*   **Premium UI**: Dark-themed, glassmorphism design with responsive controls.
*   **Real-time Text Chat**: Integrated messenger alongside video.
*   **Monetization Ready**: Razorpay integration for premium subscriptions.
*   **Safety Features**: Report/Block system (schema included).

## 🛠 Tech Stack

*   **Frontend**: Next.js (App Router), Tailwind CSS, Zustand, Framer Motion.
*   **Backend**: Node.js, Express, Socket.io (Signaling & Matchmaking).
*   **Database**: PostgreSQL with Prisma ORM.
*   **Authentication**: NextAuth.js (Google OAuth).
*   **Payments**: Razorpay (India).

---

## ⚙️ Setup Instructions

### 1. Prerequisites
*   Node.js (v18+)
*   PostgreSQL Database (Supabase / Neon / Local)
*   Razorpay API Keys
*   Google OAuth Credentials

### 2. Backend Setup
1.  Navigate to `/backend`
2.  Install dependencies: `npm install`
3.  Copy `.env.example` to `.env` and fill in your database and Razorpay credentials.
4.  Push prisma schema: `npx prisma db push`
5.  Start server: `npm run dev` (add a dev script to package.json: `"dev": "ts-node src/index.ts"`)

### 3. Frontend Setup
1.  Navigate to `/frontend`
2.  Install dependencies: `npm install`
3.  Copy `.env.example` to `.env` and fill in your Socket URL and API keys.
4.  Start Next.js: `npm run dev`

---

## 📦 Folder Structure

```text
/backend
├── prisma/               # Database schema
├── src/
│   ├── index.ts          # Socket.io signaling + Express API
├── .env.example
├── package.json
└── tsconfig.json

/frontend
├── src/
│   ├── app/              # Main UI & Next.js routes
│   ├── components/       # UI components
│   ├── hooks/            # WebRTC logic
│   ├── lib/              # Client utilities (Razorpay)
│   ├── socket.ts         # Socket.io client setup
│   └── store/            # Zustand state management
├── .env.example
├── package.json
└── tailwind.config.ts
```

## 🔐 Security & Moderation
*   Signaling server handles pair deletion on disconnect.
*   STUN servers are configured for NAT traversal.
*   User reports are logged to the database via Prisma.

## 💰 Future Enhancements (Phase 2 & 3)
*   **Gender/Country Filters**: Restrict matching to specific segments.
*   **AI Moderation**: Use AWS Rekognition/Azure for real-time video moderation.
*   **PWA Support**: Install as a mobile app.
*   **TURN Server**: Add a TURN relay for users behind strict firewalls.
|
---

Developed for **Advanced Agentic Coding (Deepmind)**.
