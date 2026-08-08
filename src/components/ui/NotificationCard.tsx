import React from "react";
import { NotificationItem } from "@/data/mockData";
import { Badge } from "./Badge";
import { Calendar, CheckCircle2, MessageSquare, CreditCard, BellRing } from "lucide-react";
import { clsx } from "clsx";

export interface NotificationCardProps {
  notification: NotificationItem;
  onMarkRead?: (id: string) => void;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onMarkRead,
}) => {
  const getIcon = () => {
    switch (notification.type) {
      case "event":
        return <Calendar className="w-4 h-4 text-blue-600" />;
      case "task":
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case "community":
        return <MessageSquare className="w-4 h-4 text-purple-600" />;
      case "billing":
        return <CreditCard className="w-4 h-4 text-amber-600" />;
      default:
        return <BellRing className="w-4 h-4 text-[#FF7A00]" />;
    }
  };

  const getIconBg = () => {
    switch (notification.type) {
      case "event":
        return "bg-blue-50 border-blue-100";
      case "task":
        return "bg-emerald-50 border-emerald-100";
      case "community":
        return "bg-purple-50 border-purple-100";
      case "billing":
        return "bg-amber-50 border-amber-100";
      default:
        return "bg-orange-50 border-orange-100";
    }
  };

  return (
    <div
      className={clsx(
        "p-4 rounded-2xl border transition-all duration-200 flex items-start gap-4",
        notification.isRead
          ? "bg-white border-slate-200/70"
          : "bg-blue-50/40 border-blue-200 shadow-xs"
      )}
    >
      <div className={clsx("p-2.5 rounded-xl border shrink-0 mt-0.5", getIconBg())}>
        {getIcon()}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <h4 className="text-sm font-bold text-slate-900 tracking-tight">
            {notification.title}
          </h4>
          <span className="text-xs text-slate-400 font-medium shrink-0">
            {notification.timestamp}
          </span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed mb-2">
          {notification.message}
        </p>

        <div className="flex items-center gap-3">
          <Badge
            variant={
              notification.type === "event"
                ? "primary"
                : notification.type === "task"
                ? "success"
                : notification.type === "billing"
                ? "secondary"
                : "neutral"
            }
            size="sm"
          >
            {notification.type.toUpperCase()}
          </Badge>
          {!notification.isRead && (
            <button
              onClick={() => onMarkRead?.(notification.id)}
              className="text-xs font-semibold text-[#0F4CFF] hover:underline"
            >
              Mark as read
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
