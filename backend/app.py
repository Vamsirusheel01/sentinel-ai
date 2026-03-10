# Add missing imports
from collections import deque
from datetime import datetime, timezone
import os
import json
# In-memory log queue for async processing
log_queue = deque(maxlen=1000)

def log_queue_worker():
    import time
    while True:
        if log_queue:
            entry = log_queue.popleft()
            try:
                conn = get_db_connection()
                cur = conn.cursor()
                cur.execute("INSERT INTO logs (device_id, log_entry, timestamp) VALUES (?, ?, ?)", (entry['device_id'], entry['log_entry'], entry['timestamp']))
                conn.commit()
                conn.close()
            except Exception as e:
                logging.error(f"[ERROR] log_queue_worker: {e}")
        else:
            time.sleep(0.1)

import threading
threading.Thread(target=log_queue_worker, daemon=True).start()
# Ensure all global variables are initialized
monitoring_enabled = False
agent_connected = False
trust_score = 100.0
system_status = "Protected"
last_risk_event = None
from flask import Flask, request, jsonify
from flask_cors import CORS
from collections import deque
import sqlite3
import json
import os

app = Flask(__name__, static_folder='static', static_url_path='')
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:3000", "http://127.0.0.1:3000"]}}, supports_credentials=True)

# ================== MONITORING MODE ENDPOINTS ==================
@app.route("/api/start-protection", methods=["POST"])
def start_protection():
    global monitoring_enabled
    monitoring_enabled = True
    print("[SYSTEM] Monitoring enabled")
    return jsonify({"status": "success", "monitoring": True, "message": "Monitoring started"})

import uuid
import re
import threading
import time
import subprocess
from datetime import datetime, timezone


# Health endpoint for server availability
@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "service": "SentinelAI Backend"
    }), 200
from flask_cors import CORS
from collections import deque
import sqlite3
import json
import os
import uuid
import re
import threading
import time
import subprocess
from datetime import datetime, timezone
from typing import Dict, List, Any

# Import YARA for rule-based detection
try:
    import yara
    base_dir = os.path.dirname(__file__)
    rules_path = os.path.join(base_dir, "detection", "rules", "malware_rules.yar")
    if os.path.exists(rules_path):
        RULES = yara.compile(filepath=rules_path)
        DETECTION_ENGINE = 'YARA'
        print(f"[Detection] YARA rules loaded successfully from {rules_path}")
    else:
        print("[Detection] YARA rules not found, continuing without signature detection.")
        RULES = None
        DETECTION_ENGINE = 'DISABLED'
except Exception as e:
    print(f"[Detection] YARA rules failed to load: {e}")
    RULES = None
    DETECTION_ENGINE = 'DISABLED'


@app.route('/')
def index():
    return app.send_static_file('index.html')

DB = "sentinel.db"


trust_score = 100.0
system_status = "Protected"
last_risk_event = None
is_isolated = False  # Flag to prevent repeated isolation attempts
protection_active = False  # Legacy, kept for compatibility
monitoring_enabled = False  # NEW: Global monitoring mode
agent_connected = False  # Tracks agent status

# Tracks when each event type penalty was last applied (to prevent burst penalties)
recent_events = {}
EVENT_TYPE_COOLDOWN_SECONDS = 5

# Cooldown: tracks when each threat type last triggered a score reduction
# If the same threat type occurs within 30 seconds, score reduction is skipped
last_trigger_time: Dict[str, float] = {}
ALERT_COOLDOWN_SECONDS_PATTERN = 30

# Cooldown for YARA-based detection deduplication
ALERT_COOLDOWN_SECONDS = 30

def safe_float_ts(val, fallback=None):
    """Convert any timestamp value to float (supports float and ISO format). Falls back to time.time() if invalid."""
    if val is None:
        return fallback if fallback is not None else time.time()
    try:
        return float(val)
    except:
        try:
            return datetime.fromisoformat(val).timestamp()
        except:
            return fallback if fallback is not None else time.time()

# Global sliding window event buffer for analyzing events
event_window = deque(maxlen=300)

# Trust score history — tracks only when score actually changes (capped at 500 entries)
trust_score_history = deque(maxlen=500)
previous_trust_score = 100.0  # Tracks last recorded score to avoid duplicate entries

def record_trust_score_change(score: float):
    """Append a timestamped trust score record to history only if score changed."""
    global previous_trust_score
    rounded = round(score, 1)
    if rounded != previous_trust_score:
        trust_score_history.append({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "score": rounded
        })
        previous_trust_score = rounded

# Security alerts — stores last 100 alert objects for the /api/alerts endpoint
security_alerts = deque(maxlen=100)

# Connected devices — keyed by device_id
devices = {}

def record_security_alert(event_type: str, process_name: str, severity: str, trust_score_val: float, trust_score_before: float = None):
    """Append a structured alert object to the security_alerts buffer."""
    global monitoring_enabled
    if not monitoring_enabled:
        return
    old_score = round(trust_score_before, 1) if trust_score_before is not None else round(trust_score_val, 1)
    new_score = round(trust_score_val, 1)
    impact = round(old_score - new_score, 1)
    security_alerts.append({
        "event_type": event_type,
        "process_name": process_name,
        "severity": severity,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "trust_score": new_score,
        "old_score": old_score,
        "new_score": new_score,
        "impact": impact,
        "description": f"Trust Score Impact: {old_score} → {new_score} (-{impact})"
    })

# ================== PROCESS INTELLIGENCE LISTS ==================
# SAFE_PROCESSES → ignore completely (never enters event_window or analysis)
SAFE_PROCESSES = {
    "explorer.exe",
    "chrome.exe",
    "msedge.exe",
    "svchost.exe",
    "system",
    "code.exe",
    "python.exe",
    "node.exe",
    "npm.exe",
    "electron.exe",
    "vite.exe",
    "git.exe",
    "widgets.exe",
    "startmenuexperiencehost.exe",
}

# SUSPICIOUS_PROCESSES → monitor behavior (allowed into event_window for pattern analysis)
SUSPICIOUS_PROCESSES = {
    "powershell.exe",
    "wmic.exe",
    "reg.exe",
    "schtasks.exe",
    "netsh.exe",
    "rundll32.exe",
    "mshta.exe",
}

# KNOWN_MALWARE → immediate critical alert and score reduction
KNOWN_MALWARE = {
    "mimikatz.exe",
    "nc.exe",
    "netcat.exe",
    "meterpreter.exe",
    "powersploit.ps1",
}

def update_system_status():
    """Update system_status based on current trust_score"""
    global system_status
    if trust_score < 20:
        system_status = "Isolated"
    elif trust_score > 80:
        system_status = "Protected"
    elif trust_score >= 60:
        system_status = "Warning"
    elif trust_score >= 40:
        system_status = "Suspicious"
    else:
        system_status = "Critical"

# Event type penalties for trust score
EVENT_TYPE_PENALTIES = {
    "process_start": 0.2,
    "file_modified": 0.5,
    "network_connect": 1,
    "persistence_created": 5,
    "unauthorized_access_attempt": 8,
}

# Only these event types can reduce trust_score
SCORE_REDUCING_EVENT_TYPES = {
    "process_start",
    "file_modified",
    "network_connect",
    "persistence_created",
    "unauthorized_access_attempt",
}
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
        cur.execute("""
        CREATE TABLE IF NOT EXISTS logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            device_id TEXT,
            process_name TEXT,
            event_type TEXT,
            severity TEXT,
            timestamp TEXT
        )
        """)
        cur.execute("""
        CREATE TABLE IF NOT EXISTS threat_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_type TEXT,
            severity TEXT,
            trust_score_before REAL,
            trust_score_after REAL,
            timestamp TEXT
        )
        """)
        conn.commit()
    finally:
        conn.close()

