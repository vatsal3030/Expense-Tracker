# 💸 FairShare — Split Expenses Fairly

<div align="center">

![FairShare Logo](https://img.shields.io/badge/FairShare-6366f1?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48dGV4dCB4PSI1IiB5PSIxOCIgZm9udC1zaXplPSIxOCIgZmlsbD0id2hpdGUiIGZvbnQtd2VpZ2h0PSJib2xkIj5GPC90ZXh0Pjwvc3ZnPg==&logoColor=white)

**A free, production-ready expense splitting platform**

[![Next.js](https://img.shields.io/badge/Next.js-14+-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![Express](https://img.shields.io/badge/Express-4.x-green?style=flat-square&logo=express)](https://expressjs.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?style=flat-square&logo=postgresql)](https://postgresql.org)
[![Prisma](https://img.shields.io/badge/Prisma-6.x-2D3748?style=flat-square&logo=prisma)](https://prisma.io)
[![Supabase](https://img.shields.io/badge/Supabase-Auth-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com)
[![MUI](https://img.shields.io/badge/MUI-v6-007FFF?style=flat-square&logo=mui)](https://mui.com)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

</div>

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 👥 **Group Splitting** | Split bills equally, by percentage, exact amounts, or shares |
| 📊 **Smart Dashboard** | Visual analytics with spending trends and category breakdowns |
| 🤝 **Debt Simplification** | Minimize transactions to settle group debts |
| 💰 **Budget Planning** | Category budgets with smart alerts |
| 🔔 **Notifications** | Real-time alerts for expenses, settlements, and budgets |
| 👫 **Friends System** | Add friends, send requests, manage connections |
| 🌍 **Multi-Currency** | Support for multiple currencies |
| 📱 **PWA Support** | Install as a native app on any device |
| 🌙 **Dark/Light Mode** | Beautiful themed UI with smooth transitions |
| 🔒 **Secure** | JWT auth, rate limiting, input validation, CORS |

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14+ (App Router), TypeScript, MUI v6 |
| Backend | Express.js, TypeScript |
| Database | PostgreSQL, Prisma ORM |
| Auth | Supabase Auth (Email, Google, GitHub) |
| Charts | Recharts |
| HTTP | Axios |
| Validation | Zod |
| CI/CD | GitHub Actions |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm
- A [Supabase](https://supabase.com) project (free tier)

### 1. Clone & Install

```bash
git clone https://github.com/vatsal3030/Expense-Tracker.git
cd Expense-Tracker
npm install
```

### 2. Configure Environment

**Server** — copy `server/.env.example` to `server/.env`:
```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_REF.supabase.co:5432/postgres
SUPABASE_URL=https://YOUR_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
CLIENT_URL=http://localhost:3000
```

**Client** — copy `client/.env.example` to `client/.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 3. Setup Database

```bash
cd server
npx prisma generate
npx prisma db push
```

### 4. Run Development

```bash
# From root directory — starts both client and server
npm run dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- API Health: http://localhost:5000/api/health

## 📦 Deployment

### Vercel (Frontend)
1. Connect your GitHub repo to Vercel
2. Set root directory to `client`
3. Add environment variables in Vercel dashboard

### Render (Backend)
1. Connect GitHub repo to Render
2. Use `render.yaml` for configuration
3. Add environment variables in Render dashboard

### AWS (Full Stack)
- Use provided Dockerfiles for ECS/EC2 deployment
- RDS for PostgreSQL database
- See `Dockerfile` in both `client/` and `server/`

## 📁 Project Structure

```
├── client/                  # Next.js Frontend
│   ├── src/
│   │   ├── app/             # App Router pages
│   │   ├── components/      # Reusable UI components
│   │   ├── lib/             # API client, Supabase
│   │   ├── providers/       # Auth & Theme contexts
│   │   └── theme/           # MUI theme config
│   ├── public/              # Static assets & PWA
│   └── Dockerfile
├── server/                  # Express.js Backend
│   ├── src/
│   │   ├── routes/          # API route handlers
│   │   ├── middleware/      # Auth, validation, errors
│   │   └── lib/             # Prisma, Supabase clients
│   ├── prisma/              # Database schema
│   └── Dockerfile
├── .github/workflows/       # CI/CD pipeline
├── render.yaml              # Render deployment config
└── package.json             # Root monorepo scripts
```

## 🛡️ Security

- **Supabase Auth** with JWT token verification
- **Rate Limiting** — 100 requests per 15 minutes
- **Input Validation** — Zod schemas on all endpoints
- **CORS** — Configured for specific origins
- **Helmet** — Security headers
- **SQL Injection** — Prevented via Prisma ORM
- **XSS** — Next.js built-in protection

## 📄 License

MIT License — use it freely for personal or commercial projects.

---

<div align="center">
  Built with ❤️ by <a href="https://github.com/vatsal3030">Vatsal</a>
</div>
