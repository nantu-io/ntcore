#! /usr/bin/env sh

# Execute python script to download and deserialize model
python3 /usr/local/bin/main.py

# Set env required for the base tensorflow/serving container
export MODEL_NAME=${DSP_WORKSPACE_ID}

exec "$@"