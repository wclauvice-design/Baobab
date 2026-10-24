// Opt-in integration runner. Operates ONLY in a dedicated schema, never public.
const fs = require("fs"),
  path = require("path"),
  { spawnSync } = require("child_process");
const { PrismaClient } = require("@prisma/client");
const envPath = process.env.BAOBAB_SOURCE_ENV;
if (!envPath)
  throw new Error(
    "BAOBAB_SOURCE_ENV must point to the existing local API env file",
  );
const env = require("dotenv").parse(fs.readFileSync(envPath));
const schema = "baobab_refonte_test_20261023";
const url = new URL(env.DATABASE_URL);
url.searchParams.set("schema", schema);
url.searchParams.set("connection_limit", "4");
url.searchParams.set("pool_timeout", "30");
process.env.DATABASE_URL = url.toString();
process.env.JWT_SECRET = "integration-only-not-production";
process.env.ENABLE_DEV_LOGIN = "true";
process.env.PORT = "3017";
if (new URL(process.env.DATABASE_URL).searchParams.get("schema") !== schema)
  throw new Error("Unsafe schema");
const db = new PrismaClient({
  transactionOptions: { maxWait: 30000, timeout: 30000 },
});
async function main() {
  const exists = await db.$queryRawUnsafe(
    "SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1",
    schema,
  );
  if (process.argv.includes("--setup") || process.argv.includes("--migrate")) {
    if (process.argv.includes("--setup") && exists.length)
      throw new Error("Test schema already exists; refusing to overwrite");
    if (!exists.length) await db.$executeRawUnsafe(`CREATE SCHEMA "${schema}"`);
    const prismaCli = require.resolve("prisma/build/index.js");
    const result = spawnSync(
      process.execPath,
      [prismaCli, "migrate", "deploy"],
      { cwd: __dirname, env: process.env, encoding: "utf8", timeout: 180000 },
    );
    if (result.status !== 0)
      throw new Error(
        (result.stderr || result.stdout).replaceAll(
          env.DATABASE_URL,
          "[REDACTED]",
        ),
      );
    console.log("Isolated schema created; all migrations applied.");
    return;
  }
  if (!exists.length) throw new Error("Run --setup first");
  if (process.argv.includes("--serve")) {
    require("./dist/main");
    await new Promise(() => {});
    return;
  }
  require("./test-commerce-scenarios.cjs")(db)
    .then(() =>
      console.log("All isolated PostgreSQL commerce scenarios passed."),
    )
    .catch((e) => {
      console.error(e.message);
      process.exitCode = 1;
    })
    .finally(() => db.$disconnect());
}
main()
  .catch((e) => {
    console.error(e.message.replaceAll(env.DATABASE_URL, "[REDACTED]"));
    process.exitCode = 1;
  })
  .finally(() => {
    if (process.argv.includes("--setup") || process.argv.includes("--migrate"))
      db.$disconnect();
  });
