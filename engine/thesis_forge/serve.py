"""Single-origin production entrypoint for MonadBuilder HQ.

This module keeps every existing FastAPI route and, when ``web/dist`` exists,
serves the compiled React application from the same process and origin.
That makes custom-domain and Replit deployments deterministic: browser calls
``/health`` and every other API route without localhost or CORS assumptions.

The deployed product shell historically probes ``