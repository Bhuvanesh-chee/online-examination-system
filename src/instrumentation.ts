export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") return;
  if (process.env.NODE_ENV !== "production") return;

  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be set to at least 32 characters in production");
  }

  if (!process.env.APP_ORIGIN && !process.env.APP_ORIGINS) {
    console.warn(
      "APP_ORIGIN/APP_ORIGINS is not set; cross-origin protection will only allow localhost requests."
    );
  }
}
