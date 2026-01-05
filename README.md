# Neuroverse

A privacy-first mental health monitoring web app with journaling, AI emotion analysis, chatbot, relaxation tools, and music therapy.

## Stack
- Client: React (Vite) + Tailwind CSS + Framer Motion + Recharts
- Server: Node.js (Express) + MongoDB + JWT
- AI: FastAPI (Python) + Transformers

## Project Structure
- /client — React frontend
- /server — Node.js backend
- /ai — FastAPI microservice

## Quickstart
1) Server
- Copy .env.example to .env in /server and fill values
- Install: npm install
- Run dev: npm run dev

2) AI Service
- Create venv
- pip install -r requirements.txt
- uvicorn main:app --reload --port 8001

3) Client
- Copy .env.example to .env in /client and fill values
- npm install
- npm run dev

## Environment Variables
See .env.example at root and per service.

## Privacy
- Journals stored encrypted at rest (AES-256-GCM)
- JWT auth
- Consent recorded on first login
- Full account deletion supported

## License
MIT
