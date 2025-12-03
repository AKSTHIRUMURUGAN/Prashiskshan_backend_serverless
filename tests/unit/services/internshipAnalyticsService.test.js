import internshipAnalyticsService from "../../../src/services/internshipAnalyticsService.js";
import Internship from "../../../src/models/Internship.js";
import Application from "../../../src/models/Application.js";
import Company from "../../../src/models/Company.js";
import Mentor from "../../../src/models/Mentor.js";
import Student from "../../../src/models/Student.js";
import InternshipCompletion from "../../../src/models/InternshipCompletion.js";
import AnalyticsSnapshot from "../../../src/models/AnalyticsSnapshot.js";

// Mock all models
jest.mock("../../../src/models/Internship.js");
jest.mock("../../../src/models/Application.js");
jest.mock("../../../src/models/Company.j