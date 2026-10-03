export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.AUTO_POST !== "off") {
    const { startScheduler } = await import("./lib/scheduler");
    startScheduler();
  }
}
