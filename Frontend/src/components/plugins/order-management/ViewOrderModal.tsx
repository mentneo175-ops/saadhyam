import { Package, User, MapPin, Truck, Calendar, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Order } from "@/routes/dashboard.plugins.order-management.index";

interface ViewOrderModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ViewOrderModal({ order, isOpen, onClose }: ViewOrderModalProps) {
  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl flex items-center gap-2">
              <Package className="w-5 h-5 text-purple-600" />
              Order #{order.order_number}
            </DialogTitle>
            <Badge variant="outline" className="capitalize font-mono">
              {order.order_status}
            </Badge>
          </div>
          <DialogDescription>
            Detailed view of sales order, items, shipping, and payment status.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 my-2">
          {/* Customer & Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                <User className="w-3.5 h-3.5 text-purple-500" />
                Customer
              </div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{order.customer_name}</p>
              {order.customer_email && (
                <p className="text-xs text-gray-600 dark:text-gray-400">{order.customer_email}</p>
              )}
              {order.customer_phone && (
                <p className="text-xs text-gray-600 dark:text-gray-400">{order.customer_phone}</p>
              )}
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                <MapPin className="w-3.5 h-3.5 text-purple-500" />
                Shipping Address
              </div>
              <p className="text-xs text-gray-800 dark:text-gray-200 leading-relaxed">
                {order.shipping_address}
              </p>
            </div>
          </div>

          {/* Payment & Logistics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl text-xs">
            <div>
              <div className="flex items-center gap-1.5 font-semibold text-gray-500 dark:text-gray-400 mb-1">
                <CreditCard className="w-3.5 h-3.5 text-green-500" />
                Payment Information
              </div>
              <p className="font-medium text-gray-900 dark:text-white">
                Payment Status: <span className="capitalize font-semibold text-purple-600 dark:text-purple-400">{order.payment_status}</span>
              </p>
              <p className="font-semibold text-sm text-gray-900 dark:text-white mt-1">
                Total: ${order.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-1.5 font-semibold text-gray-500 dark:text-gray-400 mb-1">
                <Truck className="w-3.5 h-3.5 text-blue-500" />
                Logistics & Carrier
              </div>
              <p className="text-gray-800 dark:text-gray-200">
                Carrier: <span className="font-semibold">{order.carrier_name || "Not assigned"}</span>
              </p>
              <p className="text-gray-800 dark:text-gray-200">
                Tracking #: <span className="font-mono">{order.tracking_number || "N/A"}</span>
              </p>
            </div>
          </div>

          {/* Line Items Table */}
          <div>
            <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-2">
              Order Line Items ({order.items.length})
            </h4>
            <div className="border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 font-semibold border-b border-gray-200 dark:border-slate-700">
                  <tr>
                    <th className="p-2.5">Product</th>
                    <th className="p-2.5">SKU</th>
                    <th className="p-2.5 text-center">Qty</th>
                    <th className="p-2.5 text-right">Price</th>
                    <th className="p-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td className="p-2.5 font-medium text-gray-900 dark:text-white">{item.product_name}</td>
                      <td className="p-2.5 font-mono text-gray-500">{item.sku || "N/A"}</td>
                      <td className="p-2.5 text-center font-semibold">{item.quantity}</td>
                      <td className="p-2.5 text-right">${item.unit_price.toFixed(2)}</td>
                      <td className="p-2.5 text-right font-semibold">${item.total_price.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="p-3 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/40 rounded-xl text-xs">
              <span className="font-semibold text-purple-900 dark:text-purple-300">Notes: </span>
              <span className="text-purple-800 dark:text-purple-400">{order.notes}</span>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <Button onClick={onClose} variant="outline" size="sm">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
