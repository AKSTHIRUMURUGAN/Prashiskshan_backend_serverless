import { connectDB } from "../../src/config/database.js";
import { logger } from "../../src/utils/logger.js";
import { creditReminderQueue } from "../../src/queues/index.js";

export default async function handler(req, res) {
  // Verify cron secret for security
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    await connectDB();
    
    // Add credit reminder job
    await creditReminderQueue.add("send-overdue-reminders", {
      timestamp: new Date().toISOString()
    });

    logger.info("Credit reminders cron job triggered");
    
    return res.status(200).json({ 
      success: true, 
      message: "Credit reminders job queued" 
    });
  } catch (error) {
    logger.error("Credit reminders cron error", { error: error.message });
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}
