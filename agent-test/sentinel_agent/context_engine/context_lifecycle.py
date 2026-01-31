# sentinel_agent/context_engine/context_lifecycle.py

import time


class ContextLifecycle:
    def __init__(self, timeout=30):
        self.active_contexts = {}
        self.timeout = timeout

    def open_context(self, context_id):
        self.active_contexts[context_id] = {
            "opened_at": time.time(),
            "status": "active"
        }

    def close_context(self, context_id):
        if context_id in self.active_contexts:
            self.active_contexts[context_id]["status"] = "closed"
            self.active_contexts[context_id]["closed_at"] = time.time()

    def is_expired(self, context_id):
        if context_id not in self.active_contexts:
            return True

        opened_at = self.active_contexts[context_id]["opened_at"]
        return (time.time() - opened_at) > self.timeout