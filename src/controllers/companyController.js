import mongoose from "mongoose";
import Company from "../models/Company.js";
import Internship from "../models/Internship.js";
import Application from "../models/Application.js";
import Logbook from "../models/Logbook.js";
import Student from "../models/Student.js";
import InternshipCompletion from "../models/InternshipCompletion.js";
import { apiSuccess } from "../utils/apiResponse.js";
import { createHttpError, resolveUserFromRequest } from "./helpers/context.js";

const ensureCompanyContext = async (req, { requireVerified = true } = {}) => {
  const context = await resolveUserFromRequest(req);
  if (context.role !== "company") throw createHttpError(403, "Company access required");
  if (requireVerified && context.doc.status !== "verified") {
    throw createHttpError(403, "Company must be verified to perform this action");
  }
  return context.doc;
};

const ensureInternshipOwnership = async (companyId, internshipId) => {
  // internshipId is a custom string (e.g., INTERN-123), not an ObjectId
  const internship = await Internship.findOne({ internshipId: internshipId, companyId: companyId });
  if (!internship) throw createHttpError(404, "Internship not found");
  return internship;
};

export const getCompanyDashboard = async (req, res, next) => {
  try {
    const company = await ensureCompanyContext(req);
    const [
      activeInternships,
      totalInternships,
      totalApplications,
      pendingApplications,
      studentsHired,
      pendingLogbooks
    ] = await Promise.all([
      Internship.countDocuments({ companyId: company._id, status: "approved" }),
      Internship.countDocuments({ companyId: company._id }),
      Application.countDocuments({ companyId: company._id }),
      Application.countDocuments({ companyId: company._id, status: "pending" }),
      InternshipCompletion.countDocuments({ companyId: company._id }),
      Logbook.countDocuments({ companyId: company._id, status: { $in: ["pending_company_review", "submitted"] } }),
    ]);
    res.json(
      apiSuccess(
        {
          company,
          metrics: {
            activeInternships,
            totalInternships,
            totalApplications,
            pendingApplications,
            studentsHired,
            pendingLogbooks,
          },
        },
        "Company dashboard",
      ),
    );
  } catch (error) {
    next(error);
  }
};

export const getCompanyProfile = async (req, res, next) => {
  try {
    const company = await ensureCompanyContext(req, { requireVerified: false });
    res.json(apiSuccess(company, "Company profile"));
  } catch (error) {
    next(error);
  }
};

export const updateCompanyProfile = async (req, res, next) => {
  try {
    const company = await ensureCompanyContext(req, { requireVerified: false });
    const allowedFields = ["phone", "address", "pointOfContact", "website", "documents"];
    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const updated = await Company.findByIdAndUpdate(company._id, { $set: updates }, { new: true });
    res.json(apiSuccess(updated, "Company profile updated"));
  } catch (error) {
    next(error);
  }
};

export const createInternship = async (req, res, next) => {
  try {
    const company = await ensureCompanyContext(req);
    const payload = req.body;
    if (!payload.title || !payload.description || !payload.department || !payload.requiredSkills) {
      throw createHttpError(400, "Missing required fields");
    }

    const internship = await Internship.create({
      ...payload,
      internshipId: `INTERN-${Date.now()}`,
      companyId: company._id,
      status: "pending_approval",
      postedBy: company.companyId,
      postedAt: new Date(),
    });

    res.status(201).json(apiSuccess(internship, "Internship created"));
  } catch (error) {
    next(error);
  }
};

export const updateInternship = async (req, res, next) => {
  try {
    const company = await ensureCompanyContext(req);
    const { internshipId } = req.params;
    const internship = await ensureInternshipOwnership(company._id, internshipId);

    Object.assign(internship, req.body);
    internship.status = "pending_approval";
    await internship.save();

    res.json(apiSuccess(internship, "Internship updated and pending approval"));
  } catch (error) {
    next(error);
  }
};

