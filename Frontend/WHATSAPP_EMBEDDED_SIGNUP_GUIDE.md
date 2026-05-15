# WhatsApp Embedded Signup - Frontend Implementation Guide

## Problem

The current OAuth callback flow tries to fetch WABA details from Meta's API, but **System User tokens** (which Embedded Signup provides) don't have access to `/me/businesses` or `/me/owned_whatsapp_business_accounts`.

## Solution

Use **Meta's Embedded Signup JavaScript SDK** which provides the WABA details directly in the callback.

## Implementation Steps

### Step 1: Load Meta SDK

Add this to your `index.html` or load it dynamically:

```html
<script>
  window.fbAsyncInit = function() {
    FB.init({
      appId: '795095706777348', // Your Meta App ID
      cookie: true,
      xfbml: true,
      version: 'v21.0'
    });
  };

  (function(d, s, id){
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) {return;}
    js = d.createElement(s); js.id = id;
    js.src = "https://connect.facebook.net/en_US/sdk.js";
    fjs.parentNode.insertBefore(js, fjs);
  }(document, 'script', 'facebook-jssdk'));
</script>
```

### Step 2: Update WhatsAppConnect Component

Replace the current `handleConnect` function with this:

```typescript
const handleConnect = async () => {
  try {
    setConnecting(true);
    
    // Launch Embedded Signup using Facebook SDK
    if (typeof FB === 'undefined') {
      toast.error("Facebook SDK not loaded. Please refresh the page.");
      setConnecting(false);
      return;
    }

    FB.login(
      function(response: any) {
        if (response.authResponse) {
          const code = response.authResponse.code;
          
          console.log('Full response:', response);
          console.log('Auth response:', response.authResponse);
          
          // IMPORTANT: The setup data contains WABA and phone number IDs
          // This is provided by Meta's Embedded Signup
          if (response.authResponse.setup_data) {
            const setupData = response.authResponse.setup_data;
            console.log('Setup data:', setupData);
            
            // Extract WABA and phone number from setup data
            const wabaId = setupData.waba_id;
            const phoneNumberId = setupData.phone_number_id;
            const businessName = setupData.business_name || "WhatsApp Business";
            
            if (wabaId && phoneNumberId) {
              // Send to backend with WABA details
              completeEmbeddedSignup(code, wabaId, phoneNumberId, businessName);
            } else {
              toast.error("Setup data incomplete. Please try again.");
              setConnecting(false);
            }
          } else {
            toast.error("No setup data received from Meta. Please try again.");
            setConnecting(false);
          }
        } else {
          toast.error("Authentication cancelled or failed");
          setConnecting(false);
        }
      },
      {
        config_id: '2175611099919987', // Your WhatsApp Config ID
        response_type: 'code',
        override_default_response_type: true,
        extras: {
          setup: {
            // This tells Meta we want Embedded Signup
          }
        }
      }
    );
  } catch (error) {
    console.error("Error connecting WhatsApp:", error);
    toast.error("Failed to connect WhatsApp");
    setConnecting(false);
  }
};

const completeEmbeddedSignup = async (
  code: string,
  wabaId: string,
  phoneNumberId: string,
  businessName: string
) => {
  try {
    const token = localStorage.getItem("saadhyam_token");
    
    const response = await fetch(
      "http://localhost:8000/api/whatsapp/embedded-signup-complete",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          waba_id: wabaId,
          phone_number_id: phoneNumberId,
          business_name: businessName,
        }),
      }
    );

    if (response.ok) {
      const data = await response.json();
      toast.success("WhatsApp connected successfully!");
      console.log("Account saved:", data);
      onConnectionSuccess();
    } else {
      const error = await response.json();
      toast.error(error.detail || "Failed to complete setup");
      setConnecting(false);
    }
  } catch (error) {
    console.error("Error completing signup:", error);
    toast.error("Failed to complete WhatsApp setup");
    setConnecting(false);
  }
};
```

### Step 3: Add TypeScript Declarations

Create `src/types/facebook.d.ts`:

```typescript
declare global {
  interface Window {
    FB: {
      init: (params: {
        appId: string;
        cookie: boolean;
        xfbml: boolean;
        version: string;
      }) => void;
      login: (
        callback: (response: {
          authResponse?: {
            code: string;
            setup_data?: {
              waba_id: string;
              phone_number_id: string;
              business_name?: string;
            };
          };
          status: string;
        }) => void,
        options: {
          config_id: string;
          response_type: string;
          override_default_response_type: boolean;
          extras?: {
            setup?: {};
          };
        }
      ) => void;
    };
    fbAsyncInit: () => void;
  }
}

export {};
```

## How It Works

1. **User clicks "Connect WhatsApp"**
2. **FB.login()** opens Meta's Embedded Signup dialog
3. **User completes signup** in Meta's interface
4. **Meta returns:**
   - `code` - OAuth authorization code
   - `setup_data.waba_id` - WhatsApp Business Account ID
   - `setup_data.phone_number_id` - Phone Number ID
5. **Frontend sends all data** to `/api/whatsapp/embedded-signup-complete`
6. **Backend:**
   - Exchanges code for access token
   - Saves WABA ID and phone number ID to database
   - Returns success

## Why This Works

- ✅ **No API calls needed** to fetch WABA details
- ✅ **Works with System Users** (the token type Meta provides)
- ✅ **Direct from Meta** - WABA details come from Meta's SDK
- ✅ **Multi-user SaaS ready** - Each user gets their own WABA

## Testing

1. Make sure your Meta App has:
   - WhatsApp product added
   - Embedded Signup configured
   - Correct redirect URIs
   - App domains configured

2. Test the flow:
   ```
   Click Connect → Meta Dialog Opens → Complete Setup → Success!
   ```

3. Check backend logs for:
   ```
   🚀 COMPLETING EMBEDDED SIGNUP WITH SDK DATA
   📱 WABA ID: 123456789
   📞 Phone Number ID: 987654321
   ✅ Created WhatsApp account for user X
   ```

## Troubleshooting

### "Facebook SDK not loaded"
- Check that the SDK script is loaded before calling FB.login()
- Add a check: `if (typeof FB === 'undefined')`

### "No setup data received"
- Verify `config_id` is correct in your Meta App
- Check that Embedded Signup is enabled in Meta App settings
- Ensure you're using `response_type: 'code'` and `override_default_response_type: true`

### "Setup data incomplete"
- User may have cancelled during setup
- Check Meta App configuration
- Verify WhatsApp product is properly configured

## References

- [Meta Embedded Signup Documentation](https://developers.facebook.com/docs/whatsapp/embedded-signup)
- [Facebook JavaScript SDK](https://developers.facebook.com/docs/javascript)
- [WhatsApp Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api)
