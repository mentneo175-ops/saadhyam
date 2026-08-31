import { Eye, Edit3, Truck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Order, OrderStatus, PaymentStatus } from "@/routes/dashboard.plugins.order-management.index";

interface OrdersTableProps {
  orders: Order[];
  onView: (order: Order) => void;
  onEdit: (order: Order) => void;
  onUpdateStatus: (order: Order) => void;
  onDelete: (order: Order) => void;
}

export function OrdersTable({
  orders,
  onView,
  onEdit,
  onUpdateStatus,
  onDelete,
}: OrdersTableProps) {
  const getOrderStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-100 border-none font-semibold">Completed</Badge>;
      case "delivered":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300 hover:bg-green-100 border-none font-semibold">Delivered</Badge>;
      case "shipped":
        return <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 hover:bg-indigo-100 border-none font-semibold">Shipped</Badge>;
      case "processing":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 hover:bg-blue-100 border-none font-semibold">Processing</Badge>;
      case "confirmed":
        return <Badge className="bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 hover:bg-teal-100 border-none font-semibold">Confirmed</Badge>;
      case "pending":
        return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 hover:bg-amber-100 border-none font-semibold">Pending</Badge>;
      case "cancelled":
        return <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 hover:bg-rose-100 border-none font-semibold">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400 border border-green-200 dark:border-green-800 font-medium">Paid</Badge>;
      case "pending":
        return <Badge className="bg-yellow-50 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800 font-medium">Unpaid</Badge>;
      case "refunded":
        return <Badge className="bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border border-purple-200 dark:border-purple-800 font-medium">Refunded</Badge>;
      case "failed":
        return <Badge className="bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-800 font-medium">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200/80 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
      <Table>
        <TableHeader className="bg-gray-50/80 dark:bg-slate-800/50">
          <TableRow>
            <TableHead className="font-semibold">Order Number</TableHead>
            <TableHead className="font-semibold">Customer</TableHead>
            <TableHead className="font-semibold">Total Amount</TableHead>
            <TableHead className="font-semibold">Payment</TableHead>
            <TableHead className="font-semibold">Order Status</TableHead>
            <TableHead className="font-semibold">Date</TableHead>
            <TableHead className="font-semibold text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors">
              <TableCell className="font-mono font-medium text-purple-600 dark:text-purple-400">
                {order.order_number}
              </TableCell>
              <TableCell>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">{order.customer_name}</p>
                  {order.customer_email && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">{order.customer_email}</p>
                  )}
                </div>
              </TableCell>
              <TableCell className="font-semibold text-gray-900 dark:text-white">
                ${order.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </TableCell>
              <TableCell>{getPaymentStatusBadge(order.payment_status)}</TableCell>
              <TableCell>{getOrderStatusBadge(order.order_status)}</TableCell>
              <TableCell className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(order.created_at).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    onClick={() => onView(order)}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-gray-600 hover:text-purple-600 hover:bg-purple-50 dark:text-gray-400 dark:hover:text-purple-400 dark:hover:bg-purple-950/30"
                    title="View Order Details"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => onEdit(order)}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-gray-600 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-blue-950/30"
                    title="Edit Order"
                  >
                    <Edit3 className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => onUpdateStatus(order)}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-gray-600 hover:text-amber-600 hover:bg-amber-50 dark:text-gray-400 dark:hover:text-amber-400 dark:hover:bg-amber-950/30"
                    title="Update Order Status"
                  >
                    <Truck className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => onDelete(order)}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-gray-600 hover:text-rose-600 hover:bg-rose-50 dark:text-gray-400 dark:hover:text-rose-400 dark:hover:bg-rose-950/30"
                    title="Delete Order"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
