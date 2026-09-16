"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { Check, X, RefreshCw, ExternalLink, Loader2 } from "lucide-react";
import { getStatusColor } from "@/lib/utils";

interface DocumentReviewProps {
  document: {
    id: string;
    type: string;
    imageUrl: string;
    status: string;
    adminNote: string | null;
  };
}

const typeLabels: Record<string, string> = {
  NATIONAL_ID: "الهوية الشخصية",
  PASSPORT: "جواز السفر",
  DRIVING_LICENSE: "رخصة القيادة",
};

const statusLabels: Record<string, string> = {
  PENDING: "بانتظار المراجعة",
  APPROVED: "مقبولة",
  REJECTED: "مرفوضة",
  REUPLOAD_REQUIRED: "مطلوب إعادة رفع",
};

const actions = [
  { status: "APPROVED", label: "قبول", icon: Check, tone: "text-green-700 hover:bg-green-50" },
  { status: "REJECTED", label: "رفض", icon: X, tone: "text-red-700 hover:bg-red-50" },
  { status: "REUPLOAD_REQUIRED", label: "إعادة رفع", icon: RefreshCw, tone: "text-amber-700 hover:bg-amber-50" },
];

export function DocumentReview({ document }: DocumentReviewProps) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);

  async function setStatus(status: string) {
    setPending(status);
    try {
      const res = await fetch(`/api/documents/${document.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Request failed");

      toast.success("تم تحديث حالة الوثيقة");
      router.refresh();
    } catch {
      toast.error("تعذر تحديث الوثيقة");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      {/* Uploaded documents are private customer files served from Cloudinary or
          /uploads; a plain <img> keeps them out of the image optimiser. */}
      <a href={document.imageUrl} target="_blank" rel="noopener noreferrer" className="block relative group">
        <img
          src={document.imageUrl}
          alt={typeLabels[document.type] ?? document.type}
          className="w-full h-40 object-cover bg-gray-100"
        />
        <span className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
          <ExternalLink className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </span>
      </a>

      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="font-medium text-dark-950 text-sm">
            {typeLabels[document.type] ?? document.type}
          </p>
          <span className={`badge ${getStatusColor(document.status)}`}>
            {statusLabels[document.status] ?? document.status}
          </span>
        </div>

        {document.adminNote && (
          <p className="text-xs text-gray-500">{document.adminNote}</p>
        )}

        <div className="flex gap-1">
          {actions
            .filter((a) => a.status !== document.status)
            .map((action) => (
              <button
                key={action.status}
                onClick={() => setStatus(action.status)}
                disabled={pending !== null}
                className={`flex-1 flex items-center justify-center gap-1 text-xs font-medium py-2 rounded-lg transition-colors disabled:opacity-50 ${action.tone}`}
              >
                {pending === action.status ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <action.icon className="w-3 h-3" />
                )}
                {action.label}
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
