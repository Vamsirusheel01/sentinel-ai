import sqlite3
import re

DANGEROUS_KEYWORDS = [
    r'\bwhoami\b', r'\bnet user\b', r'\bnet group\b', r'\bsysteminfo\b', r'\bnltest\b',
    r'powershell\.exe\s+-[eE](?:nc|ncod)?', r'powershell\.exe\s+-[cC](?:ommand)?',
    r'cmd\.exe\s+/[cCkK]', r'bitsadmin\s+/transfer', r'certutil\s+-urlcache',
    r'vssadmin\s+delete\s+shadows', r'schtasks\s+/create', r'\breg\s+add\b',
    r'\blsass\.exe\b', r'\bmimikatz\b', r'\bpypykatz\b', r'\bsekurlsa\b', 
    r'\bnmap\b', r'\bnetcat\b', r'\bnc\.exe\b', r'\btelnet\b'
]
COMPILED_PATTERNS = [re.compile(p, re.IGNORECASE) for p in DANGEROUS_KEYWORDS]

def check():
    conn = sqlite3.connect('database.db')
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute("SELECT cmdline FROM process_events")
    rows = cur.fetchall()
    
    found = False
    for r in rows:
        cmd = (r['cmdline'] or "").lower()
        for i, p in enumerate(COMPILED_PATTERNS):
            if p.search(cmd):
                print(f"Match: '{DANGEROUS_KEYWORDS[i]}' in Cmd: '{cmd[:150]}'")
                found = True
    
    if not found:
        print("No regex matches found")

if __name__ == "__main__":
    check()
