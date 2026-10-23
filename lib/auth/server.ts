import { createNeonAuth } from "@neondatabase/auth/next/server";
import { env } from "@/lib/env";

export const auth = createNeonAuth({
  baseUrl: env.neonAuthUrl || "https://auth.neon.tech",
  cookies: {
    secret: env.neonAuthCookieSecret,
  },
});

