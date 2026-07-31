import os
import json
from google_auth_oauthlib.flow import InstalledAppFlow

# Define the scopes required. For full Gmail access, we use https://mail.google.com/
SCOPES = ['https://mail.google.com/']

def main():
    client_secret_file = 'client_secret.json'
    
    if not os.path.exists(client_secret_file):
        print(f"Error: {client_secret_file} not found in the current directory.")
        return

    # Load client secrets to print details later
    with open(client_secret_file, 'r') as f:
        secrets_data = json.load(f)
    
    installed_info = secrets_data.get('installed', {})
    client_id = installed_info.get('client_id')
    client_secret = installed_info.get('client_secret')

    print("Starting local OAuth flow. A browser window will open for authentication...")
    
    # Create the flow from the client secrets file
    flow = InstalledAppFlow.from_client_secrets_file(
        client_secret_file, 
        scopes=SCOPES
    )
    
    # Run the local server for authorization callback
    # Using port=0 lets the system pick a random available port
    creds = flow.run_local_server(
        port=0, 
        prompt='consent', 
        access_type='offline'
    )
    
    print("\n" + "="*50)
    print("OAUTH CREDENTIALS GENERATED SUCCESSFULLY")
    print("="*50)
    print(f"Client ID: {client_id}")
    print(f"Client Secret: {client_secret}")
    print(f"Refresh Token: {creds.refresh_token}")
    print("="*50)
    print("\nYou can now copy the values above and paste them into your Gmail config.")

if __name__ == '__main__':
    main()
