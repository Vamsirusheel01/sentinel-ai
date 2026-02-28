import time
from datetime import datetime

from agent.identity.identity import collect_identity
from agent.collectors.process.process_collector import collect_process_events
from agent.collectors.network.network_collector import collect_network_events
from agent.collectors.filesystem.filesystem_collector import collect_filesystem_events
from agent.collectors.persistence.persistence_collector import collect_persistence_events
from agent.collectors.privilege.privilege_collector import collect_privilege_events

from agent.normalizer.normalizer import normalize
from agent.deduplicator.deduplicator import deduplicate
from agent.correlator.correlator import correlate
from agent.local_risk_evaluator.risk_evaluator import evaluate
from agent.buffer.event_buffer import push, flush
from agent.sender.sender import send


def run():
    identity = collect_identity()
    print("[Sentinel Agent] Started. Identity:", identity)

    while True:
        print(f"\n[{datetime.now().strftime('%H:%M:%S')}] Collecting telemetry...")
        
        events = []
        events += collect_process_events()
        events += collect_network_events()
        events += collect_filesystem_events()
        events += collect_persistence_events()
        events += collect_privilege_events()

        events = [normalize(e) for e in events]
        events = deduplicate(events)
        events = correlate(events)
        events = evaluate(events)

        # Include device identity in every heartbeat for the backend to recognize
        payload = {
            "device": identity,
            "events": events,
            "timestamp": datetime.utcnow().isoformat()
        }

        # DEBUG: See what is being sent
        print(f"\n[Sentinel Agent] Sending payload at {payload['timestamp']}")
        print(f"[Sentinel Agent] Total Events: {len(events)}")
        if events:
            display_count = min(len(events), 10)
            print(f"[Sentinel Agent] Sample of first {display_count} events being sent:")
            for i, e in enumerate(events[:display_count]):
                name = e.get('process_name', 'N/A')
                cmd = e.get('cmdline', 'N/A')
                print(f"  {i+1:2}. {name:<20} | {cmd[:80]}...")
            if len(events) > display_count:
                print(f"  ... and {len(events) - display_count} more events.")
        print("-" * 30)

        # Send and get feedback
        feedback = send(payload)
        
        if feedback:
            trust_score = feedback.get("trust_score", "N/A")
            msg = feedback.get("feedback", "")
            print(f"[Sentinel Agent] Feedback Received -> Trust Score: {trust_score} | Msg: {msg}")
        else:
            print("[Sentinel Agent] Warning: No feedback received from backend.")

        # Faster polling improves capture of short-lived processes like whoami
        time.sleep(1)