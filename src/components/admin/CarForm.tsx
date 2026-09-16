"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { Loader2, Trash2, Upload, Plus } from "lucide-react";

interface Branch {
  id: string;
  nameAr: string;
}

export interface CarFormValues {
  id?: string;
  name: string;
  nameAr: string;
  brand: string;
  model: string;
  year: number;
  seats: number;
  fuelType: string;
  fuelConsumption: string;
  transmission: string;
  color: string;
  colorAr: string;
  description: string;
  descriptionAr: string;
  images: string[];
  status: string;
  dailyPrice: number;
  weeklyPrice: number | null;
  monthlyPrice: number | null;
  depositAmount: number;
  branchId: string;
}

interface CarFormProps {
  branches: Branch[];
  initial: CarFormValues;
  mode: "create" | "edit";
  canDelete: boolean;
}

const fuelOptions = [
  { value: "PETROL", label: "بنزين" },
  { value: "DIESEL", label: "ديزل" },
  { value: "HYBRID", label: "هايبرد" },
  { value: "ELECTRIC", label: "كهربائي" },
];

const transmissionOptions = [
  { value: "AUTOMATIC", label: "أوتوماتيك" },
  { value: "MANUAL", label: "عادي" },
];

const statusOptions = [
  { value: "AVAILABLE", label: "متاحة" },
  { value: "BOOKED", label: "محجوزة" },
  { value: "MAINTENANCE", label: "صيانة" },
  { value: "OUT_OF_SERVICE", label: "خارج الخدمة" },
];

