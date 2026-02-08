# Dibby Dollars Frontend

React 18 + TypeScript + Vite + MUI. Student, Teacher, and Admin portals for the Dibby Dollars school reward banking app.

## Setup

```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local and set VITE_API_URL if the backend is not at http://localhost:5000
npm run dev
```

The app runs at `http://localhost:5173`. Ensure the [backend](../backend) is running so login and data work.

## Environment variables

| Variable        | Description              | Default (if unset)           |
|-----------------|--------------------------|------------------------------|
| `VITE_API_URL`  | Backend API base URL     | `http://localhost:5000/api`  |

Copy `.env.example` to `.env.local` (or `.env`) and set `VITE_API_URL` to your backend URL in production.

## Scripts

- `npm run dev` – Start dev server
- `npm run build` – Production build (output in `dist/`)
- `npm run preview` – Serve the production build locally
- `npm run test` – Run unit tests (Vitest)
- `npm run cypress:run` – Run E2E tests (requires dev server and backend)
- `npm run lint` – Run ESLint

## Deployment

- Build: `npm run build`.
- Serve the `dist/` folder with any static host (e.g. Nginx, Vercel, Netlify).
- Set `VITE_API_URL` at build time to your production API URL (e.g. in CI: `VITE_API_URL=https://api.example.com/api npm run build`).
