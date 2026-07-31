"""
Gmail Plugin Constants
Defines global configuration and settings defaults for the Gmail plugin
"""

PLUGIN_KEY = "gmail"
OAUTH_SCOPES = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/gmail.compose",
    "https://www.googleapis.com/auth/gmail.modify"
]
DEFAULT_TIMEOUT = 30
API_VERSION = "v1"
API_SERVICE_NAME = "gmail"
