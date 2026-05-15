import os

# Recursively find all Python files and replace get_db_sync with get_db_sync
count = 0
for root, dirs, files in os.walk('.'):
    # Skip virtual environments and cache directories
    dirs[:] = [d for d in dirs if d not in ['.venv', '__pycache__', '.git', 'node_modules']]
    
    for file in files:
        if file.endswith('.py'):
            filepath = os.path.join(root, file)
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                if 'get_db_sync' in content:
                    new_content = content.replace('get_db_sync', 'get_db_sync')
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    count += 1
                    print(f"✅ Fixed: {filepath}")
            except Exception as e:
                print(f"❌ Error in {filepath}: {e}")

print(f"\n✅ Total files fixed: {count}")
