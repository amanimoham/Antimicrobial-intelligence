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
./.venv/bin/python -m uvicorn main:app --host 0.0.0.0 --port 8010 --reload
```

Backend URL: `http://127.0.0.1:8010`  
Backend docs URL: `http://127.0.0.1:8010/docs`

## 6) Database initialization

- SQLite file is created automatically: `backend/app.db`
- Tables are created on startup (`init_db()`).
- If you change models and SQLite errors appear, **delete** `backend/app.db` and restart the API.
- Optional seed runs on startup when the DB is empty.

## 7) How frontend connects to backend

- `frontend/src/lib/api.ts` reads `NEXT_PUBLIC_API_URL` only.
- Default local setting in this repo is `http://127.0.0.1:8010` (`.env.example` and `frontend/.env.local`).
- CORS allows localhost loopback on `3xxx` frontend ports (`3000`, `3001`, `3002`, ...).

## Common local issues

- **`npm ERR! enoent ... /newha/package.json`**  
  You ran npm from root. Move to `frontend/`.
- **`Address already in use` on backend**  
  Check used ports first:
  - `lsof -i :8000`
  - `lsof -i :8001`
  - `lsof -i :8002`
  - `lsof -i :8003`
  - `lsof -i :8010`
  To kill a blocking process:
  - `kill -9 PID`
  - `lsof -ti :8010 | xargs -r kill -9`
  Then start backend on `8010` and keep `frontend/.env.local` in sync.
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

## ML training pipeline (new)

The backend now supports a trainable ML pipeline (activity/mic/regression + resistance classification):

- `POST /api/train/models` — train and persist artifacts
- `POST /api/train/models?replace_artifacts=true` — delete stale `trained_models.joblib` / metrics / report, then train (use after numpy/sklearn upgrades)
- `DELETE /api/train/artifacts` — remove artifact files only (retrain afterward)
- `GET /api/train/metrics` — latest MAE/RMSE/R2 and Accuracy/F1/ROC-AUC
- `POST /api/predict` — uses trained model artifacts when available; returns **503** with a clear message if artifacts are missing or incompatible

### Incompatible model artifacts (e.g. `numpy: trained=1.26.4 current=2.1.3`)

Artifacts under `backend/artifacts/` record the numpy/sklearn versions used at train time. If you see a mismatch error on predict, retrain **in the same venv** you use to run the API:

```bash
cd backend
source .venv/bin/activate
curl -X POST "http://127.0.0.1:8010/api/train/models?replace_artifacts=true"
```

Requires at least **20** rows in `ingestion_records` (upload data first). CLI alternative:

```bash
cd backend
source .venv/bin/activate
./.venv/bin/python train.py --dataset ../training_dataset_large.csv --clean-artifacts
```

Training command example:

```bash
curl -X POST http://127.0.0.1:8010/api/train/models
curl http://127.0.0.1:8010/api/train/metrics
```

Expected upload schema (canonical, aliases are accepted):

- `sample_id` (required)
- `sample_type`
- `pathogen`
- `source`
- `date`
- `value`
- `compound_code`
- `compound_name`
- `smiles`
- `molecular_weight`
- `logp`
- `toxicity_score`
- `synthesizability_score`

Model artifacts are saved under `backend/artifacts/`.

## Exact local startup commands

Backend:

```bash
cd /path/to/project/backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
./.venv/bin/python -m uvicorn main:app --host 0.0.0.0 --port 8010 --reload
```

Frontend:

```bash
cd /path/to/project/frontend
npm install
npm run dev
```

Frontend URL: `http://127.0.0.1:3000` (Next.js may auto-switch to `3001`, `3002`, ... if busy).

## Local run script helpers

Backend:

```bash
cd /path/to/project/backend
./run_backend.sh
```

Frontend:

```bash
cd /path/to/project/frontend
./run_frontend.sh
```
# Antimicrobial-intelligence
# Antimicrobial-intelligence
# Antimicrobial-intelligence

## Frontend deployment (Vercel)

### 1) Push project to GitHub

```bash
cd /home/amani/Desktop/newha
git add .
git commit -m "prepare frontend for vercel deployment"
git push -u origin main
```

### 2) Import into Vercel

- In Vercel: **Add New Project** -> import `amanimoham/Antimicrobial-intelligence`.
- Set **Root Directory** to `frontend`.

### 3) Vercel build settings

- Framework Preset: `Next.js`
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: leave empty/default.

### 4) Required Vercel environment variable

- `NEXT_PUBLIC_API_URL` = your production backend base URL.
  - Example: `https://my-backend.onrender.com`
  - Never use localhost in production.

### 5) Redeploy after changes

- Push new commits to `main`, Vercel auto-deploys.
- Or click **Redeploy** from latest deployment in Vercel dashboard.

### 6) Remaining issues to watch

- Ensure backend allows CORS from your Vercel frontend domain.
- Ensure backend URL used in `NEXT_PUBLIC_API_URL` is publicly reachable over HTTPS.

## Backend deployment (Render)

Use `render.yaml` in this repo, or configure manually:

- Root Directory: `backend`
- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Health Check Path: `/api/health`

Required Render environment variables:

- `DATABASE_URL` (Render Postgres URL; SQLAlchemy format supported)
- `CORS_ORIGINS` (comma-separated frontend domains, e.g. `https://your-frontend.vercel.app`)
- Optional `CORS_ORIGIN_REGEX` (default allows local `localhost/127.0.0.1` dev ports)
# hack
