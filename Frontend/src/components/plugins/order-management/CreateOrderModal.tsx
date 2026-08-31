import { useState } from "react";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { toast } from "sonner";
import { OrderStatus, PaymentStatus } from "@/routes/dashboard.plugins.order-management.index";

interface CreateOrderItem {
  product_name: string;
  sku: string;
  quantity: number;
  unit_price: number;
}

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  isSubmitting: boolean;
}

export function CreateOrderModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: CreateOrderModalProps) {
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("pending");
  const [orderStatus, setOrderStatus] = useState<OrderStatus>("pending");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<CreateOrderItem[]>([
    { product_name: "", sku: "", quantity: 1, unit_price: 0 },
  ]);

  const handleAddItem = () => {
    setItems((prev) => [...prev, { product_name: "", sku: "", quantity: 1, unit_price: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof CreateOrderItem, value: any) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validItems = items.filter((item) => item.product_name.trim() !== "");

    if (validItems.length === 0) {
      toast.error("Please add at least one line item with a product name.");
      return;
    }

    await onSubmit({
      customer_name: customerName,
      customer_email: customerEmail || undefined,
      customer_phone: customerPhone || undefined,
      shipping_address: shippingAddress,
      payment_status: paymentStatus,
      order_status: orderStatus,
      notes: notes || undefined,
      items: validItems.map((item) => ({
        product_name: item.product_name,
        sku: item.sku || undefined,
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
      })),
    });

    // Reset form
    setCustomerName("");
    setCustomerEmail("");
    setCustomerPhone("");
    setShippingAddress("");
    setPaymentStatus("pending");
    setOrderStatus("pending");
    setNotes("");
    setItems([{ product_name: "", sku: "", quantity: 1, unit_price: 0 }]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Sales Order</DialogTitle>
          <DialogDescription>
            Enter customer details, line items, and shipping address to create a new order.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Information */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm text-gray-900 dark:text-white border-b pb-2">
              1. Customer Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customerName" className="required">
                  Customer Name *
                </Label>
                <Input
                  id="customerName"
                  placeholder="e.g. Rahul Sharma"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="customerEmail">Customer Email</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  placeholder="rahul@example.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customerPhone">Phone Number</Label>
                <Input
                  id="customerPhone"
                  placeholder="+91 9876543210"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="paymentStatus">Payment Status</Label>
                <Select
                  value={paymentStatus}
                  onValueChange={(val: PaymentStatus) => setPaymentStatus(val)}
                >
                  <SelectTrigger id="paymentStatus">
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
            </div>

            <div>
              <Label htmlFor="shippingAddress">Shipping Address *</Label>
              <Textarea
                id="shippingAddress"
                placeholder="Enter complete delivery street address, city, state, postal code..."
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                required
                rows={2}
              />
            </div>
          </div>

          {/* Order Line Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="font-semibold text-sm text-gray-900 dark:text-white">
                2. Order Products / Line Items
              </h4>
              <Button
                type="button"
                onClick={handleAddItem}
                variant="outline"
                size="sm"
                className="gap-1 text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Item
              </Button>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-12 gap-2 items-center p-3 bg-gray-50 dark:bg-slate-800 rounded-xl"
                >
                  <div className="col-span-5">
                    <Label className="text-xs">Product Name</Label>
                    <Input
                      placeholder="Item name"
                      value={item.product_name}
                      onChange={(e) => handleItemChange(idx, "product_name", e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-span-3">
                    <Label className="text-xs">SKU</Label>
                    <Input
                      placeholder="SKU Code"
                      value={item.sku}
                      onChange={(e) => handleItemChange(idx, "sku", e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Qty</Label>
                    <Input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-span-2 flex items-center gap-1">
                    <div className="flex-1">
                      <Label className="text-xs">Price ($)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        value={item.unit_price}
                        onChange={(e) => handleItemChange(idx, "unit_price", e.target.value)}
                        required
                      />
                    </div>
                    {items.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950/40 mt-5"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status & Notes */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm text-gray-900 dark:text-white border-b pb-2">
              3. Status & Notes
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="orderStatus">Initial Order Status</Label>
                <Select
                  value={orderStatus}
                  onValueChange={(val: OrderStatus) => setOrderStatus(val)}
                >
                  <SelectTrigger id="orderStatus">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="notes">Delivery / Internal Notes</Label>
                <Input
                  id="notes"
                  placeholder="Special instructions or customer remarks"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Order
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
