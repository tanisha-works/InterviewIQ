# InterviewIQ

A responsive AI interview-practice frontend built with React, Vite, Tailwind CSS, React Router, Framer Motion, Recharts, and Lucide.

## Getting started

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. Run `npm run build` to create the production bundle.

## API integration

The app runs with realistic local mock data by default. To enable the Axios-backed service endpoints, set `VITE_API_URL` in a local `.env` file, for example:

```env
VITE_API_URL=https://your-api.example.com
```

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
