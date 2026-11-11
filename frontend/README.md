# InterviewIQ

A responsive AI interview-practice frontend built with React, Vite, Tailwind CSS, React Router, Framer Motion, Recharts, and Lucide.

## Getting started

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. Run `npm run build` to create the production bundle.

## API integration

Authentication, resume upload, interview sessions, interview history, and reports use the FastAPI backend. Copy `.env.example` to `.env` and set `VITE_API_URL` to the backend origin (without an `/api` suffix), for example:

```env
VITE_API_URL=http://localhost:8000
```

The backend must allow the frontend's origin in `CORS_ORIGINS`; separate multiple origins with commas. For local `SameSite=Strict` refresh cookies, use `localhost` consistently for both frontend and API. The resume endpoint accepts PDF files only.

The service modules in `src/services/` define the current auth, resume, interview, report, and profile integration points.

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
