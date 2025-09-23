# CSS Playground - Multi-app Monorepo

This repository contains three sub-projects running on separate ports:

- **Result** (frontend) - React + Vite + TypeScript - http://localhost:5173
- **Control Panel** (frontend) - React + Vite + TypeScript - http://localhost:5174  
- **Middleware** (backend) - Express + CORS - http://localhost:4000

## Quick Start

### Option 1: Run All Apps Together (Recommended)

Open three terminal windows and run these commands simultaneously:

```bash
# Terminal 1 - Middleware (backend)
cd middleware && npm run dev

# Terminal 2 - Control Panel (frontend)
cd control-panel && npm run dev

# Terminal 3 - Result (frontend)
cd result && npm run dev
```

### Option 2: Using npm scripts (if available)

If you have npm scripts set up in the root package.json:

```bash
# Install all dependencies
npm run install:all

# Run all apps in development mode
npm run dev:all
```

### Option 3: One-liner Commands

```bash
# Install dependencies for all repos
npm install && cd control-panel && npm install && cd ../middleware && npm install && cd ../result && npm install

# Run all three apps (requires 3 terminal windows)
# Terminal 1:
cd middleware && npm run dev

# Terminal 2: 
cd control-panel && npm run dev

# Terminal 3:
cd result && npm run dev
```

## Detailed Setup

### 1. Install Dependencies

Install dependencies for each sub-project:

```bash
# Install for Result
cd result && npm install

# Install for Control Panel  
cd control-panel && npm install

# Install for Middleware
cd middleware && npm install
```

### 2. Development Commands

Each sub-project has its own development server:

```bash
# Result (Frontend) - Port 5173
cd result && npm run dev

# Control Panel (Frontend) - Port 5174
cd control-panel && npm run dev

# Middleware (Backend) - Port 4000
cd middleware && npm run dev
```

### 3. Build Commands

```bash
# Build Result
cd result && npm run build

# Build Control Panel
cd control-panel && npm run build

# Middleware (no build step)
cd middleware && npm run build
```

## Health Checks

- **Middleware**: Visit http://localhost:4000/health
- **Result**: Visit http://localhost:5173
- **Control Panel**: Visit http://localhost:5174

## Development Tips

### Running in Background (macOS/Linux)

```bash
# Start all services in background
cd middleware && npm run dev &
cd control-panel && npm run dev &
cd result && npm run dev &

# To stop all background processes
pkill -f "npm run dev"
```

### Using tmux (Advanced)

```bash
# Create a new tmux session
tmux new-session -d -s css-playground

# Split into 3 panes and run each service
tmux split-window -h
tmux split-window -v
tmux select-pane -t 0
tmux send-keys 'cd middleware && npm run dev' Enter
tmux select-pane -t 1  
tmux send-keys 'cd control-panel && npm run dev' Enter
tmux select-pane -t 2
tmux send-keys 'cd result && npm run dev' Enter

# Attach to session
tmux attach-session -t css-playground
```

## Port Configuration

- **Result**: 5173 (Vite default)
- **Control Panel**: 5174 (custom port)
- **Middleware**: 4000 (Express server)

## Notes

- Dev ports are fixed to avoid conflicts
- CORS is configured in Middleware to allow both frontend origins
- All projects use modern ES modules (type: "module")
- Hot reloading is enabled for both frontend applications
