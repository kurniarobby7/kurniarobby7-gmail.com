import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import { db } from "./src/db/index.ts";
import { visits } from "./src/db/schema.ts";
import { requireAuth, AuthRequest } from "./src/middleware/auth.ts";
import { eq, desc, and, gte, lte, like, sql } from "drizzle-orm";
import { format } from "date-fns";

// Initialize app with Express
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Main server startup function
async function startServer() {
  
  // Public API: Submit Guest Book form
  app.post("/api/visits", async (req: Request, res: Response): Promise<void> => {
    try {
      const data = req.body;
      const today = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
      
      // Generate Visit Number
      const dateStr = format(today, 'yyyyMMdd');
      // Count visits today to append sequence
      const visitsToday = await db.select({ count: sql<number>`count(*)` })
        .from(visits)
        .where(eq(visits.tanggalKunjungan, format(today, 'yyyy-MM-dd')));
      
      const seq = Number(visitsToday[0].count) + 1;
      const visitNumber = `BPMP-${dateStr}-${seq.toString().padStart(3, '0')}`;

      const newVisit = await db.insert(visits).values({
        visitNumber,
        namaLengkap: data.namaLengkap,
        nik: data.nik || null,
        instansi: data.instansi,
        jabatan: data.jabatan,
        noHp: data.noHp,
        email: data.email,
        alamat: data.alamat,
        keperluan: data.keperluan,
        keteranganLainnya: data.keteranganLainnya || null,
        tujuanBertemu: data.tujuanBertemu,
        bidangTujuan: data.bidangTujuan,
        jumlahPengunjung: parseInt(data.jumlahPengunjung, 10) || 1,
        tanggalKunjungan: format(today, 'yyyy-MM-dd'),
        jamDatang: format(today, 'HH:mm:ss'),
        signatureUrl: data.signatureUrl || null,
        photoUrl: data.photoUrl || null,
        documentUrl: data.documentUrl || null,
        syncedToSheets: 0,
      }).returning();

      res.status(201).json({ success: true, visit: newVisit[0] });
    } catch (error) {
      console.error("Error submitting visit:", error);
      res.status(500).json({ error: "Failed to submit data" });
    }
  });

  // Backend API: Get visits (Admin only)
  app.get("/api/admin/visits", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { search, startDate, endDate, keperluan, instansi } = req.query;
      
      let conditions = [];
      if (search) conditions.push(like(visits.namaLengkap, `%${search}%`));
      if (startDate) conditions.push(gte(visits.tanggalKunjungan, String(startDate)));
      if (endDate) conditions.push(lte(visits.tanggalKunjungan, String(endDate)));
      if (keperluan) conditions.push(eq(visits.keperluan, String(keperluan)));
      if (instansi) conditions.push(like(visits.instansi, `%${instansi}%`));

      const query = conditions.length > 0 
          ? db.select().from(visits).where(and(...conditions)).orderBy(desc(visits.createdAt))
          : db.select().from(visits).orderBy(desc(visits.createdAt));

      const allVisits = await query;
      res.json(allVisits);
    } catch (error) {
      console.error("Error fetching visits:", error);
      res.status(500).json({ error: "Failed to fetch visits" });
    }
  });

  // Admin API: Mark as synced
  app.post("/api/admin/visits/mark-synced", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { ids } = req.body;
      if (!ids || !Array.isArray(ids)) {
        res.status(400).json({ error: "Invalid visit IDs" });
        return;
      }
      
      // We process sequentially or pass a batch if drizzle supports 'inArray' (it does, but doing simple updates)
      for (const id of ids) {
        await db.update(visits).set({ syncedToSheets: 1 }).where(eq(visits.id, id));
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error marking synced:", error);
      res.status(500).json({ error: "Failed to update sync status" });
    }
  });

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production serving of built assets
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // SPA fallback
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
