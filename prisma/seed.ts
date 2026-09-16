import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Branches
  const ammanBranch = await prisma.branch.upsert({
    where: { id: "branch-amman-001" },
    update: {},
    create: {
      id: "branch-amman-001",
      name: "Amman Branch",
      nameAr: "فرع عمان",
      address: "7th Circle, Amman",
      addressAr: "الدوار السابع، عمان",
      city: "Amman",
      lat: 31.9539,
      lng: 35.9106,
      phone: "+962 6 123 4567",
      whatsapp: "+962 7 987 6543",
      email: "amman@drivejordan.jo",
      emergencyPhone: "+962 7 000 0000",
    },
  });

  const aqabaBranch = await prisma.branch.upsert({
    where: { id: "branch-aqaba-001" },
    update: {},
    create: {
      id: "branch-aqaba-001",
      name: "Aqaba Branch",
      nameAr: "فرع العقبة",
      address: "King Hussein St, Aqaba",
      addressAr: "شارع الملك حسين، العقبة",
      city: "Aqaba",
      lat: 29.5267,
      lng: 35.0078,
      phone: "+962 3 201 2345",
      whatsapp: "+962 7 876 5432",
      email: "aqaba@drivejordan.jo",
    },
  });

  // Super Admin
  const superAdmin = await prisma.user.upsert({
    where: { email: "admin@drivejordan.jo" },
    update: {},
    create: {
      email: "admin@drivejordan.jo",
      name: "Super Admin",
      password: await bcrypt.hash("Admin@123!", 12),
      role: "SUPER_ADMIN",
      phone: "+962 7 000 0001",
    },
  });

  // Branch Admin
  const branchAdmin = await prisma.user.upsert({
    where: { email: "amman-admin@drivejordan.jo" },
    update: {},
    create: {
      email: "amman-admin@drivejordan.jo",
      name: "Amman Branch Admin",
      password: await bcrypt.hash("Admin@123!", 12),
      role: "ADMIN",
      branchId: ammanBranch.id,
      phone: "+962 7 000 0002",
    },
  });

  // Sample Cars
  const cars = [
    {
      name: "Mercedes GLC 2024",
      nameAr: "مرسيدس GLC 2024",
      brand: "Mercedes-Benz",
      model: "GLC",
      year: 2024,
      seats: 5,
      fuelType: "HYBRID" as const,
      fuelConsumption: "6.5L/100km",
      transmission: "AUTOMATIC" as const,
      color: "White",
      colorAr: "أبيض",
      description: "Tourism SUV with panoramic roof and premium interior",
      descriptionAr: "سيارة دفع رباعي سياحية مع سقف بانورامي وتشطيبات ممتازة",
      images: ["https://res.cloudinary.com/demo/image/upload/car1.jpg"],
      dailyPrice: 120,
      weeklyPrice: 700,
      monthlyPrice: 2400,
      depositAmount: 500,
      branchId: ammanBranch.id,
      status: "AVAILABLE" as const,
    },
    {
      name: "BMW X5 2023",
      nameAr: "بي ام دبليو X5 2023",
      brand: "BMW",
      model: "X5",
      year: 2023,
      seats: 7,
      fuelType: "PETROL" as const,
      fuelConsumption: "9.5L/100km",
      transmission: "AUTOMATIC" as const,
      color: "Black",
      colorAr: "أسود",
      description: "Powerful 7-seater SUV with all-wheel drive",
      descriptionAr: "سيارة SUV قوية 7 مقاعد مع دفع رباعي",
      images: ["https://res.cloudinary.com/demo/image/upload/car2.jpg"],
      dailyPrice: 150,
      weeklyPrice: 900,
      monthlyPrice: 3200,
      depositAmount: 600,
      branchId: ammanBranch.id,
      status: "AVAILABLE" as const,
    },
    {
      name: "Toyota Camry 2024",
      nameAr: "تويوتا كامري 2024",
      brand: "Toyota",
      model: "Camry",
      year: 2024,
      seats: 5,
      fuelType: "HYBRID" as const,
      fuelConsumption: "5.5L/100km",
      transmission: "AUTOMATIC" as const,
      color: "Silver",
      colorAr: "فضي",
      description: "Elegant hybrid sedan with exceptional fuel economy",
      descriptionAr: "سيدان أنيق هايبرد باقتصاد ممتاز في الوقود",
      images: ["https://res.cloudinary.com/demo/image/upload/car3.jpg"],
      dailyPrice: 65,
      weeklyPrice: 380,
      monthlyPrice: 1300,
      depositAmount: 300,
      branchId: ammanBranch.id,
      status: "AVAILABLE" as const,
    },
    {
      name: "Range Rover Sport 2023",
      nameAr: "رنج روفر سبورت 2023",
      brand: "Land Rover",
      model: "Range Rover Sport",
      year: 2023,
      seats: 5,
      fuelType: "PETROL" as const,
      fuelConsumption: "12L/100km",
      transmission: "AUTOMATIC" as const,
      color: "Red",
      colorAr: "أحمر",
      description: "Ultimate tourism off-road vehicle",
      descriptionAr: "السيارة الأكثر رفاهية للطرق الوعرة",
      images: ["https://res.cloudinary.com/demo/image/upload/car4.jpg"],
      dailyPrice: 200,
      weeklyPrice: 1200,
      monthlyPrice: 4500,
      depositAmount: 800,
      branchId: aqabaBranch.id,
      status: "AVAILABLE" as const,
    },
  ];

  for (const car of cars) {
    await prisma.car.upsert({
      where: { id: `car-${car.model.toLowerCase().replace(/\s/g, "-")}-001` },
      update: {},
      create: {
        id: `car-${car.model.toLowerCase().replace(/\s/g, "-")}-001`,
        ...car,
      },
    });
  }

  // Season example (Eid)
  await prisma.season.upsert({
    where: { id: "season-eid-2025" },
    update: {},
    create: {
      id: "season-eid-2025",
      name: "Eid Al-Adha 2025",
      nameAr: "عيد الأضحى 2025",
      startDate: new Date("2025-06-06"),
      endDate: new Date("2025-06-13"),
      priceMultiplier: 1.5,
      minDays: 7,
      isActive: false,
      description: "Eid holiday season pricing",
      descriptionAr: "أسعار موسم عيد الأضحى",
    },
  });

  console.log("✅ Seed complete!");
  console.log("\n📧 Credentials:");
  console.log("   Super Admin: admin@drivejordan.jo / Admin@123!");
  console.log("   Branch Admin: amman-admin@drivejordan.jo / Admin@123!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
