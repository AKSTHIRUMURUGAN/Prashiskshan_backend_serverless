import { connectDB } from "../../src/config/database.js";
import { logger } from "../../src/utils/logger.js";
import { analyticsSnapshotQueue } from "../../src/queues/index.js";

export default async function handler(req, res) {
  // Verify cron secret for security
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    await connectDB();
    
    // Add analytics snapshot job
    await analyticsSnapshotQueue.add("create-snapshot", {
      timestamp: new Date().toISOString()
    });

    logger.info("Analytics snapshot cron job triggered");
    
    return res.status(200).json({ 
      success: true, 
      message: "Analytics snapshot job queued" 
    });
  } catch (error) {
    logger.error("Analytics snapshot cron error", { error: error.message });
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}
