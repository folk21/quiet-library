# Quiet Library

A text-first social library built with **React Native / Expo** and a **Rust / Axum** API. Each person gets a permanent numeric page, publishes texts, finds publications by content, browses authors by name or number, and keeps a private notebook of authors and notes.

The interface is in Russian. The initial visual direction is warm paper, dark forest green, restrained serif typography, and a handwritten-library-card feeling. No infinite feeds, likes, follower counts, or AI recommendations are used.

## What works

- Expo Router navigation on web, Android, and iOS targets.
- Registration and login with server-issued sessions.
- Stable numeric page IDs assigned by SQLite `AUTOINCREMENT`.
- Public pages, a post editor, post updates, and deletion.
- Explicit lookup by page number and random discovery of nonempty pages.
- Full-text search across publication titles and bodies, with snippets and links to matching posts.
- A clickable author-name cloud with a sample of up to 40 authors.
- A compact, task-oriented home screen with content/page-number search, quick actions, and a collapsible author list.
- A local history of the 12 most recently opened distinct author pages, shown on the home screen and preserved across app restarts.
- Enter-key submission for search fields and the password field in the login/registration form.
- A private notebook with personal notes.
- Private person-to-person messages, including messages to yourself, with inbox, sent items, read status, and recipient-controlled type restrictions.
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

Demo mode is active when `EXPO_PUBLIC_DEMO_MODE` is omitted or set to `true`. It uses in-memory mock data and ten sample author pages. You can search their sample posts, register a temporary demo account, write texts, and save notes. Demo data is not intended for long-term storage and may reset when the app restarts. The full Rust seed includes forty publications and two long texts; the offline demo contains a smaller sample.

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

### Content search and author cloud

The API uses SQLite FTS5 with the Unicode tokenizer, indexed publication titles and bodies, and triggers that maintain the index on post insert/update/delete. The migration backfills existing posts. Search is case-insensitive for Cyrillic and Latin letters and supports word-prefix matches. Multiple words must appear in the same post; search does not include private notebook notes. Results are limited to 25 matches and include an excerpt. Typo tolerance, stemming, and pagination are not implemented.

Example requests:

- `curl -G --data-urlencode "q=лаванда" http://localhost:3001/api/search`
- `curl http://localhost:3001/api/catalog/authors`

The author cloud displays up to 40 randomly sampled names and their page numbers. Clicking a name opens the author's page. Content-search results link to the matching author's page with the matching publication moved to the top of the reading view.

### Recent pages and navigation

The home screen opens with a compact search panel and the most recently visited author pages immediately below it. Search can switch between publication content and an exact page number; both modes submit with Enter. Quick actions for a new post, random page, messages, and the personal area remain available beneath the history list.

Opening a public author page successfully adds it to the recent history. The list is ordered by last opening time, contains at most 12 distinct pages, and never records nonexistent pages. Opening an already visited page moves it to the top. History is kept locally with AsyncStorage on web, Android, and iOS, without an account requirement or a backend endpoint. It is per device/browser, not synchronized between devices, and can be cleared from the home screen after confirmation.

### Private messages

Users can send private messages from any public author page, including their own page, or from the Messages tab. Messages are stored in SQLite and are only accessible to the sender and recipient. Unlike public posts, private message bodies are not included in FTS search.

| Type | Minimum content length |
| --- | --- |
| `simple` | 200 Unicode characters |
| `thought` | 500 Unicode characters |
| `letter` | 1,800 Unicode characters |

All types have a 30,000-character maximum. Letters may include an optional subject of up to 140 characters. The server validates message length and recipient preferences independently of the client.

The Messages tab contains inbox, sent items, and settings. Each account can choose which of the three types to accept. All types are accepted by default. Restrictions apply only to other senders: messages addressed to the sender's own page are always permitted. A message sent to oneself appears in both inbox and sent items.

Opening an incoming message records its read timestamp. The inbox and sent endpoints each return up to 50 recent items, while full content is loaded from the detail endpoint. Demo author accounts cannot log in or reply, but their public message options are visible in the composer.

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

The server tests cover unique numeric pages, duplicate accounts, post ownership, notebook privacy, idempotent seeding, legacy fixture preservation, two long seeded posts, Cyrillic full-text search, catalog authors, search-index updates, message type limits, private message access, recipient restrictions, and self-messaging.

## Project structure

```text
quiet-library/
  src/app/                Expo Router screens
  src/components/         Reusable reading and form components
  src/lib/                API client, demo data, session, and theme
  server/src/main.rs      Axum HTTP API
  server/src/messaging.rs  Private messaging API and access controls
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
| GET | `/api/catalog/authors` | Public |
| GET | `/api/search?q=...` | Public |
| GET | `/api/pages/:number` | Public |
| GET | `/api/pages/random` | Public |
| GET | `/api/pages/:number/message-options` | Public |
| POST | `/api/posts` | Author |
| PUT/DELETE | `/api/posts/:id` | Owner |
| GET | `/api/notebook` | Owner |
| PUT/DELETE | `/api/notebook/:number` | Owner |
| GET/PUT | `/api/me/message-preferences` | Authenticated |
| POST | `/api/messages` | Authenticated |
| GET | `/api/messages/inbox` | Authenticated |
| GET | `/api/messages/sent` | Authenticated |
| GET | `/api/messages/:id` | Sender or recipient |
| POST | `/api/messages/:id/read` | Recipient |
| GET | `/health` | Public |

## Limitations before public launch

This is a functional local MVP, not a production-ready public social network. Before inviting untrusted public users, implement email verification and account recovery, rate limiting and spam control, user reports and moderation, data deletion/export policy, scheduled backups, monitoring, and HTTPS. Restrict CORS to trusted origins, deploy secrets properly, and review the authentication strategy for web: the demo client stores its opaque bearer token in browser local storage, while native builds use Expo SecureStore. An HttpOnly-cookie web session is preferable for a hardened production website.

Private messages are protected by API authorization but are not end-to-end encrypted. Server administrators with database access can read them. Production messaging additionally needs spam prevention, blocking/reporting, notification controls, retention policies, and careful privacy disclosures.

Expo Web is also less suited to search-engine indexing of long text documents than traditional HTML. For a public launch where organic search matters, add server-rendered public reading pages or another HTML-based read-only frontend. Native app store builds and distribution are not included in this MVP.

## Design note

All sample writers and texts are fictional and intended solely as placeholders. Replace them with permission-based real content when validating the concept with readers.
