FROM node:20-alpine AS web-build
WORKDIR /app/web
COPY web/package*.json ./
RUN npm install
COPY web/ ./
RUN npm run build

FROM python:3.11-slim AS runtime
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8043
WORKDIR /app
COPY engine/ ./engine/
RUN python -m pip install --no-cache-dir ./engine
COPY --from=web-build /app/web/dist ./web/dist
EXPOSE 8043
CMD ["sh", "-c", "python -m uvicorn thesis_forge.serve:app --app-dir engine --host 0.0.0.0 --port ${PORT} --proxy-headers --forwarded-allow-ips='*'"]
