import multer from "multer";
import { createHttpError } from "../controllers/helpers/context.js";

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter to accept only CSV and Excel files
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "text/csv",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(createHttpError(400, "Invalid file type. Only CSV and Excel files are allowed."), false);
  }
};

// Configure multer for student uploads
export const uploadStudentFile = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
}).single("file"); // Expect a single file with field name "file"

// Configure multer for mentor uploads
export const uploadMentorFile = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
}).single("file"); // Expect a single file with field name "file"
