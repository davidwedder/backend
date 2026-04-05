-- CreateTable
CREATE TABLE "cars" (
    "id" SERIAL NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "mileage" INTEGER NOT NULL,
    "fuel" TEXT NOT NULL,
    "transmission" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'available',
    "images" JSONB NOT NULL DEFAULT '[]',
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "hours_week" TEXT NOT NULL,
    "hours_saturday" TEXT NOT NULL,
    "hours_sunday" TEXT NOT NULL,
    "instagram_url" TEXT,
    "facebook_url" TEXT,
    "about_image_url" TEXT DEFAULT 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=1000',
    "hero_image_url" TEXT DEFAULT 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=1920',

    CONSTRAINT "store_settings_pkey" PRIMARY KEY ("id")
);
