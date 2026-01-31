# sentinel_agent/context_engine/context_linker.py

class ContextLinker:
    def __init__(self):
        self.process_map = {}

    def link_process(self, pid, context_id):
        self.process_map[pid] = context_id

    def get_context_for_pid(self, pid):
        return self.process_map.get(pid)