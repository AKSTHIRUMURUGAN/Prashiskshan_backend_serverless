import mongoose from "mongoose";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import Company from "../src/models/Company.js";
import Student from "../src/models/Student.js";
import Mentor from "../src/models/Mentor.js";
import Admin from "../src/models/Admin.js";
import Internship from "../src/models/Internship.js";
import Application from "../src/models/Application.js";
import AnalyticsSnapshot from "../src/models/AnalyticsSnapshot.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/internship-platform";

// Sample data generators
const departments = ["Computer Science", "Mechanical Engineering", "Electrical Engineering", "Civil Engineering", "Data Science"];
const skills = {
  "Computer Science": ["JavaScript", "Python", "React", "Node.js", "MongoDB", "AWS", "Docker", "Git"],
  "Mechanical Engineering": ["CAD", "SolidWorks", "AutoCAD", "ANSYS", "Manufacturing", "Thermodynamics"],
  "Electrical Engineering": ["Circuit Design", "PCB Design", "Embedded Systems", "MATLAB", "Power Systems"],
  "Civil Engineering": ["AutoCAD", "Structural Analysis", "Project Management", "BIM", "Construction"],
  "Data Science": ["Python", "Machine Learning", "TensorFlow", "SQL", "Data Visualization", "Statistics"]
};

const companyNames = [
  "TechCorp Solutions", "InnovateLabs", "DataDrive Inc", "CloudScale Systems", "BuildRight Engineering",
  "SmartMech Industries", "PowerGrid Solutions", "DesignHub Studios", "CodeCraft Technologies", "FutureBuild Co"
];

const internshipTitles = {
  "Computer Science": ["Full Stack Developer Intern", "Backend Developer Intern", "Frontend Developer Intern", "DevOps Intern"],
  "Mechanical Engineering": ["CAD Design Intern", "Manufacturing Intern", "Product Design Intern"],
  "Electrical Engineering": ["Circuit Design Intern", "Embedded Systems Intern", "Power Systems Intern"],
  "Civil Engineering": ["Structural Design Intern", "Construction Management Intern", "BIM Specialist Intern"],
  "Data Science": ["Data Analyst Intern", "ML Engineer Intern", "Data Science Intern"]
};

function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomElements(array, count) {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function futureDate(daysFromNow) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date;
}

function pastDate(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date;
}

