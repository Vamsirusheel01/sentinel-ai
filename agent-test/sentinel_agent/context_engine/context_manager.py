# sentinel_agent/context_engine/context_manager.py

import time
import uuid
import threading

from context_engine.context_lifecycle import ContextLifecycle
from context_engine.context_graph import ContextGraph

from raw_store.writer import write_raw_event

from cleaner.normalizer import normalize_event
from cleaner.validator import validate_event
from cleaner.deduplicator import deduplicate_events
from cleaner.aggregator import aggregate_events

from buffer.queue import enqueue


# --------------------------------------------------
# PAYLOAD TYPE CLASSIFIER (ADDED)
# --------------------------------------------------

def classify_payload(events):
    """
    Classifies a context based on contained event types
    """
    event_types = {e["event_type"] for e in events}

    if "persistence_created" in event_types:
        return "persistence_activity"

    if "network_connect" in event_types and "process_start" in event_types:
        return "process_network_activity"

    if any(t.startswith("file_") for t in event_types):
        return "filesystem_activity"

    if "process_start" in event_types:
        return "process_execution"

    if "network_connect" in event_types:
        return "network_activity"

    return "unknown"


class ContextManager:
    def __init__(self, device_identity, user_context, context_timeout=30):
        """
        context_timeout: seconds after which a context expires automatically
        """
        self.device_identity = device_identity
        self.user_context = user_context

        self.contexts = {}  # context_id -> context

        self.lifecycle = ContextLifecycle(timeout=context_timeout)
        self.graph = ContextGraph()

    # --------------------------------------------------
    # CONTEXT CREATION
    # --------------------------------------------------

    def create_context(self, anchor_event):
        """
        Creates a new execution context
        """
        context_id = f"CTX-{uuid.uuid4().hex[:8]}"

        context = {
            "context_id": context_id,
            "device": self.device_identity,
            "user": self.user_context,
            "created_at": time.time(),
            "anchor_event": anchor_event,
            "events": []
        }

        self.contexts[context_id] = context
        self.lifecycle.open_context(context_id)

        # Anchor event is raw evidence
        anchor_event["timestamp"] = time.time()
        anchor_event["context_id"] = context_id
        write_raw_event(anchor_event)

        return context_id

    # --------------------------------------------------
    # EVENT ATTACHMENT
    # --------------------------------------------------

    def add_event(self, context_id, event):
        """
        Adds an event to an existing context
        """
        if context_id not in self.contexts:
            return

        event["timestamp"] = time.time()
        event["context_id"] = context_id

        # 1️⃣ Persist raw event (IMMUTABLE EVIDENCE)
        write_raw_event(event)

        # 2️⃣ Store in memory
        self.contexts[context_id]["events"].append(event)

        # 3️⃣ Maintain vertical ordering
        self.graph.link_event(context_id, event)

    # --------------------------------------------------
    # CONTEXT ACCESS
    # --------------------------------------------------

    def get_context(self, context_id):
        return self.contexts.get(context_id)

    def close_context(self, context_id):
        """
        Marks context as closed (cleanup handled by watcher)
        """
        if context_id in self.contexts:
            self.lifecycle.close_context(context_id)

    # --------------------------------------------------
    # CONTEXT EXPIRY → CLEAN → ENQUEUE
    # --------------------------------------------------

    def start_context_watcher(self, check_interval=2):
        """
        Background watcher:
        - detects expired contexts
        - cleans events
        - enqueues clean context
        - removes context from memory
        """

        def watcher():
            while True:
                expired = []

                for ctx_id in list(self.contexts.keys()):
                    if self.lifecycle.is_expired(ctx_id):
                        expired.append(ctx_id)

                for ctx_id in expired:
                    context = self.contexts.pop(ctx_id, None)
                    if not context:
                        continue

                    # -------- CLEAN PIPELINE --------
                    clean_events = []

                    for raw_event in context["events"]:
                        normalized = normalize_event(raw_event, ctx_id)
                        if validate_event(normalized):
                            clean_events.append(normalized)

                    clean_events = deduplicate_events(clean_events)
                    clean_events = aggregate_events(clean_events)

                    # 🔥 ADD PAYLOAD TYPE HERE
                    payload_type = classify_payload(clean_events)

                    clean_context = {
                        "context_id": ctx_id,
                        "payload_type": payload_type,   # ✅ ADDED
                        "device": context["device"],
                        "user": context["user"],
                        "created_at": context["created_at"],
                        "events": clean_events
                    }

                    enqueue(clean_context)

                time.sleep(check_interval)

        threading.Thread(target=watcher, daemon=True).start()