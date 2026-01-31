# app_with_supabase.py
# Updated backend supporting both SQLite (local) and Supabase (production)

from flask import Flask, request, jsonify
import sqlite3
import json
import os
from datetime import datetime
from typing import Dict, List, Any

# Try to import Supabase, fallback to SQLite
try:
    from supabase_client import get_db as get_supabase_db
    HAS_SUPABASE = True
except ImportError:
    HAS_SUPABASE = False

app = Flask(__name__)

# Configuration
USE_SUPABASE = os.getenv("USE_SUPABASE", "false").lower() == "true"
DB = "database.db"

if USE_SUPABASE and HAS_SUPABASE:
    print("✓ Using Supabase backend")
    db = get_supabase_db()
else:
    print("✓ Using SQLite backend")
    db = None


# ================== DATABASE INIT (SQLite only) ==================

def init_sqlite_db():
    """Initialize SQLite database with proper schema"""
    conn = sqlite3.connect(DB)
    cur = conn.cursor()

    # Devices
    cur.execute("""
    CREATE TABLE IF NOT EXISTS devices (
        id TEXT PRIMARY KEY,
        hostname TEXT,
        os TEXT,
        os_version TEXT,
        architecture TEXT,
        created_at TEXT
    )
    """)

    # Events (normalized)
    cur.execute("""
    CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        device_id TEXT REFERENCES devices(id),
        context_id TEXT,
        event_type TEXT,
        timestamp TEXT,
        raw_data TEXT,
        created_at TEXT
    )
    """)

    # Process events
    cur.execute("""
    CREATE TABLE IF NOT EXISTS process_events (
        id TEXT PRIMARY KEY,
        device_id TEXT REFERENCES devices(id),
        event_id TEXT REFERENCES events(id),
        pid INTEGER,
        ppid INTEGER,
        process_name TEXT,
        cmdline TEXT,
        username TEXT,
        timestamp TEXT,
        created_at TEXT
    )
    """)

    # File events
    cur.execute("""
    CREATE TABLE IF NOT EXISTS file_events (
        id TEXT PRIMARY KEY,
        device_id TEXT REFERENCES devices(id),
        event_id TEXT REFERENCES events(id),
        file_path TEXT,
        operation TEXT,
        hash TEXT,
        timestamp TEXT,
        created_at TEXT
    )
    """)

    # Network events
    cur.execute("""
    CREATE TABLE IF NOT EXISTS network_events (
        id TEXT PRIMARY KEY,
        device_id TEXT REFERENCES devices(id),
        event_id TEXT REFERENCES events(id),
        pid INTEGER,
        process_name TEXT,
        src_ip TEXT,
        src_port INTEGER,
        dst_ip TEXT,
        dst_port INTEGER,
        timestamp TEXT,
        created_at TEXT
    )
    """)

    # Raw payloads (audit trail)
    cur.execute("""
    CREATE TABLE IF NOT EXISTS payloads (
        id TEXT PRIMARY KEY,
        device_id TEXT REFERENCES devices(id),
        payload_type TEXT,
        data TEXT,
        received_at TEXT
    )
    """)

    conn.commit()
    conn.close()


# ================== PAYLOAD CLASSIFIER ==================

def classify_payload(payload):
    """Classify payload by type"""
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


# ================== STORE PAYLOAD (SQLite) ==================

def store_payload_sqlite(device_id: str, payload_type: str, payload: Dict):
    """Store payload in SQLite"""
    import uuid
    conn = sqlite3.connect(DB)
    cur = conn.cursor()

    try:
        # Store device
        device = payload.get("device", {})
        dev_id = device.get("device_id") or device_id
        
        cur.execute("""
        INSERT OR REPLACE INTO devices (id, hostname, os, os_version, architecture, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
        """, (
            dev_id,
            device.get("hostname"),
            device.get("os"),
            device.get("os_version"),
            device.get("architecture"),
            datetime.utcnow().isoformat()
        ))

        # Store context/events if present
        if payload.get("events"):
            context_id = payload.get("context_id") or str(uuid.uuid4())
            
            for event in payload.get("events", []):
                event_id = str(uuid.uuid4())
                event_type = event.get("event_type")
                timestamp = event.get("timestamp") or datetime.utcnow().isoformat()

                # Store in events
                cur.execute("""
                INSERT INTO events (id, device_id, context_id, event_type, timestamp, raw_data, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (
                    event_id,
                    dev_id,
                    context_id,
                    event_type,
                    timestamp,
                    json.dumps(event),
                    datetime.utcnow().isoformat()
                ))

                # Store specific event types
                details = event.get("details", {})

                if event_type == "process_start":
                    cur.execute("""
                    INSERT INTO process_events 
                    (id, device_id, event_id, pid, ppid, process_name, cmdline, username, timestamp, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        str(uuid.uuid4()),
                        dev_id,
                        event_id,
                        details.get("pid"),
                        details.get("ppid"),
                        details.get("process_name"),
                        details.get("cmdline"),
                        details.get("username"),
                        timestamp,
                        datetime.utcnow().isoformat()
                    ))

                elif event_type == "file_modified":
                    cur.execute("""
                    INSERT INTO file_events
                    (id, device_id, event_id, file_path, operation, hash, timestamp, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        str(uuid.uuid4()),
                        dev_id,
                        event_id,
                        details.get("file_path"),
                        event_type,
                        details.get("hash"),
                        timestamp,
                        datetime.utcnow().isoformat()
                    ))

                elif event_type == "network_connect":
                    cur.execute("""
                    INSERT INTO network_events
                    (id, device_id, event_id, pid, process_name, src_ip, src_port, dst_ip, dst_port, timestamp, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        str(uuid.uuid4()),
                        dev_id,
                        event_id,
                        details.get("pid"),
                        details.get("process_name"),
                        details.get("src_ip"),
                        details.get("src_port"),
                        details.get("dst_ip"),
                        details.get("dst_port"),
                        timestamp,
                        datetime.utcnow().isoformat()
                    ))

        # Store raw payload
        cur.execute("""
        INSERT INTO payloads (id, device_id, payload_type, data, received_at)
        VALUES (?, ?, ?, ?, ?)
        """, (
            str(uuid.uuid4()),
            dev_id,
            payload_type,
            json.dumps(payload),
            datetime.utcnow().isoformat()
        ))

        conn.commit()
        return True

    except Exception as e:
        print(f"[SQLite Error] {e}")
        return False
    finally:
        conn.close()


