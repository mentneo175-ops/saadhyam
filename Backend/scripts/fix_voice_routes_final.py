"""
Final fix for voice agent routes - rewrite with correct syntax
"""

import re

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace all old-style dependency injections
    # Pattern 1: User = Depends(get_current_user)
    content = re.sub(
        r'current_user:\s*User\s*=\s*Depends\(get_current_user\)',
        'current_user: Annotated[User, Depends(get_current_user)]',
        content
    )
    
    # Pattern 2: Session = Depends(get_db)
    content = re.sub(
        r'db:\s*Session\s*=\s*Depends\(get_db\)',
        'db: Annotated[Session, Depends(get_db)]',
        content
    )
    
    # Write back
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✅ Fixed {filepath}")

if __name__ == '__main__':
    fix_file('Backend/routes/voice_agent.py')
    fix_file('Backend/routes/voice_agent_v2.py')
    print("\n✅ All files fixed!")
