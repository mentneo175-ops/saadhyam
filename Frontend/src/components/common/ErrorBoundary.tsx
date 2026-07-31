/**
 * ErrorBoundary.tsx
 * Class-based error boundary wrapping the Gmail dashboard.
 * Renders a friendly recovery UI on unhandled render errors.
 */

import React from "react";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: React.ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error: unknown): State {
    const msg =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return { hasError: true, errorMessage: msg };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error("[ErrorBoundary] Caught error:", error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, errorMessage: "" });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoBack = () => {
    window.history.back();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center"
        >
          <div className="p-4 rounded-full bg-destructive/10 mb-4">
            <AlertTriangle className="w-10 h-10 text-destructive" aria-hidden />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">
            {this.props.fallbackTitle ?? "Something went wrong"}
          </h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">
            {this.state.errorMessage}
          </p>
          <div className="flex gap-3 flex-wrap justify-center">
            <Button
              onClick={this.handleRetry}
              variant="default"
              className="gap-2"
              aria-label="Retry rendering component"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </Button>
            <Button
              onClick={this.handleReload}
              variant="outline"
              className="gap-2"
              aria-label="Reload page"
            >
              Reload Page
            </Button>
            <Button
              onClick={this.handleGoBack}
              variant="ghost"
              className="gap-2"
              aria-label="Go back"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
