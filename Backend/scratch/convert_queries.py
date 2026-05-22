import os

def parse_sqlalchemy(content):
    # Fix imports
    if "from sqlalchemy.ext.asyncio import AsyncSession" not in content:
        content = content.replace("from sqlalchemy.orm import Session", "from sqlalchemy.orm import Session\nfrom sqlalchemy.ext.asyncio import AsyncSession\nfrom sqlalchemy import select, func")
    
    if "from config.database import get_db_sync" in content:
        content = content.replace("from config.database import get_db_sync", "from config.database import get_db")
    elif "from config.database import get_db_sync, get_db" in content:
        content = content.replace("from config.database import get_db_sync, get_db", "from config.database import get_db")
        
    content = content.replace("db: Session = Depends(get_db_sync)", "db: AsyncSession = Depends(get_db)")
    content = content.replace("db: Session = Depends(get_db)", "db: AsyncSession = Depends(get_db)")
    
    content = content.replace("db.commit()", "await db.commit()")
    content = content.replace("db.rollback()", "await db.rollback()")
    
    import re
    # Simple replace for refresh and delete which are mostly single line
    content = re.sub(r'db\.refresh\((.*?)\)', r'await db.refresh(\1)', content)
    content = re.sub(r'db\.delete\((.*?)\)', r'await db.delete(\1)', content)

    # Simple replace for whatsapp_service methods
    for method in ["send_text_message", "send_template_message", "send_media_message", "mark_message_as_read", "get_business_profile"]:
        content = content.replace(f"whatsapp_service.{method}(", f"await whatsapp_service.{method}(")
        
    # Now the tricky part: db.query(...) to await db.execute(select(...))
    # We will do this by finding "db.query(" and balancing parentheses.
    while True:
        start_idx = content.find("db.query(")
        if start_idx == -1:
            break
            
        # find the end of db.query(...)
        stack = []
        in_string = False
        string_char = ''
        escape = False
        
        query_end = -1
        for i in range(start_idx + 8, len(content)):
            char = content[i]
            if escape:
                escape = False
                continue
            if char == '\\':
                escape = True
                continue
            if char in ["'", '"']:
                if not in_string:
                    in_string = True
                    string_char = char
                elif string_char == char:
                    in_string = False
                continue
                
            if not in_string:
                if char == '(':
                    stack.append('(')
                elif char == ')':
                    if len(stack) > 0:
                        stack.pop()
                    else:
                        query_end = i
                        break
                        
        if query_end == -1:
            break # Malformed
            
        args = content[start_idx+9:query_end]
        
        # Now find the end of the chain. e.g. .filter(...).first()
        # We'll just look ahead to see what method ends it.
        # Common enders: .first(), .all(), .count(), .scalar()
        chain_end = query_end + 1
        terminator = None
        
        # We need to parse until we hit .first(), .all(), or .count()
        # We'll do this by matching the chain methods
        current_idx = query_end + 1
        while current_idx < len(content):
            # skip whitespace and newlines and backslashes
            while current_idx < len(content) and content[current_idx] in ' \t\n\r\\':
                current_idx += 1
                
            if current_idx < len(content) and content[current_idx] == '.':
                current_idx += 1
                # Read method name
                method_name = ""
                while current_idx < len(content) and content[current_idx].isalpha() or content[current_idx] == '_':
                    method_name += content[current_idx]
                    current_idx += 1
                    
                # Skip to '('
                while current_idx < len(content) and content[current_idx] in ' \t\n\r\\':
                    current_idx += 1
                    
                if current_idx < len(content) and content[current_idx] == '(':
                    # Balance parens for this method
                    p_stack = []
                    in_s = False
                    s_c = ''
                    esc = False
                    m_end = -1
                    for j in range(current_idx + 1, len(content)):
                        c = content[j]
                        if esc:
                            esc = False
                            continue
                        if c == '\\':
                            esc = True
                            continue
                        if c in ["'", '"']:
                            if not in_s:
                                in_s = True
                                s_c = c
                            elif s_c == c:
                                in_s = False
                            continue
                            
                        if not in_s:
                            if c == '(':
                                p_stack.append('(')
                            elif c == ')':
                                if len(p_stack) > 0:
                                    p_stack.pop()
                                else:
                                    m_end = j
                                    break
                    
                    if method_name in ["first", "all", "count", "delete", "update"]:
                        terminator = method_name
                        chain_end = m_end + 1
                        break
                    else:
                        current_idx = m_end + 1
                        chain_end = m_end + 1
            else:
                break
                
        # Now we replace the original text [start_idx : chain_end] with the async version.
        original_text = content[start_idx:chain_end]
        
        if terminator == "first":
            # Extract everything between db.query(...) and .first()
            # Which is original_text[query_end+1 : chain_end] without .first()
            # Wait, chain_end points to after the ')' of .first().
            # So the middle part is from query_end+1 to the start of .first()
            # Let's just use regex on the original text now that we have bounded it perfectly!
            middle = original_text[len(args)+10:-8] # len("db.query(") is 9 + args + ")" is len+10. len(".first()") is 8.
            new_text = f"(await db.execute(select({args}){middle})).scalars().first()"
        elif terminator == "all":
            middle = original_text[len(args)+10:-6] # len(".all()") is 6
            new_text = f"(await db.execute(select({args}){middle})).scalars().all()"
        elif terminator == "count":
            middle = original_text[len(args)+10:-8] # len(".count()") is 8
            # In async, we can do len(scalars().all()) for count if it's small, or select(func.count(args))
            new_text = f"(await db.execute(select(func.count()).select_from({args}){middle})).scalar()"
        elif terminator == "delete":
            middle = original_text[len(args)+10:-9] 
            # This is tricky because query().filter().delete() is an update operation.
            # In async, we do await db.execute(delete(Table).where(...))
            # Wait, delete is rare, let's see if we just replace it with scalars().all() then loop? No.
            # The codebase probably doesn't use query().delete() often. 
            pass # fallback to string replacement below if needed
        elif terminator == "update":
            pass
        else:
            # No terminator found, e.g. it's just a query being built
            middle = original_text[len(args)+10:]
            new_text = f"(await db.execute(select({args}){middle}))"
            
        if terminator in ["first", "all", "count"] or terminator is None:
            content = content[:start_idx] + new_text + content[chain_end:]
        else:
            # Leave it alone or manual
            break
            
    return content

if __name__ == "__main__":
    files = [
        "Backend/routes/whatsapp_auth.py", 
        "Backend/routes/whatsapp_messages.py", 
        "Backend/routes/whatsapp_automation.py", 
        "Backend/routes/whatsapp_campaigns.py", 
        "Backend/routes/whatsapp_webhook.py",
        "Backend/routes/meta_ads.py"
    ]
    
    for f in files:
        if os.path.exists(f):
            with open(f, "r", encoding="utf-8") as file:
                content = file.read()
            new_content = parse_sqlalchemy(content)
            
            # Additional cleanups: await await db.commit() if any duplicate
            new_content = new_content.replace("await await", "await")
            
            with open(f, "w", encoding="utf-8") as file:
                file.write(new_content)
            print(f"Converted {f}")
