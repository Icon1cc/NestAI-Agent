# Home Scout AI — Setup & Usage

## Prerequisites
- Node 18+ and npm
- A Dify API key (for live AI results)

## Getting Started
```sh
npm install
cp .env.example .env.local   # or .env
```
Edit `.env.local` and set:
```
VITE_DIFY_API_KEY=your-dify-api-key
# Optional if you use a custom endpoint:
# VITE_DIFY_ENDPOINT=https://api.dify.ai/v1/workflows/run
```

Run the app:
```sh
npm run dev
```

## Dify Integration (how it works)
- Frontend calls `src/hooks/useDify.ts`.
- It reads `VITE_DIFY_API_KEY` and `VITE_DIFY_ENDPOINT` from env.
- Requests go directly to Dify with `Authorization: Bearer <key>`.
- If the key/endpoint is missing or fails, the UI will surface an error instead of loading mock data.

## Language Support
- Languages available: English (EN), Français (FR), Deutsch (DE).
- Change language in Settings; it’s applied when you click “Done”.
- `document.documentElement.lang` is set for accessibility/SEO.

## Panel & UI Notes
- Right-hand panel can be shown/hidden via the bottom-right toggle on the panel area.
- Map fills the screen when the panel is hidden.

## Tech Stack
- Vite + React + TypeScript
- Tailwind + shadcn/ui
- Zustand state, React Query, Framer Motion, Leaflet

## Quick Scripts
- `npm run dev` – start local dev server
- `npm run build` – production build
- `npm run preview` – preview production build
- `npm run lint` – linting
