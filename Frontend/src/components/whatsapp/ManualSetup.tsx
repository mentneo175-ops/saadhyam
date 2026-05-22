import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { env } from "@/config/env";

interface ManualSetupProps {
  onSuccess: () => void;
  onBack: () => void;
}

export function ManualSetup({ onSuccess, onBack }: ManualSetupProps) {
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [wabaId, setWabaId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!phoneNumberId || !wabaId || !accessToken) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem("saadhyam_token");

      const response = await fetch(
        `${env.apiBaseUrl}/api/whatsapp/connect-manual`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone_number_id: phoneNumberId,
            waba_id: wabaId,
            access_token: accessToken,
            business_name: businessName || undefined,
            phone_number: phoneNumber || undefined,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message || "WhatsApp account connected successfully!");
        onSuccess();
      } else {
        const error = await response.json();
        toast.error(error.detail || "Failed to connect WhatsApp account");
      }
    } catch (error) {
      console.error("Error saving WhatsApp account:", error);
      toast.error("Failed to connect WhatsApp account");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Button variant="ghost" onClick={onBack} className="mb-4">
        <ArrowLeft size={16} className="mr-2" />
        Back
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Manual WhatsApp Setup</CardTitle>
          <CardDescription>
            Enter your WhatsApp Business account details from Meta Business Manager
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phoneNumberId">
              Phone Number ID <span className="text-red-500">*</span>
            </Label>
            <Input
              id="phoneNumberId"
              value={phoneNumberId}
              onChange={(e) => setPhoneNumberId(e.target.value)}
              placeholder="e.g., 1045916955280773"
            />
            <p className="text-xs text-muted-foreground">
              Find this in Meta Business Manager → WhatsApp → Phone Numbers
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="wabaId">
              WABA ID (WhatsApp Business Account ID) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="wabaId"
              value={wabaId}
              onChange={(e) => setWabaId(e.target.value)}
              placeholder="e.g., 123456789012345"
            />
            <p className="text-xs text-muted-foreground">
              Find this in Meta Business Manager → WhatsApp → Settings
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="accessToken">
              Access Token <span className="text-red-500">*</span>
            </Label>
            <Input
              id="accessToken"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder="Paste your access token here"
              type="password"
            />
            <p className="text-xs text-muted-foreground">
              Use the token from your .env file or generate a new one in Meta Business Manager
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessName">Business Name (Optional)</Label>
            <Input
              id="businessName"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g., My Business"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number (Optional)</Label>
            <Input
              id="phoneNumber"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="e.g., +1234567890"
            />
          </div>

          <div className="pt-4">
            <Button
              onClick={handleSave}
              disabled={saving || !phoneNumberId || !wabaId || !accessToken}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} className="mr-2" />
                  Save & Connect
                </>
              )}
            </Button>
          </div>

          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-xs text-blue-900 dark:text-blue-100">
              <strong>Where to find these values:</strong>
              <br />
              1. Go to{" "}
              <a
                href="https://business.facebook.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Meta Business Manager
              </a>
              <br />
              2. Navigate to WhatsApp → Settings
              <br />
              3. Copy the Phone Number ID and WABA ID
              <br />
              4. Use your existing access token from .env file
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