async function seedDatabase() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    // Clear existing data
    console.log("\n=== Clearing existing data ===");
    await Promise.all([
      Company.deleteMany({}),
      Student.deleteMany({}),
      Mentor.deleteMany({}),
      Admin.deleteMany({}),
      Internship.deleteMany({}),
      Application.deleteMany({}),
      AnalyticsSnapshot.deleteMany({})
    ]);
    console.log("Existing data cleared");

    // Create Admins
    console.log("\n=== Creating Admins ===");
    const admins = [];
    for (let i = 1; i <= 3; i++) {
      const admin = await Admin.create({
        adminId: `ADMIN${String(i).padStart(3, '0')}`,
        firebaseUid: `admin-firebase-${uuidv4()}`,
        email: `admin${i}@platform.com`,
        name: `Admin ${i}`,
        role: i === 1 ? "super_admin" : "admin",
        permissions: ["verify_companies", "approve_internships", "manage_users"],
        status: "active"
      });
      admins.push(admin);
      console.log(`Created admin: ${admin.email}`);
    }

    // Create Mentors
    console.log("\n=== Creating Mentors ===");
    const mentors = [];
    for (const dept of departments) {
      for (let i = 1; i <= 2; i++) {
        const mentor = await Mentor.create({
          mentorId: `MENTOR${String(mentors.length + 1).padStart(3, '0')}`,
          firebaseUid: `mentor-firebase-${uuidv4()}`,
          email: `mentor.${dept.toLowerCase().replace(/\s+/g, '')}${i}@university.edu`,
          profile: {
            name: `Dr. ${['Smith', 'Johnson', 'Williams', 'Brown', 'Jones'][mentors.length % 5]} ${i}`,
            department: dept,
            designation: i === 1 ? "Professor" : "Associate Professor",
            phone: `+1-555-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
            bio: `Experienced faculty member in ${dept} with focus on student development`,
            expertiseAreas: randomElements(skills[dept], 3)
          },
          workload: {
            maxStudents: 30,
            current: 0
          },
          status: "active"
        });
        mentors.push(mentor);
        console.log(`Created mentor: ${mentor.email} (${dept})`);
      }
    }

    // Create Companies
    console.log("\n=== Creating Companies ===");
    const companies = [];
    const companyStatuses = ["verified", "verified", "verified", "pending_verification", "rejected"];
    
    for (let i = 0; i < companyNames.length; i++) {
      const status = companyStatuses[i % companyStatuses.length];
      const company = await Company.create({
        companyId: `COMP${String(i + 1).padStart(4, '0')}`,
        firebaseUid: `company-firebase-${uuidv4()}`,
        companyName: companyNames[i],
        about: `${companyNames[i]} is a leading company in technology and innovation.`,
        website: `https://www.${companyNames[i].toLowerCase().replace(/\s+/g, '')}.com`,
        email: `contact@${companyNames[i].toLowerCase().replace(/\s+/g, '')}.com`,
        phone: `+1-555-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
        address: `${Math.floor(Math.random() * 1000)} Tech Street, Silicon Valley, CA`,
        documents: {
          cinNumber: `CIN${String(i + 1).padStart(8, '0')}`,
          gstCertificate: `https://storage.example.com/gst-${i + 1}.pdf`,
          registrationCertificate: `https://storage.example.com/reg-${i + 1}.pdf`,
          addressProof: `https://storage.example.com/address-${i + 1}.pdf`
        },
        pointOfContact: {
          name: `${['John', 'Jane', 'Mike', 'Sarah', 'David'][i % 5]} ${['Doe', 'Smith', 'Johnson'][i % 3]}`,
          designation: "HR Manager",
          email: `hr@${companyNames[i].toLowerCase().replace(/\s+/g, '')}.com`,
          phone: `+1-555-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`
        },
        status,
        stats: {
          totalInternshipsPosted: Math.floor(Math.random() * 20),
          activeInternships: Math.floor(Math.random() * 5),
          studentsHired: Math.floor(Math.random() * 50),
          avgRating: 3.5 + Math.random() * 1.5
        }
      });
      
      if (status === "verified") {
        company.adminReview = {
          reviewedBy: randomElement(admins).adminId,
          reviewedAt: pastDate(Math.floor(Math.random() * 30)),
          decision: "approved",
          comments: "All documents verified successfully"
        };
        await company.save();
      }
      
      companies.push(company);
      console.log(`Created company: ${company.companyName} (${status})`);
    }

    const verifiedCompanies = companies.filter(c => c.status === "verified");

    // Create Students
    console.log("\n=== Creating Students ===");
    const students = [];
    for (const dept of departments) {
      for (let i = 1; i <= 10; i++) {
        const year = Math.floor(Math.random() * 4) + 1;
        const student = await Student.create({
          studentId: `STU${String(students.length + 1).padStart(5, '0')}`,
          firebaseUid: `student-firebase-${uuidv4()}`,
          email: `student${students.length + 1}@university.edu`,
          profile: {
            name: `Student ${students.length + 1}`,
            department: dept,
            year,
            college: "University of Technology",
            rollNumber: `${dept.substring(0, 2).toUpperCase()}${year}${String(i).padStart(3, '0')}`,
            phone: `+1-555-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
            bio: `${year}${year === 1 ? 'st' : year === 2 ? 'nd' : year === 3 ? 'rd' : 'th'} year ${dept} student`,
            skills: randomElements(skills[dept], Math.floor(Math.random() * 4) + 2),
            interests: randomElements(skills[dept], 2)
          },
          readinessScore: Math.floor(Math.random() * 40) + 60,
          completedModules: randomElements(["MOD001", "MOD002", "MOD003", "MOD004", "MOD005"], Math.floor(Math.random() * 3) + 1),
          credits: {
            earned: Math.floor(Math.random() * 10),
            approved: Math.floor(Math.random() * 8),
            pending: Math.floor(Math.random() * 3)
          },
          previousInternships: Math.floor(Math.random() * 3),
          interviewAttempts: Math.floor(Math.random() * 5),
          status: "active"
        });
        students.push(student);
        console.log(`Created student: ${student.email} (${dept}, Year ${year})`);
      }
    }

    // Create Internships in various states
    console.log("\n=== Creating Internships ===");
    const internships = [];
    const internshipStatuses = [
      "pending_admin_verification",
      "admin_approved",
      "open_for_applications",
      "open_for_applications",
      "open_for_applications",
      "closed",
      "admin_rejected",
      "mentor_rejected"
    ];

    for (let i = 0; i < 30; i++) {
      const company = randomElement(verifiedCompanies);
      const dept = randomElement(departments);
      const status = internshipStatuses[i % internshipStatuses.length];
      const slots = Math.floor(Math.random() * 5) + 2;
      const startDate = futureDate(Math.floor(Math.random() * 60) + 30);
      const applicationDeadline = futureDate(Math.floor(Math.random() * 30) + 7);
      
      const internship = await Internship.create({
        internshipId: `INT${String(i + 1).padStart(5, '0')}`,
        companyId: company._id,
        title: randomElement(internshipTitles[dept]),
        description: `Exciting opportunity to work on cutting-edge projects in ${dept}. Gain hands-on experience with industry-leading technologies.`,
        department: dept,
        requiredSkills: randomElements(skills[dept], Math.floor(Math.random() * 3) + 3),
        optionalSkills: randomElements(skills[dept], 2),
        duration: randomElement(["3 months", "6 months", "4 months"]),
        stipend: Math.floor(Math.random() * 20000) + 10000,
        location: randomElement(["Remote", "San Francisco, CA", "New York, NY", "Austin, TX", "Seattle, WA"]),
        workMode: randomElement(["remote", "onsite", "hybrid"]),
        startDate,
        applicationDeadline,
        slots,
        slotsRemaining: status === "open_for_applications" ? Math.floor(Math.random() * slots) + 1 : slots,
        appliedCount: status === "open_for_applications" ? Math.floor(Math.random() * 20) : 0,
        responsibilities: [
          "Work on real-world projects",
          "Collaborate with experienced team members",
          "Participate in code reviews and team meetings"
        ],
        learningOpportunities: [
          "Hands-on experience with industry tools",
          "Mentorship from senior engineers",
          "Exposure to agile development practices"
        ],
        eligibilityRequirements: {
          minYear: Math.floor(Math.random() * 2) + 2,
          minReadinessScore: Math.floor(Math.random() * 20) + 60,
          requiredModules: randomElements(["MOD001", "MOD002", "MOD003"], 1)
        },
        status,
        postedBy: company.companyId,
        postedAt: pastDate(Math.floor(Math.random() * 30))
      });

      // Add audit trail
      internship.auditTrail = [{
        timestamp: internship.postedAt,
        actor: company.companyId,
        actorRole: "company",
        action: "created",
        fromStatus: null,
        toStatus: "pending_admin_verification",
        reason: "Initial internship creation"
      }];

      // Add admin review for approved/rejected internships
      if (status !== "pending_admin_verification") {
        const admin = randomElement(admins);
        internship.adminReview = {
          reviewedBy: admin.adminId,
          reviewedAt: pastDate(Math.floor(Math.random() * 20) + 5),
          decision: status === "admin_rejected" ? "rejected" : "approved",
          comments: status === "admin_rejected" ? "Insufficient details provided" : "Internship details verified",
          reasons: status === "admin_rejected" ? ["Incomplete description", "Unclear requirements"] : []
        };

        internship.auditTrail.push({
          timestamp: internship.adminReview.reviewedAt,
          actor: admin.adminId,
          actorRole: "admin",
          action: status === "admin_rejected" ? "rejected" : "approved",
          fromStatus: "pending_admin_verification",
          toStatus: status === "admin_rejected" ? "admin_rejected" : "admin_approved",
          reason: internship.adminReview.comments
        });
      }

      // Add mentor approval for open/mentor_rejected internships
      if (status === "open_for_applications" || status === "mentor_rejected" || status === "closed") {
        const deptMentors = mentors.filter(m => m.profile.department === dept);
        const mentor = randomElement(deptMentors);
        
        internship.mentorApproval = {
          status: status === "mentor_rejected" ? "rejected" : "approved",
          mentorId: mentor.mentorId,
          approvedAt: pastDate(Math.floor(Math.random() * 15) + 3),
          comments: status === "mentor_rejected" ? "Not suitable for our department curriculum" : "Approved for department students",
          department: dept
        };

        internship.auditTrail.push({
          timestamp: internship.mentorApproval.approvedAt,
          actor: mentor.mentorId,
          actorRole: "mentor",
          action: status === "mentor_rejected" ? "rejected" : "approved",
          fromStatus: "admin_approved",
          toStatus: status === "mentor_rejected" ? "mentor_rejected" : "open_for_applications",
          reason: internship.mentorApproval.comments
        });
      }

      // Add AI tags
      internship.aiTags = {
        primarySkills: randomElements(skills[dept], 5),
        difficulty: randomElement(["beginner", "intermediate", "advanced"]),
        careerPath: dept === "Computer Science" ? "Software Engineering" : dept,
        industryFit: [dept, randomElement(["Technology", "Innovation", "Research"])],
        learningIntensity: randomElement(["low", "moderate", "high"]),
        technicalDepth: randomElement(["shallow", "moderate", "deep"]),
        generatedAt: internship.postedAt
      };

      await internship.save();
      internships.push(internship);
      console.log(`Created internship: ${internship.title} (${status})`);
    }

    // Create Applications
    console.log("\n=== Creating Applications ===");
    const openInternships = internships.filter(i => i.status === "open_for_applications");
    const applications = [];

    for (const internship of openInternships) {
      const numApplications = Math.floor(Math.random() * 8) + 2;
      const deptStudents = students.filter(s => s.profile.department === internship.department);
      const applicants = randomElements(deptStudents, Math.min(numApplications, deptStudents.length));

      for (const student of applicants) {
        const appStatus = randomElement(["pending", "shortlisted", "rejected", "accepted"]);
        
        const application = await Application.create({
          applicationId: `APP${String(applications.length + 1).padStart(6, '0')}`,
          studentId: student._id,
          internshipId: internship._id,
          companyId: internship.companyId,
          department: internship.department,
          status: appStatus,
          appliedAt: pastDate(Math.floor(Math.random() * 10)),
          coverLetter: `I am very interested in this ${internship.title} position. My skills in ${student.profile.skills.join(', ')} make me a great fit.`,
          resumeUrl: `https://storage.example.com/resumes/${student.studentId}.pdf`,
          companyFeedback: {
            status: appStatus === "pending" ? "pending" : appStatus === "shortlisted" ? "shortlisted" : appStatus === "rejected" ? "rejected" : "pending",
            reviewedAt: appStatus !== "pending" ? pastDate(Math.floor(Math.random() * 5)) : undefined,
            feedback: appStatus === "shortlisted" ? "Strong candidate, proceed to interview" : appStatus === "rejected" ? "Skills don't match requirements" : undefined
          },
          aiRanking: {
            matchScore: Math.floor(Math.random() * 30) + 70,
            reasoning: "Good skill match with internship requirements",
            strengths: randomElements(student.profile.skills, 2),
            concerns: [],
            recommendation: "Recommended for interview"
          },
          timeline: [
            {
              event: "Application submitted",
              timestamp: pastDate(Math.floor(Math.random() * 10)),
              performedBy: student.studentId,
              notes: "Initial application"
            }
          ]
        });

        if (appStatus !== "pending") {
          application.timeline.push({
            event: `Application ${appStatus}`,
            timestamp: application.companyFeedback.reviewedAt,
            performedBy: internship.companyId.toString(),
            notes: application.companyFeedback.feedback
          });
        }

        await application.save();
        applications.push(application);
      }
    }
    console.log(`Created ${applications.length} applications`);

    // Create Analytics Snapshots
    console.log("\n=== Creating Analytics Snapshots ===");
    const snapshots = [];
    const periods = ["daily", "weekly", "monthly"];
    
    // Company snapshots
    for (const company of verifiedCompanies.slice(0, 5)) {
      for (let i = 0; i < 3; i++) {
        const snapshot = await AnalyticsSnapshot.create({
          snapshotId: `SNAP${String(snapshots.length + 1).padStart(6, '0')}`,
          entityType: "company",
          entityId: company.companyId,
          period: periods[i],
          date: pastDate(i * 7),
          metrics: {
            internshipsPosted: Math.floor(Math.random() * 10) + 1,
            applicationsReceived: Math.floor(Math.random() * 50) + 10,
            acceptanceRate: Math.random() * 0.3 + 0.1,
            completionRate: Math.random() * 0.4 + 0.5,
            averageRating: Math.random() * 1.5 + 3.5
          }
        });
        snapshots.push(snapshot);
      }
    }

    // Mentor snapshots
    for (const mentor of mentors.slice(0, 5)) {
      for (let i = 0; i < 3; i++) {
        const snapshot = await AnalyticsSnapshot.create({
          snapshotId: `SNAP${String(snapshots.length + 1).padStart(6, '0')}`,
          entityType: "mentor",
          entityId: mentor.mentorId,
          period: periods[i],
          date: pastDate(i * 7),
          metrics: {
            approvalsProcessed: Math.floor(Math.random() * 20) + 5,
            approvalRate: Math.random() * 0.3 + 0.6,
            averageResponseTime: Math.floor(Math.random() * 48) + 12,
            studentsSupervised: Math.floor(Math.random() * 20) + 5
          }
        });
        snapshots.push(snapshot);
      }
    }

    // Department snapshots
    for (const dept of departments) {
      for (let i = 0; i < 3; i++) {
        const snapshot = await AnalyticsSnapshot.create({
          snapshotId: `SNAP${String(snapshots.length + 1).padStart(6, '0')}`,
          entityType: "department",
          entityId: dept,
          period: periods[i],
          date: pastDate(i * 7),
          metrics: {
            applicationRate: Math.random() * 0.4 + 0.4,
            placementRate: Math.random() * 0.3 + 0.5,
            averageCredits: Math.random() * 5 + 5
          }
        });
        snapshots.push(snapshot);
      }
    }

    // Admin snapshots
    for (let i = 0; i < 3; i++) {
      const snapshot = await AnalyticsSnapshot.create({
        snapshotId: `SNAP${String(snapshots.length + 1).padStart(6, '0')}`,
        entityType: "admin",
        entityId: "system",
        period: periods[i],
        date: pastDate(i * 7),
        metrics: {
          verificationsProcessed: Math.floor(Math.random() * 30) + 10,
          verificationRate: Math.random() * 0.2 + 0.7,
          activeInternships: Math.floor(Math.random() * 50) + 20
        }
      });
      snapshots.push(snapshot);
    }

    console.log(`Created ${snapshots.length} analytics snapshots`);

    // Summary
    console.log("\n=== Seeding Summary ===");
    console.log(`Admins: ${admins.length}`);
    console.log(`Mentors: ${mentors.length}`);
    console.log(`Companies: ${companies.length} (${verifiedCompanies.length} verified)`);
    console.log(`Students: ${students.length}`);
    console.log(`Internships: ${internships.length}`);
    console.log(`  - Pending Admin Verification: ${internships.filter(i => i.status === "pending_admin_verification").length}`);
    console.log(`  - Admin Approved: ${internships.filter(i => i.status === "admin_approved").length}`);
    console.log(`  - Open for Applications: ${internships.filter(i => i.status === "open_for_applications").length}`);
    console.log(`  - Closed: ${internships.filter(i => i.status === "closed").length}`);
    console.log(`  - Rejected: ${internships.filter(i => i.status === "admin_rejected" || i.status === "mentor_rejected").length}`);
    console.log(`Applications: ${applications.length}`);
    console.log(`Analytics Snapshots: ${snapshots.length}`);

    console.log("\n✅ Database seeded successfully!");

  } catch (error) {
    console.error("❌ Seeding failed:", error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log("Database connection closed");
  }
}

// Run seeding
seedDatabase()
  .then(() => {
    console.log("Seeding script finished");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seeding script failed:", error);
    process.exit(1);
  });