export const deleteInternship = async (req, res, next) => {
  try {
    const company = await ensureCompanyContext(req);
    const { internshipId } = req.params;
    const internship = await ensureInternshipOwnership(company._id, internshipId);
    internship.status = "cancelled";
    internship.closedAt = new Date();
    await internship.save();
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const getCompanyInternships = async (req, res, next) => {
  try {
    const company = await ensureCompanyContext(req);
    const query = { companyId: company._id };
    if (req.query.status) query.status = req.query.status;
    const internships = await Internship.find(query).sort({ createdAt: -1 }).lean();
    res.json(apiSuccess(internships, "Company internships"));
  } catch (error) {
    next(error);
  }
};

export const getInternshipById = async (req, res, next) => {
  try {
    const company = await ensureCompanyContext(req);
    const { internshipId } = req.params;
    const internship = await ensureInternshipOwnership(company._id, internshipId);
    res.json(apiSuccess(internship, "Internship details"));
  } catch (error) {
    next(error);
  }
};

export const getApplicants = async (req, res, next) => {
  try {
    const company = await ensureCompanyContext(req);
    const { internshipId } = req.params;
    const internship = await ensureInternshipOwnership(company._id, internshipId);
    const status = req.query.status;
    const query = { internshipId: internship._id };
    if (status) query.status = status;
    const applications = await Application.find(query).populate("studentId").sort({ appliedAt: -1 }).lean();
    res.json(apiSuccess(applications, "Internship applicants"));
  } catch (error) {
    next(error);
  }
};

export const reviewApplications = async (req, res, next) => {
  try {
    const company = await ensureCompanyContext(req);
    const { updates = [] } = req.body;
    if (!Array.isArray(updates) || updates.length === 0) throw createHttpError(400, "updates array required");

    const results = [];
    for (const update of updates) {
      const application = await Application.findOne({
        _id: update.applicationId,
        companyId: company._id,
      });
      if (!application) continue;
      application.companyFeedback = {
        status: update.status || "reviewing",
        reviewedAt: new Date(),
        feedback: update.feedback,
        rejectionReason: update.rejectionReason,
        nextSteps: update.nextSteps,
        scheduledInterviewDate: update.scheduledInterviewDate,
      };
      application.status = update.status || application.status;
      application.timeline.push({
        event: "company_review_updated",
        performedBy: company.companyId,
        notes: update.feedback,
        timestamp: new Date(),
      });
      await application.save();
      results.push(application);
    }

    res.json(apiSuccess(results, "Applications reviewed"));
  } catch (error) {
    next(error);
  }
};

export const shortlistCandidates = async (req, res, next) => {
  try {
    const company = await ensureCompanyContext(req);
    const { applicationIds = [] } = req.body;
    if (!Array.isArray(applicationIds) || applicationIds.length === 0) throw createHttpError(400, "applicationIds required");

    const applications = await Application.updateMany(
      { _id: { $in: applicationIds }, companyId: company._id },
      {
        $set: {
          status: "shortlisted",
          "companyFeedback.status": "shortlisted",
          "companyFeedback.reviewedAt": new Date(),
        },
      },
    );
    res.json(apiSuccess({ modified: applications.modifiedCount }, "Candidates shortlisted"));
  } catch (error) {
    next(error);
  }
};

export const rejectCandidates = async (req, res, next) => {
  try {
    const company = await ensureCompanyContext(req);
    const { applicationIds = [], reason } = req.body;
    const update = await Application.updateMany(
      { _id: { $in: applicationIds }, companyId: company._id },
      {
        $set: {
          status: "rejected",
          "companyFeedback.status": "rejected",
          "companyFeedback.rejectionReason": reason,
          "companyFeedback.reviewedAt": new Date(),
        },
      },
    );
    res.json(apiSuccess({ modified: update.modifiedCount }, "Candidates rejected"));
  } catch (error) {
    next(error);
  }
};

export const getInternsProgress = async (req, res, next) => {
  try {
    const company = await ensureCompanyContext(req);
    const internships = await Internship.find({ companyId: company._id, status: "approved" }).select("_id title").lean();
    const internshipIds = internships.map((i) => i._id);
    const logbooks = await Logbook.find({ internshipId: { $in: internshipIds }, status: "approved" })
      .populate("studentId")
      .sort({ weekNumber: 1 })
      .lean();
    res.json(apiSuccess({ internships, logbooks }, "Intern progress"));
  } catch (error) {
    next(error);
  }
};

export const provideLogbookFeedback = async (req, res, next) => {
  try {
    const company = await ensureCompanyContext(req);
    const { logbookId } = req.params;
    const feedback = req.body;
    const logbook = await Logbook.findOneAndUpdate(
      { _id: logbookId, companyId: company._id },
      {
        $set: {
          companyFeedback: {
            ...feedback,
            providedAt: new Date(),
          },
          status: "completed",
        },
      },
      { new: true },
    );
    if (!logbook) throw createHttpError(404, "Logbook not found");
    res.json(apiSuccess(logbook, "Feedback submitted"));
  } catch (error) {
    next(error);
  }
};

export const markInternshipComplete = async (req, res, next) => {
  try {
    const company = await ensureCompanyContext(req);
    const { internshipId } = req.params;
    const internship = await ensureInternshipOwnership(company._id, internshipId);
    internship.status = "closed";
    internship.closedAt = new Date();
    await internship.save();
    res.json(apiSuccess(internship, "Internship marked complete"));
  } catch (error) {
    next(error);
  }
};

export const createEvent = async (req, res, next) => {
  try {
    const company = await ensureCompanyContext(req);
    const { title, description, date, targetDepartments = [] } = req.body;
    if (!title) throw createHttpError(400, "title required");
    const event = {
      eventId: `EVT-${Date.now()}`,
      title,
      description,
      date,
      targetDepartments,
      createdAt: new Date(),
    };
    company.events.push(event);
    await company.save();
    res.status(201).json(apiSuccess(event, "Event created"));
  } catch (error) {
    next(error);
  }
};

export const createChallenge = async (req, res, next) => {
  try {
    const company = await ensureCompanyContext(req);
    const { title, description, rewards, deadline } = req.body;
    if (!title) throw createHttpError(400, "title required");
    const challenge = {
      challengeId: `CHL-${Date.now()}`,
      title,
      description,
      rewards,
      deadline,
      createdAt: new Date(),
    };
    company.challenges.push(challenge);
    await company.save();
    res.status(201).json(apiSuccess(challenge, "Challenge created"));
  } catch (error) {
    next(error);
  }
};

export const getCompanyApplications = async (req, res, next) => {
  try {
    const company = await ensureCompanyContext(req);
    const { internshipId, status } = req.query;
    const query = { companyId: company._id };

    if (internshipId) {
      if (mongoose.Types.ObjectId.isValid(internshipId)) {
        query.internshipId = internshipId;
      } else {
        const internship = await Internship.findOne({ internshipId: internshipId, companyId: company._id });
        if (internship) {
          query.internshipId = internship._id;
        } else {
          return res.json(apiSuccess([], "Company applications"));
        }
      }
    }

    if (status) query.status = status;

    const applications = await Application.find(query)
      .populate("studentId", "profile.name profile.department profile.college profile.resume profile.skills profile.year")
      .populate("internshipId", "title internshipId")
      .sort({ appliedAt: -1 })
      .lean();

    res.json(apiSuccess(applications, "Company applications"));
  } catch (error) {
    next(error);
  }
};

export const getCompanyInterns = async (req, res, next) => {
  try {
    const company = await ensureCompanyContext(req);
    const status = req.query.status || 'accepted';

    // 1. Get all applications with specified status
    const applications = await Application.find({
      companyId: company._id,
      status: status
    })
      .populate('studentId', 'profile.name profile.email')
      .populate('internshipId', 'title')
      .lean();

    // 2. For each intern, fetch logbook stats
    const internsWithStats = await Promise.all(applications.map(async (app) => {
      const logbooks = await Logbook.find({
        studentId: app.studentId._id,
        internshipId: app.internshipId._id
      }).lean();

      const totalLogbooks = logbooks.length;
      const submittedLogbooks = logbooks.filter(l => l.status === 'submitted' || l.status === 'approved').length;
      const pendingLogbooks = logbooks.filter(l => l.status === 'submitted').length; // Pending company review

      const approvedLogbooks = logbooks.filter(l => l.status === 'approved');
      const totalHours = approvedLogbooks.reduce((sum, l) => sum + (l.hours || 0), 0);

      // Calculate average rating from approved logbooks
      const ratedLogbooks = approvedLogbooks.filter(l => l.companyRating);
      const averageRating = ratedLogbooks.length > 0
        ? ratedLogbooks.reduce((sum, l) => sum + l.companyRating, 0) / ratedLogbooks.length
        : 0;

      return {
        _id: app.studentId._id, // Use student ID as key or application ID
        applicationId: app._id,
        studentName: app.studentId.profile.name,
        internshipTitle: app.internshipId.title,
        internshipId: app.internshipId._id,
        status: app.status, // 'accepted'
        startDate: app.updatedAt, // Approximate start date (when accepted)
        logbooksSubmitted: submittedLogbooks,
        pendingLogbooks: pendingLogbooks,
        totalHours: totalHours,
        averageRating: averageRating,
        creditsEarned: 0 // Placeholder, logic for credits might be complex or in another model
      };
    }));

    res.json(apiSuccess(internsWithStats, "Active interns fetched successfully"));
  } catch (error) {
    next(error);
  }
};

export const getCompanyInternLogbooks = async (req, res, next) => {
  try {
    const company = await ensureCompanyContext(req);
    const { studentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      throw createHttpError(400, "Invalid studentId");
    }

    const logbooks = await Logbook.find({
      studentId,
      companyId: company._id,
    })
      .populate("internshipId", "title internshipId")
      .sort({ weekNumber: 1 })
      .lean();

    res.json(apiSuccess(logbooks, "Intern logbooks"));
  } catch (error) {
    next(error);
  }
};

export const completeInternship = async (req, res, next) => {
  try {
    const company = await ensureCompanyContext(req);
    const { applicationId } = req.params;
    const { feedback, overallScore } = req.body;

    const application = await Application.findOne({
      _id: applicationId,
      companyId: company._id,
      status: 'accepted'
    });

    if (!application) {
      throw createHttpError(404, "Active internship application not found");
    }

    // Calculate totals from logbooks
    const logbooks = await Logbook.find({
      studentId: application.studentId,
      internshipId: application.internshipId,
      status: 'approved'
    });

    const totalHours = logbooks.reduce((sum, l) => sum + (l.hours || 0), 0);
    // Simple credit calculation: 1 credit per 10 hours (example logic)
    const creditsEarned = Math.floor(totalHours / 10);

    // Create completion record
    const completion = await InternshipCompletion.create({
      completionId: `COMP-${Date.now()}`,
      studentId: application.studentId,
      internshipId: application.internshipId,
      companyId: company._id,
      totalHours,
      creditsEarned,
      completionDate: new Date(),
      evaluation: {
        companyScore: overallScore,
        overallComments: feedback,
      },
      status: 'pending' // Pending admin/system verification if needed
    });

    // Update application status
    application.status = 'completed';
    await application.save();

    res.json(apiSuccess(completion, "Internship marked as completed"));
  } catch (error) {
    next(error);
  }
};
