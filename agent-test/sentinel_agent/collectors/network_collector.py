# sentinel_agent/collectors/network_collector.py

import time
import psutil
import socket

from context_engine.context_linker import ContextLinker

context_linker = ContextLinker()


def start_network_collector(context_manager, poll_interval=2):
    print("[NetworkCollector] Started")

    known_connections = set()

    while True:
        try:
            connections = psutil.net_connections(kind="inet")

            for conn in connections:
                if not conn.pid or not conn.raddr:
                    continue

                conn_id = (conn.pid, conn.raddr.ip, conn.raddr.port)

                if conn_id in known_connections:
                    continue

                known_connections.add(conn_id)

                context_id = context_linker.get_context_for_pid(conn.pid)
                if not context_id:
                    continue

                try:
                    domain = socket.gethostbyaddr(conn.raddr.ip)[0]
                except Exception:
                    domain = None

                event = {
                    "event_type": "network_connect",
                    "pid": conn.pid,
                    "remote_ip": conn.raddr.ip,
                    "remote_port": conn.raddr.port,
                    "domain": domain,
                    "status": conn.status
                }

                context_manager.add_event(context_id, event)

            time.sleep(poll_interval)

        except Exception as e:
            print("[NetworkCollector] Error:", e)
            time.sleep(2)