# Antibacterial Generation and Resistance Prediction Platform

Minimal **red-themed** full-stack app: **Next.js 14 (App Router)** + **FastAPI** + **SQLite**.

## 1) Final folder structure (top level)

```
newha/
├── README.md
├── .env.example
├── data/
│   └── samples_template.csv
├── backend/
│   ├── main.py                 # uvicorn entry: imports app from app.main
│   ├── requirements.txt
│   └── app/
│       ├── main.py
│       ├── config.py
│       ├── api/routes/*.py
│       ├── db/
│       ├── models/
│       ├── services/
│       └── schemas/
└── frontend/
    ├── package.json
    └── src/
        ├── app/                # routes
        ├── components/
        ├── lib/
        └── types/
```

## Prerequisites

- Node.js **20+** (recommended)
- Python **3.10+** (tested with 3.12)

## Important working directories

- Run frontend commands from: `frontend/`
- Run backend commands from: `backend/`
- Do **not** run `npm` commands from repo root (there is no root `package.json`)

## 2) Frontend install

```bash
cd frontend
npm install
cp ../.env.example .env.local
```

## 3) Backend install

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## 4) Frontend run

```bash
cd frontend
npm run dev
```

Frontend dev URL: `http://127.0.0.1:3000` (may auto-switch to `3001`, `3002`, ... if busy).

## 5) Backend run

```bash
cd /path/to/project/backend
source .venv/bin/activate
uvicorn main:app --reload --port 8002
```

Backend URL: `http://127.0.0.1:8002`  
Backend docs URL: `http://127.0.0.1:8002/docs`

## 6) Database initialization

- SQLite file is created automatically: `backend/app.db`
- Tables are created on startup (`init_db()`).
- If you change models and SQLite errors appear, **delete** `backend/app.db` and restart the API.
- Optional seed runs on startup when the DB is empty.

## 7) How frontend connects to backend

- `frontend/src/lib/api.ts` reads `NEXT_PUBLIC_API_URL` only.
- Default local setting in this repo is `http://127.0.0.1:8002` (`.env.example` and `frontend/.env.local`).
- CORS allows localhost loopback on `3xxx` frontend ports (`3000`, `3001`, `3002`, ...).

## Common local issues

- **`npm ERR! enoent ... /newha/package.json`**  
  You ran npm from root. Move to `frontend/`.
- **`Address already in use` on backend**  
  Check used ports first:
  - `lsof -i :8000`
  - `lsof -i :8001`
  - `lsof -i :8002`
  Then pick a free port and update `frontend/.env.local`.
- **Frontend cannot reach API**  
  Confirm `NEXT_PUBLIC_API_URL` in `frontend/.env.local`, then restart Next dev server.
- **Import path confusion (`frontend/lib/api.ts` vs `frontend/src/lib/api.ts`)**  
  Canonical file is `frontend/src/lib/api.ts`; compatibility re-export exists at `frontend/lib/api.ts`.

## 8) Where to change colors / layout

- **Colors / theme tokens:** `frontend/tailwind.config.ts`, `frontend/src/app/globals.css`
- **Shell / header / nav:** `frontend/src/components/layout/*`
- **Dashboard blocks:** `frontend/src/components/*` and `DashboardContent.tsx`

## 9) Where to replace simple prediction logic with real AI

- **Backend rules today:** `backend/app/services/prediction_service.py`
- **API entry point:** `backend/app/api/routes/predict.py` (swap call to your model loader)
- **Persist outputs:** already stored in `predictions` table via SQLAlchemy

## Sample upload

Use `data/samples_template.csv` on `/data`.

## Exact local startup commands

Backend:

```bash
cd /path/to/project/backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8002
```

Frontend:

```bash
cd /path/to/project/frontend
npm install
npm run dev
```

Frontend URL: `http://127.0.0.1:3000` (Next.js may auto-switch to `3001`, `3002`, ... if busy).
