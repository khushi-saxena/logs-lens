# LogLens

LogLens is a full-stack app that analyzes raw logs using AI and returns a structured incident report.
It streams the model output in real time, stores each analysis in PostgreSQL, and lets you revisit past analyses from a history panel.

## What it does

- Paste logs into the frontend.
- Start analysis from the API.
- Stream AI output over WebSocket.
- Save structured results (root cause, error chain, affected services, severity, suggested fix).
- Browse and reopen previous analyses.

## Tech stack

- Frontend: React + TypeScript + Vite + Tailwind CSS
- Backend: FastAPI + SQLAlchemy (async) + Uvicorn
- Database: PostgreSQL
- AI: OpenAI Chat Completions API
- Container setup: Docker + Docker Compose

## Project structure

```text
logs-lens/
  backend/
    main.py
    database.py
    models.py
    routes/
      analyze.py
      history.py
    services/
      openai_service.py
  frontend/
    src/
      App.tsx
      components/
      hooks/
  docker-compose.yml
  .env.example
```

## Environment variables

Create a `.env` file in the project root using `.env.example` as reference:

```env
OPENAI_API_KEY=your_openai_api_key
DATABASE_URL=postgresql://loglensuser:loglenspass@postgres:5432/loglens
POSTGRES_USER=loglensuser
POSTGRES_PASSWORD=loglenspass
POSTGRES_DB=loglens
```

Notes:
- `OPENAI_API_KEY` is required for analysis.
- In Docker, `DATABASE_URL` should point to `postgres` host.
- If running backend locally, use `localhost` in `DATABASE_URL`.

## Run with Docker (recommended)

1. Copy env file:
   - `cp .env.example .env`
2. Add your `OPENAI_API_KEY` in `.env`.
3. Build and start:
   - `docker compose up --build`
4. Open app:
   - Frontend: `http://localhost:5173`
   - Backend health: `http://localhost:8000/health`

## Run locally (without Docker)

### 1) Start PostgreSQL

Run a local PostgreSQL instance and create DB/user matching your env values.

### 2) Start backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export OPENAI_API_KEY=your_openai_api_key
export DATABASE_URL=postgresql://loglensuser:loglenspass@localhost:5432/loglens
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 3) Start frontend

```bash
cd frontend
npm install
export VITE_API_BASE_URL=http://localhost:8000
export VITE_WS_BASE_URL=ws://localhost:8000
npm run dev
```

Open `http://localhost:5173`.

## API endpoints

- `GET /health` - health check
- `POST /api/analyze` - create a new analysis job
  - body: `{ "log_text": "..." }`
  - response: `{ "analysis_id": "<uuid>" }`
- `WS /ws/analyze/{analysis_id}` - stream tokens and receive final structured analysis
- `GET /api/history` - list all past analyses
- `GET /api/history/{analysis_id}` - get full details of one analysis

## How analysis flow works

1. Frontend sends log text to `POST /api/analyze`.
2. Backend creates a DB row and returns `analysis_id`.
3. Frontend opens WebSocket `/ws/analyze/{analysis_id}`.
4. Backend streams model tokens to frontend.
5. Backend parses final response into sections.
6. Structured output is saved in PostgreSQL and returned as `complete` message.
7. Frontend refreshes history and displays the result.

## Current limitations

- Uses `gpt-3.5-turbo` in backend service by default.
- CORS is currently open to all origins.
- No authentication yet.
- No automated tests included yet.

## License

No license file is currently included.
