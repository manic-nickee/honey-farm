#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

usage() {
    echo "Usage: ./start.sh [backend|api|frontend|web|both]" >&2
}

if [[ $# -gt 1 ]]; then
    usage
    exit 2
fi

MODE="${1:-both}"

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
    "$PYTHON" manage.py runserver 0.0.0.0:8000
}

start_frontend() {
    cd "$ROOT_DIR/frontend"
    if command -v bun >/dev/null 2>&1; then
        bun run dev
    elif command -v npm >/dev/null 2>&1; then
        npm run dev
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