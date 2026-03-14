import { config as dotenvConfig } from "dotenv";
import type { AppConfig } from "./types.js";

dotenvConfig();

function envFloat(key: string, fallback: number): number {
  const val = process.env[key];
  if (val === undefined) return fallback;
  const parsed = parseFloat(val);
  return isNaN(parsed) ? fallback : parsed;
}

function envInt(key: string, fallback: number): number {
  const val = process.env[key];
  if (val === undefined) return fallback;
  const parsed = parseInt(val, 10);
  return isNaN(parsed) ? fallback : parsed;
}

function envStr(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export const config: AppConfig = {
  rateLimitRpm: envInt("RATE_LIMIT_RPM", 30),
  dbPath: envStr("DB_PATH", "./data/arbitrage.db"),
  minMarginPercent: envFloat("MIN_MARGIN_PERCENT", 15),
  minConfidence: envFloat("MIN_CONFIDENCE", 0.5),
  requestTimeoutMs: envInt("REQUEST_TIMEOUT_MS", 10000),
  userAgent: envStr(
    "USER_AGENT",
    "ArbitrageFinder/1.0 (educational project)"
  ),
  fees: {
    tradera: envFloat("FEE_TRADERA", 0.1),
    ebay: envFloat("FEE_EBAY", 0.13),
    blocket: envFloat("FEE_BLOCKET", 0.0),
    facebook: envFloat("FEE_FACEBOOK", 0.0),
  },
};