# ================== HELPERS ==================

def get_db_connection():
    conn = sqlite3.connect("sentinel_ai.db")
    conn.row_factory = sqlite3.Row
    return conn

def initialize_database():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id TEXT,
        event_type TEXT,
        process_name TEXT,
        cmdline TEXT,
        timestamp TEXT
    )
    """)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        process_name TEXT,
        severity TEXT,
        event_type TEXT,
        timestamp TEXT
    )
    """)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS trust_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trust_score INTEGER,
        timestamp TEXT
    )
    """)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS threat_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_type TEXT,
        severity TEXT,
        timestamp TEXT
    )
    """)
    conn.commit()
    conn.close()

initialize_database()

def insert_log(device_id: str, process_name: str, event_type: str, severity: str, timestamp: str):
    """Insert a log entry into the logs table"""
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO logs (device_id, process_name, event_type, severity, timestamp) VALUES (?, ?, ?, ?, ?)",
            (device_id, process_name, event_type, severity, timestamp)
        )
        conn.commit()
    finally:
        conn.close()

def insert_threat(event_type: str, severity: str, trust_score_before: float, trust_score_after: float, timestamp: str):
    """Insert a threat entry into the threat_history table"""
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO threat_history (event_type, severity, trust_score_before, trust_score_after, timestamp) VALUES (?, ?, ?, ?, ?)",
            (event_type, severity, trust_score_before, trust_score_after, timestamp)
        )
        conn.commit()
    finally:
        conn.close()

def get_all_logs(limit: int = 100) -> List[Dict]:
    """Get logs from the logs table ordered by timestamp DESC"""
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT * FROM logs ORDER BY timestamp DESC LIMIT ?", (limit,))
        return [dict(row) for row in cur.fetchall()]
    finally:
        conn.close()

def get_all_threats() -> List[Dict]:
    """Get threat entries from the threat_history table ordered by timestamp DESC"""
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT * FROM threat_history ORDER BY timestamp DESC")
        return [dict(row) for row in cur.fetchall()]
    finally:
        conn.close()

def record_events_batch(cur: sqlite3.Cursor, device_id: str, events: List[Dict], now: str):
    """Optimized batch recording of events"""
    if not events:
        return
    
    for event in events:
        event_id = str(uuid.uuid4())
        event_type = event.get("event_type", "unknown")
        timestamp = safe_float_ts(event.get("timestamp"), fallback=time.time())
        
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


def _handle_malware_detection(device_id: str, proc_name: str, event: dict, now_ts: float):
    """Immediate critical alert when known malware is detected.
    Reduces trust_score by 30 with 30-second cooldown per malware name."""
    global trust_score, last_risk_event

    pattern_key = f"malware_{proc_name}"
    if not is_pattern_cooled_down(pattern_key, now_ts):
        return

    mark_pattern_detected(pattern_key, now_ts)
    trust_score_before = trust_score
    trust_score = max(0.0, trust_score - 30)
    record_trust_score_change(trust_score)
    record_security_alert("known_malware", proc_name, "critical", trust_score, trust_score_before)
    current_time = datetime.now(timezone.utc).isoformat()

    last_risk_event = {
        "event_type": "known_malware",
        "description": f"Known malware detected: {proc_name}",
        "timestamp": current_time,
        "severity": "critical",
        "pattern": pattern_key,
        "process_name": proc_name,
    }

    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO threat_history (event_type, severity, trust_score_before, trust_score_after, timestamp) VALUES (?, ?, ?, ?, ?)",
            ("known_malware", "critical", trust_score_before, trust_score, current_time)
        )
        conn.commit()
    finally:
        conn.close()

    update_system_status()
    print(f"[MALWARE] Known malware detected: {proc_name}. Trust score: {trust_score_before} → {trust_score}")

# ================== STORAGE FUNCTIONS ==================

def store_payload(device_info: Dict, events: List[Dict]) -> int:
    """
    Store payload and events to database and event_window buffer.
    
    Does NOT:
    - Calculate trust_score
    - Call analyze_behavior()
    
    Returns:
    - Number of events stored
    """
    if not events:
        return 0
    
    print(f"[Debug] Payload received: {len(events)} events from {device_info.get('device_id', 'unknown')}")
    
    device_id = device_info.get("device_id") or "unknown"
    hostname = device_info.get("hostname", "unknown")
    os_name = device_info.get("os", "unknown")
    os_version = device_info.get("os_version", "unknown")
    architecture = device_info.get("architecture", "unknown")
    current_time = datetime.now(timezone.utc).isoformat()

    # Track device in global dictionary
    if device_id not in devices:
        devices[device_id] = {
            "device_id": device_id,
            "hostname": hostname,
            "os": os_name,
            "os_version": os_version,
            "architecture": architecture,
            "trust_score": trust_score,
            "last_seen": current_time,
        }
    else:
        devices[device_id]["trust_score"] = trust_score
        devices[device_id]["last_seen"] = current_time

    conn = get_db_connection()
    try:
        cur = conn.cursor()
        now = datetime.now(timezone.utc).isoformat()
        now_ts = datetime.now(timezone.utc).timestamp()
        
        # Update device information
        cur.execute("""
        INSERT INTO devices (id, hostname, os, os_version, architecture, last_seen, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET last_seen = excluded.last_seen
        """, (device_id, device_info.get("hostname"), device_info.get("os"), 
              device_info.get("os_version"), device_info.get("architecture"), now, now))
        
        # Record events to database
        record_events_batch(cur, device_id, events, now)
        
        # Append events to sliding window buffer (deque automatically maintains max size)
        global event_window
        processed_events = []
        for event in events:
            event_type = event.get("event_type", "unknown")

            # Ignore heartbeat events — they are keep-alive signals, not security telemetry
            if event_type == "heartbeat":
                continue

            # Process intelligence filtering
            proc_name = (event.get("process_name") or "").lower()

            # SAFE_PROCESSES → ignore completely, do not store in event_window
            if proc_name in SAFE_PROCESSES:
                continue

            # KNOWN_MALWARE → immediate critical alert + score reduction
            if proc_name in KNOWN_MALWARE:
                event["severity"] = "critical"
                event["event_type"] = "known_malware"
                _handle_malware_detection(device_id, proc_name, event, now_ts)

            # SUSPICIOUS_PROCESSES → tag for monitoring (flows into analyze_behavior)
            elif proc_name in SUSPICIOUS_PROCESSES:
                if event.get("severity") not in ("high", "critical"):
                    event["severity"] = "high"
                if event_type not in ("suspicious_process", "known_malware"):
                    event["event_type"] = "suspicious_process"

            event_with_metadata = {
                "device_id": device_id,
                "timestamp": now_ts,
                **event
            }
            processed_events.append(event_with_metadata)
            print(f"[Debug] Event appended to window: {event.get('event_type', 'unknown')} from {event.get('process_name', 'unknown')}")
            
            # Insert into logs table using SQLite INSERT query
            cur.execute(
                "INSERT INTO logs (device_id, process_name, event_type, severity, timestamp) VALUES (?, ?, ?, ?, ?)",
                (
                    device_id,
                    event.get("process_name", "Unknown"),
                    event_type,
                    event.get("severity", "low"),
                    safe_float_ts(event.get("timestamp"), fallback=now_ts)
                )
            )

        # Store entire payload in event_window so analyze_behavior() can iterate nested events
        if processed_events:
            event_window.append({
                "device_id": device_id,
                "events": processed_events
            })
        
        # Run analysis immediately after storing payload
        run_analysis()
        print("Analyzer executed")
        
        # Update last_risk_event for display
        global last_risk_event
        most_recent = events[-1]  # Usually last event in batch is most recent
        last_risk_event = {
            "event_type": most_recent.get("event_type", "Unknown"),
            "description": most_recent.get("description") or most_recent.get("details", {}).get("description") or "No details",
            "timestamp": safe_float_ts(most_recent.get("timestamp"), fallback=now_ts),
            "severity": most_recent.get("severity", "low"),
            "process_name": most_recent.get("process_name", "Unknown"),
        }
        
        conn.commit()
        print(f"[Debug] Calling analyze_behavior() — {len(events)} events stored")
        return len(events)
    
    except sqlite3.OperationalError as exc:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        print(f"[ERROR] store_payload: {e}")
        raise
    finally:
        conn.close()

