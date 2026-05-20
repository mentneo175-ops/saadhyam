import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";

type FeatureDisabledStateProps = {
  title: string;
  message?: string;
  featureLabel?: string;
};

export function FeatureDisabledState({
  title,
  message = "This module is currently disabled by your admin.",
  featureLabel,
}: FeatureDisabledStateProps) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <Card className="max-w-2xl w-full border-amber-200 bg-amber-50/60 shadow-sm">
        <CardContent className="p-8 text-center space-y-6">
          <div className="mx-auto h-14 w-14 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
            <AlertTriangle size={28} />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
              Feature unavailable
            </p>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            <p className="text-sm text-gray-600 max-w-xl mx-auto">{message}</p>
            {featureLabel && (
              <p className="text-xs text-gray-500">Feature key: {featureLabel}</p>
            )}
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="outline" onClick={() => window.history.back()}>
              <ArrowLeft size={16} className="mr-2" />
              Go back
            </Button>
            <Button onClick={() => window.location.reload()} className="bg-amber-600 hover:bg-amber-700">
              <RefreshCw size={16} className="mr-2" />
              Check again
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
