import { Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Order } from "@/routes/dashboard.plugins.order-management.index";

interface DeleteOrderDialogProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (id: number) => Promise<void>;
  isDeleting: boolean;
}

export function DeleteOrderDialog({
  order,
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
}: DeleteOrderDialogProps) {
  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <AlertTriangle className="w-5 h-5" />
            Delete Order #{order.order_number}?
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete order #{order.order_number} for customer{" "}
            <span className="font-semibold text-gray-900 dark:text-white">{order.customer_name}</span>?
            This action will permanently delete the order and line items.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-0 mt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => onConfirm(order.id)}
            disabled={isDeleting}
            className="bg-rose-600 hover:bg-rose-700 text-white font-medium"
          >
            {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Delete Permanently
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
