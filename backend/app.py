from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import json
import os
import uuid
import re
from datetime import datetime, timezone
from typing import Dict, List, Any

# Import YARA for rule-based detection
try:
    import yara
    RULES = yara.compile(filepath='sentinel_rules.yar')
    DETECTION_ENGINE = 'YARA'
    print("[Detection] YARA rules loaded successfully")
except Exception as e:
    print(f"[Detection] YARA rules failed to load: {e}")
    RULES = None
    DETECTION_ENGINE = 'DISABLED'

app = Flask(__name__, static_folder='static', static_url_path='')
CORS(app) # Enable CORS for frontend

@app.route('/')
def index():
    return app.send_static_file('index.html')

DB = "database.db"

ALERT_COOLDOWN_SECONDS = int(os.getenv("ALERT_COOLDOWN_SECONDS", "45"))
RECOVERY_PER_CYCLE = float(os.getenv("RECOVERY_PER_CYCLE", "1.2"))
SLOW_RECOVERY_PER_CYCLE = float(os.getenv("SLOW_RECOVERY_PER_CYCLE", "0.2"))
FAST_RECOVERY_PER_CYCLE = float(os.getenv("FAST_RECOVERY_PER_CYCLE", "3.0"))
RECON_CONTEXT_SECONDS = int(os.getenv("RECON_CONTEXT_SECONDS", "30"))
COMPROMISED_RECOVERY_SECONDS = int(os.getenv("COMPROMISED_RECOVERY_SECONDS", "120"))
CHAIN_ESCALATION_BONUS = float(os.getenv("CHAIN_ESCALATION_BONUS", "5.0"))

SEVERITY_PENALTY = {
    "low": 5.0,
    "medium": 10.0,
    "high": 15.0,
    "critical": 20.0,
}

SEVERITY_ORDER = {
    "none": 0,
    "low": 1,
    "medium": 2,
    "high": 3,
    "critical": 4,
}

# In-memory cooldown cache for repeated identical detections:
# key -> last_penalized_unix_ts
RECENT_DETECTIONS: Dict[str, float] = {}

# In-memory risk context per device.
DEVICE_RISK_STATE: Dict[str, Dict[str, float]] = {}

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

def _build_detection_signature(device_id: str, rule_name: str, proc_name: str, cmdline: str) -> str:
    return f"{device_id}|{rule_name}"


def _is_penalty_cooled_down(signature: str, now_ts: float) -> bool:
    last_ts = RECENT_DETECTIONS.get(signature)
    if last_ts is None:
        return False
    return (now_ts - last_ts) < ALERT_COOLDOWN_SECONDS


def _mark_penalized(signature: str, now_ts: float) -> None:
    RECENT_DETECTIONS[signature] = now_ts


def _cleanup_old_detection_cache(now_ts: float) -> None:
    expiry = ALERT_COOLDOWN_SECONDS * 5
    stale = [k for k, ts in RECENT_DETECTIONS.items() if (now_ts - ts) > expiry]
    for key in stale:
        RECENT_DETECTIONS.pop(key, None)


def _get_device_risk_state(device_id: str, now_ts: float) -> Dict[str, float]:
    state = DEVICE_RISK_STATE.get(device_id)
    if state is None:
        state = {
            "recon_until": 0.0,
            "recon_only_until": 0.0,
            "compromised_until": 0.0,
            "last_seen": now_ts,
        }
        DEVICE_RISK_STATE[device_id] = state
    else:
        state["last_seen"] = now_ts
    return state


def _cleanup_old_device_risk_state(now_ts: float) -> None:
    stale_after = max(COMPROMISED_RECOVERY_SECONDS, RECON_CONTEXT_SECONDS) * 4
    stale_device_ids = [
        device_id
        for device_id, state in DEVICE_RISK_STATE.items()
        if (now_ts - state.get("last_seen", 0.0)) > stale_after
    ]
    for device_id in stale_device_ids:
        DEVICE_RISK_STATE.pop(device_id, None)


