import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, CheckCircle, AlertTriangle, Info, ExternalLink } from "lucide-react";

interface OnboardingGuideProps {
  onDismiss: () => void;
}

export function OnboardingGuide({ onDismiss }: OnboardingGuideProps) {
  return (
    <Card className="border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <Info size={24} className="text-blue-600" />
              WhatsApp Business Setup Guide
            </CardTitle>
            <CardDescription className="mt-2">
              Everything you need to know before connecting your WhatsApp Business account
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="shrink-0"
          >
            <X size={18} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Step 1 */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold">
              1
            </span>
            WhatsApp Business Account
          </h3>
          <div className="ml-10 space-y-2">
            <p className="text-sm text-muted-foreground">
              You need a <strong>WhatsApp Business account</strong>, not a personal WhatsApp account.
            </p>
            <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="text-yellow-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-yellow-900 dark:text-yellow-100">
                  <strong>Important:</strong> If your phone number is already registered with personal WhatsApp, 
                  you cannot use it for WhatsApp Business API. Use a different number.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold">
              2
            </span>
            Facebook Business Account
          </h3>
          <div className="ml-10 space-y-2">
            <p className="text-sm text-muted-foreground">
              WhatsApp Business API requires a Facebook Business account for authentication.
            </p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle size={14} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                <span>Create one at <a href="https://business.facebook.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">business.facebook.com</a></span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={14} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                <span>It's free and takes about 5 minutes</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={14} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                <span>You'll use this to manage WhatsApp permissions</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Step 3 */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold">
              3
            </span>
            Phone Number Requirements
          </h3>
          <div className="ml-10 space-y-2">
            <p className="text-sm text-muted-foreground">
              Your phone number must meet these requirements:
            </p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle size={14} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                <span>Not currently registered with personal WhatsApp</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={14} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                <span>Not already connected to another WhatsApp Business API</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={14} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                <span>Able to receive SMS or voice calls for verification</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={14} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                <span>Recommended: Use a dedicated business number</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Step 4 */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold">
              4
            </span>
            Business Verification
          </h3>
          <div className="ml-10 space-y-2">
            <p className="text-sm text-muted-foreground">
              Meta may require business verification for certain features:
            </p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Info size={14} className="text-blue-600 mt-0.5 flex-shrink-0" />
                <span>Basic messaging works immediately</span>
              </li>
              <li className="flex items-start gap-2">
                <Info size={14} className="text-blue-600 mt-0.5 flex-shrink-0" />
                <span>Marketing templates require approval</span>
              </li>
              <li className="flex items-start gap-2">
                <Info size={14} className="text-blue-600 mt-0.5 flex-shrink-0" />
                <span>Higher message limits need verification</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Connection Process */}
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
            <CheckCircle size={16} className="text-emerald-600" />
            What Happens When You Connect?
          </h4>
          <ol className="space-y-1 text-sm text-muted-foreground list-decimal list-inside">
            <li>You'll be redirected to Meta's secure login page</li>
            <li>Log in with your Facebook Business account</li>
            <li>Select your WhatsApp Business account</li>
            <li>Grant permissions for messaging</li>
            <li>You'll be redirected back to Saadhyam AI</li>
            <li>Start managing conversations immediately!</li>
          </ol>
        </div>

        {/* Help Resources */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Helpful Resources</h4>
          <div className="space-y-1">
            <a
              href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              <ExternalLink size={14} />
              WhatsApp Cloud API Documentation
            </a>
            <a
              href="https://www.facebook.com/business/help/2058515294227817"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              <ExternalLink size={14} />
              WhatsApp Business API Requirements
            </a>
            <a
              href="https://business.facebook.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              <ExternalLink size={14} />
              Create Facebook Business Account
            </a>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="outline" onClick={onDismiss}>
            I'll Set This Up Later
          </Button>
          <Button onClick={onDismiss} className="bg-emerald-600 hover:bg-emerald-700">
            Got It, Let's Connect!
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
