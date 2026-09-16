# 🚗 South Rent Car — نظام تأجير سيارات سياحية

نظام متكامل لتأجير السيارات السياحية في الأردن — Enterprise Level.

## 🏗️ التقنيات

- **Next.js 15** (App Router)
- **React 19**
- **TypeScript**
- **PostgreSQL + Prisma**
- **NextAuth v5**
- **Tailwind CSS**
- **next-intl** (6 لغات)
- **Cloudinary** (الصور)
- **Stripe** (الدفع)
- **Resend** (الإيميل)

---

## 🚀 تشغيل المشروع

### 1. المتطلبات
- Node.js 20+
- PostgreSQL 15+
- حساب Cloudinary (مجاني)

### 2. تثبيت المشروع

```bash
# نسخ الملف
git clone https://github.com/yourname/jordan-cars
cd jordan-cars

# تثبيت الحزم
npm install

# نسخ ملف البيئة
cp .env.example .env.local
# عدّل .env.local بقيمك الحقيقية
```

### 3. إعداد قاعدة البيانات

```bash
# إنشاء الجداول
npm run db:push

# توليد Prisma Client
npm run db:generate

# إضافة بيانات تجريبية
npm run db:seed
```

### 4. تشغيل المشروع

```bash
npm run dev
# افتح http://localhost:3001
```

> المنفذ الافتراضي هو **3001** (`next dev -p 3001`).
> إذا غيّرته، غيّر أيضاً `NEXTAUTH_URL` و `NEXT_PUBLIC_APP_URL` في `.env.local`
> و `experimental.serverActions.allowedOrigins` في `next.config.mjs` — وإلا ستفشل عمليات تسجيل الدخول.

---

## 📁 هيكل المشروع

```
src/
├── app/
│   ├── [locale]/         ← الموقع العام (ar, en, es, tr, zh, ja)
│   │   ├── page.tsx      ← الصفحة الرئيسية
│   │   ├── cars/         ← تصفح السيارات
│   │   ├── booking/      ← نظام الحجز
│   │   ├── dashboard/    ← لوحة العميل
│   │   ├── branches/     ← الفروع
│   │   └── ...
│   ├── admin/            ← لوحة الأدمن
│   ├── super-admin/      ← Super Admin
│   └── api/              ← Backend APIs
├── components/
│   ├── layout/           ← Navbar, Footer
│   ├── cars/             ← CarCard, CarGrid
│   ├── booking/          ← BookingWizard
│   └── admin/            ← AdminSidebar, Tables
├── lib/
│   ├── prisma.ts         ← Prisma client
│   ├── auth.ts           ← NextAuth config
│   └── utils.ts          ← Utilities
├── i18n/                 ← i18n config
└── messages/             ← ar.json, en.json, ...

prisma/
├── schema.prisma         ← Database schema
└── seed.ts               ← Seed data
```

---

## 🌍 اللغات المدعومة

| كود | اللغة    | الرابط   |
|-----|----------|---------|
| ar  | العربية  | /ar     |
| en  | English  | /en     |
| es  | Español  | /es     |
| tr  | Türkçe   | /tr     |
| zh  | 中文     | /zh     |
| ja  | 日本語   | /ja     |

### إضافة لغة جديدة:
1. أضف الكود في `src/i18n/routing.ts`
2. أنشئ ملف `messages/XX.json`
3. انتهى! ✅

---

## 👤 صلاحيات المستخدمين

| الدور        | الوصول                    |
|-------------|--------------------------|
| `USER`      | الحجز، Dashboard          |
| `ADMIN`     | إدارة فرع واحد            |
| `SUPER_ADMIN` | إدارة كاملة للنظام     |

**بيانات الاختبار:**
- Super Admin: `admin@drivejordan.jo` / `Admin@123!`
- Branch Admin: `amman-admin@drivejordan.jo` / `Admin@123!`

---

## 📅 نظام الحجوزات

- حد أدنى 3 أيام (قابل للتعديل)
- في المواسم: 7 أيام (قابل للتعديل من الأدمن)
- منع التضارب تلقائياً
- حالات: PENDING → APPROVED → COMPLETED

## 🌟 نظام النقاط

- كل 1 دينار = 10 نقاط
- كل 100 نقطة = خصم 1 دينار
- تحكم كامل من Super Admin

---

## 🔧 الـ APIs الرئيسية

| الطريقة | المسار                      | الوصف               |
|---------|----------------------------|---------------------|
| GET     | `/api/cars`                | قائمة السيارات       |
| POST    | `/api/bookings`            | إنشاء حجز جديد      |
| GET     | `/api/bookings`            | قائمة الحجوزات      |
| PATCH   | `/api/bookings/[id]/status`| تغيير حالة الحجز    |
| POST    | `/api/upload`              | رفع صورة            |
| GET     | `/api/admin/dashboard`     | إحصائيات الأدمن     |

---

## 📱 التصميم

- ألوان: أحمر + أبيض + أسود
- Fully Responsive
- RTL/LTR تلقائي
- Dark hero + Light content

---

## 🚀 النشر على Vercel

```bash
# ربط المشروع
vercel

# أضف متغيرات البيئة في Vercel Dashboard

# نشر production
vercel --prod
```

لا تنسَ إضافة DATABASE_URL لـ Vercel ومزامنة قاعدة البيانات:
```bash
DATABASE_URL=your_production_url npm run db:push
```
