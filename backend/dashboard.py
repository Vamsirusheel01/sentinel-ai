from flask import Flask, render_template, request
import pandas as pd
import sqlite3

app = Flask(__name__)
DB = "sentinel.db"


@app.route("/dashboard")
def dashboard():

    device = request.args.get("device")
    process = request.args.get("process")

    conn = sqlite3.connect(DB)

    query = "SELECT * FROM process_events WHERE 1=1"

    if device:
        query += f" AND device_id='{device}'"

    if process:
        query += f" AND process_name LIKE '%{process}%'"

    df = pd.read_sql(query, conn)

    return df.to_html(classes="table", index=False)


if __name__ == "__main__":
    app.run(port=6000,debug=True)