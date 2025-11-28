import { firebaseAdmin } from "../config/firebase.js";
import Student from "../models/Student.js";
import Company from "../models/Company.js";
import Mentor from "../models/Mentor.js";
import Admin from "../models/Admin.js";
import { apiSuccess } from "../utils/apiResponse.js";
import { logger } from "../utils/logger.js";
import { createHttpError } from "./helpers/context.js";

export const clearFirebaseUsers = async (req, res, next) => {
  try {
    // Safety check: Only allow in non-production environments
    if (process.env.NODE_ENV === "production") {
      throw createHttpError(403, "This endpoint is disabled in production");
    }

    let nextPageToken;
    let deletedCount = 0;

    // List all users, 1000 at a time
    do {
      const listUsersResult = await firebaseAdmin.auth().listUsers(1000, nextPageToken);
      const uids = listUsersResult.users.map((user) => user.uid);

      if (uids.length > 0) {
        await firebaseAdmin.auth().deleteUsers(uids);
        deletedCount += uids.length;
        logger.info(`Deleted ${uids.length} Firebase users`);
      }

      nextPageToken = listUsersResult.pageToken;
    } while (nextPageToken);

    res.json(apiSuccess({ deletedCount }, "All Firebase users deleted successfully"));
  } catch (error) {
    next(error);
  }
};

export const clearMongoData = async (req, res, next) => {
  try {
    // Safety check: Only allow in non-production environments
    if (process.env.NODE_ENV === "production") {
      throw createHttpError(403, "This endpoint is disabled in production");
    }

    const [students, companies, mentors, admins] = await Promise.all([
      Student.deleteMany({}),
      Company.deleteMany({}),
      Mentor.deleteMany({}),
      Admin.deleteMany({}),
    ]);

    const deletedCounts = {
      students: students.deletedCount,
      companies: companies.deletedCount,
      mentors: mentors.deletedCount,
      admins: admins.deletedCount,
    };

    logger.info("Cleared MongoDB collections", deletedCounts);

    res.json(apiSuccess(deletedCounts, "All MongoDB data cleared successfully"));
  } catch (error) {
    next(error);
  }
};
