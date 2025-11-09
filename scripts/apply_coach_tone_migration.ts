import { sql } from "drizzle-orm";
import { db } from "../lib/db";

async function applyMigration() {
  console.log("🔄 Applying coach_tone enum migration...\n");

  try {
    // Step 1: Convert column to text
    console.log("Step 1: Converting coach_tone column to text...");
    await db.execute(sql`ALTER TABLE "profiles" ALTER COLUMN "coach_tone" SET DATA TYPE text`);

    // Step 2: Set default to analyst
    console.log("Step 2: Setting default to analyst...");
    await db.execute(sql`ALTER TABLE "profiles" ALTER COLUMN "coach_tone" SET DEFAULT 'analyst'::text`);

    // Step 3: Update existing data
    console.log("Step 3: Converting existing data...");
    const conciseUpdate = await db.execute(sql`UPDATE "profiles" SET "coach_tone" = 'analyst' WHERE "coach_tone" = 'concise'`);
    console.log(`   - Converted ${conciseUpdate.rowCount || 0} rows from 'concise' to 'analyst'`);

    const friendlyUpdate = await db.execute(sql`UPDATE "profiles" SET "coach_tone" = 'flirty' WHERE "coach_tone" = 'friendly'`);
    console.log(`   - Converted ${friendlyUpdate.rowCount || 0} rows from 'friendly' to 'flirty'`);

    // Step 4: Drop old enum
    console.log("Step 4: Dropping old enum type...");
    await db.execute(sql`DROP TYPE "public"."coach_tone"`);

    // Step 5: Create new enum
    console.log("Step 5: Creating new enum type with ['analyst', 'flirty']...");
    await db.execute(sql`CREATE TYPE "public"."coach_tone" AS ENUM('analyst', 'flirty')`);

    // Step 6: Set default to new enum
    console.log("Step 6: Setting default to new enum...");
    await db.execute(sql`ALTER TABLE "profiles" ALTER COLUMN "coach_tone" SET DEFAULT 'analyst'::"public"."coach_tone"`);

    // Step 7: Convert column back to enum type
    console.log("Step 7: Converting column back to enum type...");
    await db.execute(sql`ALTER TABLE "profiles" ALTER COLUMN "coach_tone" SET DATA TYPE "public"."coach_tone" USING "coach_tone"::"public"."coach_tone"`);

    console.log("\n✅ Migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  }
}

applyMigration();
