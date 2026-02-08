# NestAI Agent – Map-first AI home finder

An interactive map + side-panel UI that finds rentals or purchases via Dify/OpenAI, compares amenities, and chats with the user in context. Tabs keep Offers, Amenities, and Chat separate; the map always stays interactive.

---

## Table of contents
1) Quick start  
2) Environment variables  
3) How the app works (data flow)  
4) UI guide  
5) Voice & chat  
6) Dify/OpenAI integration details  
7) Companion plugin (if used)  
8) Scripts & tooling  
9) Troubleshooting

---

## 1) Quick start
Prereqs: Node 18+, npm.

```sh
git clone <repo>
cd home-scout-ai-ce7cddae
npm install
cp .env.example .env     # or .env.local
```

Update `.env` (see next section), then:
```sh
npm run dev        # start Vite dev server
npm run build      # production build
npm run preview    # preview the build
```

---

## 2) Environment variables
| Key | Required | Description |
| --- | --- | --- |
| `VITE_DIFY_API_KEY` | Yes | Dify API key used by the frontend for all AI calls. |
| `VITE_DIFY_MODE` | Optional (`workflow` \| `chat`, default `workflow`) | Matches your Dify app type. |
| `VITE_DIFY_ENDPOINT` | Optional | Override endpoint; defaults to Dify’s standard URL based on mode. |

*Keep keys client-safe only if you trust the environment; this app calls Dify from the browser.*

---

## 3) How the app works (data flow)

```mermaid
graph TD
  UI[User UI (Map + Tabs)] -->|search/chat| DIFY[useDify hook]
  DIFY -->|POST lat/lng/radius/transaction_type| API[Dify API]
  API -->|offers & amenities| DIFY
  DIFY -->|normalize + distance filter| STORE[Zustand store]
  STORE --> MAP[Leaflet map markers]
  STORE --> OFFERS[Offers tab]
  STORE --> AMENITIES[Amenities tab]
  STORE --> CHAT[Chat tab history]
```
Key points:
- Radius filtering happens client-side; if nothing is inside the radius, the UI shows nearest results and informs the user.
- Listings carry `distance`, `amenities`, and `closest_amenity_ids` so the map and details panel stay in sync.

---

## 4) UI guide
- **Map (always visible):** shows search center with radius circle; markers for listings and highlighted amenities when an offer is selected.
- **Side panel tabs:**
  - **Offers:** ranked listings with scores, badges, price, quick chips, and a details panel (photos, summary, pros/cons, nearby amenities).
  - **Amenities:** categorized nearby points (groceries, parks, schools, transit, healthcare, fitness).
  - **Chat:** full conversation with NestAI plus input bar.
- **Panel toggle:** bottom-right handle shows/hides the side panel; map remains interactive.
- **Details view:** shows listing info, amenities by category with distances, and quick link to open the original listing.

---

## 5) Voice & chat
- Voice capture is available via the mic button (see `src/hooks/useVoice.ts`). Hold to speak; on release, the transcript is sent as a chat message.
- Chat input lives in the Chat tab; quick chips appear in Offers for fast refinements.

---

## 6) Dify/OpenAI integration details
- Core hook: `src/hooks/useDify.ts`
  - Builds payload with `latitude`, `longitude`, `radius`, `transaction_type` (rent=1, buy=0), and the user prompt.
  - Reads `VITE_DIFY_API_KEY`, `VITE_DIFY_MODE`, `VITE_DIFY_ENDPOINT`.
  - Normalizes offers/amenities, computes distances, filters by radius, and gracefully falls back to “nearest matches” if none are inside the radius.
  - Accepts `llm_out.agent_summary` as assistant text when Dify returns that shape.
- State: `src/store/appStore.ts` (Zustand) holds location, listings, amenities, messages, active tab, etc.
- Types: `src/types/index.ts` (offers, amenities, listing shape, distance helpers).

---

## 7) Companion plugin (if used)
If you use the companion browser/plugin, point it to the same backend/URL and reuse your Dify key. Keep its README aligned with these env keys and payloads. (No plugin code lives in this repo.)

---

## 8) Scripts & tooling
- `npm run dev` – start dev server
- `npm run build` – production build
- `npm run preview` – serve built assets locally
- `npm run lint` – lint via eslint

Tech stack: Vite, React, TypeScript, Tailwind + shadcn/ui, Zustand, React Query, Framer Motion, Leaflet, SWC.

---

## 9) Troubleshooting
- **Nothing shows up:** verify `VITE_DIFY_API_KEY` and mode/endpoint; check browser console for `[Dify]` logs.
- **Results outside radius:** client now falls back to nearest matches only if radius is empty; otherwise only in-radius listings render.
- **Voice not working:** ensure mic permissions; fallback to typing in Chat tab.

Enjoy exploring neighborhoods with NestAI Agent!
