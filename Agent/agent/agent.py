import time

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
    print("[Sentinel Agent] Identity:", identity)

    while True:
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

        push(events)

        send(flush())
        time.sleep(15)