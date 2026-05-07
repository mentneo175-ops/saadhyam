# Instagram Integration Components

This directory contains all components related to Instagram integration and management.

## Components

### 1. InstagramConnectionWizard
**File:** `InstagramConnectionWizard.tsx`

A comprehensive 5-step onboarding wizard that guides users through connecting their Instagram Business account.

**Features:**
- Step-by-step instructions with progress tracking
- Account requirements validation
- Permissions and privacy explanation
- Features overview
- Terms agreement
- Professional UI with animations

**Steps:**
1. **Introduction** - Welcome and overview
2. **Requirements** - Account setup checklist
3. **Permissions** - Data access explanation
4. **Features** - Benefits overview
5. **Confirmation** - Final agreement and connection

**Usage:**
```tsx
<InstagramConnectionWizard
  onConnect={handleConnectInstagram}
  onCancel={() => setShowWizard(false)}
  isLoading={connectionLoading}
/>
```

### 2. InstagramConnectionSuccess
**File:** `InstagramConnectionSuccess.tsx`

Success page shown immediately after successful Instagram connection.

**Features:**
- Celebration animation with confetti effect
- Connected account information display
- Features overview grid
- Next steps guidance
- Quick action buttons

**Usage:**
```tsx
<InstagramConnectionSuccess
  accountUsername={username}
  pageName={pageName}
  onContinue={() => goToPosting()}
  onGoToSettings={() => openSettings()}
/>
```

### 3. InstagramSettingsModal
**File:** `InstagramSettingsModal.tsx`

Comprehensive settings modal for managing Instagram automation and preferences.

**Features:**
- Connection status display
- Automation settings (enable/disable features)
- Posting preferences (time, frequency)
- Notification settings
- Account disconnect functionality
- Real-time settings updates

**Settings Categories:**
- **Connection Status** - Account info and connection management
- **Automation** - Auto-publish, auto-reply, save drafts
- **Posting Schedule** - Preferred times and frequency
- **Notifications** - Post, engagement, and error notifications

**Usage:**
```tsx
<InstagramSettingsModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  connectionStatus={connectionStatus}
  onDisconnect={handleDisconnect}
  onReconnect={handleReconnect}
  isLoading={loading}
/>
```

### 4. InstagramAccountManager
**File:** `InstagramAccountManager.tsx`

Component for managing multiple Instagram accounts (existing component).

### 5. InstagramPostCreator
**File:** `InstagramPostCreator.tsx`

Component for creating and scheduling Instagram posts (existing component).

## Integration Flow

### New User Flow
1. User navigates to `/dashboard/instagram`
2. If not connected, shows `InstagramConnectionWizard`
3. User completes 5-step wizard
4. Redirects to Instagram OAuth
5. After successful auth, shows `InstagramConnectionSuccess`
6. User can start posting or configure settings

### Existing User Flow
1. User navigates to `/dashboard/instagram`
2. If connected, shows main posting interface
3. Connection status displayed in header
4. Settings accessible via Settings button

### Settings Management
1. User clicks Settings button in Instagram dashboard
2. Opens `InstagramSettingsModal`
3. Can modify automation, posting, and notification preferences
4. Can disconnect account with confirmation dialog

## Backend Integration

### Required Endpoints
- `GET /settings/instagram/connection-status` - Check connection status
- `POST /settings/instagram/disconnect` - Disconnect account
- `PUT /settings/instagram/automation` - Update automation settings
- `PUT /settings/posting-preferences` - Update posting preferences
- `PUT /settings/notifications` - Update notification settings

### Connection Status Response
```json
{
  "is_connected": true,
  "account_username": "business_account",
  "page_name": "Business Page Name",
  "automation_enabled": true,
  "auto_publish_enabled": false,
  "last_post_time": "2024-01-01T12:00:00Z"
}
```

## Styling

All components use:
- Tailwind CSS for styling
- Gradient backgrounds and effects
- Consistent color scheme (pink/orange for Instagram branding)
- Responsive design
- Smooth animations and transitions
- Professional business appearance

## State Management

Components manage their own state and communicate via props:
- Connection status passed down from parent
- Loading states for async operations
- Form validation and error handling
- Toast notifications for user feedback

## Error Handling

- Network error handling with user-friendly messages
- Validation errors with inline feedback
- Graceful fallbacks for missing data
- Retry mechanisms for failed operations

## Accessibility

- Proper ARIA labels and roles
- Keyboard navigation support
- Screen reader friendly
- High contrast colors
- Focus management

## Future Enhancements

- Multi-account support
- Advanced scheduling options
- Analytics integration
- Bulk operations
- Template management
- A/B testing features