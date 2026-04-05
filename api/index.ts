import express, { Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import session from "express-session";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { prisma } from "./lib/db";
import { uploadToBlob, deleteFromBlob } from "./lib/blob";
import sharp from "sharp";
import cors from "cors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const PORT = 3000;

const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:3000",
  "http://localhost:5173",
];

// CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));

// Configuração para confiar no proxy
app.set("trust proxy", 1);

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || "your-secret-key",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
}));

const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.session?.isAdmin) {
    return next();
  }
  return res.status(401).json({ error: "Unauthorized" });
};

app.post("/api/auth/login", (req: Request, res: Response) => {
  const { email, password } = req.body;
  const adminEmail = process.env.ADMIN_EMAIL || "admin@feautos.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "your-admin-password";

  if (email === adminEmail && password === adminPassword) {
    if (req.session) {
      req.session.isAdmin = true;
    }
    return res.json({ success: true });
  }

  return res.status(401).json({ error: "Invalid credentials" });
});

app.post("/api/auth/logout", requireAdmin, (req: Request, res: Response) => {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to logout" });
      }
      return res.json({ success: true });
    });
  } else {
    return res.json({ success: true });
  }
});

app.get("/api/auth/status", (req: Request, res: Response) => {
  res.json({ authenticated: !!req.session?.isAdmin });
});

// Multer Setup for Image Uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
    files: 10 // Maximum 10 images per vehicle
  },
});

// Upload fallback local
const localUploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(localUploadsDir)) {
  fs.mkdirSync(localUploadsDir, { recursive: true });
}

const saveBufferToLocalUploads = async (buffer: Buffer, filename: string): Promise<string> => {
  const safeName = filename.replace(/[^a-zA-Z0-9._/-]/g, "_").replace(/\.\./g, "_");
  const base = path.basename(safeName);
  const outName = `${Date.now()}-${Math.random().toString(36).slice(2)}-${base}`;
  const outPath = path.join(localUploadsDir, outName);
  fs.writeFileSync(outPath, buffer);
  return `/uploads/${outName}`;
};

const normalizeCar = (car: any) => ({
  ...car,
  images: typeof car.images === "string" ? JSON.parse(car.images) : car.images,
});

// API Routes

// Health check
app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Get all cars
app.get("/api/cars", async (req: Request, res: Response) => {
  try {
    const cars = await prisma.cars.findMany({
      orderBy: { created_at: "desc" },
    });
    res.json(cars.map(normalizeCar));
  } catch (error) {
    console.error("Error fetching cars:", error);
    res.status(500).json({ error: "Failed to fetch cars" });
  }
});

// Get car by ID
app.get("/api/cars/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const car = await prisma.cars.findUnique({
      where: { id: parseInt(id) },
    });

    if (!car) {
      return res.status(404).json({ error: "Car not found" });
    }

    res.json(normalizeCar(car));
  } catch (error) {
    console.error("Error fetching car:", error);
    res.status(500).json({ error: "Failed to fetch car" });
  }
});

// Create car
app.post("/api/cars", requireAdmin, upload.array("images", 10), async (req: Request, res: Response) => {
  try {
    const { brand, model, year, price, mileage, fuel, transmission, description } = req.body;
    const files = req.files as Express.Multer.File[];

    // Process images
    const imageUrls: string[] = [];
    if (files && files.length > 0) {
      for (const file of files) {
        try {
          // Compress image
          const compressedBuffer = await sharp(file.buffer)
            .resize(1200, 800, { fit: "inside", withoutEnlargement: true })
            .jpeg({ quality: 80 })
            .toBuffer();

          // Upload to blob storage or save locally
          const imageUrl = process.env.BLOB_READ_WRITE_TOKEN
            ? await uploadToBlob(compressedBuffer, file.originalname)
            : await saveBufferToLocalUploads(compressedBuffer, file.originalname);

          imageUrls.push(imageUrl);
        } catch (error) {
          console.error("Error processing image:", error);
        }
      }
    }

    const car = await prisma.cars.create({
      data: {
        brand,
        model,
        year: parseInt(year),
        price: parseFloat(price),
        mileage: parseInt(mileage),
        fuel,
        transmission,
        description,
        images: JSON.stringify(imageUrls),
      },
    });

    res.status(201).json(car);
  } catch (error) {
    console.error("Error creating car:", error);
    res.status(500).json({ error: "Failed to create car" });
  }
});

