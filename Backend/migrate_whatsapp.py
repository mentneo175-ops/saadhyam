"""
Quick migration runner for WhatsApp System User fields
Run this file directly: python migrate_whatsapp.py
"""

import subprocess
import sys

if __name__ == "__main__":
    print("\n🚀 Running WhatsApp migration...\n")
    result = subprocess.run([sys.executable, "migrations/run_whatsapp_migration.py"])
    sys.exit(result.returncode)