# ================== ROUTES ==================

@app.route("/api/logs", methods=["GET"])
def get_logs():
    """Get last 100 logs ordered by timestamp DESC"""
    try:
        logs = get_all_logs(limit=100)
        return jsonify({
            "events": logs
        }), 200
    except Exception as e:
        print(f"[ERROR] get_logs: {e}")
        return jsonify({"events": [], "error": str(e)}), 500

@app.route("/api/trust-history", methods=["GET"])
def get_trust_history():
    """Get trust score change history (last 500 entries)"""
    return jsonify({
        "history": list(trust_score_history)
    }), 200

@app.route("/api/alerts", methods=["GET"])
def get_security_alerts():
    """Get recent security alerts (last 100 entries)"""
    return jsonify({
        "alerts": list(security_alerts)
    }), 200

@app.route("/api/debug-events", methods=["GET"])
def debug_events():
    """Debug endpoint: show raw event_window contents"""
    return jsonify({
        "window_size": len(event_window),
        "events": list(event_window)
    }), 200

@app.route("/api/devices", methods=["GET"])
def get_devices():
    """Get list of tracked devices with current status"""
    device_list = []
    for d in devices.values():
        score = d.get("trust_score", 100)
        if score >= 70:
            status = "Protected"
        elif score >= 40:
            status = "At Risk"
        else:
            status = "Critical"
        device_list.append({
            "device_id": d.get("device_id"),
            "hostname": d.get("hostname"),
            "os": d.get("os"),
            "os_version": d.get("os_version"),
            "architecture": d.get("architecture"),
            "trust_score": score,
            "status": status,
            "last_seen": d.get("last_seen"),
        })
    return jsonify({"devices": device_list}), 200

@app.route("/api/devices/<device_id>", methods=["GET"])
def get_device_detail(device_id):
    """Get detailed info for a single device including recent alerts"""
    d = devices.get(device_id)
    if not d:
        return jsonify({"error": "Device not found"}), 404

    score = d.get("trust_score", 100)
    if score >= 70:
        status = "Protected"
    elif score >= 40:
        status = "At Risk"
    else:
        status = "Critical"

    # Gather recent alerts (from security_alerts deque)
    device_alerts = [
        a for a in security_alerts
        if a.get("process_name") or True  # include all alerts (global scope)
    ]
    # Return most recent 10
    recent = sorted(device_alerts, key=lambda a: a.get("timestamp", ""), reverse=True)[:10]

    return jsonify({
        "device": {
            "device_id": d.get("device_id"),
            "hostname": d.get("hostname"),
            "os": d.get("os"),
            "os_version": d.get("os_version"),
            "architecture": d.get("architecture"),
            "trust_score": score,
            "status": status,
            "last_seen": d.get("last_seen"),
            "recent_alerts": recent,
        }
    }), 200

@app.route("/api/logs", methods=["POST"])
def receive_logs():
    """
    API endpoint to receive logs. Immediately appends to log_queue and returns success.
    Heavy processing (DB, YARA, etc.) is handled by log_queue_worker.
    """
    try:
        payload = request.get_json()
        if not payload:
            return jsonify({"error": "No payload"}), 400

        device_info = payload.get("device", {})
        events = payload.get("events", [])
        for event in events:
            log_queue.append({
                "device_id": device_info.get("id", ""),
                "log_entry": json.dumps({
                    "event_type": event.get("event_type", ""),
                    "process_name": event.get("process_name", ""),
                    "cmdline": event.get("cmdline", ""),
                    "timestamp": event.get("timestamp", "")
                }),
                "timestamp": event.get("timestamp", "")
            })

        # Update agent status/timestamp
        global agent_connected, last_heartbeat
        agent_connected = True
        last_heartbeat = datetime.now(timezone.utc).isoformat()
        return jsonify({"status": "success"}), 201
    except Exception as e:
        print(f"[ERROR] receive_logs: {e}")
        return jsonify({"error": "Failed to store payload"}), 500

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

