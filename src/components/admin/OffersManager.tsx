"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, Loader2, Tag } from "lucide-react";
import { formatDate, formatPrice } from "@/lib/utils";

export interface OfferRow {
  id: string;
  title: string;
  titleAr: string;
  descriptionAr: string | null;
  discountPercent: number | null;
  discountAmount: number | null;
  code: string | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
  usageLimit: number | null;
  usageCount: number;
}

const empty = {
  id: "",
  title: "",
  titleAr: "",
  descriptionAr: "",
  discountPercent: "",
  discountAmount: "",
  code: "",
  startDate: "",
  endDate: "",
  isActive: true,
  usageLimit: "",
};

type Draft = typeof empty;

export function OffersManager({
  offers,
  canEdit,
}: {
  offers: OfferRow[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  function startEdit(offer: OfferRow) {
    setDraft({
      id: offer.id,
      title: offer.title,
      titleAr: offer.titleAr,
      descriptionAr: offer.descriptionAr ?? "",
      discountPercent: offer.discountPercent?.toString() ?? "",
      discountAmount: offer.discountAmount?.toString() ?? "",
      code: offer.code ?? "",
      startDate: offer.startDate.slice(0, 10),
      endDate: offer.endDate.slice(0, 10),
      isActive: offer.isActive,
      usageLimit: offer.usageLimit?.toString() ?? "",
    });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!draft) return;

    if (!draft.discountPercent && !draft.discountAmount) {
      toast.error("حدّد نسبة خصم أو مبلغ خصم");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: draft.title,
        titleAr: draft.titleAr,
        descriptionAr: draft.descriptionAr || null,
        discountPercent: draft.discountPercent ? Number(draft.discountPercent) : null,
        discountAmount: draft.discountAmount ? Number(draft.discountAmount) : null,
        code: draft.code || null,
        startDate: new Date(`${draft.startDate}T00:00:00.000Z`).toISOString(),
        endDate: new Date(`${draft.endDate}T23:59:59.000Z`).toISOString(),
        isActive: draft.isActive,
        usageLimit: draft.usageLimit ? Number(draft.usageLimit) : null,
      };

      const res = await fetch(draft.id ? `/api/offers/${draft.id}` : "/api/offers", {
        method: draft.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Request failed");
      }

      toast.success(draft.id ? "تم حفظ العرض" : "تمت إضافة العرض");
      setDraft(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر الحفظ");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("هل تريد حذف هذا العرض؟")) return;

    try {
      const res = await fetch(`/api/offers/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Request failed");
      toast.success("تم حذف العرض");
      router.refresh();
    } catch {
      toast.error("تعذر الحذف");
    }
  }

  const labelClass = "block text-sm font-medium text-gray-700 mb-2";

  return (
    <div className="space-y-6">
      {canEdit && !draft && (
        <button onClick={() => setDraft({ ...empty })} className="btn-primary">
          <Plus className="w-4 h-4" />
          إضافة عرض
        </button>
      )}

      {draft && (
        <form onSubmit={save} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
          <h2 className="font-bold text-dark-950">{draft.id ? "تعديل العرض" : "عرض جديد"}</h2>

          <div className="grid sm:grid-cols-2 gap-5">
            <label className="block">
              <span className={labelClass}>العنوان بالعربية</span>
              <input
                required
                value={draft.titleAr}
                onChange={(e) => setDraft({ ...draft, titleAr: e.target.value })}
                className="input-field"
              />
            </label>
            <label className="block">
              <span className={labelClass}>العنوان بالإنجليزية</span>
              <input
                required
                dir="ltr"
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                className="input-field"
              />
            </label>
            <label className="block">
              <span className={labelClass}>نسبة الخصم (%)</span>
              <input
                type="number"
                min={1}
                max={100}
                value={draft.discountPercent}
                onChange={(e) => setDraft({ ...draft, discountPercent: e.target.value })}
                className="input-field"
              />
            </label>
            <label className="block">
              <span className={labelClass}>مبلغ الخصم (دينار)</span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={draft.discountAmount}
                onChange={(e) => setDraft({ ...draft, discountAmount: e.target.value })}
                className="input-field"
              />
            </label>
            <label className="block">
              <span className={labelClass}>رمز العرض</span>
              <input
                dir="ltr"
                value={draft.code}
                onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase() })}
                className="input-field"
                placeholder="SUMMER25"
              />
            </label>
            <label className="block">
              <span className={labelClass}>حد الاستخدام</span>
              <input
                type="number"
                min={1}
                value={draft.usageLimit}
                onChange={(e) => setDraft({ ...draft, usageLimit: e.target.value })}
                className="input-field"
              />
            </label>
            <label className="block">
              <span className={labelClass}>تاريخ البداية</span>
              <input
                required
                type="date"
                value={draft.startDate}
                onChange={(e) => setDraft({ ...draft, startDate: e.target.value })}
                className="input-field"
              />
            </label>
            <label className="block">
              <span className={labelClass}>تاريخ النهاية</span>
              <input
                required
                type="date"
                min={draft.startDate}
                value={draft.endDate}
                onChange={(e) => setDraft({ ...draft, endDate: e.target.value })}
                className="input-field"
              />
            </label>
          </div>

          <label className="block">
            <span className={labelClass}>الوصف</span>
            <textarea
              rows={2}
              value={draft.descriptionAr}
              onChange={(e) => setDraft({ ...draft, descriptionAr: e.target.value })}
              className="input-field resize-none"
            />
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={draft.isActive}
              onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })}
              className="w-5 h-5"
            />
            <span className="text-sm text-gray-700">العرض مفعّل</span>
          </label>

          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              حفظ
            </button>
            <button type="button" onClick={() => setDraft(null)} className="btn-secondary">
              إلغاء
            </button>
          </div>
        </form>
      )}

      {offers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <Tag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">لا توجد عروض</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {offers.map((offer) => (
            <article key={offer.id} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="font-bold text-dark-950">{offer.titleAr}</h3>
                  <p className="text-gray-400 text-xs mt-0.5">{offer.title}</p>
                </div>
                <span
                  className={`badge ${
                    offer.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {offer.isActive ? "مفعّل" : "متوقف"}
                </span>
              </div>

              {offer.descriptionAr && (
                <p className="text-sm text-gray-500 mb-4">{offer.descriptionAr}</p>
              )}

              <dl className="grid grid-cols-2 gap-3 text-sm mb-4">
                <div>
                  <dt className="text-gray-400 text-xs">الخصم</dt>
                  <dd className="font-medium text-primary-700">
                    {offer.discountPercent
                      ? `${offer.discountPercent}%`
                      : offer.discountAmount
                      ? formatPrice(offer.discountAmount)
                      : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-400 text-xs">الرمز</dt>
                  <dd className="font-mono text-dark-950" dir="ltr">
                    {offer.code ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-400 text-xs">الفترة</dt>
                  <dd className="text-gray-600 text-xs">
                    {formatDate(offer.startDate)} — {formatDate(offer.endDate)}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-400 text-xs">الاستخدام</dt>
                  <dd className="text-gray-600">
                    {offer.usageCount}
                    {offer.usageLimit ? ` / ${offer.usageLimit}` : ""}
                  </dd>
                </div>
              </dl>

              {canEdit && (
                <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => startEdit(offer)}
                    className="inline-flex items-center gap-1.5 text-primary-700 hover:text-primary-600 text-xs font-medium"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    تعديل
                  </button>
                  <button
                    onClick={() => remove(offer.id)}
                    className="inline-flex items-center gap-1.5 text-red-600 hover:text-red-500 text-xs font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    حذف
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
