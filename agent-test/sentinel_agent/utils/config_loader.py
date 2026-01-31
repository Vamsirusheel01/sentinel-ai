# sentinel_agent/utils/config_loader.py

import yaml
import os


def load_config(relative_path):
    """
    Load YAML config safely
    """
    base_dir = os.path.dirname(os.path.dirname(__file__))
    config_path = os.path.join(base_dir, relative_path)

    with open(config_path, "r") as f:
        return yaml.safe_load(f)