from flask import Flask, request, redirect, url_for
import pandas as pd
import sqlite3

app = Flask(__name__)
DB = "database.db"


def _load_agent_payloads(conn):
    query = """
    SELECT id, device_id, payload_type, raw_payload, received_at
    FROM agent_payloads
    ORDER BY id DESC
    LIMIT 100
    """
    return pd.read_sql(query, conn)


@app.route("/")
def index():
    return redirect(url_for("dashboard"))


@app.route("/dashboard")
def dashboard():

    device = request.args.get("device")
    process = request.args.get("process")

    conn = sqlite3.connect(DB)

    try:
        df = _load_agent_payloads(conn)
    except Exception:
        conn.close()
        return "No payloads available yet. Start backend and agent to populate database.", 200

    conn.close()

    if device:
        df = df[df["device_id"] == device]

    if process:
        df = df[df["raw_payload"].str.contains(process, na=False)]

    return df.to_html(classes="table", index=False)


if __name__ == "__main__":
    app.run(port=6000,debug=True)