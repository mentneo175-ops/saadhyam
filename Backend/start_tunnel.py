import os
import re
import sys
import subprocess
import time

def main():
    print("============================================")
    print("  Starting Cloudflare Tunnel for Saadhyam AI")
    print("============================================")
    
    # 1. Determine cloudflared executable path
    cloudflared_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "cloudflared.exe")
    if not os.path.exists(cloudflared_path):
        cloudflared_path = "cloudflared" # Fallback to system path
        
    print(f"[INFO] Using cloudflared: {cloudflared_path}")
    
    # 2. Start cloudflared tunnel pointing to port 8000
    cmd = [cloudflared_path, "tunnel", "--url", "http://localhost:8000"]
    print(f"[INFO] Running: {' '.join(cmd)}")
    
    try:
        # Start process with redirected stderr (cloudflared logs to stderr)
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1,
            universal_newlines=True
        )
    except Exception as e:
        print(f"[ERROR] Failed to start cloudflared process: {e}")
        sys.exit(1)
        
    tunnel_url = None
    print("[INFO] Waiting for Cloudflare quick tunnel creation...")
    
    # We read from stderr because cloudflared logs output to stderr
    # We run a loop to scan for trycloudflare.com URL
    start_time = time.time()
    while True:
        # Check if process terminated
        if process.poll() is not None:
            print("[ERROR] cloudflared process terminated unexpectedly.")
            stderr_out = process.stderr.read()
            print(stderr_out)
            sys.exit(1)
            
        # Read line from stderr
        line = process.stderr.readline()
        if not line:
            time.sleep(0.1)
            continue
            
        # Optional: Print line for debugging
        # print(line.strip())
        
        # Match trycloudflare URL
        match = re.search(r'https://[a-zA-Z0-9-]+\.trycloudflare\.com', line)
        if match:
            tunnel_url = match.group(0)
            print(f"\n[SUCCESS] Quick Tunnel Created successfully!")
            print(f"🔗 Tunnel URL: {tunnel_url}\n")
            break
            
        # Timeout after 20 seconds
        if time.time() - start_time > 20:
            print("[ERROR] Timeout waiting for Cloudflare Tunnel URL.")
            process.terminate()
            sys.exit(1)
            
    # 3. Update the .env file with the new URL
    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
    if os.path.exists(env_path):
        try:
            with open(env_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
                
            # Replace EXOTEL_STREAM_URL value
            if "EXOTEL_STREAM_URL=" in content:
                content = re.sub(r'EXOTEL_STREAM_URL=.*', f'EXOTEL_STREAM_URL={tunnel_url}', content)
            else:
                content += f"\nEXOTEL_STREAM_URL={tunnel_url}"
                
            with open(env_path, "w", encoding="utf-8") as f:
                f.write(content)
                
            print(f"[SUCCESS] Updated EXOTEL_STREAM_URL in .env to: {tunnel_url}")
            print("[IMPORTANT] Please restart the Backend server for the changes to take effect!")
            print("[INFO] Press Ctrl+C in this window to stop the tunnel when done.\n")
        except Exception as e:
            print(f"[ERROR] Failed to update .env: {e}")
    else:
        print("[WARNING] .env file not found. Could not auto-update EXOTEL_STREAM_URL.")
        
    # 4. Keep process running
    try:
        while True:
            line = process.stderr.readline()
            if line:
                # Optionally log tunnel requests/traffic logs here if needed
                if "connection" in line.lower() or "error" in line.lower():
                    print(f"[Tunnel Log] {line.strip()}")
            time.sleep(0.05)
    except KeyboardInterrupt:
        print("\n[INFO] Stopping Cloudflare Tunnel...")
        process.terminate()
        print("[SUCCESS] Tunnel stopped.")

if __name__ == "__main__":
    main()
