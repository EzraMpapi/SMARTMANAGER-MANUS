FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /workspace
RUN pip install --no-cache-dir "psycopg[binary]>=3.2,<4"

COPY scripts/standing_order_webhook_multiprocess_load_test.py /workspace/scripts/standing_order_webhook_multiprocess_load_test.py
COPY scripts/pg_lock_staging/instance_entrypoint.py /workspace/scripts/pg_lock_staging/instance_entrypoint.py

ENTRYPOINT ["python", "/workspace/scripts/pg_lock_staging/instance_entrypoint.py"]
