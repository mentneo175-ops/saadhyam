import { Package, DollarSign, Truck, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Order } from "@/routes/dashboard.plugins.order-management.index";

interface KPISectionProps {
  orders: Order[];
  serverStats?: Record<string, any> | null;
}

export function KPISection({ orders, serverStats }: KPISectionProps) {
  // Prefer server-side stats when available; fall back to consistent client-side computation
  const totalOrders = serverStats?.total_orders ?? orders.length;
  
  const totalRevenue = serverStats?.total_revenue ?? orders.reduce((sum, order) => {
    return (order.payment_status === "paid" && order.order_status !== "cancelled") ? sum + order.total_amount : sum;
  }, 0);

  const activeShipments = serverStats?.active_shipments ?? orders.filter(
    (order) => order.order_status === "shipped"
  ).length;

  const cancelledOrders = serverStats?.cancelled_orders ?? orders.filter(
    (order) => order.order_status === "cancelled"
  ).length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Orders Card */}
      <Card className="border border-purple-100 dark:border-purple-900/30 bg-gradient-to-br from-purple-50/50 to-white dark:from-slate-900 dark:to-slate-900 shadow-sm">
        <CardContent className="p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Orders</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {totalOrders.toLocaleString()}
            </h3>
            <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">All recorded orders</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Package className="w-6 h-6" />
          </div>
        </CardContent>
      </Card>

      {/* Total Revenue Card */}
      <Card className="border border-green-100 dark:border-green-900/30 bg-gradient-to-br from-green-50/50 to-white dark:from-slate-900 dark:to-slate-900 shadow-sm">
        <CardContent className="p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Revenue</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <span className="text-xs text-green-600 dark:text-green-400 font-medium">From paid orders</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
        </CardContent>
      </Card>

      {/* Active Shipments Card */}
      <Card className="border border-blue-100 dark:border-blue-900/30 bg-gradient-to-br from-blue-50/50 to-white dark:from-slate-900 dark:to-slate-900 shadow-sm">
        <CardContent className="p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Active Shipments</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {activeShipments.toLocaleString()}
            </h3>
            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Shipped in transit</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Truck className="w-6 h-6" />
          </div>
        </CardContent>
      </Card>

      {/* Cancelled Orders Card */}
      <Card className="border border-rose-100 dark:border-rose-900/30 bg-gradient-to-br from-rose-50/50 to-white dark:from-slate-900 dark:to-slate-900 shadow-sm">
        <CardContent className="p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Cancelled Orders</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {cancelledOrders.toLocaleString()}
            </h3>
            <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">Cancelled orders</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <XCircle className="w-6 h-6" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
