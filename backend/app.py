from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import json
import os
import uuid
import joblib
import numpy as np
import pandas as pd
from datetime import datetime, timezone
from typing import Dict, List, Any

# Import AI logic
try:
    from train_model import batch_extract_features, FEATURE_NAMES
    MODEL = joblib.load('ml/sentinel_model.pkl')
    HAS_AI = True
    print("[AI] Engine Loaded Successfully")
except Exception as e:
    print(f"[AI] Model not loaded: {e}")
    HAS_AI = False

app = Flask(__name__, static_folder='static', static_url_path='')
CORS(app) # Enable CORS for frontend

@app.route('/')
def index():
    return app.send_static_file('index.html')

DB = "database.db"

# ================== DATABASE INIT ==================

def init_db():
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute("""
        CREATE TABLE IF NOT EXISTS devices (
            id TEXT PRIMARY KEY,
            hostname TEXT,
            os TEXT,
            os_version TEXT,
            architecture TEXT,
            trust_score REAL DEFAULT 100.0,
            last_seen TEXT,
            created_at TEXT
        )
        """)
        cur.execute("""
        CREATE TABLE IF NOT EXISTS events (
            id TEXT PRIMARY KEY,
            device_id TEXT REFERENCES devices(id),
            event_type TEXT,
            timestamp TEXT,
            raw_data TEXT,
            created_at TEXT
        )
        """)
        cur.execute("""
        CREATE TABLE IF NOT EXISTS process_events (
            id TEXT PRIMARY KEY,
            device_id TEXT REFERENCES devices(id),
            pid INTEGER,
            process_name TEXT,
            cmdline TEXT,
            username TEXT,
            timestamp TEXT
        )
        """)
        conn.commit()
    finally:
        conn.close()

# ================== HELPERS ==================

def get_db_connection():
    conn = sqlite3.connect(DB, timeout=15)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA busy_timeout = 15000")
    conn.execute("PRAGMA journal_mode = WAL")
    conn.execute("PRAGMA synchronous = NORMAL")
    return conn

def record_events_batch(cur: sqlite3.Cursor, device_id: str, events: List[Dict], now: str):
    """Optimized batch recording of events"""
    if not events:
        return
    
    for event in events:
        event_id = str(uuid.uuid4())
        event_type = event.get("event_type", "unknown")
        timestamp = event.get("timestamp") or now
        
        # Main event
        cur.execute("INSERT INTO events VALUES (?, ?, ?, ?, ?, ?)", 
                   (event_id, device_id, event_type, timestamp, json.dumps(event), now))
        
        # Process specific
        if event_type == "process_start":
            pid = event.get("pid") or event.get("details", {}).get("pid")
            name = event.get("process_name") or event.get("details", {}).get("process_name")
            cmdline = event.get("cmdline") or event.get("details", {}).get("cmdline")
            user = event.get("username") or event.get("user") or event.get("details", {}).get("username")
            
            cur.execute("INSERT INTO process_events VALUES (?, ?, ?, ?, ?, ?, ?)",
                       (str(uuid.uuid4()), device_id, pid, name, cmdline, user, timestamp))

# Whitelist of known-safe processes (bypass model for high-confidence benign)
BENIGN_PROCESSES = {
    # Browsers
    'chrome.exe', 'brave.exe', 'msedgewebview2.exe', 'msedge.exe', 'firefox.exe',
    # Development/Editors
    'code.exe', 'code - insiders.exe', 'devenv.exe', 'python.exe', 'node.exe',
    # System processes
    'svchost.exe', 'explorer.exe', 'runtimebroker.exe', 'csrss.exe', 'services.exe',
    'lsass.exe', 'conhost.exe', 'wininit.exe', 'dwm.exe', 'taskhostw.exe',
    'searchindexer.exe', 'searchprotocolhost.exe', 'taskmgr.exe', 'winlogon.exe',
    'smss.exe', 'spoolsv.exe', 'msiexec.exe', 'dllhost.exe', 'svchost.exe',
    'winstore.app.exe', 'settingshandlers_*.exe',
    # Updates and maintenance
    'wuauclt.exe', 'tiworker.exe', 'trustedinstaller.exe',
    # Audio/video
    'audiodg.exe', 'applicationframehost.exe', 'mediaplayeruserinterface.exe',
    # Office
    'outlook.exe', 'winword.exe', 'excel.exe', 'onenote.exe',
    # Other common apps
    'slack.exe', 'discord.exe', 'telegram.exe', 'teams.exe', 'zoom.exe',
    'java.exe', 'javaw.exe', 'git.exe', 'docker.exe',
    # Antivirus/security
    'msmpeng.exe', 'msseces.exe', 'windefend.exe'
}

