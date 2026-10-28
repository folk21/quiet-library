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
- Offline demo mode with fictional authors and sample texts to explore the design without starting the API.
- Automatic API database seeding with ten fictional authors and forty varied-length posts.
- Support for publications up to 30,000 Unicode characters.

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

The default API listens at `http://127.0.0.1:3001`. The database is created at `server/quiet_library.db`; SQLx migrations and the development seed run automatically during startup.

### Automatic development seed

The Rust seeder is implemented in `server/src/seed.rs` and runs automatically on every API startup. `DEMO_SEED=true` is the default; set `DEMO_SEED=false` in `server/.env` to disable it.

- Ten fictional authors, each with four publications (forty posts total).
- Posts of varied lengths and subjects, including two generated field journals of approximately 23,000 and 28,000 characters.
- Preferred example page numbers: `56`, `207`, `314`, `721`, `1128`, `1450`, `1502`, `1699`, `1764`, and `1888`. If a preferred number belongs to a real user, the demo author is assigned another number instead.
- The seed is idempotent: restarting the server does not duplicate authors or posts. It also upgrades databases containing the original five demo authors and one post per author.
- Existing user accounts, original demo post contents, and personal notebook entries are preserved.
- Demo author accounts are read-only fixtures and cannot log in.

Use `curl http://localhost:3001/api/catalog/stats` to inspect the total user and publication counts. If you have existing real users, these totals will exceed the seed counts.

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

The server tests cover unique numeric pages, duplicate accounts, post ownership, notebook privacy, idempotent seeding, legacy fixture preservation, and two long seeded posts.

## Project structure

```text
quiet-library/
  src/app/                Expo Router screens
  src/components/         Reusable reading and form components
  src/lib/                API client, demo data, session, and theme
  server/src/main.rs      Axum HTTP API
  server/src/seed.rs      Idempotent development content seeder
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
