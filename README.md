# Honey Farm

A Django + React project split into a clean monorepo structure.

## Project structure

```text
honey-farm/
├── .github/
├── backend/
│   ├── config/
│   ├── shop/
│   ├── manage.py
│   ├── requirements.txt
│   ├── media/
│   └── staticfiles/
├── docs/
│   ├── postman/
│   └── .postman/
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   └── firebase.json
├── .gitignore
├── README.md
└── .venv/   # local environment (not committed)
```

## Run the app

The start scripts run the backend and frontend together by default. They use the
local environment unless you specify `production`.

### Prerequisites

- Python and the backend dependencies from `backend/requirements.txt`
- Bun or Node.js/npm for the frontend
- Environment files for each service:
  - `backend/.env/env.local` and `frontend/.env/env.local`
  - `backend/.env/env.production` and `frontend/.env/env.production`

Install dependencies if needed:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
cd frontend
bun install
# Or use: npm install
cd ..
```

On Windows, create the backend virtual environment with `py -m venv .venv`,
activate it with `.venv\Scripts\activate`, and install the requirements with
`pip install -r backend\requirements.txt`.

### Linux and macOS

```bash
./start.sh                 # Local environment; start backend and frontend
./start.sh production      # Production environment; start both
./start.sh backend         # Local backend only
./start.sh production frontend
```

### Windows

```bat
start.bat                  REM Local environment; start backend and frontend
start.bat production       REM Production environment; start both
start.bat backend          REM Local backend only
start.bat production frontend
```

The environment can also follow the service selector, for example
`./start.sh frontend production` or `start.bat backend production`.
Supported service selectors are `backend`/`api`, `frontend`/`web`, and `both`.

The backend reads its settings from the selected file under
`backend/.env/`. The frontend reads its `VITE_*` settings from the selected
file under `frontend/.env/`. The scripts do not copy or overwrite these files.
For example, local mode uses `env.local`; production mode uses `env.production`.

Before the first backend run, apply database migrations from the repository
root:

```bash
# Linux/macOS
DJANGO_ENV=local .venv/bin/python backend/manage.py migrate

# Windows Command Prompt
set DJANGO_ENV=local
.venv\Scripts\python.exe backend\manage.py migrate
```

To migrate the production database instead, use `production` in place of
`local`; ensure its database and other production settings are configured first.
The start scripts launch Django's development server and Vite's development
server; use an appropriate production application server and frontend build for
deployment.

## Notes

- The Django backend is isolated under `backend/`.
- The React frontend remains under `frontend/`.
- API and Postman assets live under `docs/`.
