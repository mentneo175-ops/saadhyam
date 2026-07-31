# Gmail Plugin for Saadhyam AI

This plugin provides integration with Google's Gmail API, permitting asynchronous email communication and analytics.

## Folder Structure
```
plugins/
    gmail/
        __init__.py      # Package entry point exposing PluginMain, GmailPlugin, and constants
        main.py          # GmailPlugin (PluginMain) class defining skeletons raising NotImplementedError
        manifest.json    # Declarative manifest with metadata, actions, and features
        schemas.py       # Pydantic schema validation models
        constants.py     # Central repository of scopes, versions, timeouts, and names
        README.md        # Documentation and implementation maps
```

## Available Actions

1. **`test_connection`**
   * **Purpose**: Tests OAuth credentials and connectivity status.
   * **Payload**: `{}` (uses saved configuration credentials).

2. **`send_email`**
   * **Purpose**: Sends a plain text or HTML email.
   * **Payload**:
     ```json
     {
       "to": "recipient@example.com",
       "subject": "Hello World",
       "body": "This is a test email message.",
       "cc": ["cc1@example.com"],
       "bcc": []
     }
     ```

3. **`list_emails`**
   * **Purpose**: Lists emails from specified labels.
   * **Payload**:
     ```json
     {
       "max_results": 10,
       "label_ids": ["INBOX"]
     }
     ```

4. **`get_email`**
   * **Purpose**: Retrieves full content of an email message.
   * **Payload**:
     ```json
     {
       "email_id": "message_id_12345"
     }
     ```

5. **`search_emails`**
   * **Purpose**: Performs pattern/query search within the inbox.
   * **Payload**:
     ```json
     {
       "query": "from:manager@company.com is:unread",
       "max_results": 10
     }
     ```

## Permissions & Scopes
The plugin requires the following OAuth scopes:
* `https://www.googleapis.com/auth/gmail.readonly` (reading messages and labels)
* `https://www.googleapis.com/auth/gmail.send` (sending draft/outbox emails)
* `https://www.googleapis.com/auth/gmail.compose` (composing drafts)
* `https://www.googleapis.com/auth/gmail.modify` (modifying labels like read/unread status)

## Future Implementation Plan
1. **Google Auth Handshake**: Implement exchange flows for converting Auth codes to Refresh tokens.
2. **Credential Management**: Integrate backend secure vault to decrypt/encrypt tokens.
3. **Gmail API client wrapper**: Build service builders via `google-api-python-client`.
4. **Error handling**: Map Google API quota limits or token expirations to appropriate backend execution exceptions.
