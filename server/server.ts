import express from "express";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { performance } from "perf_hooks";
import {
  loginRateLimiter,
  registerRateLimiter,
  carbonCalcRateLimiter,
  marketplaceRateLimiter,
  orderCreationRateLimiter,
  generalApiRateLimiter,
} from "./middleware/rateLimiter";

dotenv.config();

const app = express();
app.use(express.json());

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://tbdyvkrfprmviwiphxxt.supabase.co";
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_Usz3WJfLN7bPlNfqH0DFCA_BZe2Cx50";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Fixed base credit price per ton on server-side ($25 per carbon credit)
const SERVER_CREDIT_PRICE_PER_TON = 25;

// CORS headers
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, x-user-id");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// 1. Auth: Login endpoint (5 attempts / min)
app.post("/api/auth/login", loginRateLimiter, async (req, res) => {
  const tStart = performance.now();
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  const tDb = performance.now() - tStart;

  if (error) {
    return res.status(401).json({ error: error.message, tDbMs: parseFloat(tDb.toFixed(2)) });
  }
  return res.json({ success: true, user: data.user, session: data.session, tDbMs: parseFloat(tDb.toFixed(2)) });
});

// 2. Auth: Registration endpoint (5 attempts / hr / IP)
app.post("/api/auth/register", registerRateLimiter, async (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { role: role || "farmer" } },
  });

  if (error) {
    return res.status(400).json({ error: error.message });
  }
  return res.json({ success: true, user: data.user });
});

// 3. Carbon Sequestration Calculation endpoint (30 req / min / user)
app.post("/api/carbon/calculate", carbonCalcRateLimiter, (req, res) => {
  const tStart = performance.now();
  const { area, trees, species, practice } = req.body;
  const parsedArea = parseFloat(area) || 0;
  const parsedTrees = parseInt(trees) || 0;

  // Input validation duration
  const tVal = performance.now() - tStart;

  // Sequestration calculation formula
  const speciesFactor = species === "Mangrove" ? 2.5 : species === "Teak" ? 1.8 : 1.2;
  const practiceFactor = practice === "Agroforestry" ? 1.3 : 1.0;
  const totalCarbon = (parsedArea * 0.8 + parsedTrees * 0.05) * speciesFactor * practiceFactor;

  const tCalc = performance.now() - tStart;

  return res.json({
    success: true,
    estimatedCarbonTons: parseFloat(totalCarbon.toFixed(2)),
    parameters: { area: parsedArea, trees: parsedTrees, species, practice },
    timing: {
      validationMs: parseFloat(tVal.toFixed(3)),
      totalMs: parseFloat(tCalc.toFixed(3)),
    },
  });
});

// Lightweight in-memory cache for Marketplace projects
interface CacheEntry {
  data: any;
  expiry: number;
}
const marketplaceCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 30000; // 30 Seconds TTL

// 4. Marketplace API endpoint (Optimized with explicit columns + pagination + 30s TTL Cache)
app.get("/api/marketplace/projects", marketplaceRateLimiter, async (req, res) => {
  const tStart = performance.now();

  // Parse pagination params (?page=1&limit=20)
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  const offset = (page - 1) * limit;

  const cacheKey = `mkt_page_${page}_limit_${limit}`;
  const cached = marketplaceCache.get(cacheKey);

  // Serve from cache if valid
  if (cached && Date.now() < cached.expiry) {
    const tTotal = performance.now() - tStart;
    return res.json({
      ...cached.data,
      timing: {
        cached: true,
        dbMs: 0,
        totalMs: parseFloat(tTotal.toFixed(2)),
      },
    });
  }

  // Select explicit columns instead of SELECT * without expensive exact count
  const { data, error } = await supabase
    .from("farms")
    .select("id, area, trees, carbon, practice, species, latitude, longitude, status, user_id")
    .eq("status", "approved")
    .range(offset, offset + limit - 1);

  const tDb = performance.now() - tStart;

  if (error) {
    return res.status(500).json({ error: error.message, tDbMs: parseFloat(tDb.toFixed(2)) });
  }

  const tTotal = performance.now() - tStart;
  const payload = {
    success: true,
    pagination: {
      page,
      limit,
      returnedRecords: data ? data.length : 0,
    },
    projects: data,
  };

  // Populate cache
  marketplaceCache.set(cacheKey, {
    data: payload,
    expiry: Date.now() + CACHE_TTL_MS,
  });

  return res.json({
    ...payload,
    timing: {
      cached: false,
      dbMs: parseFloat(tDb.toFixed(2)),
      totalMs: parseFloat(tTotal.toFixed(2)),
    },
  });
});

