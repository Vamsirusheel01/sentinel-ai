from flask import Flask, request, jsonify, Response
import sqlite3
import json
import time
from datetime import datetime

app = Flask(__name__)
DB = "database.db"


# ================== DATABASE INIT ==================

def init_db():
    conn = sqlite3.connect(DB)
    cur = conn.cursor()

    cur.execute("""
    CREATE TABLE IF NOT EXISTS agent_payloads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id TEXT,
        payload_type TEXT,
        raw_payload TEXT,
        received_at TEXT
    )
    """)

    conn.commit()
    conn.close()


# ================== PAYLOAD CLASSIFIER ==================

def classify_payload(payload):
    if payload.get("payload_type"):
        return payload.get("payload_type")

    if payload.get("events"):
        event_types = {e.get("event_type") for e in payload.get("events", [])}

        if "persistence_created" in event_types:
            return "persistence_activity"

        if "network_connect" in event_types and "process_start" in event_types:
            return "process_network_activity"

        if any(e.startswith("file_") for e in event_types if e):
            return "filesystem_activity"

        if "process_start" in event_types:
            return "process_execution"

    return "unknown"


# ================== STORE PAYLOAD ==================

def store_payload(payload):
    conn = sqlite3.connect(DB)
    cur = conn.cursor()

    device = payload.get("device", {})
    device_id = device.get("device_id") or payload.get("device_id")

    payload_type = classify_payload(payload)

    record = {
        "device_id": device_id,
        "payload_type": payload_type,
        "payload": payload,
        "received_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    }

    # Store in DB
    cur.execute("""
    INSERT INTO agent_payloads
    (device_id, payload_type, raw_payload, received_at)
    VALUES (?, ?, ?, ?)
    """, (
        device_id,
        payload_type,
        json.dumps(payload),
        record["received_at"]
    ))

    conn.commit()
    conn.close()

   
# ================== ROUTES ==================

@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "status": "Sentinel AI Backend Running",
        "time": datetime.utcnow().isoformat()
    })


# -------- RECEIVE DATA (POST) --------
@app.route("/api/logs", methods=["POST"])
def receive_logs():
    payload = request.get_json()

    if not payload:
        return jsonify({"error": "Empty payload"}), 400

    # Batch support
    if isinstance(payload, list):
        for entry in payload:
            if isinstance(entry, dict):
                store_payload(entry)

    elif isinstance(payload, dict):
        store_payload(payload)

    else:
        return jsonify({"error": "Invalid payload format"}), 400

    return jsonify({"status": "payload stored"}), 201


# -------- VIEW STORED DATA --------
@app.route("/api/logs", methods=["GET"])
def view_logs():
    conn = sqlite3.connect(DB)
    cur = conn.cursor()

    cur.execute("""
    SELECT id, device_id, payload_type, raw_payload, received_at
    FROM agent_payloads
    ORDER BY id DESC
    LIMIT 100
    """)
    rows = cur.fetchall()
    conn.close()

    results = []
    for row in rows:
        results.append({
            "id": row[0],
            "device_id": row[1],
            "payload_type": row[2],
            "payload": json.loads(row[3]),
            "received_at": row[4]
        })

    return jsonify(results)


# -------- LIVE STREAM (NO REFRESH) --------
@app.route("/api/logs/stream")
def stream_logs():
    def event_generator():
        while True:
            data = event_stream.get()
            yield f"data: {json.dumps(data)}\n\n"

    return Response(
        event_generator(),
        mimetype="text/event-stream"
    )


# ================== MAIN ==================

if __name__ == "__main__":
    init_db()
    app.run(host="0.0.0.0", port=5000, debug=True)