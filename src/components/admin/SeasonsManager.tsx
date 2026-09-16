"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, Loader2, Sunset } from "lucide-react";
import { formatDate } from "@/lib/utils";

export interface SeasonRow {
  id: string;
  name: string;
  nameAr: string;
  startDate: string;
  endDate: string;
  priceMultiplier: number;
  minDays: number;
  isActive: boolean;
  descriptionAr: string | null;
}

const empty = {
  id: "",
  name: "",
  nameAr: "",
  startDate: "",
  endDate: "",
  priceMultiplier: 1.5,
  minDays: 7,
  isActive: true,
  descriptionAr: "",
};

type Draft = typeof empty;

function toDateInput(iso: string) {
  return iso.slice(0, 10);
}

export function SeasonsManager({
  seasons,
  canEdit,
}: {
  seasons: SeasonRow[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  function startCreate() {
    setDraft({ ...empty });
  }

  function startEdit(season: SeasonRow) {
    setDraft({
      id: season.id,
      name: season.name,
      nameAr: season.nameAr,
      startDate: toDateInput(season.startDate),
      endDate: toDateInput(season.endDate),
      priceMultiplier: season.priceMultiplier,
      minDays: season.minDays,
      isActive: season.isActive,
      descriptionAr: season.descriptionAr ?? "",
    });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!draft) return;

    setSaving(true);
    try {
      const payload = {
        name: draft.name,
        nameAr: draft.nameAr,
        // The API takes ISO datetimes; the inputs give plain dates.
        startDate: new Date(`${draft.startDate}T00:00:00.000Z`).toISOString(),
        endDate: new Date(`${draft.endDate}T23:59:59.000Z`).toISOString(),
        priceMultiplier: Number(draft.priceMultiplier),
        minDays: Number(draft.minDays),
        isActive: draft.isActive,
        descriptionAr: draft.descriptionAr || null,
      };

      const res = await fetch(draft.id ? `/api/seasons/${draft.id}` : "/api/seasons", {
        method: draft.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Request failed");
      }

      toast.success(draft.id ? "تم حفظ الموسم" : "تمت إضافة الموسم");
      setDraft(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر الحفظ");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("هل تريد حذف هذا الموسم؟")) return;

    try {
      const res = await fetch(`/api/seasons/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Request failed");
      toast.success("تم حذف الموسم");
      router.refresh();
    } catch {
      toast.error("تعذر الحذف");
    }
  }

  const labelClass = "block text-sm font-medium text-gray-700 mb-2";

  return (
    <div className="space-y-6">
      {canEdit && !draft && (
        <button onClick={startCreate} className="btn-primary">
          <Plus className="w-4 h-4" />
          إضافة موسم
        </button>
      )}

      {draft && (
        <form onSubmit={save} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
          <h2 className="font-bold text-dark-950">
            {draft.id ? "تعديل الموسم" : "موسم جديد"}
          </h2>

          <div className="grid sm:grid-cols-2 gap-5">
            <label className="block">
              <span className={labelClass}>الاسم بالعربية</span>
              <input
                required
                value={draft.nameAr}
                onChange={(e) => setDraft({ ...draft, nameAr: e.target.value })}
                className="input-field"
              />
            </label>
            <label className="block">
              <span className={labelClass}>الاسم بالإنجليزية</span>
              <input
                required
                dir="ltr"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
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
            <label className="block">
              <span className={labelClass}>معامل السعر (1.5 = زيادة 50%)</span>
              <input
                required
                type="number"
                min={1}
                max={9.99}
                step="0.05"
                value={draft.priceMultiplier}
                onChange={(e) => setDraft({ ...draft, priceMultiplier: Number(e.target.value) })}
                className="input-field"
              />
            </label>
            <label className="block">
              <span className={labelClass}>الحد الأدنى للحجز (أيام)</span>
              <input
                required
                type="number"
                min={1}
                max={90}
                value={draft.minDays}
                onChange={(e) => setDraft({ ...draft, minDays: Number(e.target.value) })}
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
            <span className="text-sm text-gray-700">الموسم مفعّل</span>
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

      {seasons.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <Sunset className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">لم يُضف أي موسم بعد</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="text-right font-medium px-6 py-3">الموسم</th>
                  <th className="text-right font-medium px-6 py-3">الفترة</th>
                  <th className="text-right font-medium px-6 py-3">معامل السعر</th>
                  <th className="text-right font-medium px-6 py-3">حد أدنى</th>
                  <th className="text-right font-medium px-6 py-3">الحالة</th>
                  {canEdit && <th className="px-6 py-3" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {seasons.map((season) => (
                  <tr key={season.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-dark-950">{season.nameAr}</p>
                      <p className="text-gray-400 text-xs">{season.name}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {formatDate(season.startDate)} — {formatDate(season.endDate)}
                    </td>
                    <td className="px-6 py-4 font-medium text-dark-950">
                      ×{season.priceMultiplier}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{season.minDays} أيام</td>
                    <td className="px-6 py-4">
                      <span
                        className={`badge ${
                          season.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {season.isActive ? "مفعّل" : "متوقف"}
                      </span>
                    </td>
                    {canEdit && (
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => startEdit(season)}
                            className="inline-flex items-center gap-1.5 text-primary-700 hover:text-primary-600 text-xs font-medium"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            تعديل
                          </button>
                          <button
                            onClick={() => remove(season.id)}
                            className="inline-flex items-center gap-1.5 text-red-600 hover:text-red-500 text-xs font-medium"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            حذف
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