@app.route("/api/system-status", methods=["GET"])
def get_system_status():
    """Get global system state (trust score, status, last risk event, isolation state, monitoring)"""
    import logging
    try:
        # Ensure all variables are initialized
        global monitoring_enabled, agent_connected, trust_score, system_status, last_risk_event
        if 'monitoring_enabled' not in globals(): monitoring_enabled = False
        if 'agent_connected' not in globals(): agent_connected = False
        if 'trust_score' not in globals(): trust_score = 100.0
        if 'system_status' not in globals(): system_status = "Protected"
        if 'last_risk_event' not in globals(): last_risk_event = None

        event = last_risk_event.copy() if last_risk_event else None
        if event and "timestamp" in event:
            ts = event["timestamp"]
            if isinstance(ts, str) and "T" in ts:
                event["timestamp"] = ts
            else:
                event["timestamp"] = datetime.fromtimestamp(float(ts), tz=timezone.utc).isoformat()

        # Agent status calculation: ensure UTC is used
        agent_status = False
        try:
            conn = get_db_connection()
            cur = conn.cursor()
            cur.execute("SELECT last_seen FROM devices ORDER BY last_seen DESC LIMIT 1")
            row = cur.fetchone()
            if row:
                last_seen = row[0]
                last_seen_dt = datetime.fromisoformat(last_seen)
                now_utc = datetime.now(timezone.utc)
                # Agent is online if last_seen within 30 seconds
                agent_status = (now_utc - last_seen_dt).total_seconds() < 30
            conn.close()
        except Exception as e:
            agent_status = False

        def sanitize(obj):
            if isinstance(obj, dict):
                return {k: sanitize(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [sanitize(v) for v in obj]
            elif callable(obj):
                return str(obj)
            elif isinstance(obj, (str, int, float, bool)) or obj is None:
                return obj
            else:
                return str(obj)
        event = sanitize(event)
        if not event:
            event = {
                "event_type": "None",
                "description": "No events yet",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "severity": "none",
                "process_name": "None"
            }
        backend_status = True
        response_dict = {
            "monitoring": monitoring_enabled() if callable(monitoring_enabled) else monitoring_enabled,
            "backend": backend_status() if callable(backend_status) else backend_status,
            "agent": agent_status,
            "trust_score": round(trust_score(), 1) if callable(trust_score) else round(trust_score, 1),
            "system_status": system_status() if callable(system_status) else system_status,
            "lastEvent": event,
            "isIsolated": system_status() == "Isolated" if callable(system_status) else system_status == "Isolated"
        }
        def sanitize(obj):
            if isinstance(obj, dict):
                return {k: sanitize(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [sanitize(v) for v in obj]
            elif callable(obj):
                return str(obj)
            elif isinstance(obj, (str, int, float, bool)) or obj is None:
                return obj
            else:
                return str(obj)
        response_dict = sanitize(response_dict)
        return jsonify(response_dict), 200
    except Exception as e:
        logging.error(f"[ERROR] get_system_status: {e}")
        return jsonify({"error": "Failed to get system status", "details": str(e)}), 500

    """Get timeline of threats ordered by timestamp DESC"""
    try:
        threats = get_all_threats()
        return jsonify({
            "threats": threats
        }), 200
    except Exception as e:
        print(f"[ERROR] get_threat_history: {e}")
        return jsonify({"threats": [], "error": str(e)}), 500

@app.route("/api/reset-monitoring", methods=["POST"])
def reset_monitoring():
    """Reset all monitoring data and restore trust score to 100."""
    global trust_score, system_status, last_risk_event, is_isolated, protection_active

    # Clear in-memory buffers
    security_alerts.clear()
    trust_score_history.clear()
    event_window.clear()
    last_risk_event = None
    is_isolated = False

    # Clear threat_history and logs tables in the database
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute("DELETE FROM threat_history")
        cur.execute("DELETE FROM logs")
        conn.commit()
    except Exception as e:
        print(f"[Reset] Error clearing database tables: {e}")
    finally:
        conn.close()

    # Reset trust score and system status
    trust_score = 100.0
    system_status = "Protected"
    record_trust_score_change(trust_score)
    protection_active = True

    print("[System] Protection started — buffers cleared, trust score reset to 100")
    print("[System] Protection started — buffers cleared, trust score reset to 100")
    return jsonify({
        "status": "success",
        "protection_active": True,
        "message": "Protection started. All monitoring buffers cleared and trust score reset."
    }), 200

@app.route("/api/stop-protection", methods=["POST"])
def stop_protection():
    """Disable protection — analysis will skip events."""
    global protection_active, monitoring_enabled
    protection_active = False
    monitoring_enabled = False
    print("[System] Protection stopped")
    return jsonify({"status": "success", "protection_active": False, "monitoring": False, "message": "Protection stopped"}), 200

@app.route("/api/system/restore", methods=["POST"])
def restore_system_endpoint():
    """
    API endpoint to restore system from isolated state.
    
    Requirements:
    - Only allow if system_status == "Isolated"
    - Reset trust_score to 80
    - Set system_status to "Protected"
    - Reset is_isolated flag
    """
    global trust_score, system_status, is_isolated
    
    # Simulate admin authorization for now
    auth_header = request.headers.get('Authorization', '')
    # Simple authorization check - in production, this should be proper JWT/OAuth
    
    if system_status != "Isolated":
        return jsonify({
            "error": "System is not isolated",
            "status": system_status
        }), 400
    
    # Restore the system
    trust_score = 80
    system_status = "Protected"
    is_isolated = False
    
    return jsonify({
        "status": "success",
        "message": "System restored from isolated state",
        "trustScore": round(trust_score, 1),
        "systemStatus": system_status,
        "isIsolated": False
    }), 200

def restore_system() -> bool:
    """
    Restore system by enabling all network adapters using PowerShell.
    
    Requirements:
    - Requires administrator privileges
    - Only runs if system_status == "Isolated"
    - Wraps in try/except with logging
    
    Returns:
    - True if restoration successful
    - False if restoration failed or not isolated
    """
    global system_status
    
    # Only restore if currently isolated
    if system_status != "Isolated":
        print("[Restoration] System is not isolated, skipping network restore")
        return False
    
    try:
        # PowerShell command to enable all network adapters
        ps_command = "Enable-NetAdapter -Name '*' -Confirm:$false"
        
        # Run PowerShell command 
        result = subprocess.run(
            ["powershell", "-Command", ps_command],
            capture_output=True,
            text=True,
            timeout=10
        )
        
        if result.returncode == 0:
            print(f"[Restoration] Network adapters enabled successfully")
            return True
        else:
            print(f"[Restoration] Failed to enable network adapters. Error: {result.stderr}")
            return False
    
    except subprocess.TimeoutExpired:
        print("[Restoration] PowerShell command timed out")
        return False
    except Exception as e:
        print(f"[Restoration] Error restoring network: {e}")
        return False

@app.route("/api/restore", methods=["POST"])
def restore_api():
    """
    API endpoint to restore system from isolated state.
    
    Steps:
    1. Call restore_system() to enable network adapters
    2. Reset trust_score to 40
    3. Update system_status to "Critical"
    4. Return success response
    """
    global trust_score, system_status, is_isolated
    
    try:
        # Enable network adapters
        restore_system()
        
        # Reset trust_score and update status
        trust_score = 40
        system_status = "Critical"
        is_isolated = False
        
        return jsonify({
            "status": "success",
            "message": "System restored with network enabled",
            "trustScore": round(trust_score, 1),
            "systemStatus": system_status,
            "isIsolated": False
        }), 200

    except Exception as e:
        print(f"[API] Error in /api/restore: {e}")
        return jsonify({"error": "Failed to restore system"}), 500

def is_pattern_cooled_down(pattern_name: str, now_ts: float) -> bool:
    """Check if pattern was detected in last 30 seconds, return True if cooldown expired.
    Uses last_trigger_time dict to prevent repeated score reductions for same threat type."""
    if pattern_name not in last_trigger_time:
        return True
    last_detection_ts = last_trigger_time[pattern_name]
    return (now_ts - last_detection_ts) >= ALERT_COOLDOWN_SECONDS_PATTERN

def mark_pattern_detected(pattern_name: str, now_ts: float):
    """Record the timestamp when this threat type last triggered a score reduction."""
    last_trigger_time[pattern_name] = now_ts

# Only analyze security-related event types
ALLOWED_EVENTS = [
    "failed_login",
    "privilege_escalation",
    "persistence_created",
    "suspicious_process",
    "suspicious_file",
    "network_beacon",
    "network_connection",
    "registry_modification",
    "process_start",
]

# Minimum event thresholds — avoid triggering from single/few events
# Event types not listed here trigger on any occurrence (e.g. persistence, priv esc)
EVENT_THRESHOLDS = {
    "failed_login": 10,       # 10+ failed logins in 30s
    "suspicious_process": 3,  # 3+ suspicious processes in 30s
    "suspicious_file": 3,     # 3+ suspicious files in 30s
}

# Noise event types that should never be analyzed
ANALYZER_IGNORED_EVENT_TYPES = {"ui_click", "navigation", "heartbeat"}

# Only analyze events from the agent — ignore frontend/UI sources
ANALYZER_IGNORED_SOURCES = {"frontend", "ui"}

# ================== COMMAND LINE INSPECTION ==================

_PS_SUSPICIOUS_KEYWORDS = [
    "encodedcommand", "-enc",
    "invoke-webrequest", "downloadstring",
    "invoke-expression",
]

_CMD_SUSPICIOUS_KEYWORDS = [
    "net user", "net localgroup",
    "whoami", "sc create", "reg add",
]

def is_suspicious_command(process_name: str, cmdline: str) -> bool:
    """Return True if the command line contains suspicious keywords for the given process.

    powershell.exe / pwsh.exe → check for encoded commands, download cradles, invoke-expression.
    cmd.exe → check for recon / persistence commands (net user, reg add, etc.).
    Other processes → always False (not inspected here).
    """
    if not cmdline:
        return False
    cmdline_lower = cmdline.lower()
    pname = process_name.lower()
    if pname in ("powershell.exe", "pwsh.exe"):
        return any(kw in cmdline_lower for kw in _PS_SUSPICIOUS_KEYWORDS)
    if pname == "cmd.exe":
        return any(kw in cmdline_lower for kw in _CMD_SUSPICIOUS_KEYWORDS)
    return False

def run_analysis():
    """
    Single-pass analysis that detects suspicious patterns in event_window.
    
    Patterns detected (with 30-second cooldown per pattern):
    - 10+ failed_login events in 30 seconds → -10 trust_score
    - Any persistence_created event → -20 trust_score
    - Any privilege_escalation event → -25 trust_score
    - Network anomalies → -15 trust_score
    - Suspicious process: same process_name >3 times in 20s → -15 trust_score
    
    Updates last_risk_event and system_status accordingly.
    Inserts into threat_history table whenever trust_score is reduced.
    Called directly after each payload is stored and also periodically by the background thread.
    """
    global trust_score, system_status, last_risk_event

    # Skip analysis if monitoring is not enabled
    global monitoring_enabled
    if not monitoring_enabled:
        return

    # Analyze last 200 events
    print(f"[Debug] Analyzing events in window: {len(event_window)}")
    if len(event_window) == 0:
        return
    
    # Flatten events from payload format: each item in event_window
    # is a payload dict with {"device_id": ..., "events": [...]}
    all_events = []
    for payload in list(event_window):
        for event in payload.get("events", []):
            all_events.append(event)

    # Filter to only security-related events with valid required fields
    recent_events_list = []
    for e in all_events[-200:]:
        print("Analyzing event:", e)
        etype = e.get("event_type")
        pname = e.get("process_name")
        tstamp = safe_float_ts(e.get("timestamp"))
        source = (e.get("source") or "").lower()

        # Only analyze events from the agent
        if source in ANALYZER_IGNORED_SOURCES:
            continue
        if source and source != "agent":
            continue

        # Skip events missing required fields
        if not etype or not pname or not tstamp:
            continue

        # Skip noise / non-security event types
        if etype in ANALYZER_IGNORED_EVENT_TYPES:
            continue
        if etype not in ALLOWED_EVENTS:
            continue

        # Skip events with unknown/null process_name
        if pname in ("unknown", "Unknown", "None") or pname is None:
            continue

        # Allow normal shell launches (cmd/powershell without malicious commands)
        if pname in ("cmd.exe", "powershell.exe", "pwsh.exe"):
            cmdline = (
                e.get("cmdline")
                or e.get("command_line")
                or e.get("process_name")
                or ""
            ).lower()
            # Escalate severity/risk for suspicious command lines
            if ("-enc" in cmdline or "-encodedcommand" in cmdline
                or any(rs in cmdline for rs in ["nc.exe", "ncat", "bash -i", "powershell -nop -w hidden -c", "socket", "connect", "reverse shell"])
                or any(ac in cmdline for ac in ["net user", "add user", "net localgroup administrators", "add"])
                or any(s in cmdline for s in ["download", "invoke-webrequest", "iex", "curl", "wget", "bypass", "payload", "meterpreter"])):
                e["severity"] = "critical"
                e["risk"] = "critical"
                print(f"[Analyzer] Escalated severity for suspicious command line: {cmdline}")
            else:
                # If not suspicious, skip
                continue
                continue

        recent_events_list.append(e)
    
    if not recent_events_list:
        return

    # Immediately penalize any event with severity/risk critical
    for e in recent_events_list:
        if (e.get("severity") == "critical" or e.get("risk") == "critical") and not e.get("trust_score_penalized"):
            trust_score_before = trust_score
            trust_score = max(0.0, trust_score - 20)
            record_trust_score_change(trust_score)
            record_security_alert("critical_event", e.get("process_name", "unknown"), "critical", trust_score, trust_score_before)
            print(f"[CRITICAL EVENT] Trust score dropped for: {e.get('process_name', 'unknown')} | Command: {e.get('cmdline', '')[:200]}")
            e["trust_score_penalized"] = True
    
    now_ts = datetime.now(timezone.utc).timestamp()
            
    # Immediate malware detection — check before any pattern analysis
    for e in recent_events_list:
        pname = (e.get("process_name") or "").lower()
        if pname in KNOWN_MALWARE and is_pattern_cooled_down(f"malware_{pname}", now_ts):
            mark_pattern_detected(f"malware_{pname}", now_ts)
            trust_score_before = trust_score
            trust_score = max(0.0, trust_score - 30)
            record_trust_score_change(trust_score)
            record_security_alert("known_malware", pname, "critical", trust_score, trust_score_before)
            print(f"[Debug] Suspicious pattern detected: known_malware")
            print(f"[Debug] Trust score updated: {trust_score}")
            current_time = datetime.now(timezone.utc).isoformat()
            last_risk_event = {
                "event_type": "known_malware",
                "description": f"Known malware detected: {pname}",
                "timestamp": current_time,
                "severity": "critical",
                "pattern": f"malware_{pname}",
                "process_name": pname,
            }
            # Insert into threat_history table
            db_conn = get_db_connection()
            try:
                cur = db_conn.cursor()
                cur.execute(
                    "INSERT INTO threat_history (event_type, severity, trust_score_before, trust_score_after, timestamp) VALUES (?, ?, ?, ?, ?)",
                    ("known_malware", "critical", trust_score_before, trust_score, current_time)
                )
                # Insert into logs table
                cur.execute(
                    "INSERT INTO logs (device_id, process_name, event_type, severity, timestamp) VALUES (?, ?, ?, ?, ?)",
                    (e.get("device_id", "unknown"), pname, "known_malware", "critical", current_time)
                )
                db_conn.commit()
            finally:
                db_conn.close()
            update_system_status()
            print(f"[MALWARE] Known malware detected in analysis: {pname}. Trust score: {trust_score_before} → {trust_score}")

    # Behavior check: PowerShell / CMD suspicious command-line keywords
    # Only triggers on genuinely dangerous patterns — normal shell usage is ignored.
    for e in recent_events_list:
        pname = (e.get("process_name") or "").lower()
        if pname not in ("powershell.exe", "pwsh.exe", "cmd.exe"):
            continue
        cmdline = (
            e.get("cmdline")
            or e.get("command_line")
            or e.get("process_name")
            or ""
        ).lower()
        if not is_suspicious_command(pname, cmdline):
            continue
        if is_pattern_cooled_down(f"suspicious_cmdline_{pname}", now_ts):
            mark_pattern_detected(f"suspicious_cmdline_{pname}", now_ts)
            trust_score_before = trust_score
            trust_score = max(0.0, trust_score - 20)
            record_trust_score_change(trust_score)
            record_security_alert("suspicious_cmdline", pname, "critical", trust_score, trust_score_before)
            current_time = datetime.now(timezone.utc).isoformat()
            print(f"[ATTACK DETECTED]")
            print(f"Process: {pname}")
            print(f"Command: {cmdline[:200]}")
            print(f"Trust Score Impact: -20")
            last_risk_event = {
                "event_type": "suspicious_cmdline",
                "description": f"Suspicious command detected in {pname}",
                "timestamp": current_time,
                "severity": "critical",
                "pattern": f"suspicious_cmdline_{pname}",
                "process_name": pname,
            }
            db_conn = get_db_connection()
            try:
                cur = db_conn.cursor()
                cur.execute(
                    "INSERT INTO threat_history (event_type, severity, trust_score_before, trust_score_after, timestamp) VALUES (?, ?, ?, ?, ?)",
                    ("suspicious_cmdline", "critical", trust_score_before, trust_score, current_time)
                )
                cur.execute(
                    "INSERT INTO logs (device_id, process_name, event_type, severity, timestamp) VALUES (?, ?, ?, ?, ?)",
                    (e.get("device_id", "unknown"), pname, "suspicious_cmdline", "critical", current_time)
                )
                db_conn.commit()
            finally:
                db_conn.close()
            update_system_status()

    # ---- Explicit attack detection rules ----
    # Each rule inspects process_name + cmdline for specific attack signatures.
    # Rules use per-pattern 30-second cooldown to avoid duplicate penalties.
    ATTACK_RULES = [
        {
            "name": "reverse_shell",
            "severity": "critical",
            "penalty": 30,
            "description": "Reverse shell attempt detected",
            "match": lambda pname, cmdline: "nc.exe" in pname,
        },
        {
            "name": "privilege_enum",
            "severity": "medium",
            "penalty": 10,
            "description": "Privilege enumeration detected (whoami /priv)",
            "match": lambda pname, cmdline: "whoami /priv" in cmdline,
        },
        {
            "name": "admin_creation",
            "severity": "critical",
            "penalty": 25,
            "description": "Local admin account creation attempt",
            "match": lambda pname, cmdline: "net user" in cmdline and pname == "cmd.exe",
        },
        {
            "name": "persistence_reg_run",
            "severity": "critical",
            "penalty": 20,
            "description": "Registry Run key persistence detected",
            "match": lambda pname, cmdline: "reg add" in cmdline and "currentversion\\run" in cmdline,
        },
        {
            "name": "encoded_powershell",
            "severity": "critical",
            "penalty": 20,
            "description": "Encoded PowerShell execution detected",
            "match": lambda pname, cmdline: pname in ("powershell.exe", "pwsh.exe") and ("-enc " in cmdline or cmdline.endswith("-enc") or "-encodedcommand" in cmdline),
        },
    ]

    for e in recent_events_list:
        pname = (e.get("process_name") or "").lower()
        cmdline = (
            e.get("cmdline")
            or e.get("command_line")
            or e.get("process_name")
            or ""
        ).lower()
        for rule in ATTACK_RULES:
            if not rule["match"](pname, cmdline):
                continue
            pattern_key = f"attack_{rule['name']}_{pname}"
            if not is_pattern_cooled_down(pattern_key, now_ts):
                continue
            mark_pattern_detected(pattern_key, now_ts)
            trust_score_before = trust_score
            trust_score = max(0.0, trust_score - rule["penalty"])
            record_trust_score_change(trust_score)
            record_security_alert(rule["name"], pname, rule["severity"], trust_score, trust_score_before)
            current_time = datetime.now(timezone.utc).isoformat()
            last_risk_event = {
                "event_type": rule["name"],
                "description": rule["description"],
                "timestamp": current_time,
                "severity": rule["severity"],
                "pattern": pattern_key,
                "process_name": pname,
            }
            db_conn = get_db_connection()
            try:
                cur = db_conn.cursor()
                cur.execute(
                    "INSERT INTO threat_history (event_type, severity, trust_score_before, trust_score_after, timestamp) VALUES (?, ?, ?, ?, ?)",
                    (rule["name"], rule["severity"], trust_score_before, trust_score, current_time)
                )
                cur.execute(
                    "INSERT INTO logs (device_id, process_name, event_type, severity, timestamp) VALUES (?, ?, ?, ?, ?)",
                    (e.get("device_id", "unknown"), pname, rule["name"], rule["severity"], current_time)
                )
                db_conn.commit()
            finally:
                db_conn.close()
            update_system_status()
            print(f"[ATTACK DETECTED]")
            print(f"Process: {pname}")
            print(f"Command: {cmdline[:200]}")
            print(f"Trust Score Impact: -{rule['penalty']}")

    # Pattern 1: Failed login burst (10+ in 30 seconds)
    failed_logins = [
        e for e in recent_events_list 
        if e.get("event_type") == "failed_login" 
        and (now_ts - safe_float_ts(e.get("timestamp"), fallback=0)) < 30
    ]
    if len(failed_logins) > EVENT_THRESHOLDS["failed_login"] and is_pattern_cooled_down("failed_login_burst", now_ts):
        mark_pattern_detected("failed_login_burst", now_ts)
        trust_score_before = trust_score
        trust_score = max(0.0, trust_score - 10)
        record_trust_score_change(trust_score)
        record_security_alert("failed_login_burst", failed_logins[0].get("process_name", "unknown"), "critical", trust_score, trust_score_before)
        print(f"[Debug] Suspicious pattern detected: failed_login_burst")
        print(f"[Debug] Trust score updated: {trust_score}")
        current_time = datetime.now(timezone.utc).isoformat()
        last_risk_event = {
            "event_type": "failed_login_burst",
            "description": f"Failed login burst detected: {len(failed_logins)} attempts in 30 seconds",
            "timestamp": current_time,
            "severity": "critical",
            "pattern": "failed_login_burst"
        }
        # Insert into threat_history and logs tables
        conn = get_db_connection()
        try:
            cur = conn.cursor()
            cur.execute(
                "INSERT INTO threat_history (event_type, severity, trust_score_before, trust_score_after, timestamp) VALUES (?, ?, ?, ?, ?)",
                ("failed_login_burst", "critical", trust_score_before, trust_score, current_time)
            )
            cur.execute(
                "INSERT INTO logs (device_id, process_name, event_type, severity, timestamp) VALUES (?, ?, ?, ?, ?)",
                (failed_logins[0].get("device_id", "unknown"), failed_logins[0].get("process_name", "unknown"), "failed_login_burst", "critical", current_time)
            )
            conn.commit()
        finally:
            conn.close()
        update_system_status()
        print(f"[Analysis] Failed login burst detected. Trust score: {trust_score}")
        return
    
    # Pattern 1b: Suspicious process burst detection
    # Triggers when ALL conditions are met:
    #   1. Same process_name appears >5 times within 15 seconds
    #   2. Process is not in SAFE_PROCESSES
    #   3. Command line is suspicious (via is_suspicious_command)
    # Penalty: -10 trust score. Counter cleared after alert.
    suspicious_counts: Dict[str, int] = {}
    for e in recent_events_list:
        pname = (e.get("process_name") or "").lower()
        if pname in SAFE_PROCESSES:
            continue
        e_ts = safe_float_ts(e.get("timestamp"))
        if (now_ts - e_ts) >= 15:
            continue
        cmdline = (
            e.get("cmdline")
            or e.get("command_line")
            or e.get("process_name")
            or ""
        ).lower()
        if not is_suspicious_command(pname, cmdline):
            continue
        suspicious_counts[pname] = suspicious_counts.get(pname, 0) + 1

    for pname, count in suspicious_counts.items():
        if count > 5 and is_pattern_cooled_down(f"suspicious_proc_{pname}", now_ts):
            mark_pattern_detected(f"suspicious_proc_{pname}", now_ts)
            trust_score_before = trust_score
            trust_score = max(0.0, trust_score - 10)
            record_trust_score_change(trust_score)
            record_security_alert("suspicious_process_burst", pname, "high", trust_score, trust_score_before)
            current_time = datetime.now(timezone.utc).isoformat()
            last_risk_event = {
                "event_type": "suspicious_process_burst",
                "description": f"Suspicious process burst: {pname} appeared {count} times in 15 seconds with suspicious cmdline",
                "timestamp": current_time,
                "severity": "high",
                "pattern": f"suspicious_proc_{pname}",
                "process_name": pname,
            }
            db_conn = get_db_connection()
            try:
                cur = db_conn.cursor()
                cur.execute(
                    "INSERT INTO threat_history (event_type, severity, trust_score_before, trust_score_after, timestamp) VALUES (?, ?, ?, ?, ?)",
                    ("suspicious_process_burst", "high", trust_score_before, trust_score, current_time)
                )
                cur.execute(
                    "INSERT INTO logs (device_id, process_name, event_type, severity, timestamp) VALUES (?, ?, ?, ?, ?)",
                    ("unknown", pname, "suspicious_process_burst", "high", current_time)
                )
                db_conn.commit()
            finally:
                db_conn.close()
            update_system_status()
            # Clear counter after alert to prevent re-firing on same batch
            suspicious_counts[pname] = 0
            print(f"[ATTACK DETECTED]")
            print(f"Process: {pname}")
            print(f"Command: (burst — {count}x in 15s)")
            print(f"Trust Score Impact: -10")

    # Pattern 1c: Suspicious file burst (3+ in 30 seconds)
    suspicious_files = [
        e for e in recent_events_list
        if e.get("event_type") == "suspicious_file"
        and (now_ts - safe_float_ts(e.get("timestamp"), fallback=0)) < 30
    ]
    if len(suspicious_files) >= EVENT_THRESHOLDS["suspicious_file"] and is_pattern_cooled_down("suspicious_file_burst", now_ts):
        mark_pattern_detected("suspicious_file_burst", now_ts)
        trust_score_before = trust_score
        trust_score = max(0.0, trust_score - 10)
        record_trust_score_change(trust_score)
        record_security_alert("suspicious_file_burst", suspicious_files[0].get("process_name", "unknown"), "medium", trust_score, trust_score_before)
        print(f"[Debug] Suspicious pattern detected: suspicious_file_burst")
        print(f"[Debug] Trust score updated: {trust_score}")
        current_time = datetime.now(timezone.utc).isoformat()
        last_risk_event = {
            "event_type": "suspicious_file_burst",
            "description": f"Suspicious file burst: {len(suspicious_files)} suspicious files in 30 seconds",
            "timestamp": current_time,
            "severity": "medium",
            "pattern": "suspicious_file_burst"
        }
        conn = get_db_connection()
        try:
            cur = conn.cursor()
            cur.execute(
                "INSERT INTO threat_history (event_type, severity, trust_score_before, trust_score_after, timestamp) VALUES (?, ?, ?, ?, ?)",
                ("suspicious_file_burst", "medium", trust_score_before, trust_score, current_time)
            )
            cur.execute(
                "INSERT INTO logs (device_id, process_name, event_type, severity, timestamp) VALUES (?, ?, ?, ?, ?)",
                (suspicious_files[0].get("device_id", "unknown"), suspicious_files[0].get("process_name", "unknown"), "suspicious_file_burst", "medium", current_time)
            )
            conn.commit()
        finally:
            conn.close()
        update_system_status()
        print(f"[Analysis] Suspicious file burst detected ({len(suspicious_files)} files). Trust score: {trust_score}")
        return

    # Pattern 2: Persistence created event (single event is critical)
    persistence_events = [
        e for e in recent_events_list 
        if e.get("event_type") == "persistence_created"
    ]
    if persistence_events and is_pattern_cooled_down("persistence_detected", now_ts):
        mark_pattern_detected("persistence_detected", now_ts)
        trust_score_before = trust_score
        trust_score = max(0.0, trust_score - 20)
        record_trust_score_change(trust_score)
        record_security_alert("persistence_created", persistence_events[0].get("process_name", "unknown"), "critical", trust_score, trust_score_before)
        print(f"[Debug] Suspicious pattern detected: persistence_created")
        print(f"[Debug] Trust score updated: {trust_score}")
        current_time = datetime.now(timezone.utc).isoformat()
        last_risk_event = {
            "event_type": "persistence_created",
            "description": f"Persistence mechanism detected: {persistence_events[0].get('description', 'Unknown')}",
            "timestamp": current_time,
            "severity": "critical",
            "pattern": "persistence_detected"
        }
        # Insert into threat_history and logs tables
        conn = get_db_connection()
        try:
            cur = conn.cursor()
            cur.execute(
                "INSERT INTO threat_history (event_type, severity, trust_score_before, trust_score_after, timestamp) VALUES (?, ?, ?, ?, ?)",
                ("persistence_created", "critical", trust_score_before, trust_score, current_time)
            )
            cur.execute(
                "INSERT INTO logs (device_id, process_name, event_type, severity, timestamp) VALUES (?, ?, ?, ?, ?)",
                (persistence_events[0].get("device_id", "unknown"), persistence_events[0].get("process_name", "unknown"), "persistence_created", "critical", current_time)
            )
            conn.commit()
        finally:
            conn.close()
        update_system_status()
        print(f"[Analysis] Persistence mechanism detected. Trust score: {trust_score}")
        return
    
    # Pattern 3: Privilege escalation event
    priv_esc_events = [
        e for e in recent_events_list 
        if e.get("event_type") == "privilege_escalation"
    ]
    if priv_esc_events and is_pattern_cooled_down("privilege_escalation_detected", now_ts):
        mark_pattern_detected("privilege_escalation_detected", now_ts)
        trust_score_before = trust_score
        trust_score = max(0.0, trust_score - 25)
        record_trust_score_change(trust_score)
        record_security_alert("privilege_escalation", priv_esc_events[0].get("process_name", "unknown"), "critical", trust_score, trust_score_before)
        print(f"[Debug] Suspicious pattern detected: privilege_escalation")
        print(f"[Debug] Trust score updated: {trust_score}")
        current_time = datetime.now(timezone.utc).isoformat()
        last_risk_event = {
            "event_type": "privilege_escalation",
            "description": f"Privilege escalation detected: {priv_esc_events[0].get('description', 'Unknown')}",
            "timestamp": current_time,
            "severity": "critical",
            "pattern": "privilege_escalation_detected"
        }
        # Insert into threat_history and logs tables
        conn = get_db_connection()
        try:
            cur = conn.cursor()
            cur.execute(
                "INSERT INTO threat_history (event_type, severity, trust_score_before, trust_score_after, timestamp) VALUES (?, ?, ?, ?, ?)",
                ("privilege_escalation", "critical", trust_score_before, trust_score, current_time)
            )
            cur.execute(
                "INSERT INTO logs (device_id, process_name, event_type, severity, timestamp) VALUES (?, ?, ?, ?, ?)",
                (priv_esc_events[0].get("device_id", "unknown"), priv_esc_events[0].get("process_name", "unknown"), "privilege_escalation", "critical", current_time)
            )
            conn.commit()
        finally:
            conn.close()
        update_system_status()
        print(f"[Analysis] Privilege escalation detected. Trust score: {trust_score}")
        return
    
    # Pattern 4: Network anomaly detection
    # Only count connections to external public IPs within 10 seconds
    def is_external_ip(ip):
        """Return True if IP is a public/external address"""
        if not ip:
            return False
        if ip in ("127.0.0.1", "localhost", "0.0.0.0", "::1"):
            return False
        if ip.startswith("192.168.") or ip.startswith("10.") or ip.startswith("172."):
            return False
        return True

    network_events = [
        e for e in recent_events_list 
        if e.get("event_type") in ("network_connect", "network_connection", "network_beacon")
        and (now_ts - safe_float_ts(e.get("timestamp"), fallback=0)) < 10
        and is_external_ip(
            e.get("destination_ip") or e.get("remote_ip") or ""
        )
    ]
    
    if len(network_events) > 50 and is_pattern_cooled_down("excessive_external_connections", now_ts):
        mark_pattern_detected("excessive_external_connections", now_ts)
        trust_score_before = trust_score
        trust_score = max(0.0, trust_score - 15)
        record_trust_score_change(trust_score)
        record_security_alert("network_anomaly", network_events[0].get("process_name", "unknown"), "high", trust_score, trust_score_before)
        print(f"[Debug] Suspicious pattern detected: network_anomaly")
        print(f"[Debug] Trust score updated: {trust_score}")
        current_time = datetime.now(timezone.utc).isoformat()
        last_risk_event = {
            "event_type": "network_anomaly",
            "description": f"Excessive external connections: {len(network_events)} connections to public IPs in 10 seconds",
            "timestamp": current_time,
            "severity": "high",
            "pattern": "excessive_external_connections"
        }
        db_conn = get_db_connection()
        try:
            cur = db_conn.cursor()
            cur.execute(
                "INSERT INTO threat_history (event_type, severity, trust_score_before, trust_score_after, timestamp) VALUES (?, ?, ?, ?, ?)",
                ("network_anomaly", "high", trust_score_before, trust_score, current_time)
            )
            cur.execute(
                "INSERT INTO logs (device_id, process_name, event_type, severity, timestamp) VALUES (?, ?, ?, ?, ?)",
                (network_events[0].get("device_id", "unknown"), network_events[0].get("process_name", "unknown"), "network_anomaly", "high", current_time)
            )
            db_conn.commit()
        finally:
            db_conn.close()
        update_system_status()
        print(f"[Analysis] Excessive external connections ({len(network_events)} in 10s). Trust score: {trust_score}")
        return
    
    # === Automatic system isolation rule ===
    global system_status
    if trust_score <= 20 and system_status != "Isolated":
        if isolate_system():
            system_status = "Isolated"
            record_security_alert(
                "system_isolation",
                "SYSTEM",
                "critical",
                trust_score,
                trust_score + 0  # No change, just for alert
            )
            print("[ATTACK DETECTED]")
            print("System automatically isolated due to critical threat activity")
            print(f"Trust Score: {trust_score}")
            last_risk_event = {
                "event_type": "system_isolation",
                "description": "System automatically isolated due to critical threat activity",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "severity": "critical",
                "pattern": "system_isolation",
                "process_name": "SYSTEM",
            }
            update_system_status()
    # No patterns matched in this cycle
    print("[Debug] No suspicious activity detected")


def analyze_behavior():
    """
    Background analysis thread — periodic monitoring only.
    run_analysis() is called exclusively from store_payload().
    """
    while True:
        try:
            time.sleep(5)
            # Analysis is now triggered only by store_payload()
        except Exception as e:
            print(f"[Analysis] Error in behavior analysis thread: {e}")

def recovery_loop():
    """
    Background recovery thread that restores trust_score over time.
    
    Every 15 seconds:
    - If trust_score < 100 and system_status != "Isolated"
    - Increase trust_score by 1
    - Cap at 100
    """
    global trust_score, system_status
    
    while True:
        try:
            time.sleep(15)
            
            # Only recover if not isolated and not at max score
            if trust_score < 100 and system_status != "Isolated":
                trust_score = min(100.0, trust_score + 1)
                print(f"[Recovery] Trust score increased to {trust_score}")
        except Exception as e:
            print(f"[Recovery] Error in recovery loop: {e}")

def recovery_thread_worker():
    """Background thread that recovers trust score every 10 seconds if not isolated"""
    global trust_score, system_status
    
    while True:
        try:
            time.sleep(10)
            
            # Only recover if not isolated and not at max score
            if trust_score < 100 and system_status != "Isolated":
                trust_score = min(100.0, trust_score + 1)
                print(f"[Recovery] Trust score increased to {trust_score}")
        except Exception as e:
            print(f"[Recovery] Error in recovery thread: {e}")

def cleanup_loop():
    """Background thread that auto-cleans monitoring data every 15 minutes."""
    while True:
        try:
            time.sleep(900)  # 15 minutes

            security_alerts.clear()
            trust_score_history.clear()

            conn = get_db_connection()
            try:
                cur = conn.cursor()
                cur.execute("DELETE FROM threat_history")
                cur.execute("DELETE FROM logs")
                conn.commit()
            except Exception as e:
                print(f"[Cleanup] Error clearing database tables: {e}")
            finally:
                conn.close()

            print("[Cleanup] Monitoring data auto-cleaned")
        except Exception as e:
            print(f"[Cleanup] Error in cleanup thread: {e}")

if __name__ == "__main__":
    init_db()
    
    # Start background analysis thread
    analysis_thread = threading.Thread(target=analyze_behavior, daemon=True)
    analysis_thread.start()
    print("[System] Background behavior analysis thread started")
    
    # Start background recovery thread
    recovery_thread = threading.Thread(target=recovery_loop, daemon=True)
    recovery_thread.start()
    print("[System] Background recovery loop started")

    # Start background cleanup thread
    cleanup_thread = threading.Thread(target=cleanup_loop, daemon=True)
    cleanup_thread.start()
    print("[System] Background cleanup loop started (every 15 minutes)")
    
def initialize_database():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            device_id TEXT,
            event_type TEXT,
            process_name TEXT,
            cmdline TEXT,
            timestamp TEXT
        )
        """)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            process_name TEXT,
            severity TEXT,
            event_type TEXT,
            timestamp TEXT
        )
        """)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS trust_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            trust_score INTEGER,
            timestamp TEXT
        )
        """)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS threat_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_type TEXT,
            severity TEXT,
            timestamp TEXT
        )
        """)
        conn.commit()
        conn.close()
        print("[Database] Initialization successful.")
    except Exception as e:
        print(f"[Database] Initialization failed: {e}")
        # Log error but allow backend to start

