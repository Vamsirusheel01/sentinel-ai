from flask import Flask, request, jsonify
import sqlite3
from datetime import datetime

app = Flask(__name__)

DB = "database.db"


# ------------------ DATABASE INIT ------------------

def init_db():
    conn = sqlite3.connect(DB)
    cur = conn.cursor()

    cur.execute("""
    CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id TEXT,
        cpu REAL,
        ram REAL,
        processes INTEGER,
        ip TEXT,
        timestamp TEXT
    )
    """)

    conn.commit()
    conn.close()


# ------------------ API ROUTES ------------------

@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "status": "Sentinel AI Server Running",
        "time": str(datetime.now())
    })


# Receive data from agent
@app.route("/api/logs", methods=["POST"])
def receive_logs():

    data = request.json

    device_id = data.get("device_id")
    cpu = data.get("cpu")
    ram = data.get("ram")
    processes = data.get("processes")
    ip = data.get("ip")

    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    conn = sqlite3.connect(DB)
    cur = conn.cursor()

    cur.execute("""
    INSERT INTO logs
    (device_id, cpu, ram, processes, ip, timestamp)
    VALUES (?, ?, ?, ?, ?, ?)
    """, (device_id, cpu, ram, processes, ip, timestamp))

    conn.commit()
    conn.close()

    return jsonify({
        "message": "Log received",
        "device_id": device_id
    }), 201


# View logs (for admin/testing)
@app.route("/api/logs", methods=["GET"])
def view_logs():

    conn = sqlite3.connect(DB)
    cur = conn.cursor()

    cur.execute("SELECT * FROM logs ORDER BY id DESC")
    rows = cur.fetchall()

    conn.close()

    logs = []

    for row in rows:
        logs.append({
            "id": row[0],
            "device_id": row[1],
            "cpu": row[2],
            "ram": row[3],
            "processes": row[4],
            "ip": row[5],
            "timestamp": row[6]
        })

    return jsonify(logs)


# ------------------ MAIN ------------------

if __name__ == "__main__":

    init_db()

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )
