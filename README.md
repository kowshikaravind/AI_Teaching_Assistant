# Academic Performance Tracking System - Frontend

This frontend is the user-facing web application for the Academic Performance Tracking platform.

It provides role-based experiences for Students, Teachers, and Admins, connected to the Django API backend.

## Project Purpose

The UI is designed to support the complete academic monitoring workflow:
- Students can view performance, upcoming tests, AI guidance, and notifications
- Teachers can manage class-level student data and assessments
- Admins can approve/reject teacher requests and maintain admin credentials

## Main Portals and Flows

### Student Portal
- Dashboard summary
- My Performance (charts, subject trends, recent marks)
- Upcoming Tests (details, test interface, review)
- AI Tutor (context-aware chat and recommendations)
- Notifications
- Profile and password updates

### Teacher Portal
- Teacher login and registration request
- Class-scoped student access
- Test management and review utilities

### Admin Portal
- Admin login
- View pending and approved teacher requests
- Approve, reject, revoke teacher access
- Update admin credentials

## Frontend Architecture

- Framework: React + Vite
- Routing: React Router
- Visual analytics: Chart.js and Recharts
- API utilities:
	- Central backend host management in src/utils/backendUrls.js
	- Session-aware URL helpers in src/utils/studentSession.js and src/utils/teacherSession.js

## Project Structure

- src/components/ - Shared components and auth forms
- src/pages/ - Admin page modules
- src/Student/ - Student portal screens
- src/teacherPortal/ - Teacher dashboard screens
- src/utils/ - API/session/theme utilities

## Environment Setup

Create a .env file with:

VITE_API_BASE_URL=http://127.0.0.1:8000

For production, point this to deployed backend:

VITE_API_BASE_URL=https://your-backend.onrender.com

## Run and Build

Local development:
1. npm install
2. npm run dev

Production build:
1. npm run build
2. npm run preview

## Deployment

Recommended: Vercel

- Build command: npm run build
- Output directory: dist
- Environment variable: VITE_API_BASE_URL

The project includes vercel.json rewrite rules so client-side routes (example: /admin-login) resolve correctly in production.

## Integration Notes

Frontend and backend must be aligned for:
- CORS origins
- CSRF trusted origins
- Correct backend base URL

If API calls fail in browser but backend is running, verify:
1. VITE_API_BASE_URL is correct
2. Backend allows frontend origin in CORS/CSRF settings
3. Deployed frontend has latest environment variables
