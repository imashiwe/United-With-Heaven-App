# CLAUDE.md

## Project

**United With Heaven** — Expo (React Native) spiritual ministry app for Imashi Wetakepotha.

## Commands

```bash
npx expo start          # start dev server (press w for web, a for Android)
npx expo start --web    # web only
npx expo export --platform web && vercel --prod --dir dist   # deploy to Vercel
```

## Architecture

```
App.tsx                    # entry point, font loading
src/
  navigation/AppNavigator.tsx   # bottom tab navigator (9 tabs)
  screens/                      # one file per screen
    HomeScreen.tsx
    SongsScreen.tsx             # music player + lyrics browser
    BibleScreen.tsx
    MessagesScreen.tsx
    PropheticScreen.tsx
    community/
      PrayerScreen.tsx
      TestimoniesScreen.tsx
      CommunityFeedScreen.tsx
    diary/DiaryScreen.tsx
  components/
    PhotoHeader.tsx             # reusable hero photo header
    FullscreenPhoto.tsx         # fullscreen image modal
    GradientBackground.tsx
  data/
    content.ts                  # static data: songs lyrics, bible verses, messages
    music.ts                    # albums and tracks (references assets/music/*.mp3)
  lib/
    supabase.ts                 # Supabase client
  theme.ts                      # colors, fonts, shadows
  images.ts                     # typed asset references
assets/
  images/                       # photos used as headers
  music/                        # MP3 files organised by album folder
```

## Theme

| Token | Value |
|---|---|
| Background | `#FAF6F0` (warm cream) |
| Primary | `#B8722A` (brown) |
| Primary Dark | darker brown for player bar |
| Gold Light | gold accent |
| Text Primary | near-black warm |
| Parchment | card backgrounds |

Fonts: `PlayfairDisplay_700Bold` / `PlayfairDisplay_400Regular` for headings, `Nunito_*` for body.
Defined in `src/theme.ts` as `fonts.heading`, `fonts.body`, `fonts.bodyBold`, `fonts.bodySemiBold`.

## Supabase Tables

- `messages` — inspirational messages
- `prayer_requests` — community prayer wall (has `prayed_count` column)
- `testimonies` — community testimonies with category
- `prophetic_flows` — prophetic words
- `diary_entries` — Imashi's personal diary

Row Level Security is enabled on all tables with public read, public insert policies.

## Music Data

Albums and tracks are defined statically in `src/data/music.ts`.
MP3 files live in `assets/music/` organised by album subfolder.
The `SongsScreen` renders all albums grouped with an in-app audio player (expo-av).

## Adding Content

- **New song/album:** add entry to `src/data/music.ts`, place MP3 in `assets/music/`
- **Lyrics:** add to `src/data/content.ts` songs array
- **Bible verse:** add to `src/data/content.ts` verses array
- **Messages / Prayer / Testimonies / Diary:** insert rows via Supabase dashboard

## Deployment

Web build deploys to Vercel. Run:
```bash
npx expo export --platform web
vercel --prod --dir dist
```

Read the exact versioned Expo docs at https://docs.expo.dev/versions/v56.0.0/ before writing any code.
