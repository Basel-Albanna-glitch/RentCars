"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { format, differenceInDays, addDays } from "date-fns";
import { DayPicker } from "react-day-picker";
import toast from "react-hot-toast";
import {
  Calendar, Upload, CreditCard, Check, ChevronRight,
  MapPin, Shield, AlertCircle, Loader2
} from "lucide-react";
import { cn, calculateBookingPrice, formatPrice, pointsToDiscount, bookingToPoints } from "@/lib/utils";

interface BookingWizardProps {
  car: any;
  locale: string;
  bookedDates: { start: Date; end: Date }[];
  activeSeason: any | null;
  userPoints: number;
}

const MIN_DAYS = 3;

type Step = "dates" | "details" | "documents" | "payment" | "confirm";

const steps: Step[] = ["dates", "details", "documents", "payment", "confirm"];

export function BookingWizard({ car, locale, bookedDates, activeSeason, userPoints }: BookingWizardProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const isRTL = locale === "ar";

  const [currentStep, setCurrentStep] = useState<Step>("dates");
  const [loading, setLoading] = useState(false);

  // Form state
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [needsDelivery, setNeedsDelivery] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [usePoints, setUsePoints] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>("VISA");
  const [idDoc, setIdDoc] = useState<File | null>(null);
  const [licenseDoc, setLicenseDoc] = useState<File | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [bookingResult, setBookingResult] = useState<any>(null);



  // Computed values
  const days = startDate && endDate ? Math.max(1, differenceInDays(endDate, startDate)) : 0;
  const minDays = activeSeason?.isActive ? (activeSeason.minDays ?? MIN_DAYS) : MIN_DAYS;
  const seasonMultiplier = activeSeason?.isActive ? Number(activeSeason.priceMultiplier) : 1;

  const baseAmount = days > 0 ? calculateBookingPrice({
    dailyPrice: Number(car.dailyPrice),
    weeklyPrice: car.weeklyPrice ? Number(car.weeklyPrice) : null,
    monthlyPrice: car.monthlyPrice ? Number(car.monthlyPrice) : null,
    days,
  }) : 0;

  const seasonFee = baseAmount * (seasonMultiplier - 1);
  const pointsDiscount = usePoints ? Math.min(pointsToDiscount(userPoints), baseAmount + seasonFee) : 0;
  const deposit = Number(car.depositAmount);
  const total = baseAmount + seasonFee - pointsDiscount + deposit;

  // Disabled dates
  const disabledDays = bookedDates.map((b) => ({
    from: new Date(b.start),
    to: new Date(b.end),
  }));

  const isDateDisabled = (date: Date) => {
    return bookedDates.some(
      (b) => date >= new Date(b.start) && date <= new Date(b.end)
    );
  };

  function canProceed(): boolean {
    if (currentStep === "dates") {
      return !!(startDate && endDate && days >= minDays);
    }
    if (currentStep === "documents") {
      return !!(idDoc && licenseDoc);
    }
    if (currentStep === "payment") {
      return agreedToTerms && !!paymentMethod;
    }
    return true;
  }

  async function uploadFile(file: File): Promise<string> {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: form });
    const data = await res.json();
    return data.url;
  }

  async function submitBooking() {
    if (!session) {
      router.push(`/${locale}/login`);
      return;
    }

    setLoading(true);
    try {
      const [idUrl, licenseUrl] = await Promise.all([
        uploadFile(idDoc!),
        uploadFile(licenseDoc!),
      ]);

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          carId: car.id,
          startDate: startDate!.toISOString(),
          endDate: endDate!.toISOString(),
          totalDays: days,
          baseAmount,
          seasonMultiplier,
          discountAmount: pointsDiscount,
          depositAmount: deposit,
          totalAmount: total,
          pointsUsed: usePoints ? pointsToDiscount(userPoints) * 100 : 0,
          paymentMethod,
          needsDelivery,
          deliveryAddress: needsDelivery ? deliveryAddress : null,
          documents: [
            { type: "NATIONAL_ID", imageUrl: idUrl },
            { type: "DRIVING_LICENSE", imageUrl: licenseUrl },
          ],
        }),
      });

      if (!res.ok) throw new Error("Booking failed");

      const data = await res.json();
      setBookingResult(data);
      setCurrentStep("confirm");
      toast.success(locale === "ar" ? "تم إرسال طلب الحجز بنجاح!" : "Booking request sent!");
    } catch (err) {
      toast.error(locale === "ar" ? "حدث خطأ، يرجى المحاولة مرة أخرى" : "An error occurred, please try again");
    } finally {
      setLoading(false);
    }
  }

  const stepLabels: Record<Step, string> = {
    dates: locale === "ar" ? "التواريخ" : "Dates",
    details: locale === "ar" ? "التفاصيل" : "Details",
    documents: locale === "ar" ? "الوثائق" : "Documents",
    payment: locale === "ar" ? "الدفع" : "Payment",
    confirm: locale === "ar" ? "التأكيد" : "Confirm",
  };

  const currentIdx = steps.indexOf(currentStep);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Step indicator */}
      {currentStep !== "confirm" && (
        <div className="border-b border-gray-100 px-6 py-4">
          <div className="flex items-center justify-between">
            {steps.slice(0, -1).map((step, i) => (
              <div key={step} className="flex items-center">
                <div className={cn(
                  "flex items-center gap-2",
                  i < currentIdx ? "text-green-600" :
                  i === currentIdx ? "text-primary-700" : "text-gray-300"
                )}>
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all",
                    i < currentIdx ? "bg-green-600 border-green-600 text-white" :
                    i === currentIdx ? "border-primary-700 text-primary-700" :
                    "border-gray-200 text-gray-300"
                  )}>
                    {i < currentIdx ? <Check className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className="hidden sm:block text-sm font-medium">{stepLabels[step]}</span>
                </div>
                {i < steps.length - 2 && (
                  <div className={cn("w-8 sm:w-16 h-0.5 mx-2", i < currentIdx ? "bg-green-400" : "bg-gray-200")} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-6">

        {/* ======= STEP: DATES ======= */}
        {currentStep === "dates" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-dark-950">
              {locale === "ar" ? "اختر تواريخ الحجز" : "Select Booking Dates"}
            </h2>

            {activeSeason && (
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800 text-sm">
                    {locale === "ar" ? `موسم ${activeSeason.nameAr}` : `${activeSeason.name} Season`}
                  </p>
                  <p className="text-amber-700 text-xs mt-1">
                    {locale === "ar"
                      ? `أسعار خاصة مطبقة. الحد الأدنى ${activeSeason.minDays} أيام`
                      : `Special seasonal pricing applies. Minimum ${activeSeason.minDays} days`}
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1">
                <DayPicker
                  mode="range"
                  selected={{ from: startDate, to: endDate }}
                  onSelect={(range) => {
                    setStartDate(range?.from);
                    setEndDate(range?.to);
                  }}
                  disabled={[{ before: addDays(new Date(), 1) }, ...disabledDays]}
                  modifiersClassNames={{
                    selected: "bg-primary-700 text-white rounded",
                    today: "font-bold text-primary-700",
                    disabled: "opacity-30 cursor-not-allowed line-through",
                  }}
                  className="w-full"
                />
              </div>

              <div className="lg:w-64 space-y-4">
                {[
                  { label: locale === "ar" ? "الاستلام" : "Pickup", date: startDate },
                  { label: locale === "ar" ? "التسليم" : "Return", date: endDate },
                ].map(({ label, date }) => (
                  <div key={label} className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">{label}</p>
                    <p className="font-bold text-dark-950">
                      {date ? format(date, "dd/MM/yyyy") : "—"}
                    </p>
                  </div>
                ))}

                {days > 0 && (
                  <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
                    <p className="text-xs text-primary-600 mb-1">
                      {locale === "ar" ? "المدة الإجمالية" : "Total Duration"}
                    </p>
                    <p className="font-bold text-primary-700 text-2xl">{days}</p>
                    <p className="text-primary-600 text-sm">{locale === "ar" ? "أيام" : "days"}</p>
                    {days < minDays && (
                      <p className="text-red-500 text-xs mt-2">
                        {locale === "ar"
                          ? `الحد الأدنى ${minDays} أيام`
                          : `Minimum ${minDays} days required`}
                      </p>
                    )}
                  </div>
                )}

                {days >= minDays && baseAmount > 0 && (
                  <div className="bg-dark-950 rounded-xl p-4 text-white">
                    <p className="text-gray-400 text-xs mb-1">
                      {locale === "ar" ? "التكلفة التقديرية" : "Estimated Cost"}
                    </p>
                    <p className="font-bold text-2xl">{formatPrice(total)}</p>
                    {seasonMultiplier > 1 && (
                      <p className="text-xs text-amber-400 mt-1">
                        {locale === "ar" ? "يشمل سعر الموسم" : "Includes season pricing"}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ======= STEP: DETAILS ======= */}
        {currentStep === "details" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-dark-950">
              {locale === "ar" ? "تفاصيل إضافية" : "Additional Details"}
            </h2>

            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer p-4 border border-gray-200 rounded-xl hover:border-primary-300 transition-colors">
                <input
                  type="checkbox"
                  checked={needsDelivery}
                  onChange={(e) => setNeedsDelivery(e.target.checked)}
                  className="w-5 h-5 text-primary-700 rounded"
                />
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-primary-600" />
                  <div>
                    <p className="font-medium text-dark-950 text-sm">
                      {locale === "ar" ? "توصيل السيارة لموقعي" : "Deliver car to my location"}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {locale === "ar" ? "نوصل السيارة لأي موقع في الأردن" : "We deliver anywhere in Jordan"}
                    </p>
                  </div>
                </div>
              </label>

              {needsDelivery && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {locale === "ar" ? "عنوان التوصيل" : "Delivery Address"}
                  </label>
                  <textarea
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder={locale === "ar" ? "أدخل عنوانك التفصيلي..." : "Enter your detailed address..."}
                    className="input-field resize-none h-24"
                  />
                </div>
              )}
            </div>

            {/* User info (read-only) */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <h3 className="font-medium text-dark-950 text-sm">
                {locale === "ar" ? "بيانات الحجز" : "Booking Details"}
              </h3>
              {[
                { label: locale === "ar" ? "الاسم" : "Name", value: session?.user?.name },
                { label: locale === "ar" ? "البريد" : "Email", value: session?.user?.email },
                { label: locale === "ar" ? "الاستلام" : "Pickup", value: startDate ? format(startDate, "dd/MM/yyyy") : "" },
                { label: locale === "ar" ? "التسليم" : "Return", value: endDate ? format(endDate, "dd/MM/yyyy") : "" },
                { label: locale === "ar" ? "المدة" : "Duration", value: `${days} ${locale === "ar" ? "أيام" : "days"}` },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-medium text-dark-950">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======= STEP: DOCUMENTS ======= */}
        {currentStep === "documents" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-dark-950">
              {locale === "ar" ? "رفع الوثائق المطلوبة" : "Upload Required Documents"}
            </h2>
            <p className="text-gray-500 text-sm">
              {locale === "ar"
                ? "يرجى رفع صورة واضحة لكل من الهوية ورخصة القيادة"
                : "Please upload a clear photo of both your ID and driving license"}
            </p>

            {[
              {
                id: "id",
                label: locale === "ar" ? "صورة الهوية / جواز السفر" : "ID / Passport Photo",
                icon: "🪪",
                file: idDoc,
                setFile: setIdDoc,
              },
              {
                id: "license",
                label: locale === "ar" ? "صورة رخصة القيادة" : "Driving License Photo",
                icon: "🚗",
                file: licenseDoc,
                setFile: setLicenseDoc,
              },
            ].map((doc) => (
              <div key={doc.id}>
                <label className="block text-sm font-medium text-gray-700 mb-2">{doc.label}</label>
                <label
                  htmlFor={`upload-${doc.id}`}
                  className={cn(
                    "flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-xl cursor-pointer transition-all",
                    doc.file
                      ? "border-green-400 bg-green-50"
                      : "border-gray-300 bg-gray-50 hover:border-primary-400 hover:bg-primary-50"
                  )}
                >
                  {doc.file ? (
                    <div className="text-center">
                      <div className="text-3xl mb-2">✅</div>
                      <p className="text-green-700 text-sm font-medium">{doc.file.name}</p>
                      <p className="text-green-500 text-xs">{locale === "ar" ? "تم الرفع" : "Uploaded"}</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="text-3xl mb-2">{doc.icon}</div>
                      <p className="text-gray-600 text-sm font-medium">
                        {locale === "ar" ? "انقر لرفع الصورة" : "Click to upload"}
                      </p>
                      <p className="text-gray-400 text-xs mt-1">PNG, JPG {locale === "ar" ? "حتى 10MB" : "up to 10MB"}</p>
                    </div>
                  )}
                </label>
                <input
                  id={`upload-${doc.id}`}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => doc.setFile(e.target.files?.[0] ?? null)}
                />
              </div>
            ))}
          </div>
        )}

        {/* ======= STEP: PAYMENT ======= */}
        {currentStep === "payment" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-dark-950">
              {locale === "ar" ? "الدفع وتأكيد الحجز" : "Payment & Booking Confirmation"}
            </h2>

            {/* Points */}
            {userPoints > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={usePoints}
                    onChange={(e) => setUsePoints(e.target.checked)}
                    className="w-5 h-5"
                  />
                  <div>
                    <p className="font-medium text-amber-800 text-sm">
                      {locale === "ar" ? `استخدام نقاطك (${userPoints} نقطة = خصم ${formatPrice(pointsToDiscount(userPoints))})` : `Use your points (${userPoints} pts = ${formatPrice(pointsToDiscount(userPoints))} discount)`}
                    </p>
                  </div>
                </label>
              </div>
            )}

            {/* Payment methods */}
            <div>
              <p className="font-medium text-gray-700 text-sm mb-3">
                {locale === "ar" ? "طريقة الدفع" : "Payment Method"}
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: "VISA", label: "Visa", icon: "💳" },
                  { id: "MASTERCARD", label: "Mastercard", icon: "💳" },
                  { id: "CLIQ", label: "CliQ", icon: "📱" },
                  { id: "CASH", label: locale === "ar" ? "نقداً" : "Cash", icon: "💵" },
                ].map((method) => (
                  <label
                    key={method.id}
                    className={cn(
                      "flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all",
                      paymentMethod === method.id
                        ? "border-primary-700 bg-primary-50"
                        : "border-gray-200 hover:border-primary-300"
                    )}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={method.id}
                      checked={paymentMethod === method.id}
                      onChange={() => setPaymentMethod(method.id)}
                      className="hidden"
                    />
                    <span className="text-2xl">{method.icon}</span>
                    <span className="font-medium text-sm">{method.label}</span>
                    {paymentMethod === method.id && (
                      <Check className="w-4 h-4 text-primary-700 ml-auto" />
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gray-50 rounded-xl p-5 space-y-3">
              <h3 className="font-bold text-dark-950">
                {locale === "ar" ? "ملخص الحجز" : "Booking Summary"}
              </h3>
              {[
                { label: locale === "ar" ? "التكلفة الأساسية" : "Base Cost", value: formatPrice(baseAmount) },
                ...(seasonFee > 0 ? [{ label: locale === "ar" ? "رسوم الموسم" : "Season Fee", value: `+${formatPrice(seasonFee)}` }] : []),
                ...(pointsDiscount > 0 ? [{ label: locale === "ar" ? "خصم النقاط" : "Points Discount", value: `-${formatPrice(pointsDiscount)}` }] : []),
                { label: locale === "ar" ? "التأمين" : "Deposit", value: formatPrice(deposit) },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-gray-500">{label}</span>
                  <span className="text-dark-950">{value}</span>
                </div>
              ))}
              <div className="border-t border-gray-200 pt-3 flex justify-between font-bold">
                <span>{locale === "ar" ? "الإجمالي" : "Total"}</span>
                <span className="text-primary-700 text-lg">{formatPrice(total)}</span>
              </div>
            </div>

            {/* Terms */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="w-5 h-5 mt-0.5"
              />
              <p className="text-sm text-gray-600">
                {locale === "ar" ? "أوافق على " : "I agree to the "}
                <a href={`/${locale}/terms`} className="text-primary-700 hover:underline">
                  {locale === "ar" ? "الشروط والأحكام" : "Terms & Conditions"}
                </a>
                {locale === "ar" ? " وسياسة الخصوصية" : " and Privacy Policy"}
              </p>
            </label>
          </div>
        )}

        {/* ======= STEP: CONFIRM ======= */}
        {currentStep === "confirm" && bookingResult && (
          <div className="text-center py-8 space-y-6">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-12 h-12 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-dark-950 mb-2">
                {locale === "ar" ? "تم إرسال طلب الحجز!" : "Booking Request Sent!"}
              </h2>
              <p className="text-gray-500">
                {locale === "ar"
                  ? "سيتم مراجعة طلبك من قبل الإدارة وإشعارك خلال 24 ساعة"
                  : "Your request will be reviewed and you'll be notified within 24 hours"}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 inline-block">
              <p className="text-gray-500 text-sm">{locale === "ar" ? "رقم الحجز" : "Booking Number"}</p>
              <p className="font-mono font-bold text-xl text-primary-700">{bookingResult.bookingNumber}</p>
            </div>
            <div className="flex gap-3 justify-center">
              <a href={`/${locale}/dashboard`} className="btn-primary">
                {locale === "ar" ? "متابعة الحجز" : "Track Booking"}
              </a>
              <a href={`/${locale}/cars`} className="btn-secondary">
                {locale === "ar" ? "حجز آخر" : "Book Another"}
              </a>
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        {currentStep !== "confirm" && (
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
            <button
              onClick={() => {
                const idx = steps.indexOf(currentStep);
                if (idx > 0) setCurrentStep(steps[idx - 1]);
              }}
              disabled={currentIdx === 0}
              className="btn-secondary disabled:opacity-30"
            >
              {locale === "ar" ? "السابق" : "Previous"}
            </button>

            {currentStep !== "payment" ? (
              <button
                onClick={() => {
                  if (!canProceed()) {
                    toast.error(locale === "ar" ? "يرجى إكمال جميع الحقول المطلوبة" : "Please complete all required fields");
                    return;
                  }
                  setCurrentStep(steps[currentIdx + 1]);
                }}
                disabled={!canProceed()}
                className="btn-primary disabled:opacity-50"
              >
                {locale === "ar" ? "التالي" : "Next"}
                <ChevronRight className={`w-4 h-4 ${isRTL ? "rotate-180" : ""}`} />
              </button>
            ) : (
              <button
                onClick={submitBooking}
                disabled={!canProceed() || loading}
                className="btn-primary disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Shield className="w-4 h-4" />
                )}
                {locale === "ar" ? "تأكيد الحجز" : "Confirm Booking"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
