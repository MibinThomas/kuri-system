import app from "./app";
import { env } from "./config/env";
import { connectDB } from "./config/db";

async function bootstrap() {
  await connectDB();
  app.listen(env.PORT, () => console.log(`🚀 Server running on :${env.PORT}`));
}

bootstrap().catch((e) => {
  console.error("❌ Failed to start server:", e);
  process.exit(1);
});


