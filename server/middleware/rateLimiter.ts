import rateLimit from "express-rate-limit";
import { Request, Response } from "express";

// Standard JSON error response for rate limit violations
const createRateLimitHandler = (message: string) => {
  return (req: Request, res: Response) => {
    res.status(429).json({
      error: "Too Many Requests",
      message,
      retryAfterSeconds: Math.ceil((req.rateLimit?.resetTime?.getTime()! - Date.now()) / 1000) || 60,
    });
  };
};

/**
 * 1. Login Rate Limiter
 * -> 5 attempts / minute
 */
export const loginRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  handler: createRateLimitHandler("Too many login attempts. Please wait 1 minute before trying again."),
});

/**
 * 2. Registration Rate Limiter
 * -> 5 attempts / hour / IP
 */
export const registerRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  handler: createRateLimitHandler("Registration threshold reached. Maximum 5 account creations per hour per IP."),
});

/**
 * 3. Carbon Calculation Rate Limiter
 * -> 30 requests / minute / user (or IP)
 */
export const carbonCalcRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  keyGenerator: (req) => (req.headers["x-user-id"] as string) || req.ip || "anonymous",
  handler: createRateLimitHandler("Carbon calculation rate limit exceeded (max 30 requests/min)."),
});

/**
 * 4. Marketplace API Rate Limiter
 * -> 100 requests / minute / user (or IP)
 */
export const marketplaceRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  keyGenerator: (req) => (req.headers["x-user-id"] as string) || req.ip || "anonymous",
  handler: createRateLimitHandler("Marketplace API rate limit exceeded (max 100 requests/min)."),
});

/**
 * 5. Payment / Order Creation Rate Limiter
 * -> 10 requests / minute / user (or IP)
 */
export const orderCreationRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  keyGenerator: (req) => (req.headers["x-user-id"] as string) || req.ip || "anonymous",
  handler: createRateLimitHandler("Order creation rate limit exceeded. You can create a maximum of 10 orders per minute."),
});

/**
 * 6. General API Rate Limiter
 * -> 100 requests / minute / user (or IP)
 */
export const generalApiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  keyGenerator: (req) => (req.headers["x-user-id"] as string) || req.ip || "anonymous",
  handler: createRateLimitHandler("General API rate limit exceeded (max 100 requests/min)."),
});
