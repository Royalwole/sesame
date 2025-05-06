import { checkDBHealth } from "../../lib/db";

export default async function handler(req, res) {
  const startTime = Date.now();
  const checks = {
    database: await checkDBHealth(),
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };

  const status = checks.database.ok ? 200 : 503;
  const responseTime = Date.now() - startTime;

  res.status(status).json({
    status: status === 200 ? "healthy" : "unhealthy",
    checks,
    responseTime,
  });
}
