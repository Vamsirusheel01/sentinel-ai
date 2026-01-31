# sentinel_agent/utils/os_utils.py

import platform
import os


def is_windows():
    return platform.system() == "Windows"


def is_linux():
    return platform.system() == "Linux"


def home_dir():
    return os.path.expanduser("~")