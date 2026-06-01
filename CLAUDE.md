# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**United With Heaven** — Expo (React Native) spiritual ministry PWA for Imashi Wetakepotha, deployed at `https://app.unitedwithheaven.com`.

## Commands

```bash
npx expo start --web                        # dev server (web only)
npx expo start                              # dev server (press w for web, a for Android)
npx tsc --noEmit                            # type-check without building
npx vercel deploy --prod --yes              # build on Vercel's servers and deploy
```

Vercel runs `npx expo export --platform web && node scripts/inject-pwa.js` on its build servers and serves the `dist/` output. Do not run the build locally before deploying — Vercel does it remotely.

## Architecture

### Entry point and providers

`App.tsx` loads fonts then wraps the entire app in `<AuthProvider>` (from `src/lib/AuthContext.tsx`) before rendering `<AppNavigator>`. Auth state is available everywhere via `useAuth()`.

### Navigation

`src/navigation/AppNavigator.tsx` — flat bottom-tab navigator with 9 tabs: Home, Songs, Bible, Messages, Prayer, Testimonies, Prophetic, Diary, Community. No stack navigator exists; all drill-down views use `<Modal>` components within the tab screen.

### Identity system — two layers

The app has two identity layers that coexist:

1. **Anonymous session** (`src/utils/session.ts`) — a UUID stored in AsyncStorage under `@uwh/session_id`. Generated on first launch. Used as the `session_id` column on every community record (reactions, comments, posts, group_members, etc.). Survives app restarts but not device wipes.

2. **Supabase Auth** (`src/lib/AuthContext.tsx`) — optional email/password account. When a user signs up, their existing `session_id` is linked to their `user_id` in the `profiles` table. `AuthContext` exposes `{ user, isAdmin, authLoading, refreshAdmin }` app-wide.

Admin status is a `is_admin` boolean on the `profiles` table, checked via `user_id` after sign-in. Only Imashi's account has `is_admin = true`.

### Community tab hub

`src/screens/community/CommunityFeedScreen.tsx` is a three-segment hub (Feed | Groups | Prayer Room) rendered with a single `activeTab` state. The Prayer Room uses Supabase Realtime (`supabase.channel('prayer-room')`) with presence tracking. Groups renders a list of seeded circles; group detail opens as a `<Modal>` within the same screen.

### Supabase client

`src/lib/supabase.ts` — configured with `AsyncStorage` as the auth storage adapter (required for session persistence in React Native Web / PWA). Always use this client; never instantiate a second one.

## Supabase Tables

| Table | Purpose |
|---|---|
| `profiles` | Display name, avatar emoji, `session_id`, `user_id` (nullable), `is_admin` |
| `reactions` | Pray / Amen on prayer_requests, testimonies, community_posts, group_posts |
| `comments` | Threaded comments on testimonies, messages, group_posts |
| `prayer_room_messages` | Real-time prayer room chat (Realtime publication enabled) |
| `groups` | Six seeded community circles |
| `group_members` | Join/leave membership (session_id + group_id) |
| `group_posts` | Posts inside a group |
| `prophetic_requests` | User word requests; `status` = pending | answered; `response` written by admin |
| `daily_checkins` | One row per (session_id, checkin_date); streak calculated client-side |
| `community_stats` | View — aggregate counts for the admin Stats tab |
| `prayer_requests` | Community prayer wall |
| `testimonies` | Community testimonies with `category` |
| `messages` | Inspirational messages (read-only, inserted via Supabase dashboard) |
| `prophetic_flows` | Prophetic words from Imashi (read-only, inserted via Supabase dashboard) |
| `diary_entries` | Imashi's personal diary |

All tables have RLS enabled with `USING (true)` policies — access is public. Privacy is enforced at the UI layer (e.g. prophetic requests show only the current session's entries to regular users; admin sees all).

## Admin panel

`src/screens/AdminScreen.tsx` — full-screen modal opened from `ProfileModal` when `isAdmin` is true. Three tabs: Prophetic (view all requests, write responses), Moderation (delete community posts), Stats (community_stats view). Never accessible to regular users — the button only renders when `useAuth().isAdmin` is true.

## PWA setup

`scripts/inject-pwa.js` runs post-build and writes `dist/manifest.json`, a minified `dist/sw.js`, and injects PWA meta tags into `dist/index.html`. `public/manifest.json` and `public/sw.js` are source references only — the dist versions are generated fresh on every build.

## Theme

Design tokens in `src/theme.ts`:
- `colors.background` `#FAF6F0` (warm cream), `colors.primary` `#B8722A` (brown), `colors.gold` `#C9973A`, `colors.parchment` `#F5ECD8`
- `fonts.heading` → PlayfairDisplay_700Bold, `fonts.body` → Nunito_400Regular, `fonts.bodyBold` → Nunito_700Bold

## Adding content

- **New prophetic flow or message:** insert a row via Supabase dashboard into `prophetic_flows` or `messages`
- **New community group:** insert into `groups` table
- **New song/album:** add entry to `src/data/music.ts`, place MP3 in `assets/music/`
- **Bible verse / lyrics:** add to `src/data/content.ts`

## Deployment

```bash
npx vercel deploy --prod --yes   # run from project root
```

Vercel project name: `dist` (under `imashiwes-projects`). Domain `app.unitedwithheaven.com` is permanently aliased to this project. Deployment Protection must stay **Disabled** or all visitors are blocked.

To set admin after a new user signs up:
```sql
UPDATE profiles SET is_admin = true WHERE email = 'imashiwe8@gmail.com';
```

To manually confirm a user's email:
```sql
UPDATE auth.users SET email_confirmed_at = NOW() WHERE email = 'imashiwe8@gmail.com';
```
