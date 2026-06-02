import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  CheckCheck,
  Clock3,
  Loader2,
  RefreshCw,
  Sparkles,
  Megaphone,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";

import { apiClient, type UserNotification } from "@/lib/api";
import { useAuthContext } from "@/lib/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type NotificationDisplayType = "info" | "success" | "warning" | "error" | "ai";

const TYPE_STYLES: Record<NotificationDisplayType, { label: string; className: string; icon: typeof Bell }> = {
  info: { label: "Info", className: "bg-slate-100 text-slate-700 border-slate-200", icon: Bell },
  success: { label: "Success", className: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCheck },
  warning: { label: "Attention", className: "bg-amber-100 text-amber-700 border-amber-200", icon: ShieldAlert },
  error: { label: "Issue", className: "bg-rose-100 text-rose-700 border-rose-200", icon: ShieldAlert },
  ai: { label: "AI", className: "bg-violet-100 text-violet-700 border-violet-200", icon: Sparkles },
};

const mapNotificationType = (type?: string): NotificationDisplayType => {
  if (type === "success" || type === "offer") return "success";
  if (type === "warning" || type === "maintenance" || type === "disabled") return "warning";
  if (type === "error") return "error";
  if (type === "pricing") return "ai";
  return "info";
};

const formatRelativeTime = (value: string) => {
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) {
    return "Just now";
  }

  const deltaSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (deltaSeconds < 60) return "Just now";
  const deltaMinutes = Math.floor(deltaSeconds / 60);
  if (deltaMinutes < 60) return `${deltaMinutes}m ago`;
  const deltaHours = Math.floor(deltaMinutes / 60);
  if (deltaHours < 24) return `${deltaHours}h ago`;
  const deltaDays = Math.floor(deltaHours / 24);
  if (deltaDays < 7) return `${deltaDays}d ago`;
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(value));
};

export function NotificationCenter() {
  const { user } = useAuthContext();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);

  const loadNotifications = async (showSpinner = false) => {
    if (!user?.id) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    if (showSpinner) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const response = await apiClient.getNotifications(25, false);
      setNotifications(response.notifications || []);
      setUnreadCount(response.unread_count || 0);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    void loadNotifications();
  }, [user?.id]);

  useEffect(() => {
    if (!open) {
      return;
    }

    void loadNotifications();
  }, [open, user?.id]);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void loadNotifications();
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, [user?.id]);

  const sortedNotifications = useMemo(() => {
    return [...notifications].sort((left, right) => {
      if (left.is_read !== right.is_read) {
        return Number(left.is_read) - Number(right.is_read);
      }

      return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
    });
  }, [notifications]);

  const handleMarkRead = async (notificationId: number) => {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId
          ? { ...notification, is_read: true, read_at: notification.read_at || new Date().toISOString() }
          : notification,
      ),
    );
    setUnreadCount((current) => Math.max(0, current - 1));

    try {
      await apiClient.markNotificationRead(notificationId);
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      void loadNotifications();
    }
  };

  const handleMarkAllRead = async () => {
    setIsMarkingAllRead(true);
    try {
      await apiClient.markAllNotificationsRead();
      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          is_read: true,
          read_at: notification.read_at || new Date().toISOString(),
        })),
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
      void loadNotifications();
    } finally {
      setIsMarkingAllRead(false);
    }
  };

  const unreadLabel = unreadCount > 99 ? "99+" : String(unreadCount);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Notifications"
          className="relative h-9 w-9 rounded-lg border border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-900/30 flex items-center justify-center transition shadow-sm"
        >
          <Bell size={16} className="text-purple-600" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-h-4 min-w-4 rounded-full bg-red-500 px-1 text-[10px] font-bold leading-4 text-white ring-2 ring-white dark:ring-gray-900">
              {unreadLabel}
            </span>
          )}
        </button>
      </SheetTrigger>

      <SheetContent className="w-full border-l border-purple-100 bg-white/95 p-0 backdrop-blur-xl dark:border-purple-900 dark:bg-gray-950/95 sm:max-w-md">
        <div className="flex h-full flex-col">
          <SheetHeader className="border-b border-border/70 px-6 py-5 text-left">
            <div className="flex items-start justify-between gap-4">
              <div>
                <SheetTitle className="text-xl text-foreground">Notifications</SheetTitle>
                <SheetDescription className="mt-1 text-sm text-muted-foreground">
                  Recent platform updates, admin replies, and feature alerts.
                </SheetDescription>
              </div>
              <Badge variant="outline" className="rounded-full border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950/60 dark:text-purple-200">
                {unreadCount} unread
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void loadNotifications(true)}
                disabled={isLoading || isRefreshing}
              >
                <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                Refresh
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => void handleMarkAllRead()}
                disabled={isMarkingAllRead || unreadCount === 0}
              >
                <CheckCheck className="h-4 w-4" />
                Mark all read
              </Button>
            </div>
          </SheetHeader>

          <div className="flex-1 px-4 py-4">
            {isLoading ? (
              <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading notifications...
              </div>
            ) : sortedNotifications.length ? (
              <ScrollArea className="h-[calc(100vh-10rem)] pr-2">
                <div className="space-y-3">
                  {sortedNotifications.map((notification) => {
                    const displayType = mapNotificationType(notification.type);
                    const style = TYPE_STYLES[displayType];
                    const Icon = style.icon;

                    return (
                      <button
                        key={notification.id}
                        type="button"
                        onClick={() => void handleMarkRead(notification.id)}
                        className={cn(
                          "w-full rounded-2xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
                          notification.is_read
                            ? "border-border/70 bg-background"
                            : "border-purple-200 bg-purple-50/70 shadow-sm dark:border-purple-900 dark:bg-purple-950/30",
                        )}
                      >
                        <div className="flex gap-3">
                          <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border", style.className)}>
                            <Icon className="h-4 w-4" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-foreground">{notification.title}</p>
                                <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">
                                  {notification.message}
                                </p>
                              </div>

                              <div className="flex shrink-0 flex-col items-end gap-1">
                                {!notification.is_read && <span className="h-2.5 w-2.5 rounded-full bg-purple-600" />}
                                <span className="text-xs text-muted-foreground">
                                  {formatRelativeTime(notification.created_at)}
                                </span>
                              </div>
                            </div>

                            <div className="mt-3 flex items-center gap-2">
                              <Badge variant="outline" className={cn("rounded-full border text-[11px] font-semibold", style.className)}>
                                {style.label}
                              </Badge>
                              {notification.target_type && (
                                <span className="text-xs text-muted-foreground">{notification.target_type}</span>
                              )}
                              <span className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-purple-600">
                                Open
                                <ArrowRight className="h-3.5 w-3.5" />
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex h-56 flex-col items-center justify-center rounded-3xl border border-dashed border-border/70 bg-muted/30 px-6 text-center">
                <Megaphone className="h-10 w-10 text-muted-foreground/70" />
                <h3 className="mt-4 text-sm font-semibold text-foreground">No notifications yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Admin replies, feature updates, and platform alerts will show up here.
                </p>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}