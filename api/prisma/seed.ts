import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.store_settings.upsert({
    where: { id: 1 },
    update: {
      phone: "+55 (00) 0000-0000",
      email: "contato@feautos.com",
      address: "Sua cidade, Estado",
      hours_week: "Seg-Sex 08:00-18:00",
      hours_saturday: "09:00-14:00",
      hours_sunday: "Fechado",
      instagram_url: "",
      facebook_url: "",
      hero_image_url: "",
      about_image_url: "",
    },
    create: {
      phone: "+55 (00) 0000-0000",
      email: "contato@feautos.com",
      address: "Sua cidade, Estado",
      hours_week: "Seg-Sex 08:00-18:00",
      hours_saturday: "09:00-14:00",
      hours_sunday: "Fechado",
      instagram_url: "",
      facebook_url: "",
      hero_image_url: "",
      about_image_url: "",
    },
  });

  console.log("Prisma seed completed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
