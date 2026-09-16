/**
 * Upsert every TOKENS row from lib/catalog.ts into instruments.
 *
 * Usage:
 *   npm run seed
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
 * Missing credentials skip the write (the SQL migration already seeds
 * the current catalog).
 */
import { existsSync, readFileSync } from "node:fs";
import { TOKENS, instrumentRow } from "../lib/catalog";
import { supabaseAdmin } from "../lib/supabase";

function loadEnvFiles() {
  for (const file of [".env.local", ".env"]) {
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

async function main() {
  loadEnvFiles();
  const db = supabaseAdmin();
  if (!db) {
    console.log(
      "Skipping seed: set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (see .env.example)."
    );
    return;
  }

  const rows = TOKENS.map(instrumentRow);
  const { error } = await db.from("instruments").upsert(rows, { onConflict: "mint" });
  if (error) {
    console.error("seed failed:", error.message);
    process.exitCode = 1;
    return;
  }
  console.log(`upserted ${rows.length} instruments`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