// Update car
app.put("/api/cars/:id", requireAdmin, upload.array("images", 10), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { brand, model, year, price, mileage, fuel, transmission, description, status } = req.body;
    const files = req.files as Express.Multer.File[];

    // Process new images
    const imageUrls: string[] = [];
    if (files && files.length > 0) {
      for (const file of files) {
        try {
          const compressedBuffer = await sharp(file.buffer)
            .resize(1200, 800, { fit: "inside", withoutEnlargement: true })
            .jpeg({ quality: 80 })
            .toBuffer();

          const imageUrl = process.env.BLOB_READ_WRITE_TOKEN
            ? await uploadToBlob(compressedBuffer, file.originalname)
            : await saveBufferToLocalUploads(compressedBuffer, file.originalname);

          imageUrls.push(imageUrl);
        } catch (error) {
          console.error("Error processing image:", error);
        }
      }
    }

    const car = await prisma.cars.update({
      where: { id: parseInt(id) },
      data: {
        brand,
        model,
        year: parseInt(year),
        price: parseFloat(price),
        mileage: parseInt(mileage),
        fuel,
        transmission,
        description,
        status,
        ...(imageUrls.length > 0 && { images: JSON.stringify(imageUrls) }),
      },
    });

    res.json(car);
  } catch (error) {
    console.error("Error updating car:", error);
    res.status(500).json({ error: "Failed to update car" });
  }
});

// Delete car
app.delete("/api/cars/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get car to delete associated images
    const car = await prisma.cars.findUnique({
      where: { id: parseInt(id) },
    });

    if (car && car.images) {
      const images = typeof car.images === "string" ? JSON.parse(car.images) : car.images;
      if (Array.isArray(images)) {
        for (const imageUrl of images) {
          try {
            await deleteFromBlob(imageUrl);
          } catch (error) {
            console.error("Error deleting image:", error);
          }
        }
      }
    }

    await prisma.cars.delete({
      where: { id: parseInt(id) },
    });

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting car:", error);
    res.status(500).json({ error: "Failed to delete car" });
  }
});

// Get store settings
app.get("/api/settings", async (req: Request, res: Response) => {
  try {
    const settings = await prisma.store_settings.findFirst();
    res.json(settings);
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

// Update store settings
app.put("/api/settings", requireAdmin, async (req: Request, res: Response) => {
  try {
    const {
      phone,
      email,
      address,
      hours_week,
      hours_saturday,
      hours_sunday,
      instagram_url,
      facebook_url,
      hero_image_url,
      about_image_url,
    } = req.body;

    const settings = await prisma.store_settings.upsert({
      where: { id: 1 },
      update: {
        phone,
        email,
        address,
        hours_week,
        hours_saturday,
        hours_sunday,
        instagram_url,
        facebook_url,
        hero_image_url,
        about_image_url,
      },
      create: {
        phone,
        email,
        address,
        hours_week,
        hours_saturday,
        hours_sunday,
        instagram_url,
        facebook_url,
        hero_image_url,
        about_image_url,
      },
    });

    res.json(settings);
  } catch (error) {
    console.error("Error updating settings:", error);
    res.status(500).json({ error: "Failed to update settings" });
  }
});

// Serve uploaded files
app.use("/uploads", express.static(localUploadsDir));

// Error handling middleware
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Unhandled error:", error);
  res.status(500).json({ error: "Internal server error" });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: "Not found" });
});

app.listen(PORT, () => {
  console.log(`🚀 API Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});