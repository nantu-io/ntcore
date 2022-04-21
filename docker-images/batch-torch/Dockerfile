FROM bitnami/pytorch

# Use root user
USER root

# Install git.
RUN apt-get -y update && apt-get -y install git

# Install required dependencies
COPY requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt

# Copy entrypoint script to target location
COPY docker-entrypoint.sh /usr/local/bin/

# Specify healthcheck command
HEALTHCHECK --interval=30s --timeout=5m CMD ls || exit 1

# Limit user permissions
USER 1001

# Specify entrypoint script
ENTRYPOINT [ "/usr/local/bin/docker-entrypoint.sh" ]