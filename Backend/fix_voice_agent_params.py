"""
Script to fix parameter ordering in voice agent route files.
Moves Annotated dependency parameters before parameters with defaults.
"""

import re

def fix_function_params(content):
    """Fix parameter ordering in async function definitions"""
    
    # Pattern to match async function definitions with parameters
    pattern = r'(async def \w+\([^)]*?\n(?:[^)]*?\n)*?[^)]*?\):)'
    
    def reorder_params(match):
        func_def = match.group(1)
        
        # If it contains both Annotated and default parameters, we need to reorder
        if 'Annotated[' in func_def and '=' in func_def:
            lines = func_def.split('\n')
            
            # Extract function signature line
            sig_line = lines[0]
            
            # Extract parameter lines
            param_lines = []
            for line in lines[1:]:
                if line.strip() and not line.strip().startswith('):'):
                    param_lines.append(line)
            
            # Separate params into those with and without defaults
            params_without_defaults = []
            params_with_defaults = []
            
            for param in param_lines:
                # Check if this is an Annotated dependency (no default after Annotated)
                if 'Annotated[' in param and '= Depends(' not in param and '=' in param and 'Annotated' not in param.split('=')[1]:
                    # Has a default value that's not Depends
                    params_with_defaults.append(param)
                elif '=' in param and 'Annotated[' not in param:
                    # Regular parameter with default
                    params_with_defaults.append(param)
                else:
                    # No default or Annotated dependency
                    params_without_defaults.append(param)
            
            # Reconstruct function with reordered params
            if params_without_defaults and params_with_defaults:
                new_lines = [sig_line]
                new_lines.extend(params_without_defaults)
                new_lines.extend(params_with_defaults)
                new_lines.append('):')
                return '\n'.join(new_lines)
        
        return func_def
    
    return re.sub(pattern, reorder_params, content, flags=re.MULTILINE)


def main():
    files = [
        'Backend/routes/voice_agent.py',
        'Backend/routes/voice_agent_v2.py'
    ]
    
    for filepath in files:
        print(f"Processing {filepath}...")
        
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Apply fixes
            fixed_content = fix_function_params(content)
            
            # Write back
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(fixed_content)
            
            print(f"✅ Fixed {filepath}")
        
        except Exception as e:
            print(f"❌ Error processing {filepath}: {e}")


if __name__ == '__main__':
    main()
