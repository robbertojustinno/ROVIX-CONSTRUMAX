const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

async function main() {
  const url = process.env.DATABASE_URL;
  const initialPassword = process.env.ROVIX_INITIAL_ADMIN_PASSWORD;
  if (!url) throw new Error("DATABASE_URL ausente");
  if (!initialPassword) throw new Error("ROVIX_INITIAL_ADMIN_PASSWORD ausente");

  const pool = new Pool({ connectionString: url });
  const migrationsDir = path.join(__dirname, "db", "migrations");
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith(".sql")).sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
    await pool.query(sql);
    console.log("Migration aplicada:", file);
  }

  const existing = await pool.query("SELECT id FROM users WHERE email=$1", ["admin@rovix.local"]);
  if (!existing.rows[0]) {
    const hash = await bcrypt.hash(initialPassword, 12);
    await pool.query(
      "INSERT INTO users(name,email,password_hash,role) VALUES($1,$2,$3,'ADMIN')",
      ["Administrador Rovix", "admin@rovix.local", hash]
    );
  }

  await pool.query(
    "INSERT INTO warehouses(name,code,address) VALUES('Depósito Principal','DP01','Loja principal') ON CONFLICT(code) DO NOTHING"
  );

  await pool.end();
  console.log("Bootstrap concluído.");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
