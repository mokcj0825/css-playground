# Multi-app monorepo

This repository contains three sub-projects running on separate ports.

- Result (frontend) - React + Vite + TS - http://localhost:5173
- Control Panel (frontend) - React + Vite + TS - http://localhost:5174
- Middleware (backend) - Express + CORS - http://localhost:4000

## Getting Started

### 1) Install dependencies

- In `result/`:
  - npm install
- In `control-panel/`:
  - npm install
- In `middleware/`:
  - npm install

### 2) Run apps

- Result: `cd result && npm run dev`
- Control Panel: `cd control-panel && npm run dev`
- Middleware: `cd middleware && npm run dev`

### 3) Health check

- Visit `http://localhost:4000/health` to verify Middleware is running.

## Notes

- Dev ports are fixed to avoid conflicts: 5173, 5174, 4000.
- CORS in Middleware allows both frontend origins.
