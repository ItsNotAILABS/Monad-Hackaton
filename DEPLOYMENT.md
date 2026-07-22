# Deployment Guide: MonadBuilder+ and THESIS Operations

This document covers deployment of both the **MonadBuilder+** (monad-builder) frontend and **THESIS Operations** (web + engine) stack.

## Current Deployment Status

### ✅ Frontend: MonadBuilder+ (Cloudflare Pages)
- **Project**: `monadbuilder`
- **Status**: ✅ Deployed and live
- **Preview Branch**: claude-video-demo-creation-j.monadbuilder.pages.dev
- **Deployment**: Automated via Cloudflare Git integration
- **Configuration**: `edge/wrangler.toml` with pre-deploy build step

### ✅ Frontend: THESIS Web (Cloudflare Pages)
- **Project**: Configured in `THESIS_PAGES_PROJECT` environment variable
- **Status**: ✅ Deployment workflow ready
- **Deployment**: Automated via GitHub Actions (`deploy-thesis-web.yml`)
- **API URL**: Set via `THESIS_API_URL` secret

### ⏳ Backend: THESIS Engine (Python FastAPI)
- **Current Location**: Replit (needs migration)
- **Status**: Ready for deployment
- **Options**: Render.com, Fly.io, Railway, or Docker host

## Backend Deployment Options

The Python FastAPI engine is containerized in `Dockerfile`. Choose one:

### Option 1: Render.com (Recommended for Free Tier)

**Prerequisites:**
- Render.com account: https://render.com
- GitHub repository connected to Render

**Steps:**
1. Go to https://dashboard.render.com/
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Set up the service:
   - Name: `monad-engine`
   - Environment: `Docker`
   - Build Command: (leave empty, uses Dockerfile)
   - Start Command: (leave empty, uses Dockerfile CMD)
   - Plan: `Free` (with auto-spindown)
5. Add environment variables:
   - `THESIS_CORS`: `*` (or your frontend origins)
   - Any additional secrets (RPC URLs, API keys)
6. Deploy

The engine will be available at: `https://monad-engine.onrender.com`

### Option 2: Fly.io

**Prerequisites:**
- Fly.io account: https://fly.io
- `flyctl` CLI installed

**Steps:**
```bash
brew install flyctl  # or your OS equivalent
flyctl auth login
flyctl launch --name monad-engine --region sjc  # or your preferred region
# Follow prompts, configure env vars
flyctl deploy
```

The engine will be available at: `https://monad-engine.fly.dev`

### Option 3: Railway

**Prerequisites:**
- Railway.app account: https://railway.app
- GitHub repository connected

**Steps:**
1. Go to https://railway.app/dashboard
2. Click "New Project" → "Deploy from GitHub"
3. Select this repository
4. Select `Dockerfile` as the build
5. Configure environment variables
6. Deploy

### Option 4: Docker Hub + Cloud Run / ECS / Azure Container Instances

Push the Docker image to a registry and deploy to your preferred cloud provider.

## Configuration

### Environment Variables Required for Backend

- `THESIS_CORS`: CORS origins (e.g., `https://monados.medinatechlabs.net,https://your-frontend.pages.dev`)
- `PORT`: Default `8043` (Render/Railway auto-configure this)
- Any RPC URLs or API keys needed by the engine

### Updating Frontend API URLs

After deploying the backend:

1. **THESIS Web**: Update `THESIS_API_URL` secret in GitHub Actions
2. **MonadBuilder**: Update API endpoints in configuration

## Verification

After deployment, verify all services:

```bash
# Health check
curl https://your-backend-domain/health

# List engines
curl https://your-backend-domain/engines

# Platform status
curl https://your-backend-domain/platform
```

## Next Steps

1. Choose a backend deployment platform (Render, Fly, Railway, or Docker host)
2. Deploy the backend using the steps above
3. Update API URLs in GitHub Actions secrets
4. Verify all endpoints are responding
5. Test the full application flow

## Notes

- All frontends are configured for **production use** on Cloudflare Pages
- The Python backend deployment is independent and can be swapped anytime
- Use GitHub Actions secrets for sensitive configuration (API keys, RPC URLs)
- Monitor logs on your hosting platform for any runtime issues
