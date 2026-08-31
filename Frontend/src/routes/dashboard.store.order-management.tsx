import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Package,
  Plus,
  ArrowLeft,
  RefreshCw,
  Search,
  Filter,
  Loader2,
  AlertCircle,
  Settings as SettingsIcon,
  ShoppingBag,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  getStoreOrders,
  getStoreOrderStatistics,
  getStoreOrderConfig,
  createStoreOrder,
  updateStoreOrder,
  updateStoreOrderStatus,
  deleteStoreOrder,
  exportStoreOrdersCSV,
  StoreOrder,
  StoreOrderConfig,
  StoreOrderStatistics,
} from "@/lib/storeApi";

// Subcomponents
import { KPISection } from "@/components/plugins/order-management/KPISection";
import { OrdersTable } from "@/components/plugins/order-management/OrdersTable";
import { CreateOrderModal } from "@/components/plugins/order-management/CreateOrderModal";
import { EditOrderModal } from "@/components/plugins/order-management/EditOrderModal";
import { UpdateStatusModal } from "@/components/plugins/order-management/UpdateStatusModal";
import { DeleteOrderDialog } from "@/components/plugins/order-management/DeleteOrderDialog";
import { ViewOrderModal } from "@/components/plugins/order-management/ViewOrderModal";
import { OrderSettingsModal } from "@/components/plugins/order-management/OrderSettingsModal";
import { OrderManagementOnboardingWizard } from "@/components/plugins/order-management/OrderManagementOnboardingWizard";

export const Route = createFileRoute("/dashboard/store/order-management")({
  head: () => ({
    meta: [{ title: "Store ΓÇö Order Management ΓÇö Saadhyam AI" }],
  }),
  component: StoreOrderManagementPage,
});

