from collections import deque

_buffer = deque(maxlen=1000)


def push(events):
    for e in events:
        _buffer.append(e)


def flush():
    data = list(_buffer)
    _buffer.clear()
    return data