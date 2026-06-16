# tindone

Swipe your way to GTD nirvana.

## Tech Stack
- **Framework**: Next.js (App Router)
- **Styling**: Vanilla CSS
- **Database**: Turso (LibSQL)
- **Animations**: Framer Motion
- **PWA**: Manifest & Declarative Web Push (Safari 18.2+)

## Setup

1. **Turso Database**:
   - Create a database on [Turso](https://turso.tech).
   - Run the schema in `schema.sql`.
   - Get the URL and Auth Token.

2. **Environment Variables**:
   Create a `.env.local` file:
   ```env
   TURSO_DATABASE_URL=libsql://your-db-name.turso.io
   TURSO_AUTH_TOKEN=your-auth-token
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
   VAPID_PRIVATE_KEY=your-vapid-private-key
   VAPID_SUBJECT=mailto:you@example.com
   # Authentication via id.kbn.one (Passkeys / DPoP identity provider)
   IDP_BASE_URL=https://id.kbn.one
   NEXT_PUBLIC_IDP_BASE_URL=https://id.kbn.one
   GTD_SESSION_SECRET=your-random-32-byte-secret
   ```

   Generate VAPID keys with:
   ```bash
   npx web-push generate-vapid-keys
   ```

   Generate a session secret with:
   ```bash
   openssl rand -base64 32
   ```

3. **Authentication (id.kbn.one)**:
   Users sign in with passkeys via [id.kbn.one](https://github.com/kuboon/id.kbn.one).
   The app's origin must be whitelisted in the IdP's `AUTHORIZE_WHITELIST`
   (both `http://localhost:3000` for dev and your production origin).
   For existing databases, apply `migrations/001_add_idp_sub.sql`.

4. **Install & Run**:
   ```bash
   npm install
   npm run dev
   ```

## Features
- **GTD Lists**: Inbox, Now, Next, Waiting, Done.
- **Tinder Like Swipe**: Quickly process your inbox or review lists with gestures.
- **Task Log**: Automatic recording of every task movement.
- **Remote Update**: Copy-paste cURL/Wget commands from task details to update status from your terminal.
- **Dynamic OG Image**: Shareable task URLs with beautiful preview images.

## Task Update API

`PATCH /api/u/:userId/tasks/:taskId`

- Request body:
   ```json
   { "list": "now" }
   ```
- Optional `push` flag (default: `true`):
   - `push: true` or omitted: send web push notification.
   - `push: false`: skip notification (used by in-app updates to avoid self-notifications).

Example without push notification:

```json
{ "list": "now", "push": false }
```
