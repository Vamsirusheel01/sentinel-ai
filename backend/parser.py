import json
import sqlite3

DB = "sentinel.db"


def insert_payload(data):

    conn = sqlite3.connect(DB)
    cur = conn.cursor()

    payload = data["payload"]

    # RAW
    cur.execute("""
    INSERT INTO raw_events
    (device_id, context_id, payload_json, received_at)
    VALUES (?,?,?,?)
    """, (
        payload["device"]["device_id"],
        payload["context_id"],
        json.dumps(payload),
        data["received_at"]
    ))


    device = payload["device"]

    # SYSTEM
    cur.execute("""
    INSERT INTO system_info
    (device_id, os, arch, os_version, hostname, timestamp)
    VALUES (?,?,?,?,?,?)
    """, (
        device["device_id"],
        device["os"],
        device["architecture"],
        device["os_version"],
        device["hostname"],
        payload["created_at"]
    ))


    # EVENTS
    for e in payload["events"]:

        if e["event_type"] == "process_start":

            d = e["details"]

            cur.execute("""
            INSERT INTO process_events
            (device_id,timestamp,pid,ppid,process_name,cmd_length,username)
            VALUES (?,?,?,?,?,?,?)
            """, (
                device["device_id"],
                d["timestamp"],
                d["pid"],
                d["ppid"],
                d["process_name"],
                len(d.get("cmdline","")),
                d["username"]
            ))


        if e["event_type"] == "file_modified":

            d = e["details"]

            cur.execute("""
            INSERT INTO file_events
            (device_id,timestamp,file_path,event_count,hash_missing)
            VALUES (?,?,?,?,?)
            """, (
                device["device_id"],
                d["timestamp"],
                d["file_path"],
                e["count"],
                int(d["hash"] is None)
            ))


    user = payload["user"]

    cur.execute("""
    INSERT INTO user_sessions
    (device_id,username,session_type,login_time,logout_time,failed_logins)
    VALUES (?,?,?,?,?,?)
    """, (
        device["device_id"],
        user["username"],
        user["session_type"],
        payload["created_at"],
        None,
        0
    ))

    conn.commit()
    conn.close()