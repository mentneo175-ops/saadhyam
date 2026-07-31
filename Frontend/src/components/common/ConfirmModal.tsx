/**
 * ConfirmModal.tsx
 * Reusable confirmation dialog using Radix UI Dialog.
 * Replaces browser confirm() for delete/destructive actions.
 */

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";

export interface ConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  variant?: "destructive" | "default";
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export const ConfirmModal = React.memo(function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isLoading = false,
  variant = "destructive",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent
        className="max-w-sm"
        onEscapeKeyDown={onCancel}
        aria-describedby="confirm-modal-description"
      >
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            {variant === "destructive" && (
              <div className="p-2 rounded-full bg-destructive/10 flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-destructive" aria-hidden />
              </div>
            )}
            <DialogTitle className="text-left">{title}</DialogTitle>
          </div>
          <DialogDescription id="confirm-modal-description" className="text-left">
            {description}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            aria-label={cancelLabel}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={variant}
            onClick={onConfirm}
            disabled={isLoading}
            aria-label={confirmLabel}
          >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
