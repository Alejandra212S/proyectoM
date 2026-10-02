const fs = require("node:fs");
const path = require("node:path");
const { sql, config } = require("./bd");

async function setupDatabase() {
  const script = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  const batches = script.split(/^\s*GO\s*$/gim).map(batch => batch.trim()).filter(Boolean);
  const pool = new sql.ConnectionPool({ ...config, database: "master" });

  await pool.connect();
  try {
    for (const batch of batches) {
      await pool.request().batch(batch);
    }
    console.log("Base de datos y esquema ADAM-5060 creados o ya existentes.");
  } finally {
    await pool.close();
  }
}

setupDatabase().catch(error => {
  console.error("No se pudo preparar la base de datos:", error.message);
  process.exitCode = 1;
});