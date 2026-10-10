#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

usage() {
    echo "Usage: ./start.sh [local|production] [backend|api|frontend|web|both]" >&2
    echo "       ./start.sh [backend|api|frontend|web|both] [local|production]" >&2
}

if [[ $# -gt 2 ]]; then
    usage
    exit 2
fi

ENVIRONMENT="local"
MODE="both"

case "${1:-}" in
    local|production)
        ENVIRONMENT="$1"
        MODE="${2:-both}"
        ;;
    backend|api|frontend|web|both)
        MODE="$1"
        ENVIRONMENT="${2:-local}"
        ;;
    "")
        ;;
    *)
        usage
        exit 2
        ;;
esac

case "$ENVIRONMENT" in
    local|production) ;;
    *)
        usage
        exit 2
        ;;
esac

case "$MODE" in
    backend|api|frontend|web|both) ;;
    *)
        usage
        exit 2
        ;;
esac

if [[ "$MODE" == backend || "$MODE" == api || "$MODE" == both ]]; then
    BACKEND_ENV="$ROOT_DIR/backend/.env/env.$ENVIRONMENT"
    if [[ ! -f "$BACKEND_ENV" ]]; then
        echo "Error: Backend environment file not found: $BACKEND_ENV" >&2
        exit 1
    fi
fi

if [[ "$MODE" == frontend || "$MODE" == web || "$MODE" == both ]]; then
    FRONTEND_ENV="$ROOT_DIR/frontend/.env/env.$ENVIRONMENT"
    if [[ ! -f "$FRONTEND_ENV" ]]; then
        echo "Error: Frontend environment file not found: $FRONTEND_ENV" >&2
        exit 1
    fi
fi

start_backend() {
    if [[ -x "$ROOT_DIR/.venv/bin/python" ]]; then
        PYTHON="$ROOT_DIR/.venv/bin/python"
    elif command -v python3 >/dev/null 2>&1; then
        PYTHON="$(command -v python3)"
    elif command -v python >/dev/null 2>&1; then
        PYTHON="$(command -v python)"
    else
        echo "Error: Python was not found. Install Python or create .venv/ first." >&2
        return 1
    fi

    cd "$ROOT_DIR/backend"
    DJANGO_ENV="$ENVIRONMENT" "$PYTHON" manage.py runserver 0.0.0.0:8000
}

start_frontend() {
    cd "$ROOT_DIR/frontend"
    VITE_MODE="$ENVIRONMENT"
    if [[ "$VITE_MODE" == local ]]; then
        VITE_MODE="development"
    fi

    if command -v bun >/dev/null 2>&1; then
        bun run dev -- --mode "$VITE_MODE"
    elif command -v npm >/dev/null 2>&1; then
        npm run dev -- --mode "$VITE_MODE"
    else
        echo "Error: Neither Bun nor npm was found." >&2
        return 1
    fi
}

case "$MODE" in
    backend|api)
        start_backend
        ;;
    frontend|web)
        start_frontend
        ;;
    both)
        start_backend &
        BACKEND_PID=$!
        start_frontend &
        FRONTEND_PID=$!

        cleanup() {
            kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
            wait "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
        }

        trap cleanup EXIT
        trap 'exit 130' INT
        trap 'exit 143' TERM
        wait -n "$BACKEND_PID" "$FRONTEND_PID"
        ;;
    *)
        usage
        exit 2
        ;;
esac