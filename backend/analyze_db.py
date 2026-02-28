import joblib
import pandas as pd
import sqlite3
import numpy as np
from train_model import batch_extract_features, FEATURE_NAMES

# Load model
MODEL = joblib.load('ml/sentinel_model.pkl')

def analyze():
    conn = sqlite3.connect('database.db')
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    
    cur.execute("SELECT * FROM process_events ORDER BY timestamp DESC LIMIT 5000")
    rows = cur.fetchall()
    
    events = []
    for r in rows:
        events.append({
            'event_type': 'process_start',
            'details': {
                'cmdline': r['cmdline'] or "",
                'process_name': r['process_name'] or ""
            }
        })
        
    if not events:
        print("No events found")
        return

    features_df = batch_extract_features(events)
    probs = MODEL.predict_proba(features_df)[:, 1]
    
    # Bundle results for reporting
    results = []
    for i in range(len(probs)):
        results.append({
            "prob": probs[i],
            "cmd": events[i]['details']['cmdline'],
            "feat": features_df.iloc[i].to_dict()
        })
        
    # Sort by probability
    results.sort(key=lambda x: x["prob"], reverse=True)
    
    print("--- Top Suspicious Processes Analysis ---")
    seen = set()
    count = 0
    for res in results:
        cmd = res["cmd"]
        if cmd in seen: continue
        if res["prob"] < 0.05: continue
        
        f = res["feat"]
        print(f"Prob: {res['prob']:.4f} | Kw: {int(f['has_keyword'])} | Ent: {f['entropy']:.3f} | S32: {int(f['from_system32'])} | Cmd: {cmd[:100]}")
        seen.add(cmd)
        count += 1
        if count >= 30: break

if __name__ == "__main__":
    analyze()
