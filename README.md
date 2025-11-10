# FitCoach - AI-Powered Fitness Coaching PWA

A Next.js Progressive Web App for personalized fitness coaching with **offline-first architecture** and AI-powered guidance.

## 🏗️ Architecture

### Local-Aware Hybrid Architecture

FitCoach uses a sophisticated **offline-first, local-aware hybrid architecture** that provides seamless functionality regardless of network connectivity.

```
┌─────────────────────────────────────────────────────────────┐
│                        React UI Layer                        │
│  (React Query Hooks + Zustand State + Optimistic Updates)  │
└─────────────────┬───────────────────────────┬───────────────┘
                  │                           │
        ┌─────────▼─────────┐       ┌────────▼────────┐
        │  IndexedDB Cache  │       │  Server APIs    │
        │  (Dexie + Local)  │       │  (Next.js API)  │
        └─────────┬─────────┘       └────────┬────────┘
                  │                           │
        ┌─────────▼───────────────────────────▼────────┐
        │         Bidirectional Sync Engine            │
        │  (Push dirty records ↔ Pull server updates)  │
        └──────────────────────────────────────────────┘
```

### Key Components

1. **Data Layer** (`lib/db/local.ts`)
   - IndexedDB (Dexie) as primary data store
   - Offline-first: reads from IndexedDB before API
   - Dirty flag tracking (`_isDirty`) for offline writes

2. **React Query Hooks** (`lib/query/hooks.tsx`)
   - Declarative data fetching
   - Automatic caching and background refetching
   - Optimistic UI updates for mutations

3. **Sync Engine** (`lib/sync/engine.ts`)
   - Bidirectional sync (push dirty → pull updates)
   - Auto-triggers on online event
   - Per-record error tracking

4. **AI Caching** (`lib/ai/cache.ts`, `lib/ai/fallbacks.ts`)
   - Hash-based response caching (60min TTL)
   - Rule-based offline fallbacks
   - Prompt queuing for offline requests

5. **JWT Caching** (`lib/auth/cache.ts`)
   - Session caching for offline auth (24h TTL)
   - Auto-refresh on token refresh
   - Secure localStorage implementation

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- pnpm 8+
- PostgreSQL database
- Supabase account (for auth)
- OpenAI API key (for AI coaching)

### Installation

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Run database migrations
pnpm run db:push

# Start development server
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Database
DATABASE_URL=postgresql://user:pass@host:5432/fitcoach

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL_PLANNER=gpt-4o
OPENAI_MODEL_COACH=gpt-4o-mini

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 📦 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: Supabase Auth (SSR-compatible)
- **State**: React Query + Zustand
- **Offline**: IndexedDB (Dexie) + Service Worker
- **AI**: OpenAI GPT-4o
- **PWA**: next-pwa + Workbox
- **UI**: Tailwind CSS + Framer Motion
- **TypeScript**: Strict mode enabled

## 🔄 Offline Capabilities

### What Works Offline

✅ **View cached data**
- Profile, plans, workouts
- Recent workout logs and meals
- Coach briefs (cached for 60min)

✅ **Create new data**
- Log workouts
- Log meals
- Edit profile

✅ **Auto-sync when online**
- Dirty records automatically sync
- Retry failed syncs with exponential backoff
- No data loss, guaranteed eventual consistency

### Sync Flow

```
1. User logs workout offline
   ↓
2. Saved to IndexedDB with _isDirty = true
   ↓
3. useSyncStore.dirtyCount increments
   ↓
4. Device comes online
   ↓
5. Auto-trigger sync via 'online' event
   ↓
6. POST /api/sync/push (batch upload)
   ↓
7. Mark synced records _isDirty = false
   ↓
8. POST /api/sync/pull (delta download)
   ↓
9. Cache server updates in IndexedDB
   ↓
10. UI updates automatically via React Query
```

## 🧪 Development

### Scripts

```bash
# Development
pnpm run dev          # Start dev server
pnpm run build        # Production build
pnpm run start        # Start production server

# Code Quality
pnpm run lint         # Run ESLint
pnpm run typecheck    # Run TypeScript check
pnpm run format       # Format with Prettier

# Database
pnpm run db:push      # Push schema changes
pnpm run db:studio    # Open Drizzle Studio
pnpm run db:generate  # Generate migrations
```

### File Structure

```
fitcoach/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authenticated routes
│   ├── api/               # API routes
│   │   ├── sync/          # Sync endpoints
│   │   ├── coach/         # AI coach endpoints
│   │   └── log/           # Workout logging
│   └── layout.tsx         # Root layout
├── components/            # React components
│   └── providers/         # Context providers
├── lib/
│   ├── ai/               # AI caching & fallbacks
│   ├── auth/             # JWT caching
│   ├── db/               # Database & IndexedDB
│   ├── query/            # React Query config & hooks
│   ├── store/            # Zustand stores
│   └── sync/             # Sync engine
├── drizzle/              # Database schema
└── public/               # Static assets
```

## 🎯 Features

### Core Features

- **AI-Powered Planning**: GPT-4 generates personalized workout plans
- **Progressive Overload**: Automatic weight/volume progression
- **Offline-First**: Full functionality without internet
- **Real-Time Sync**: Auto-sync when connection returns
- **Coach Briefs**: Daily AI guidance (cached for offline)
- **Exercise Logging**: Track sets, reps, weight, RPE
- **Nutrition Tracking**: Log meals with macros
- **Progress Analytics**: View PRs and volume trends

### PWA Features

- **Installable**: Add to home screen (iOS/Android)
- **Offline Mode**: Works without internet
- **Background Sync**: Syncs when connection returns
- **Push Notifications**: (Coming soon)
- **App Shell Caching**: Instant load times

## 🔒 Security

- **Row-Level Security (RLS)**: Enforced in Supabase
- **Ownership Verification**: All sync operations verify user ownership
- **JWT Caching**: Secure localStorage with 24h TTL
- **API Key Protection**: Server-side only, never exposed
- **HTTPS Enforced**: Production uses HTTPS only

## 📊 Performance

### Optimizations

- **Delta Sync**: Only sync changed records (not full dataset)
- **Batch Operations**: Single API call for all dirty records
- **Indexed Queries**: Compound indices on userId + dirty/timestamp
- **Parallel Fetching**: Promise.all for independent queries
- **Request Deduplication**: React Query prevents redundant fetches
- **Automatic Retry**: Exponential backoff for failed requests

### Metrics

- **First Load**: < 2s (cached app shell)
- **Time to Interactive**: < 3s
- **Offline Boot**: < 500ms (IndexedDB reads)
- **Sync Duration**: ~1s for 10 records

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: new feature
fix: bug fix
docs: documentation changes
style: formatting, missing semi colons, etc
refactor: code restructuring
perf: performance improvements
test: adding tests
build: build system changes
ci: CI configuration changes
chore: other changes
```

## 📝 License

MIT License - see [LICENSE](LICENSE) for details

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Supabase](https://supabase.com/) - Backend as a Service
- [Dexie.js](https://dexie.org/) - IndexedDB wrapper
- [React Query](https://tanstack.com/query) - Server state management
- [Drizzle ORM](https://orm.drizzle.team/) - TypeScript ORM

---

**Built with ❤️ using the Local-Aware Hybrid Architecture**