def calculate_trust_impact(device_id: str, events: List[Dict], now_ts: float):
    """Rule-based threat detection with cooldown-aware score impact and context flags.

    Returns:
      observed_severity: highest severity seen for feedback
      score_impact: max impact actually applied to trust score (cooldown filtered)
      saw_recon: True when low recon-like behavior is present
      saw_attack: True when medium/high/critical behavior is present
    """
    if not RULES or not events:
        return "none", 0.0, False, False
    
    _cleanup_old_detection_cache(now_ts)

    observed_severity = "none"
    score_impact = 0.0
    saw_recon = False
    saw_attack = False
    try:
        for event in events:
            proc_name = event.get('process_name', '').lower()
            cmdline = event.get('cmdline') or event.get('process_name') or ''
            event_type = (event.get('event_type') or '').lower()
            
            # Skip whitelisted processes
            if proc_name in BENIGN_PROCESSES:
                continue
            
            # Run YARA rules on the command line
            matches = RULES.match(data=cmdline)
            
            if matches:
                for match in matches:
                    rule_name = match.rule
                    severity = (match.meta.get('severity', 'low') or 'low').lower()
                    impact = SEVERITY_PENALTY.get(severity, SEVERITY_PENALTY['low'])
                    
                    if severity == 'critical':
                        print(f"[DETECTION] CRITICAL RULE TRIGGERED: {rule_name} | Cmd={cmdline[:100]}")
                    elif severity == 'high':
                        print(f"[DETECTION] HIGH-RISK RULE TRIGGERED: {rule_name} | Cmd={cmdline[:100]}")
                    elif severity == 'medium':
                        print(f"[DETECTION] MEDIUM-RISK RULE TRIGGERED: {rule_name} | Cmd={cmdline[:100]}")
                    else:  # low
                        print(f"[DETECTION] INFO RULE: {rule_name}")

                    if rule_name == 'recon_commands' or severity == 'low':
                        saw_recon = True
                    if severity in ('medium', 'high', 'critical'):
                        saw_attack = True

                    if SEVERITY_ORDER.get(severity, 1) > SEVERITY_ORDER.get(observed_severity, 0):
                        observed_severity = severity

                    signature = _build_detection_signature(device_id, rule_name, proc_name, cmdline)
                    if not _is_penalty_cooled_down(signature, now_ts):
                        score_impact = max(score_impact, impact)
                        _mark_penalized(signature, now_ts)

            # Heuristic for lightweight network probes (e.g., SYN-only signals).
            details = event.get('details') or {}
            flags = str(
                event.get('flags')
                or event.get('tcp_flags')
                or details.get('flags')
                or details.get('tcp_flags')
                or ''
            ).upper()
            if event_type in ('network_connection', 'network_event', 'network_activity') and 'SYN' in flags and 'ACK' not in flags:
                saw_recon = True
                if SEVERITY_ORDER['low'] > SEVERITY_ORDER.get(observed_severity, 0):
                    observed_severity = 'low'

                syn_signature = _build_detection_signature(device_id, 'syn_probe', proc_name, f"{event_type}:{flags}")
                if not _is_penalty_cooled_down(syn_signature, now_ts):
                    score_impact = max(score_impact, SEVERITY_PENALTY['low'])
                    _mark_penalized(syn_signature, now_ts)
    except Exception as e:
        print(f"[DETECTION] Error running YARA rules: {e}")
    
    return observed_severity, score_impact, saw_recon, saw_attack

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
        now_ts = datetime.now(timezone.utc).timestamp()

        _cleanup_old_device_risk_state(now_ts)
        state = _get_device_risk_state(device_id, now_ts)

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
        observed_severity, score_impact, saw_recon, saw_attack = calculate_trust_impact(device_id, events, now_ts)

        escalated_chain = saw_attack and (now_ts <= state.get("recon_only_until", 0.0))
        correlated_penalty_applied = escalated_chain and score_impact > 0
        if correlated_penalty_applied:
            score_impact += CHAIN_ESCALATION_BONUS
            state["compromised_until"] = max(state.get("compromised_until", 0.0), now_ts + COMPROMISED_RECOVERY_SECONDS)

        if saw_recon:
            state["recon_until"] = max(state.get("recon_until", 0.0), now_ts + RECON_CONTEXT_SECONDS)
            if not saw_attack:
                state["recon_only_until"] = max(state.get("recon_only_until", 0.0), now_ts + RECON_CONTEXT_SECONDS)
            else:
                state["recon_only_until"] = 0.0

        # Any strong attack (even without recon history) should trigger slower recovery period.
        if observed_severity in ("high", "critical"):
            state["compromised_until"] = max(state.get("compromised_until", 0.0), now_ts + COMPROMISED_RECOVERY_SECONDS)

        cur.execute("SELECT trust_score FROM devices WHERE id = ?", (device_id,))
        row = cur.fetchone()
        current_score = float(row["trust_score"]) if row else 100.0

        if score_impact > 0:
            # Apply penalty only when outside cooldown for the same detection signature.
            new_score = max(0.0, current_score - score_impact)
        else:
            if now_ts <= state.get("compromised_until", 0.0):
                # Correlated or strong attack context: recover slowly.
                recovery_delta = SLOW_RECOVERY_PER_CYCLE
            elif now_ts <= state.get("recon_until", 0.0):
                # Recon without dangerous follow-up: recover very fast.
                recovery_delta = FAST_RECOVERY_PER_CYCLE
            else:
                recovery_delta = RECOVERY_PER_CYCLE

            new_score = min(100.0, current_score + recovery_delta)

        cur.execute("UPDATE devices SET trust_score = ? WHERE id = ?", (new_score, device_id))
        score = new_score
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
            "CRITICAL: Correlated attack pattern" if correlated_penalty_applied
            else "CRITICAL: Threat detected" if observed_severity == "critical"
            else "WARNING: Suspicious activity" if observed_severity == "high"
            else "WARNING: Monitor activity" if observed_severity in ("medium", "low")
            else "Secure" if score > 75
            else "WARNING: Low trust score"
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
