"use client";

import { useEffect } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ToastMessage {
  id: number;
  message: string;
  type: "success" | "error";
}

interface ToastProps {
  toast: ToastMessage | null;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ toast, onClose, duration = 2500 }: ToastProps) {
  const id = toast?.id;

  useEffect(() => {
    if (id === undefined) return;
    const timer = window.setTimeout(onClose, duration);
    return () => window.clearTimeout(timer);
  }, [id, duration, onClose]);

  if (!toast) return null;

  const isError = toast.type === "error";
  const Icon = isError ? XCircle : CheckCircle2;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60]" role="status" aria-live="polite">
      <div
        className={cn(
          "pointer-events-auto flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg",
          isError ? "bg-red-600" : "bg-slate-900",
        )}
      >
        <Icon className={cn("h-4 w-4", isError ? "text-red-100" : "text-emerald-400")} aria-hidden />
        {toast.message}
      </div>
    </div>
  );
}
