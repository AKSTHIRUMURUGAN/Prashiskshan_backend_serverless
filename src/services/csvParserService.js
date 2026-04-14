import xlsx from "xlsx";
import { logger } from "../utils/logger.js";

/**
 * Parses CSV or Excel file buffer and extracts mentor records
 * @param {Buffer} fileBuffer - File buffer from multer
 * @param {string} mimetype - File MIME type
 * @returns {Array<object>} Array of mentor records
 */
export function parseMentorFile(fileBuffer, mimetype) {
  try {
    // Read the workbook from buffer
    const workbook = xlsx.read(fileBuffer, { type: "buffer" });
    
    // Get the first sheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const rawData = xlsx.utils.sheet_to_json(worksheet, { 
      raw: false, // Convert all values to strings first
      defval: "" // Default value for empty cells
    });
    
    // Transform to expected format
    const mentors = rawData.map((row, index) => {
      try {
        return {
          email: row.email || row.Email || "",
          name: row.name || row.Name || "",
          department: row.department || row.Department || "",
          designation: row.designation || row.Designation || "",
          phone: row.phone || row.Phone || "",
          bio: row.bio || row.Bio || "",
          specialization: row.specialization || row.Specialization || "",
          yearsOfExperience: row.yearsOfExperience || row.YearsOfExperience || row.years_of_experience || "",
        };
      } catch (error) {
        logger.warn(`Error parsing mentor row ${index + 1}`, { error: error.message, row });
        return null;
      }
    }).filter(Boolean); // Remove null entries
    
    logger.info("Successfully parsed mentor file", { 
      totalRows: rawData.length, 
      validMentors: mentors.length 
    });
    
    return mentors;
  } catch (error) {
    logger.error("Error parsing mentor file", { error: error.message });
    throw new Error(`Failed to parse file: ${error.message}`);
  }
}

/**
 * Parses CSV or Excel file buffer and extracts student records
 * @param {Buffer} fileBuffer - File buffer from multer
 * @param {string} mimetype - File MIME type
 * @returns {Array<object>} Array of student records
 */
export function parseStudentFile(fileBuffer, mimetype) {
  try {
    // Read the workbook from buffer
    const workbook = xlsx.read(fileBuffer, { type: "buffer" });
    
    // Get the first sheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const rawData = xlsx.utils.sheet_to_json(worksheet, { 
      raw: false, // Convert all values to strings first
      defval: "" // Default value for empty cells
    });
    
    // Transform to expected format
    const students = rawData.map((row, index) => {
      try {
        return {
          email: row.email || row.Email || "",
          name: row.name || row.Name || "",
          department: row.department || row.Department || "",
          year: parseInt(row.year || row.Year || "0", 10),
          college: row.college || row.College || "",
          rollNumber: row.rollNumber || row.RollNumber || row.roll_number || "",
          phone: row.phone || row.Phone || "",
          bio: row.bio || row.Bio || "",
          skills: row.skills || row.Skills || "",
          interests: row.interests || row.Interests || "",
        };
      } catch (error) {
        logger.warn(`Error parsing row ${index + 1}`, { error: error.message, row });
        return null;
      }
    }).filter(Boolean); // Remove null entries
    
    logger.info("Successfully parsed student file", { 
      totalRows: rawData.length, 
      validStudents: students.length 
    });
    
    return students;
  } catch (error) {
    logger.error("Failed to parse student file", { 
      error: error.message, 
      mimetype 
    });
    throw new Error(`Failed to parse file: ${error.message}`);
  }
}

/**
 * Validates file type
 * @param {string} mimetype - File MIME type
 * @returns {boolean} True if valid file type
 */
export function isValidFileType(mimetype) {
  const validTypes = [
    "text/csv",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ];
  return validTypes.includes(mimetype);
}

/**
 * Generates a sample CSV template for students
 * @returns {string} CSV template content
 */
export function generateCSVTemplate() {
  const headers = [
    "email",
    "name",
    "department",
    "year",
    "college",
    "rollNumber",
    "phone",
    "bio",
    "skills",
    "interests"
  ];
  
  const sampleData = [
    [
      "student@example.com",
      "John Doe",
      "Computer Science",
      "3",
      "Example College",
      "CS2021001",
      "1234567890",
      "Passionate about software development",
      "JavaScript,Python,React",
      "Web Development,AI"
    ],
    [
      "student2@example.com",
      "Jane Smith",
      "Electrical Engineering",
      "2",
      "Example College",
      "EE2022001",
      "0987654321",
      "Enthusiastic learner",
      "C++,MATLAB",
      "Robotics,IoT"
    ]
  ];
  
  const csvContent = [
    headers.join(","),
    ...sampleData.map(row => row.join(","))
  ].join("\n");
  
  return csvContent;
}

/**
 * Generates a sample CSV template for mentors
 * @returns {string} CSV template content
 */
export function generateMentorCSVTemplate() {
  const headers = [
    "email",
    "name",
    "department",
    "designation",
    "phone",
    "bio",
    "specialization",
    "yearsOfExperience"
  ];
  
  const sampleData = [
    [
      "john.doe@university.edu",
      "Dr. John Doe",
      "Computer Science",
      "Associate Professor",
      "+91-9876543210",
      "Experienced professor specializing in AI and Machine Learning with 15 years of teaching experience",
      "AI,Machine Learning,Data Science",
      "15"
    ],
    [
      "jane.smith@university.edu",
      "Prof. Jane Smith",
      "Electrical Engineering",
      "Professor",
      "+91-9876543211",
      "Senior faculty member with expertise in IoT and Embedded Systems",
      "IoT,Embedded Systems,Robotics",
      "20"
    ],
    [
      "robert.wilson@university.edu",
      "Dr. Robert Wilson",
      "Mechanical Engineering",
      "Assistant Professor",
      "+91-9876543212",
      "Research-focused faculty member in thermal engineering and renewable energy",
      "Thermal Engineering,Renewable Energy,CAD",
      "10"
    ]
  ];
  
  const csvContent = [
    headers.join(","),
    ...sampleData.map(row => row.join(","))
  ].join("\n");
  
  return csvContent;
}
