# sentinel_agent/context_engine/context_graph.py

class ContextGraph:
    def __init__(self):
        self.graph = {}

    def link_event(self, context_id, event):
        if context_id not in self.graph:
            self.graph[context_id] = []

        self.graph[context_id].append({
            "event_type": event.get("event_type"),
            "details": event
        })

    def get_events(self, context_id):
        return self.graph.get(context_id, [])