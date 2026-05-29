# United With Heaven

A spiritual ministry app built with Expo (React Native) for Imashi Wetakepotha's community. Available as a web app and installable on Android & iOS.

**Live web app:** https://united-with-heaven.netlify.app

## Features

- **Home** — Hero photo, Verse of the Day, latest message, about the founder
- **Songs** — Music player with 8 albums (20 tracks) by Imashi Wetakepotha + lyrics browser
- **Bible Verses** — Themed scripture cards by category
- **Messages** — Inspirational messages from Supabase
- **Prayer Requests** — Community prayer wall with "I Prayed" counter
- **Testimonies** — Healing, Finances, Identity, Breakthrough, Guidance, General
- **Prophetic Flows** — Prophetic words from Supabase
- **Diary** — Imashi's personal walk with God entries

## Stack

- [Expo](https://expo.dev) ~56 + React Native 0.85
- TypeScript
- React Navigation (bottom tabs)
- Supabase (database + auth)
- expo-av (audio playback)
- expo-linear-gradient
- Playfair Display + Nunito (Google Fonts)

## Getting Started

```bash
npm install
npx expo start
```

Press `w` to open in browser, `a` for Android emulator, `i` for iOS simulator.

## Deploy (web)

```bash
npx expo export --platform web
vercel --prod --dir dist
```

## Environment

The app connects to Supabase for live data. The Supabase URL and anon key are configured in `src/lib/supabase.ts`.

## Design

- Background: warm cream/ivory `#FAF6F0`
- Primary: brown `#B8722A`
- Accents: gold
- Fonts: Playfair Display (headings) + Nunito (body)
