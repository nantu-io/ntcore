FROM pytorch/pytorch

# Install required dependencies
COPY requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt

# Install curl for health check.
RUN apt update && \
    apt install -y curl

# Copy app to the target destination
COPY ./app /app

# Go to app directory.
WORKDIR /app

# Add flask health check
HEALTHCHECK --interval=5s --timeout=5m \
    CMD curl -f http://localhost:80/health || exit 1

# Start uvicorn server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "80"]