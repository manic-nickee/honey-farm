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

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Notes

- The Django backend is isolated under `backend/`.
- The React frontend remains under `frontend/`.
- API and Postman assets live under `docs/`.
