"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { Plus, Pencil, Loader2, Car, Users, MapPin } from "lucide-react";

export interface BranchRow {
  id: string;
  name: string;
  nameAr: string;
  address: string;
  addressAr: string;
  city: string;
  lat: number;
  lng: number;
  phone: string;
  whatsapp: string;
  email: string;
  emergencyPhone: string | null;
  isActive: boolean;
  carCount: number;
  adminCount: number;
}

const empty = {
  id: "",
  name: "",
  nameAr: "",
  address: "",
  addressAr: "",
  city: "",
  lat: 31.9539,
  lng: 35.9106,
  phone: "",
  whatsapp: "",
  email: "",
  emergencyPhone: "",
  isActive: true,
};

type Draft = typeof empty;

export function BranchesManager({
  branches,
  canEdit,
}: {
  branches: BranchRow[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  function startEdit(branch: BranchRow) {
    setDraft({
      id: branch.id,
      name: branch.name,
      nameAr: branch.nameAr,
      address: branch.address,
      addressAr: branch.addressAr,
      city: branch.city,
      lat: branch.lat,
      lng: branch.lng,
      phone: branch.phone,
      whatsapp: branch.whatsapp,
      email: branch.email,
      emergencyPhone: branch.emergencyPhone ?? "",
      isActive: branch.isActive,
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
        address: draft.address,
        addressAr: draft.addressAr,
        city: draft.city,
        lat: Number(draft.lat),
        lng: Number(draft.lng),
        phone: draft.phone,
        whatsapp: draft.whatsapp,
        email: draft.email,
        emergencyPhone: draft.emergencyPhone || null,
        isActive: draft.isActive,
      };

      const res = await fetch(draft.id ? `/api/branches/${draft.id}` : "/api/branches", {
        method: draft.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Request failed");
      }

      toast.success(draft.id ? "تم حفظ الفرع" : "تمت إضافة الفرع");
      setDraft(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر الحفظ");
    } finally {
      setSaving(false);
    }
  }

  const labelClass = "block text-sm font-medium text-gray-700 mb-2";

  return (
    <div className="space-y-6">
      {canEdit && !draft && (
        <button onClick={() => setDraft({ ...empty })} className="btn-primary">
          <Plus className="w-4 h-4" />
          إضافة فرع
        </button>
      )}

      {draft && (
        <form onSubmit={save} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
          <h2 className="font-bold text-dark-950">{draft.id ? "تعديل الفرع" : "فرع جديد"}</h2>

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
              <span className={labelClass}>العنوان بالعربية</span>
              <input
                required
                value={draft.addressAr}
                onChange={(e) => setDraft({ ...draft, addressAr: e.target.value })}
                className="input-field"
              />
            </label>
            <label className="block">
              <span className={labelClass}>العنوان بالإنجليزية</span>
              <input
                required
                dir="ltr"
                value={draft.address}
                onChange={(e) => setDraft({ ...draft, address: e.target.value })}
                className="input-field"
              />
            </label>
            <label className="block">
              <span className={labelClass}>المدينة (بالإنجليزية)</span>
              <input
                required
                dir="ltr"
                value={draft.city}
                onChange={(e) => setDraft({ ...draft, city: e.target.value })}
                className="input-field"
                placeholder="Amman"
              />
            </label>
            <label className="block">
              <span className={labelClass}>البريد الإلكتروني</span>
              <input
                required
                type="email"
                dir="ltr"
                value={draft.email}
                onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                className="input-field"
              />
            </label>
            <label className="block">
              <span className={labelClass}>الهاتف</span>
              <input
                required
                dir="ltr"
                value={draft.phone}
                onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                className="input-field"
              />
            </label>
            <label className="block">
              <span className={labelClass}>واتساب</span>
              <input
                required
                dir="ltr"
                value={draft.whatsapp}
                onChange={(e) => setDraft({ ...draft, whatsapp: e.target.value })}
                className="input-field"
              />
            </label>
            <label className="block">
              <span className={labelClass}>خط الطوارئ</span>
              <input
                dir="ltr"
                value={draft.emergencyPhone}
                onChange={(e) => setDraft({ ...draft, emergencyPhone: e.target.value })}
                className="input-field"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className={labelClass}>خط العرض</span>
                <input
                  required
                  type="number"
                  step="0.00000001"
                  dir="ltr"
                  value={draft.lat}
                  onChange={(e) => setDraft({ ...draft, lat: Number(e.target.value) })}
                  className="input-field"
                />
              </label>
              <label className="block">
                <span className={labelClass}>خط الطول</span>
                <input
                  required
                  type="number"
                  step="0.00000001"
                  dir="ltr"
                  value={draft.lng}
                  onChange={(e) => setDraft({ ...draft, lng: Number(e.target.value) })}
                  className="input-field"
                />
              </label>
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={draft.isActive}
              onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })}
              className="w-5 h-5"
            />
            <span className="text-sm text-gray-700">الفرع يعمل</span>
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

      <div className="grid md:grid-cols-2 gap-4">
        {branches.map((branch) => (
          <article key={branch.id} className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="font-bold text-dark-950">{branch.nameAr}</h3>
                <p className="text-gray-500 text-sm mt-1">{branch.addressAr}</p>
              </div>
              <span
                className={`badge ${
                  branch.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                }`}
              >
                {branch.isActive ? "يعمل" : "متوقف"}
              </span>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
              <span className="flex items-center gap-1.5">
                <Car className="w-4 h-4 text-primary-600" />
                {branch.carCount} سيارة
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-primary-600" />
                {branch.adminCount} مدير
              </span>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${branch.lat},${branch.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-primary-700 hover:underline"
              >
                <MapPin className="w-4 h-4" />
                الخريطة
              </a>
            </div>

            <dl className="space-y-1.5 text-sm border-t border-gray-100 pt-4">
              <div className="flex justify-between">
                <dt className="text-gray-400">الهاتف</dt>
                <dd className="text-dark-950" dir="ltr">
                  {branch.phone}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-400">واتساب</dt>
                <dd className="text-dark-950" dir="ltr">
                  {branch.whatsapp}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-400">البريد</dt>
                <dd className="text-dark-950" dir="ltr">
                  {branch.email}
                </dd>
              </div>
            </dl>

            {canEdit && (
              <button
                onClick={() => startEdit(branch)}
                className="inline-flex items-center gap-1.5 text-primary-700 hover:text-primary-600 text-xs font-medium mt-4 pt-4 border-t border-gray-100 w-full"
              >
                <Pencil className="w-3.5 h-3.5" />
                تعديل الفرع
              </button>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
