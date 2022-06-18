#! /usr/bin/env sh

if [ -z "${DSP_API_ENDPOINT}" ]; then
    echo "DSP_API_ENDPOINT not set."
    exit
fi
if [ -z "${DSP_WORKSPACE_ID}" ]; then
    echo "DSP_WORKSPACE_ID not set."
    exit
fi

# Execute python script to download and deserialize model
python3 /usr/local/bin/main.py

# Set env required for the base tensorflow/serving container
export MODEL_NAME=${DSP_WORKSPACE_ID}

exec "$@"