# Stage 1: Build React Frontend
FROM node:18-bullseye-slim AS frontend-builder
WORKDIR /app/frontend
COPY server/frontend/package*.json ./
RUN npm install
COPY server/frontend/ ./
RUN npm run build

# Stage 2: Python Backend with Gunicorn
FROM python:3.10-slim-bullseye
WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000

COPY server/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir gunicorn flask nltk && \
    python -c "import nltk; nltk.download('vader_lexicon')"

COPY server/ ./server/
COPY --from=frontend-builder /app/frontend/build ./server/frontend/build

WORKDIR /app/server
RUN python manage.py makemigrations djangoapp && \
    python manage.py migrate && \
    python manage.py collectstatic --noinput && \
    python -c "import os, django; os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'djangoproj.settings'); import sys; sys.path.insert(0, '.'); django.setup(); from djangoapp.populate import initiate; initiate()"

EXPOSE 8000

CMD ["sh", "-c", "gunicorn djangoproj.wsgi:application --bind 0.0.0.0:${PORT:-8000}"]
