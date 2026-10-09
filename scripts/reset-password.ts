import { Client } from "pg";
import bcrypt from "bcryptjs";

/**
 * Resets a user's password from the CLI.
 *
 * Reads the database URL and the new password from the environment so no
 * credentials ever land in the repo. Run it like:
 *
 *   DATABASE_URL="postgresql://..." RESET_EMAIL="you@example.com" \
 *   NEW_PASSWORD="..." npx tsx scripts/reset-password.ts
 *
 * See .env.example for the variables this project expects.
 */
async function resetPassword() {
  const connectionString = process.env.DATABASE_URL;
  const email = process.env.RESET_EMAIL;
  const newPassword = process.env.NEW_PASSWORD;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  if (!email) {
    throw new Error("RESET_EMAIL is not set");
  }
  if (!newPassword) {
    throw new Error("NEW_PASSWORD is not set");
  }

  const client = new Client({ connectionString });
  await client.connect();

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  const res = await client.query(
    'UPDATE "User" SET password = $1 WHERE email = $2 RETURNING id, email',
    [hashedPassword, email]
  );

  if (res.rows.length === 0) {
    console.log("User not found");
  } else {
    console.log("Password reset for:", res.rows[0].email);
  }

  await client.end();
}

resetPassword().catch((e) => {
  console.error(e);
  process.exit(1);
});
