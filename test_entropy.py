import math

def get_entropy(text):
    if not text: return 0
    probs = [text.count(c) / len(text) for c in set(text)]
    ent = -sum(p * math.log2(p) for p in probs)
    return ent, ent / 8

test_strings = [
    "chrome.exe",
    "C:\\Windows\\System32\\svchost.exe -k netsvcs",
    "powershell.exe -ExecutionPolicy Bypass -File C:\\tmp\\mal.ps1",
    "RuntimeBroker.exe -Embedding",
    "python app.py",
    "lsass.exe",
    "cmd.exe /c echo hello",
    "AAAAAAAAAAAAAAAAAAAA",
    "abcdefghijklmnopqrstuv"
]

for s in test_strings:
    ent, norm = get_entropy(s)
    print(f"Str: {s:60} | Ent: {ent:.3f} | Norm: {norm:.3f}")
