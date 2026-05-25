FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install minimal system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Copy requirements first for better caching
COPY requirements.txt .

# Install only essential Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir \
    fastapi==0.104.1 \
    uvicorn==0.24.0 \
    python-multipart==0.0.6 \
    starlette==0.27.0 \
    asyncpg==0.29.0 \
    pydantic-settings==2.1.0 \
    python-dotenv==1.0.0 \
    requests==2.31.0 \
    python-jose[cryptography]==3.3.0 \
    passlib[bcrypt]==1.7.4 \
    firebase-admin==7.4.0

# Copy application code
COPY . .

# Make entrypoint.sh executable
RUN chmod +x entrypoint.sh

# Create minimal directories
RUN mkdir -p /app/logs /app/cache

# Create non-root user for security
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE $PORT

# Minimal health check
HEALTHCHECK --interval=120s --timeout=30s --start-period=30s --retries=2 \
    CMD curl -f http://localhost:${PORT:-8000}/health || exit 1

# Run application
CMD ["./entrypoint.sh"]