export function CarForm({ branches, initial, mode, canDelete }: CarFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<CarFormValues>(initial);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

  function set<K extends keyof CarFormValues>(key: K, value: CarFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function uploadImage(file: File) {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      set("images", [...values.images, data.url]);
      toast.success("تم رفع الصورة");
    } catch {
      toast.error("تعذر رفع الصورة");
    } finally {
      setUploading(false);
    }
  }

  function addImageUrl() {
    const trimmed = imageUrl.trim();
    if (!trimmed) return;
    set("images", [...values.images, trimmed]);
    setImageUrl("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    if (values.images.length === 0) {
      toast.error("أضف صورة واحدة على الأقل");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: values.name,
        nameAr: values.nameAr,
        brand: values.brand,
        model: values.model,
        year: Number(values.year),
        seats: Number(values.seats),
        fuelType: values.fuelType,
        fuelConsumption: values.fuelConsumption || undefined,
        transmission: values.transmission,
        color: values.color,
        colorAr: values.colorAr || undefined,
        description: values.description || undefined,
        descriptionAr: values.descriptionAr || undefined,
        images: values.images,
        dailyPrice: Number(values.dailyPrice),
        weeklyPrice: values.weeklyPrice ? Number(values.weeklyPrice) : null,
        monthlyPrice: values.monthlyPrice ? Number(values.monthlyPrice) : null,
        depositAmount: Number(values.depositAmount),
        branchId: values.branchId,
        ...(mode === "edit" ? { status: values.status } : {}),
      };

      const res = await fetch(
        mode === "create" ? "/api/cars" : `/api/cars/${values.id}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Request failed");
      }

      toast.success(mode === "create" ? "تمت إضافة السيارة" : "تم حفظ التعديلات");
      router.push("/admin/cars");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر الحفظ");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm("هل تريد حذف هذه السيارة؟ السيارات التي لها حجوزات ستُنقل إلى (خارج الخدمة).")) {
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/cars/${values.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();

      toast.success(data.retired ? "تم نقل السيارة إلى خارج الخدمة" : "تم حذف السيارة");
      router.push("/admin/cars");
      router.refresh();
    } catch {
      toast.error("تعذر الحذف");
    } finally {
      setSaving(false);
    }
  }

  const fieldClass = "input-field";
  const labelClass = "block text-sm font-medium text-gray-700 mb-2";

  return (
    <form onSubmit={submit} className="space-y-6 max-w-4xl">
      {/* Identity */}
      <section className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-bold text-dark-950 mb-5">بيانات السيارة</h2>
        <div className="grid sm:grid-cols-2 gap-5">
          <label className="block">
            <span className={labelClass}>الاسم بالعربية</span>
            <input
              required
              value={values.nameAr}
              onChange={(e) => set("nameAr", e.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="block">
            <span className={labelClass}>الاسم بالإنجليزية</span>
            <input
              required
              dir="ltr"
              value={values.name}
              onChange={(e) => set("name", e.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="block">
            <span className={labelClass}>الشركة المصنّعة</span>
            <input
              required
              dir="ltr"
              value={values.brand}
              onChange={(e) => set("brand", e.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="block">
            <span className={labelClass}>الطراز</span>
            <input
              required
              dir="ltr"
              value={values.model}
              onChange={(e) => set("model", e.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="block">
            <span className={labelClass}>سنة الصنع</span>
            <input
              required
              type="number"
              min={2000}
              max={2030}
              value={values.year}
              onChange={(e) => set("year", Number(e.target.value))}
              className={fieldClass}
            />
          </label>
          <label className="block">
            <span className={labelClass}>عدد المقاعد</span>
            <input
              required
              type="number"
              min={2}
              max={12}
              value={values.seats}
              onChange={(e) => set("seats", Number(e.target.value))}
              className={fieldClass}
            />
          </label>
          <label className="block">
            <span className={labelClass}>نوع الوقود</span>
            <select
              value={values.fuelType}
              onChange={(e) => set("fuelType", e.target.value)}
              className={fieldClass}
            >
              {fuelOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={labelClass}>ناقل الحركة</span>
            <select
              value={values.transmission}
              onChange={(e) => set("transmission", e.target.value)}
              className={fieldClass}
            >
              {transmissionOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={labelClass}>استهلاك الوقود</span>
            <input
              dir="ltr"
              placeholder="8L/100km"
              value={values.fuelConsumption}
              onChange={(e) => set("fuelConsumption", e.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="block">
            <span className={labelClass}>اللون بالإنجليزية</span>
            <input
              required
              dir="ltr"
              value={values.color}
              onChange={(e) => set("color", e.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="block">
            <span className={labelClass}>اللون بالعربية</span>
            <input
              value={values.colorAr}
              onChange={(e) => set("colorAr", e.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="block">
            <span className={labelClass}>الفرع</span>
            <select
              required
              value={values.branchId}
              onChange={(e) => set("branchId", e.target.value)}
              className={fieldClass}
            >
              <option value="">اختر الفرع</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nameAr}
                </option>
              ))}
            </select>
          </label>
          {mode === "edit" && (
            <label className="block">
              <span className={labelClass}>الحالة</span>
              <select
                value={values.status}
                onChange={(e) => set("status", e.target.value)}
                className={fieldClass}
              >
                {statusOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-5 mt-5">
          <label className="block">
            <span className={labelClass}>الوصف بالعربية</span>
            <textarea
              rows={3}
              value={values.descriptionAr}
              onChange={(e) => set("descriptionAr", e.target.value)}
              className={`${fieldClass} resize-none`}
            />
          </label>
          <label className="block">
            <span className={labelClass}>الوصف بالإنجليزية</span>
            <textarea
              rows={3}
              dir="ltr"
              value={values.description}
              onChange={(e) => set("description", e.target.value)}
              className={`${fieldClass} resize-none`}
            />
          </label>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-bold text-dark-950 mb-5">التسعير (دينار أردني)</h2>
        <div className="grid sm:grid-cols-4 gap-5">
          <label className="block">
            <span className={labelClass}>السعر اليومي</span>
            <input
              required
              type="number"
              min={1}
              step="0.01"
              value={values.dailyPrice}
              onChange={(e) => set("dailyPrice", Number(e.target.value))}
              className={fieldClass}
            />
          </label>
          <label className="block">
            <span className={labelClass}>السعر الأسبوعي</span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={values.weeklyPrice ?? ""}
              onChange={(e) => set("weeklyPrice", e.target.value ? Number(e.target.value) : null)}
              className={fieldClass}
            />
          </label>
          <label className="block">
            <span className={labelClass}>السعر الشهري</span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={values.monthlyPrice ?? ""}
              onChange={(e) => set("monthlyPrice", e.target.value ? Number(e.target.value) : null)}
              className={fieldClass}
            />
          </label>
          <label className="block">
            <span className={labelClass}>مبلغ التأمين</span>
            <input
              required
              type="number"
              min={0}
              step="0.01"
              value={values.depositAmount}
              onChange={(e) => set("depositAmount", Number(e.target.value))}
              className={fieldClass}
            />
          </label>
        </div>
      </section>

      {/* Images */}
      <section className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-bold text-dark-950 mb-2">الصور</h2>
        <p className="text-gray-500 text-sm mb-5">
          ارفع صورة من جهازك أو ألصق رابط صورة. الصورة الأولى هي صورة الغلاف.
        </p>

        {values.images.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            {values.images.map((src, i) => (
              <div key={src + i} className="relative group">
                {/* Sources are arbitrary admin-supplied URLs, so skip the optimiser. */}
                <img
                  src={src}
                  alt={`صورة ${i + 1}`}
                  className="w-full h-24 object-cover rounded-xl bg-gray-100"
                />
                {i === 0 && (
                  <span className="absolute top-1 start-1 badge bg-primary-700 text-white text-[10px]">
                    الغلاف
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => set("images", values.images.filter((_, idx) => idx !== i))}
                  className="absolute top-1 end-1 w-7 h-7 bg-white/90 rounded-lg flex items-center justify-center text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="حذف الصورة"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <label className="btn-secondary text-sm py-2.5 cursor-pointer">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            رفع صورة
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadImage(file);
                e.target.value = "";
              }}
            />
          </label>

          <div className="flex gap-2 flex-1 min-w-[240px]">
            <input
              dir="ltr"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              className={`${fieldClass} py-2.5 text-sm`}
            />
            <button type="button" onClick={addImageUrl} className="btn-secondary text-sm py-2.5 px-4">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={saving} className="btn-primary">
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {mode === "create" ? "إضافة السيارة" : "حفظ التعديلات"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/cars")}
          className="btn-secondary"
        >
          إلغاء
        </button>

        {mode === "edit" && canDelete && (
          <button
            type="button"
            onClick={remove}
            disabled={saving}
            className="ms-auto flex items-center gap-2 text-red-600 hover:bg-red-50 px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            حذف السيارة
          </button>
        )}
      </div>
    </form>
  );
}