export function StoreOrderManagementPage() {
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverStats, setServerStats] = useState<StoreOrderStatistics | null>(null);

  // Store Solution Onboarding & Config States
  const [config, setConfig] = useState<StoreOrderConfig | null>(null);
  const [isConfigLoading, setIsConfigLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");

  // Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState<StoreOrder | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadConfigAndOrders();
  }, []);

  const loadConfigAndOrders = async () => {
    setIsConfigLoading(true);
    try {
      const cfg = await getStoreOrderConfig();
      if (cfg) {
        setConfig(cfg);
        if (cfg.setup_completed === false) {
          setShowOnboarding(true);
        } else {
          setShowOnboarding(false);
          await fetchOrders();
        }
      }
    } catch (err) {
      console.error("Failed to load order configuration:", err);
      await fetchOrders();
    } finally {
      setIsConfigLoading(false);
    }
  };

  const fetchOrders = async (showRefreshSpinner = false) => {
    if (showRefreshSpinner) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const response = await getStoreOrders();
      if (response && response.orders) {
        setOrders(response.orders);
      } else if (Array.isArray(response)) {
        setOrders(response);
      } else {
        setOrders([]);
      }
    } catch (err: any) {
      console.error("Failed to fetch sales orders:", err);
      setError(err?.message || "Failed to load orders. Please try again.");
      toast.error("Failed to load orders.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }

    // Fetch server-side statistics (non-blocking)
    try {
      const statsRes = await getStoreOrderStatistics();
      if (statsRes?.success && statsRes?.data) {
        setServerStats(statsRes.data);
      }
    } catch {
      // Fallback to client-side KPI computation
    }
  };

  const handleOnboardingComplete = async (savedConfig: any) => {
    setConfig(savedConfig);
    setShowOnboarding(false);
    await fetchOrders();
  };

  // Create Order Handler
  const handleCreateOrder = async (orderData: any) => {
    setIsSubmitting(true);
    try {
      const createdOrder = await createStoreOrder(orderData);
      toast.success(`Order #${createdOrder.order_number || "created"} successfully!`);
      setIsCreateOpen(false);
      await fetchOrders(true);
    } catch (err: any) {
      console.error("Failed to create order:", err);
      toast.error(err?.message || "Failed to create order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit Order Details Handler
  const handleEditOrder = async (id: number, updateData: any) => {
    setIsSubmitting(true);
    try {
      await updateStoreOrder(id, updateData);
      toast.success("Order details updated successfully!");
      setIsEditOpen(false);
      setSelectedOrder(null);
      await fetchOrders(true);
    } catch (err: any) {
      console.error("Failed to update order:", err);
      toast.error(err?.message || "Failed to update order details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update Status & Logistics Handler
  const handleUpdateStatus = async (id: number, statusData: any) => {
    setIsSubmitting(true);
    try {
      await updateStoreOrderStatus(id, statusData);
      toast.success("Order status updated successfully!");
      setIsStatusOpen(false);
      setSelectedOrder(null);
      await fetchOrders(true);
    } catch (err: any) {
      console.error("Failed to update status:", err);
      toast.error(err?.message || "Failed to update status.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Order Handler
  const handleDeleteOrder = async (id: number) => {
    setIsSubmitting(true);
    try {
      await deleteStoreOrder(id);
      toast.success("Order deleted successfully!");
      setIsDeleteOpen(false);
      setSelectedOrder(null);
      await fetchOrders(true);
    } catch (err: any) {
      console.error("Failed to delete order:", err);
      toast.error(err?.message || "Failed to delete order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Export CSV Handler
  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const blob = await exportStoreOrdersCSV({
        status: statusFilter,
        query: searchQuery,
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sales_orders_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Orders CSV exported successfully!");
    } catch (err: any) {
      console.error("Export failed:", err);
      toast.error(err?.message || "Failed to export orders.");
    } finally {
      setIsExporting(false);
    }
  };

  // Filtered Orders Logic
  const filteredOrders = orders.filter((order) => {
    // Status Filter
    if (statusFilter !== "all" && order.order_status !== statusFilter) {
      return false;
    }
    // Payment Filter
    if (paymentFilter !== "all" && order.payment_status !== paymentFilter) {
      return false;
    }
    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = order.customer_name?.toLowerCase().includes(q);
      const matchNum = order.order_number?.toLowerCase().includes(q);
      const matchAddr = order.shipping_address?.toLowerCase().includes(q);
      const matchEmail = order.customer_email?.toLowerCase().includes(q);
      return matchName || matchNum || matchAddr || matchEmail;
    }
    return true;
  });

  // Show loading spinner while determining user setup state
  if (isConfigLoading) {
    return (
      <div className="container mx-auto p-12 max-w-7xl flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
        <p className="text-sm font-medium text-muted-foreground">Loading Order Management Solution...</p>
      </div>
    );
  }

  // Show Store Solution Onboarding Wizard if not yet configured
  if (showOnboarding) {
    return (
      <OrderManagementOnboardingWizard
        initialConfig={config}
        onComplete={handleOnboardingComplete}
      />
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6 max-w-7xl animate-in fade-in duration-200">
      {/* Breadcrumb Navigation */}
      <div>
        <Link
          to="/dashboard/store"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Saadhyam Store
        </Link>
      </div>

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5 border-gray-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white flex items-center justify-center text-xl shadow-md shrink-0">
              ≡ƒôª
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  Order Management
                </h1>
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs">
                  <ShoppingBag className="h-3 w-3 mr-1" />
                  Saadhyam Store Solution
                </Badge>
                {config?.currency && (
                  <span className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-md font-mono border">
                    {config.currency}
                  </span>
                )}
                {config?.is_password_configured && config?.email_notifications_enabled ? (
                  <span className="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 text-[11px] px-2 py-0.5 rounded-full font-medium border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Emails: {config?.provider?.toUpperCase() || "SMTP"}
                  </span>
                ) : (
                  <span className="bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 text-[11px] px-2 py-0.5 rounded-full font-medium border border-amber-200 dark:border-amber-800">
                    Emails: Test Mode
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Track customer orders, manage line items, update delivery status, and streamline fulfillment.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <Button
            onClick={handleExportCSV}
            variant="outline"
            size="sm"
            disabled={isExporting || isLoading || orders.length === 0}
            className="gap-1.5"
          >
            <Download className="w-4 h-4" />
            {isExporting ? "Exporting..." : "Export CSV"}
          </Button>

          <Button
            onClick={() => fetchOrders(true)}
            variant="outline"
            size="sm"
            disabled={isRefreshing || isLoading}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            onClick={() => setIsSettingsOpen(true)}
            variant="outline"
            size="sm"
            className="gap-2 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/40"
          >
            <SettingsIcon className="w-4 h-4 text-purple-600" />
            Email & SMTP Settings
          </Button>

          <Button
            onClick={() => setIsCreateOpen(true)}
            size="sm"
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium shadow-md gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Order
          </Button>
        </div>
      </div>

      {/* KPI Section */}
      <KPISection orders={orders} serverStats={serverStats} />

      {/* Search & Filters Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search by customer, order #, email, or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-gray-50/50 dark:bg-slate-800/50 border-gray-200 dark:border-slate-700"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Order Status Filter */}
          <div className="w-40">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-gray-50/50 dark:bg-slate-800/50">
                <Filter className="w-3.5 h-3.5 mr-2 text-gray-500" />
                <SelectValue placeholder="Order Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
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

          {/* Payment Status Filter */}
          <div className="w-40">
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="bg-gray-50/50 dark:bg-slate-800/50">
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Unpaid</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Main Content State Rendering */}
      {isLoading ? (
        <Card className="border-dashed border-2 py-20 text-center">
          <CardContent className="flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 text-purple-600 animate-spin mb-3" />
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Loading Sales Orders...</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Fetching order records from database</p>
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="border-rose-200 dark:border-rose-900/50 bg-rose-50/20 dark:bg-rose-950/10 py-16 text-center">
          <CardContent className="flex flex-col items-center justify-center">
            <AlertCircle className="w-10 h-10 text-rose-500 mb-3" />
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Error Loading Orders</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md my-2">{error}</p>
            <Button onClick={() => fetchOrders()} variant="outline" size="sm" className="mt-2">
              Try Again
            </Button>
          </CardContent>
        </Card>
      ) : filteredOrders.length === 0 ? (
        <Card className="border-dashed border-2 py-16 text-center bg-white dark:bg-slate-900">
          <CardContent className="flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center text-3xl mb-4">
              ≡ƒôª
            </div>
            <h3 className="font-bold text-xl text-gray-900 dark:text-white">No Orders Found</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md my-2">
              {searchQuery || statusFilter !== "all" || paymentFilter !== "all"
                ? "No sales orders match your selected search filters."
                : "You haven't created any sales orders yet. Click below to add your first order."}
            </p>
            <Button
              onClick={() => setIsCreateOpen(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium mt-4 shadow-md"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create First Order
            </Button>
          </CardContent>
        </Card>
      ) : (
        <OrdersTable
          orders={filteredOrders}
          onView={(order) => {
            setSelectedOrder(order as StoreOrder);
            setIsViewOpen(true);
          }}
          onEdit={(order) => {
            setSelectedOrder(order as StoreOrder);
            setIsEditOpen(true);
          }}
          onUpdateStatus={(order) => {
            setSelectedOrder(order as StoreOrder);
            setIsStatusOpen(true);
          }}
          onDelete={(order) => {
            setSelectedOrder(order as StoreOrder);
            setIsDeleteOpen(true);
          }}
        />
      )}

      {/* Modals & Dialogs */}
      <CreateOrderModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateOrder}
        isSubmitting={isSubmitting}
      />

      <EditOrderModal
        order={selectedOrder}
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setSelectedOrder(null);
        }}
        onSubmit={handleEditOrder}
        isSubmitting={isSubmitting}
      />

      <UpdateStatusModal
        order={selectedOrder}
        isOpen={isStatusOpen}
        onClose={() => {
          setIsStatusOpen(false);
          setSelectedOrder(null);
        }}
        onSubmit={handleUpdateStatus}
        isSubmitting={isSubmitting}
      />

      <DeleteOrderDialog
        order={selectedOrder}
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setSelectedOrder(null);
        }}
        onConfirm={handleDeleteOrder}
        isDeleting={isSubmitting}
      />

      <ViewOrderModal
        order={selectedOrder}
        isOpen={isViewOpen}
        onClose={() => {
          setIsViewOpen(false);
          setSelectedOrder(null);
        }}
      />

      <OrderSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}