#!/bin/bash

# Start ollama serve in the background
/bin/ollama serve &

# Record the Process ID (PID) of the background process
pid=$!

# Wait for Ollama API to be ready
echo "Waiting for Ollama API..."
until ollama list > /dev/null 2>&1; do
    sleep 1
done

# Pull the requested model
echo "Pulling mxbai-embed-large model..."
ollama pull mxbai-embed-large

# Wait for the background process to finish
wait $pid
