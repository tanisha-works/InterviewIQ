# InterviewIQ

A responsive AI interview-practice frontend built with React, Vite, Tailwind CSS, React Router, Framer Motion, Recharts, and Lucide.

## Getting started

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. Run `npm run build` to create the production bundle.

## API integration

Authentication, resume upload, interview sessions, interview history, and reports use the FastAPI backend. By default, Vite proxies frontend requests from `/api` to `http://localhost:8000` and strips the `/api` prefix. The proxy also adjusts the refresh-cookie path so cookie-based authentication works with the proxied routes.

To call the backend directly instead, copy `.env.example` to `.env` and set `VITE_API_URL` to the backend origin (without an `/api` suffix), for example:

```env
VITE_API_URL=http://localhost:8000
```

For direct requests, the backend must allow the frontend's origin in `CORS_ORIGINS` and use `AUTH_COOKIE_PATH=/auth`. Separate multiple allowed origins with commas. For local `SameSite=Strict` refresh cookies, use `localhost` consistently for both frontend and API. The resume endpoint accepts PDF files only.

Start the backend from the `backend` directory after configuring `backend/.env` and applying database migrations:

```powershell
python -m alembic upgrade head
python -m uvicorn app.main:app --reload
```

Then start the frontend from the `frontend` directory with `npm run dev`.

The service modules in `src/services/` define the current auth, resume, interview, report, and profile integration points. Profile photos can be changed from the profile page; JPEG, PNG, and WebP uploads are limited to 2 MB and are stored with the authenticated account.

## Included routes

- `/` — product landing page
- `/login` and `/signup` — validated authentication UI
- `/dashboard` — interview stats, performance charts, and activity
- `/resume` — resume upload, mock analysis, and target role selection
- `/setup` — interview configuration
- `/room` — voice-recording interview experience with demo mode
- `/report` — performance insights and recommendations
- `/history` — searchable/filterable interview history
- `/profile` — profile, preferences, privacy, and appearance settings
