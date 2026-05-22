import os
import re

FRONTEND_DIR = r"c:\Users\Sai kiran\Desktop\Sadhyam\Frontend\src"
IMPORT_STATEMENT = 'import { env } from "@/config/env";\n'

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    if 'http://localhost:8000' not in content:
        return False

    # Replace "http://localhost:8000/..." with `${env.apiBaseUrl}/...`
    # Handle different quotation marks
    content = re.sub(r'["\']http://localhost:8000(/.*?)["\']', r'`${env.apiBaseUrl}\1`', content)
    
    # Handle exact matches without paths
    content = re.sub(r'["\']http://localhost:8000["\']', r'env.apiBaseUrl', content)
    
    # Handle any remaining instances that might be already inside template literals
    content = content.replace('http://localhost:8000', '${env.apiBaseUrl}')

    # Add import if missing
    if 'env.apiBaseUrl' in content and 'from "@/config/env"' not in content and "from '@/config/env'" not in content:
        lines = content.split('\n')
        
        # Find the last import statement or put at the top
        last_import = -1
        for i, line in enumerate(lines):
            if line.startswith('import '):
                last_import = i
        
        if last_import != -1:
            lines.insert(last_import + 1, 'import { env } from "@/config/env";')
        else:
            lines.insert(0, 'import { env } from "@/config/env";')
            
        content = '\n'.join(lines)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    return True

modified = 0
for root, dirs, files in os.walk(FRONTEND_DIR):
    for file in files:
        if file.endswith(('.ts', '.tsx', '.js', '.jsx')):
            if process_file(os.path.join(root, file)):
                modified += 1
                print(f"Fixed: {file}")

print(f"Total files modified: {modified}")
