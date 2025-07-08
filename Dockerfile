# Multi-stage Dockerfile for LiveKit Voice Agent with API Gateway
FROM python:3.11-slim as builder

# Install build dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements first for better caching
COPY agent/requirements.txt ./requirements-agent.txt
COPY requirements-api.txt ./requirements-api.txt

# Create a combined requirements file
RUN cat requirements-agent.txt requirements-api.txt > requirements.txt

# Install Python dependencies
RUN pip install --no-cache-dir --user -r requirements.txt

# Production stage
FROM python:3.11-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -u 1000 voiceagent

# Set working directory
WORKDIR /app

# Copy installed packages from builder
COPY --from=builder /root/.local /home/voiceagent/.local

# Copy application code
COPY agent/ ./agent/
COPY api_gateway.py .
COPY session_manager.py .
COPY widget/ ./widget/
COPY start.sh .

# Copy knowledge base files if they exist
COPY sample_knowledge.json* ./

# Create necessary directories
RUN mkdir -p chroma_db logs && \
    chown -R voiceagent:voiceagent /app

# Switch to non-root user
USER voiceagent

# Add local bin to PATH
ENV PATH=/home/voiceagent/.local/bin:$PATH

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app:$PYTHONPATH

# Expose port (Railway will override with PORT env var)
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD python -c "import requests; requests.get('http://localhost:${PORT:-8000}/health')"

# Start the API Gateway
CMD ["./start.sh"]