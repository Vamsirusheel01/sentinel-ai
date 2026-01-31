# Sentinel AI Endpoint Agent

This is the MVP endpoint security agent for Sentinel AI.

## Features
- Device identity collection
- Process, network, filesystem, persistence telemetry
- Deterministic deduplication
- Local risk evaluation
- Buffered, batched data transmission

## Run
pip install -r requirements.txt
python run_agent.py

## Notes
- This agent is user-mode and safe for Defender
- Designed for extension into ETW / inotify
- Detection is real-time, batching is only for sending