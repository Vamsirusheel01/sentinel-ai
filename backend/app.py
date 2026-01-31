from flask import Flask, request, jsonify
import sqlite3
import json
from datetime import datetime

app = Flask(__name__)
DB = "database.db"


# ------------------ DATABASE INIT ------------------

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


# ------------------ HELPERS ------------------

def store_payload(payload):
    conn = sqlite3.connect(DB)
    cur = conn.cursor()

    device_id = payload.get("device_id")

    # Identify payload type
    if payload.get("event_type"):
        payload_type = "event"
    elif payload.get("cpu") or payload.get("system"):
        payload_type = "system_snapshot"
    else:
        payload_type = "unknown"

    cur.execute("""
    INSERT INTO agent_payloads
    (device_id, payload_type, raw_payload, received_at)
    VALUES (?, ?, ?, ?)
    """, (
        device_id,
        payload_type,
        json.dumps(payload),
        datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    ))

    conn.commit()
    conn.close()


# ------------------ API ROUTES ------------------

@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "status": "Sentinel AI Backend Running",
        "time": datetime.utcnow().isoformat()
    })


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


# ------------------ MAIN ------------------

if __name__ == "__main__":
    init_db()
    app.run(host="0.0.0.0", port=5000, debug=True)