FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app
RUN apt-get update && \
    apt-get install --yes --no-install-recommends fonts-wqy-zenhei && \
    rm -rf /var/lib/apt/lists/*
RUN groupadd --system educhain && useradd --system --gid educhain --home-dir /app educhain
COPY pyproject.toml ./
COPY src ./src
RUN python -m pip install --no-cache-dir .
RUN mkdir -p /app/data && chown -R educhain:educhain /app

USER educhain
EXPOSE 8081
ENTRYPOINT ["uvicorn", "educhain_evidence.main:app", "--host", "0.0.0.0", "--port", "8081", "--no-access-log"]