// 5. Payment / Order Creation endpoint (Idempotency + Server-side price calculation)
app.post("/api/orders/create", orderCreationRateLimiter, async (req, res) => {
  const tStart = performance.now();
  const { userId, projectId, projectName, quantity, razorpayPaymentId } = req.body;

  if (!userId || !projectId || !quantity || !razorpayPaymentId) {
    return res.status(400).json({ error: "Missing required order parameters (userId, projectId, quantity, razorpayPaymentId)" });
  }

  const parsedQuantity = parseInt(quantity);
  if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
    return res.status(400).json({ error: "Invalid credit quantity. Quantity must be a positive integer." });
  }

  // 🛡️ SECURITY FIX: Server-side credit price calculation. Never trust price sent by client!
  const calculatedTotalCost = parsedQuantity * SERVER_CREDIT_PRICE_PER_TON;

  // Create Supabase client with caller's authorization token if present
  const authHeader = req.headers.authorization;
  const client = authHeader
    ? createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authHeader } } })
    : supabase;

  // 1. Idempotency check on purchases(razorpay_payment_id)
  const tIdemStart = performance.now();
  const { data: existing } = await client
    .from("purchases")
    .select("id")
    .eq("razorpay_payment_id", razorpayPaymentId)
    .single();
  const tIdem = performance.now() - tIdemStart;

  if (existing) {
    return res.status(409).json({
      error: "Duplicate Order",
      message: "An order for this payment ID has already been created.",
      orderId: existing.id,
      timing: { idempotencyMs: parseFloat(tIdem.toFixed(2)) },
    });
  }

  // 2. Insert order atomically
  const tInsertStart = performance.now();
  const { data: order, error } = await client
    .from("purchases")
    .insert({
      user_id: userId,
      project_id: projectId,
      project_name: projectName || "Carbon Credit Project",
      quantity: parsedQuantity,
      total_cost: calculatedTotalCost,
      razorpay_payment_id: razorpayPaymentId,
    })
    .select()
    .single();

  const tInsert = performance.now() - tInsertStart;
  const tTotal = performance.now() - tStart;

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(201).json({
    success: true,
    order,
    timing: {
      idempotencyMs: parseFloat(tIdem.toFixed(2)),
      insertMs: parseFloat(tInsert.toFixed(2)),
      totalMs: parseFloat(tTotal.toFixed(2)),
    },
  });
});

// 6. Satellite AI Tree Detection Bridge endpoint (calls Python DeepForest / ExG service on :8001)
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:8001";

app.post("/api/detect-trees", async (req, res) => {
  const { polygon, farmId } = req.body; // polygon = [[lat, lng], ...]
  if (!polygon || !Array.isArray(polygon) || polygon.length < 3) {
    return res.status(400).json({ error: "Invalid polygon: at least 3 [lat, lng] vertices required." });
  }

  try {
    // 1. Call the Python tree-detection microservice (allow up to 120s for larger multi-tile farms on CPU)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);

    let resp: Response;
    try {
      resp = await fetch(`${ML_SERVICE_URL}/detect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ polygon }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!resp.ok) {
      const txt = await resp.text();
      throw new Error(`Detect service error: ${resp.status} ${txt}`);
    }

    const data = await resp.json(); // { tree_count, detections, canopy_pct, mean_confidence, zoom, meters_per_pixel, method }

    // 2. Store the detection result in Supabase (use caller JWT if provided so RLS permits Admin update)
    let persistedToSupabase = false;
    if (farmId) {
      const numericFarmId = Number(farmId);
      const targetId = !isNaN(numericFarmId) && numericFarmId > 0 ? numericFarmId : farmId;
      const authHeader = req.headers.authorization;
      const dbClient = authHeader
        ? createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: authHeader } },
          })
        : supabase;

      const { error: dbError } = await dbClient
        .from("farms")
        .update({
          detected_trees: data.tree_count,
          detection_confidence: data.canopy_pct,
          detected_at: new Date().toISOString(),
        })
        .eq("id", targetId);

      if (dbError) {
        console.warn("[/api/detect-trees] Could not persist detection columns to Supabase (run 20261113_add_detection.sql):", dbError.message);
      } else {
        persistedToSupabase = true;
      }
    }

    // 3. Return to the front-end
    return res.json({
      success: true,
      persistedToSupabase,
      result: data,
    });
  } catch (e) {
    console.error("Tree detection failed:", e);
    return res.status(500).json({ error: (e as Error).message });
  }
});

// 7. General API fallback endpoint (100 req / min / user)
app.use("/api", generalApiRateLimiter, (req, res) => {
  return res.json({ status: "CarbonX API Active", timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;
if (process.env.START_SERVER === "true") {
  app.listen(PORT, () => {
    console.log(`🚀 CarbonX Backend Server running on port ${PORT}`);
  });
}

export default app;
