import { useState, useEffect } from "react";
import { Loader2, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Order, OrderStatus, PaymentStatus } from "@/routes/dashboard.plugins.order-management.index";

interface UpdateStatusModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: number, data: any) => Promise<void>;
  isSubmitting: boolean;
}

const ALLOWED_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["pending", "confirmed", "cancelled"],
  confirmed: ["confirmed", "processing", "cancelled"],
  processing: ["processing", "shipped", "cancelled"],
  shipped: ["shipped", "delivered"],
  delivered: ["delivered", "completed"],
  completed: ["completed"],
  cancelled: ["cancelled"],
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function UpdateStatusModal({
  order,
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: UpdateStatusModalProps) {
  const [orderStatus, setOrderStatus] = useState<OrderStatus>("pending");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("pending");
  const [carrierName, setCarrierName] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (order) {
      setOrderStatus(order.order_status);
      setPaymentStatus(order.payment_status);
      setCarrierName(order.carrier_name || "");
      setTrackingNumber(order.tracking_number || "");
      setNotes(order.notes || "");
    }
  }, [order]);

  if (!order) return null;

  const currentStatus = order.order_status;
  const allowedOptions = ALLOWED_STATUS_TRANSITIONS[currentStatus] || [currentStatus];
  const isTerminal = currentStatus === "completed" || currentStatus === "cancelled";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await onSubmit(order.id, {
      order_status: orderStatus,
      payment_status: paymentStatus,
      carrier_name: carrierName || undefined,
      tracking_number: trackingNumber || undefined,
      notes: notes || undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-amber-500" />
            Update Order Status & Logistics
          </DialogTitle>
          <DialogDescription>
            Modify order status, carrier, and shipment tracking info for Order #{order.order_number}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label htmlFor="updateOrderStatus">Order Status *</Label>
              <span className="text-xs text-muted-foreground">
                Current: <strong className="capitalize text-foreground">{currentStatus}</strong>
              </span>
            </div>
            <Select
              value={orderStatus}
              onValueChange={(val: OrderStatus) => setOrderStatus(val)}
              disabled={isTerminal}
            >
              <SelectTrigger id="updateOrderStatus">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {allowedOptions.map((st) => (
                  <SelectItem key={st} value={st}>
                    {STATUS_LABELS[st]}
                    {st === currentStatus ? " (Current)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isTerminal && (
              <p className="text-xs text-amber-600 mt-1">
                This order is in a terminal state ({currentStatus}) and cannot transition to other statuses.
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="updatePaymentStatus">Payment Status</Label>
            <Select
              value={paymentStatus}
              onValueChange={(val: PaymentStatus) => setPaymentStatus(val)}
            >
              <SelectTrigger id="updatePaymentStatus">
                <SelectValue placeholder="Select payment status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Unpaid / Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="updateCarrier">Courier / Carrier Name</Label>
            <Input
              id="updateCarrier"
              placeholder="e.g. FedEx, DHL, BlueDart"
              value={carrierName}
              onChange={(e) => setCarrierName(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="updateTracking">Shipment Tracking Number</Label>
            <Input
              id="updateTracking"
              placeholder="e.g. FX-987654321IN"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="updateStatusNotes">Status Update Notes</Label>
            <Input
              id="updateStatusNotes"
              placeholder="e.g. Dispatched via express courier"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-amber-600 hover:bg-amber-700 text-white font-medium"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Update Status
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
