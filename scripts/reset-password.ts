import { Client } from "pg";
import bcrypt from "bcryptjs";

async function resetPassword() {
  const client = new Client({
    connectionString: "postgresql://neondb_owner:REDACTED_NEON_PASSWORD@REDACTED_NEON_HOST/neondb?sslmode=verify-full",
  });
  await client.connect();

  const email = "puttapoguabhishek1007@gmail.com";
  const newPassword = "REDACTED_ACCOUNT_PASSWORD";
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
