import "../config/env";
import { connectDB } from "../config/db";
import { User } from "../models/User";
import { hashPassword } from "../utils/password";

async function run() {
  await connectDB();

  const phone = "0501111111"; // change
  const password = "Admin@12345"; // change
  const fullName = "Super Admin";

  const existing = await User.findOne({ phone });
  if (existing) {
    console.log("Admin already exists:", existing.phone);
    process.exit(0);
  }

  const passwordHash = await hashPassword(password);

  const admin = await User.create({
    fullName,
    phone,
    passwordHash,
    role: "ADMIN",
    status: "ACTIVE",
  });

  console.log("✅ Admin created:", { phone: admin.phone, password, id: admin.id });
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
