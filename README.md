# Quiet Library

A calm, text-first social library built with **React Native / Expo** and a **Rust / Axum** API. Each person gets a permanent numeric page, publishes texts, explores other pages by number or intentionally at random, and keeps a private notebook of authors and notes.

The interface is in Russian. The initial visual direction is warm paper, dark forest green, restrained serif typography, and a handwritten-library-card feeling. No infinite feeds, likes, follower counts, or AI recommendations are used.

## What works

- Expo Router navigation on web, Android, and iOS targets.
- Registration and login with server-issued sessions.
- Stable numeric page IDs assigned by SQLite `AUTOINCREMENT`.
- Public pages, a post editor, post updates, and deletion.
- Explicit lookup by page number and random discovery of nonempty pages.
- A private notebook with personal notes.
- Rust API backed by a persistent local SQLite database.
- Demo mode with fictional authors and sample texts to explore the design without starting the API.

## Requirements

- Node.js 22.13+ or another version supported by Expo SDK 58.
- npm.
- Rust stable toolchain and Cargo for the API.
- An Android emulator, iOS simulator, or web browser to view the app.

## Quick start: UI demo

```bash
cd quiet-library
npm ci
npx expo start --web
```

Demo mode is active when `EXPO_PUBLIC_DEMO_MODE` is omitted or set to `true`. It uses in-memory mock data. The sample pages are numbered `56`, `207`, `314`, `721`, and `1128`. You can register a temporary demo account, write texts, and save notes. Demo data is not intended for long-term storage and may reset when the app restarts.

For an Android or iOS development build, run `npx expo start` and follow the Expo instructions for your device. SDK 58 may require a development build rather than a matching Expo Go binary on some devices.

## Full-stack local development

Start the API in one terminal:

```bash
cd quiet-library/server
cp .env.example .env
cargo run
```

The default API listens at `http://127.0.0.1:3001`. The database is created at `server/quiet_library.db`, migrations are applied on startup, and fictional demo authors are inserted only when `DEMO_SEED=true` and the database contains no users. Demo author accounts cannot log in.

In another terminal, create a client `.env` file using `.env.example` as a starting point and set:

```dotenv
EXPO_PUBLIC_DEMO_MODE=false
EXPO_PUBLIC_API_URL=http://localhost:3001
```

Then run:

```bash
cd quiet-library
npx expo start --web --clear
```

For Android Emulator, use `http://10.0.2.2:3001` in `EXPO_PUBLIC_API_URL`. For a physical device, use your computer's LAN address and configure `API_BIND=0.0.0.0:3001` **for local development only**. Do not expose this MVP API directly to the public Internet without further hardening and HTTPS.

## Checks

Client:

```bash
npm run typecheck
npm run lint
npx expo export --platform web
```

API:

```bash
cd server
cargo check
cargo test
```

The server tests cover the unique numeric pages, duplicate accounts, ownership of posts, and privacy of notebook notes.

## Project structure

```text
quiet-library/
  src/app/                Expo Router screens
  src/components/         Reusable reading and form components
  src/lib/                API client, demo data, session, and theme
  server/src/main.rs      Axum HTTP API
  server/migrations/      SQLite schema
  .env.example            Client environment template
  server/.env.example     API environment template
```

## API routes

| Method | Path | Access |
| --- | --- | --- |
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| POST | `/api/auth/logout` | Authenticated |
| GET | `/api/me` | Authenticated |
| GET | `/api/catalog/stats` | Public |
| GET | `/api/pages/:number` | Public |
| GET | `/api/pages/random` | Public |
| POST | `/api/posts` | Author |
| PUT/DELETE | `/api/posts/:id` | Owner |
| GET | `/api/notebook` | Owner |
| PUT/DELETE | `/api/notebook/:number` | Owner |
| GET | `/health` | Public |

## Limitations before public launch

This is a functional local MVP, not a production-ready public social network. Before inviting untrusted public users, implement email verification and account recovery, rate limiting and spam control, user reports and moderation, data deletion/export policy, scheduled backups, monitoring, and HTTPS. Restrict CORS to trusted origins, deploy secrets properly, and review the authentication strategy for web: the demo client stores its opaque bearer token in browser local storage, while native builds use Expo SecureStore. An HttpOnly-cookie web session is preferable for a hardened production website.

Expo Web is also less suited to search-engine indexing of long text documents than traditional HTML. For a public launch where organic search matters, add server-rendered public reading pages or another HTML-based read-only frontend. Native app store builds and distribution are not included in this MVP.

## Design note

All sample writers and texts are fictional and intended solely as placeholders. Replace them with permission-based real content when validating the concept with readers.