# Ensure database is initialized before server starts
initialize_database()

# API Endpoints
from flask import jsonify, request


@app.route("/api/system-status", methods=["GET"])
def system_status():
    global protection_active, agent_connected
    return jsonify({
        "protection_active": protection_active,
        "agent_connected": agent_connected if 'agent_connected' in globals() else False,
        "backend_running": True
    })

@app.route("/api/alerts", methods=["GET"])
def get_alerts():
    # Return last 100 alerts
    return jsonify(list(security_alerts))


@app.route("/api/threat-history", methods=["GET"])
def get_threat_history():
    return jsonify(get_all_threats())

    protection_active = True
    print("[SYSTEM] Protection started")
    return jsonify({"status": "success", "protection_active": True, "message": "Protection started"})


import logging
@app.route("/api/logs", methods=["POST"])
def logs():
    try:
        data = request.get_json(force=True)
        device_id = data.get("device_id")
        log_entry = data.get("log_entry")
        timestamp = data.get("timestamp", datetime.now(timezone.utc).isoformat())
        log_queue.append({"device_id": device_id, "log_entry": log_entry, "timestamp": timestamp})

        # Update agent last_seen in DB and global
        try:
            conn = get_db_connection()
            cur = conn.cursor()
            cur.execute("""
                INSERT INTO devices (id, last_seen)
                VALUES (?, ?)
                ON CONFLICT(id) DO UPDATE SET last_seen = excluded.last_seen
            """, (device_id, timestamp))
            conn.commit()
            conn.close()
        except Exception as e:
            logging.error(f"[ERROR] updating agent last_seen: {e}")

        global agent_connected, last_seen
        agent_connected = True
        last_seen = timestamp

        return jsonify({"status": "success", "message": "Log entry queued."}), 201
    except Exception as e:
        logging.error(f"[ERROR] logs: {e}")
        return jsonify({"error": "Failed to queue log entry", "details": str(e)}), 503
if __name__ == '__main__':
    print("[System] Background cleanup loop started (every 15 minutes)")
    app.run(host="0.0.0.0", port=5000, debug=True)