"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { Check, X, CheckCheck, Ban, Loader2 } from "lucide-react";

interface BookingActionsProps {
  bookingId: string;
  status: string;
  adminNote: string | null;
}

/** Which buttons make sense given where the booking currently is. */
const transitions: Record<
  string,
  { status: string; label: string; icon: typeof Check; tone: string }[]
> = {
  PENDING: [
    { status: "APPROVED", label: "قبول الحجز", icon: Check, tone: "bg-green-600 hover:bg-green-700" },
    { status: "REJECTED", label: "رفض الحجز", icon: X, tone: "bg-red-600 hover:bg-red-700" },
  ],
  APPROVED: [
    { status: "COMPLETED", label: "إنهاء الحجز", icon: CheckCheck, tone: "bg-blue-600 hover:bg-blue-700" },
    { status: "CANCELLED", label: "إلغاء الحجز", icon: Ban, tone: "bg-gray-600 hover:bg-gray-700" },
  ],
};

export function BookingActions({ bookingId, status, adminNote }: BookingActionsProps) {
  const router = useRouter();
  const [note, setNote] = useState(adminNote ?? "");
  const [pending, setPending] = useState<string | null>(null);

  const actions = transitions[status] ?? [];

  async function updateStatus(next: string) {
    setPending(next);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next, adminNote: note || null }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Request failed");
      }

      toast.success("تم تحديث حالة الحجز");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر تحديث الحجز");
    } finally {
      setPending(null);
    }
  }

  return (
    <section className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
      <h2 className="font-bold text-dark-950">الإجراءات</h2>

      <label className="block">
        <span className="block text-xs text-gray-500 mb-2">ملاحظة للعميل (اختيارية)</span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="سبب الرفض أو أي ملاحظة تظهر للعميل..."
          className="input-field resize-none text-sm"
        />
      </label>

      {actions.length === 0 ? (
        <p className="text-sm text-gray-400">
          هذا الحجز في حالة نهائية ولا يمكن تغييرها.
        </p>
      ) : (
        <div className="space-y-2">
          {actions.map((action) => (
            <button
              key={action.status}
              onClick={() => updateStatus(action.status)}
              disabled={pending !== null}
              className={`w-full flex items-center justify-center gap-2 text-white font-medium px-6 py-3 rounded-lg transition-all disabled:opacity-50 ${action.tone}`}
            >
              {pending === action.status ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <action.icon className="w-4 h-4" />
              )}
              {action.label}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
