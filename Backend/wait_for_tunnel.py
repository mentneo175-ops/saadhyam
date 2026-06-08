import os
import time

def get_tunnel_url():
    # Find .env in the same folder as this script (Backend/)
    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
    if not os.path.exists(env_path):
        return None
    try:
        with open(env_path, "r", encoding="utf-8", errors="ignore") as f:
            for line in f:
                if line.strip().startswith("EXOTEL_STREAM_URL="):
                    return line.strip().split("=", 1)[1]
    except Exception:
        pass
    return None

def main():
    print("[INFO] Waiting for Cloudflare quick tunnel to update .env with new URL...")
    old_url = get_tunnel_url()
    
    # Wait for up to 30 seconds
    start_time = time.time()
    while time.time() - start_time < 30:
        new_url = get_tunnel_url()
        if new_url and new_url != old_url:
            print(f"[SUCCESS] Detected new Tunnel URL in .env: {new_url}")
            return
        time.sleep(0.5)
        
    print("[WARNING] Timeout waiting for .env to update. Proceeding anyway...")

if __name__ == "__main__":
    main()
