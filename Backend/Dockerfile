FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies including redis-server
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    postgresql-client \
    redis-server \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies with optimizations for Railway
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Make entrypoint.sh executable
RUN chmod +x entrypoint.sh

# Create directories for logs and data
RUN mkdir -p /app/logs /app/cache /app/output /app/uploads /app/recordings

# Create non-root user for security (Railway compatible)
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Expose port (Railway will set PORT env var)
EXPOSE $PORT

# Health check (handles dynamic PORT environment variable)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import os, requests; port=os.getenv('PORT', '8000'); requests.get(f'http://localhost:{port}/health')" || exit 1

# Run application via entrypoint script
CMD ["/app/entrypoint.sh"]