# ================== ROUTES ==================

@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "status": "Sentinel AI Backend Running",
        "database": "Supabase (PostgreSQL)" if USE_SUPABASE and HAS_SUPABASE else "SQLite",
        "time": datetime.utcnow().isoformat()
    })


@app.route("/api/logs", methods=["POST"])
def receive_logs():
    """Accept and store agent logs"""
    payload = request.get_json()

    if not payload:
        return jsonify({"error": "Empty payload"}), 400

    # Handle batch payloads
    if isinstance(payload, list):
        for entry in payload:
            if isinstance(entry, dict):
                device = entry.get("device", {})
                device_id = device.get("device_id") or entry.get("device_id")
                payload_type = classify_payload(entry)

                if USE_SUPABASE and HAS_SUPABASE:
                    try:
                        db.store_device(
                            device_id or "unknown",
                            device.get("hostname") or "unknown",
                            device.get("os") or "unknown",
                            device.get("os_version") or "",
                            device.get("architecture") or ""
                        )
                        db.store_payload(device_id, payload_type, entry)
                    except Exception as e:
                        print(f"[Supabase Error] {e}")
                else:
                    store_payload_sqlite(device_id, payload_type, entry)

    elif isinstance(payload, dict):
        device = payload.get("device", {})
        device_id = device.get("device_id") or payload.get("device_id")
        payload_type = classify_payload(payload)

        if USE_SUPABASE and HAS_SUPABASE:
            try:
                db.store_device(
                    device_id or "unknown",
                    device.get("hostname") or "unknown",
                    device.get("os") or "unknown",
                    device.get("os_version") or "",
                    device.get("architecture") or ""
                )
                db.store_payload(device_id, payload_type, payload)
            except Exception as e:
                print(f"[Supabase Error] {e}")
        else:
            store_payload_sqlite(device_id, payload_type, payload)

    else:
        return jsonify({"error": "Invalid payload format"}), 400

    return jsonify({"status": "payload stored"}), 201


@app.route("/api/logs", methods=["GET"])
def view_logs():
    """Retrieve stored events"""
    limit = request.args.get("limit", 100, type=int)
    device_id = request.args.get("device_id", None)

    if USE_SUPABASE and HAS_SUPABASE:
        try:
            payloads = db.get_payloads(device_id, limit)
            return jsonify(payloads)
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    else:
        conn = sqlite3.connect(DB)
        cur = conn.cursor()

        query = "SELECT id, device_id, payload_type, data, received_at FROM payloads ORDER BY received_at DESC LIMIT ?"
        params = [limit]

        if device_id:
            query = "SELECT id, device_id, payload_type, data, received_at FROM payloads WHERE device_id = ? ORDER BY received_at DESC LIMIT ?"
            params = [device_id, limit]

        cur.execute(query, params)
        rows = cur.fetchall()
        conn.close()

        results = [
            {
                "id": r[0],
                "device_id": r[1],
                "payload_type": r[2],
                "data": json.loads(r[3]),
                "received_at": r[4]
            }
            for r in rows
        ]
        return jsonify(results)


@app.route("/api/devices", methods=["GET"])
def get_devices():
    """List all devices"""
    if USE_SUPABASE and HAS_SUPABASE:
        try:
            devices = db.get_devices()
            return jsonify(devices)
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    else:
        conn = sqlite3.connect(DB)
        cur = conn.cursor()
        cur.execute("SELECT * FROM devices")
        rows = cur.fetchall()
        conn.close()

        results = [{"id": r[0], "hostname": r[1], "os": r[2]} for r in rows]
        return jsonify(results)


@app.route("/api/process-activity", methods=["GET"])
def get_process_activity():
    """Get process execution activity"""
    limit = request.args.get("limit", 100, type=int)
    device_id = request.args.get("device_id", None)

    if USE_SUPABASE and HAS_SUPABASE:
        try:
            activity = db.get_process_activity(device_id, limit)
            return jsonify(activity)
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    else:
        conn = sqlite3.connect(DB)
        cur = conn.cursor()
        cur.execute(
            "SELECT * FROM process_events ORDER BY timestamp DESC LIMIT ?",
            [limit]
        )
        rows = cur.fetchall()
        conn.close()

        results = [
            {
                "process_name": r[5],
                "pid": r[3],
                "username": r[7],
                "timestamp": r[8]
            }
            for r in rows
        ]
        return jsonify(results)


# ================== MAIN ==================

if __name__ == "__main__":
    if not USE_SUPABASE or not HAS_SUPABASE:
        init_sqlite_db()
    
    app.run(host="0.0.0.0", port=5000, debug=True)
