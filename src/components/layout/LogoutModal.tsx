import React from "react";
import { Button } from "@/components/ui/Button";
import { LogOut, X } from "lucide-react";

export interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const LogoutModal: React.FC<LogoutModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--foreground)]/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--muted)] hover:text-[var(--foreground)] p-1.5 rounded-full hover:bg-[var(--muted-light)] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-[var(--danger-light)] text-[var(--danger)] flex items-center justify-center mb-4">
          <LogOut className="w-6 h-6" />
        </div>

        <h3 className="text-xl font-bold text-[var(--foreground)] tracking-tight mb-2">
          Confirm Logout
        </h3>
        <p className="text-sm text-[var(--muted)] mb-6 leading-relaxed">
          Are you sure you want to end your current session? You can log back in at any time to access your Facilitator Support Program resources.
        </p>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-[var(--card-border)]">
          <Button variant="outline" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" size="md" icon={<LogOut className="w-4 h-4" />} onClick={onConfirm}>
            Logout Session
          </Button>
        </div>
      </div>
    </div>
  );
};