def calculate_trust_impact(events: List[Dict]):
    """Optimized batch prediction"""
    if not HAS_AI or not events: return 0
    
    try:
        # Quick pre-check: skip benign-process events entirely
        filtered_events = []
        for event in events:
            proc_name = event.get('process_name', '').lower()
            if proc_name not in BENIGN_PROCESSES:
                filtered_events.append(event)
        
        if not filtered_events:
            return 0  # All events are benign processes
        
        features_df = batch_extract_features(filtered_events)
        # Predict all at once
        probs = MODEL.predict_proba(features_df)[:, 1] # Prob of class 1 (malicious)
        
        for i, prob in enumerate(probs):
            event = filtered_events[i]
            cmd = event.get('cmdline') or event.get('process_name') or "unknown"
            
            has_low = int(features_df.iloc[i].get('has_low_keyword', features_df.iloc[i].get('has_keyword', 0)))
            has_high = int(features_df.iloc[i].get('has_high_keyword', 0))

            # Keyword insight logs for debugging
            if has_low == 1:
                print(f"[DEBUG] Security Keyword Seen: {cmd}")
            if has_high == 1:
                print(f"[DEBUG] High-Risk Pattern Seen: {cmd}")

            if prob > 0.85:
                print(f"[AI] Detected Risk: Prob={prob:.2f} | Cmd={cmd}")

        max_prob = float(np.max(probs))
        high_conf_count = int(np.sum(probs > 0.92))  # Stricter threshold
        medium_conf_count = int(np.sum((probs > 0.80) & (probs <= 0.92)))

        has_high_keyword_event = bool(features_df.get('has_high_keyword', pd.Series([0])).astype(int).any())
        has_low_keyword_event = bool(features_df.get('has_low_keyword', features_df.get('has_keyword', pd.Series([0]))).astype(int).any())

        # High-risk patterns get minimal impact to avoid false-positive cascades.
        if has_high_keyword_event and max_prob > 0.90:
            return float(min(4.0, 1.5 + (max_prob * 2.0)))

        if high_conf_count > 0:
            return float(min(2.0, 0.5 + (max_prob * 1.0)))

        if medium_conf_count > 0:
            return float(min(1.0, 0.2 + (max_prob * 0.5)))

        # Recon/admin command observed with low confidence.
        if has_low_keyword_event:
            return 0.1
    except Exception as e:
        print(f"[AI] Error during prediction: {e}")
        
    return 0

# ================== ROUTES ==================

@app.route("/api/logs", methods=["POST"])
def receive_logs():
    payload = request.get_json()
    if not payload: return jsonify({"error": "No payload"}), 400

    device_info = payload.get("device", {})
    device_id = device_info.get("device_id") or "unknown"
    events = payload.get("events", [])

    conn = get_db_connection()
    try:
        cur = conn.cursor()
        now = datetime.now(timezone.utc).isoformat()

        # Update device
        cur.execute("""
        INSERT INTO devices (id, hostname, os, os_version, architecture, last_seen, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET last_seen = excluded.last_seen
        """, (device_id, device_info.get("hostname"), device_info.get("os"), 
              device_info.get("os_version"), device_info.get("architecture"), now, now))

        # Batch record to DB (same connection/cursor to avoid nested write locks)
        record_events_batch(cur, device_id, events, now)

        # Batch AI processing
        impact = calculate_trust_impact(events)
        
        if impact > 0:
            cur.execute("UPDATE devices SET trust_score = MAX(0, trust_score - ?) WHERE id = ?", 
                       (impact, device_id))
        else:
            # Trust recovery tuned for 1-second agent heartbeat.
            cur.execute("UPDATE devices SET trust_score = MIN(100.0, trust_score + 0.2) WHERE id = ?", 
                       (device_id,))

        cur.execute("SELECT trust_score FROM devices WHERE id = ?", (device_id,))
        row = cur.fetchone()
        score = row["trust_score"] if row else 100.0
        conn.commit()
    except sqlite3.OperationalError as exc:
        conn.rollback()
        return jsonify({"error": f"database error: {exc}"}), 503
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

    return jsonify({
        "status": "success",
        "trust_score": round(score, 1),
        "feedback": (
            "WARNING: Suspicious command detected" if impact >= 2.0
            else "CRITICAL: Threat" if score < 10
            else "WARNING: Risk" if score <= 75
            else "Secure"
        )
    }), 201

@app.route("/api/status", methods=["GET"])
def get_status():
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT * FROM devices ORDER BY last_seen DESC")
        devices = [dict(r) for r in cur.fetchall()]
        cur.execute("SELECT * FROM events ORDER BY timestamp DESC LIMIT 30")
        events = []
        for r in cur.fetchall():
            item = dict(r)
            item['raw_data'] = json.loads(item['raw_data'])
            events.append(item)
        return jsonify({"devices": devices, "recent_events": events})
    except sqlite3.OperationalError as exc:
        return jsonify({"error": f"database error: {exc}"}), 503
    finally:
        conn.close()

if __name__ == "__main__":
    init_db()
    app.run(host="0.0.0.0", port=5000, debug=True)
