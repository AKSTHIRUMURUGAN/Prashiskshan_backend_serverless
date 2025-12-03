import mongoose from "mongoose";
import Student from "../models/Student.js";
import Internship from "../models/Internship.js";
import Application from "../models/Application.js";
import Logbook from "../models/Logbook.js";
import InterviewSession from "../models/InterviewSession.js";
import Notification from "../models/Notification.js";
import { recommendationService } from "../services/recommendationService.js";
import { logbookSummaryService } from "../services/logbookSummaryService.js";
import { AIInterviewBot } from "../services/interviewBotService.js";
import { storageService } from "../services/storageService.js";
import { aiService } from "../services/aiService.js";
import { internshipService } from "../services/internshipService.js";
import { applicationService } from "../services/applicationService.js";
import { aiTaggingService } from "../services/aiTaggingService.js";
import { apiSuccess } from "../utils/apiResponse.js";
import { createHttpError, resolveUserFromRequest, sanitizeDoc } from "./helpers/context.js";
import { get as redisGet, set as redisSet } from "../config/redis.js";
import { logger } from "../utils/logger.js";

const ensureStudentContext = async (req) => {
  const context = await resolveUserFromRequest(req);
  if (context.role !== "student") {
    throw createHttpError(403, "Only students can access this resource");
  }
  return context.doc;
};

const buildPagination = (req) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

export const getStudentProfile = async (req, res, next) => {
  try {
    const student = await ensureStudentContext(req);

    // Get credit history
    const InternshipCompletion = (await import("../models/InternshipCompletion.js")).default;
    const CreditRequest = (await import("../models/CreditRequest.js")).default;

    const [completions, creditRequests, applications] = await Promise.all([
      InternshipCompletion.find({ studentId: student._id, status: "completed" })
        .populate("internshipId", "title department companyId")
        .populate("companyId", "companyName")
        .sort({ completionDate: -1 })
        .lean(),
      CreditRequest.find({ studentId: student._id })
        .sort({ createdAt: -1 })
        .lean(),
      Application.countDocuments({ studentId: student._id }),
    ]);

    // Calculate total credits earned
    const totalCreditsEarned = creditRequests
      .filter(cr => cr.status === "approved")
      .reduce((sum, cr) => sum + (cr.creditsRequested || 0), 0);

    // Get internship history
    const internshipHistory = completions.map(completion => ({
      internshipId: completion.internshipId?.internshipId,
      title: completion.internshipId?.title,
      company: completion.companyId?.companyName,
      department: completion.internshipId?.department,
      completionDate: completion.completionDate,
      hoursWorked: completion.hoursWorked,
      evaluationScore: completion.evaluationScore,
      creditsEarned: completion.creditsEarned,
    }));

    const profile = {
      student: sanitizeDoc(student, "student"),
      credits: {
        total: student.credits?.total || 0,
        approved: student.credits?.approved || 0,
        pending: student.credits?.pending || 0,
        earned: totalCreditsEarned,
      },
      readinessScore: student.readinessScore,
      skills: student.skills || [],
      completedModules: student.completedModules || [],
      internshipHistory,
      stats: {
        totalApplications: applications,
        completedInternships: completions.length,
        creditRequests: creditRequests.length,
        interviewAttempts: student.interviewAttempts || 0,
      },
    };

    res.json(apiSuccess(profile, "Student profile"));
  } catch (error) {
    next(error);
  }
};

export const getStudentDashboard = async (req, res, next) => {
  try {
    const student = await ensureStudentContext(req);
    const cacheKey = `student:dashboard:${student._id}`;
    const cached = await redisGet(cacheKey);
    if (cached) {
      return res.json(apiSuccess(JSON.parse(cached), "Student dashboard"));
    }

    // Get mentor info
    const Mentor = (await import("../models/Mentor.js")).default;
    let mentorInfo = null;
    if (student.assignedMentor) {
      const mentor = await Mentor.findById(student.assignedMentor)
        .select("mentorId profile department email")
        .lean();
      if (mentor) {
        mentorInfo = {
          mentorId: mentor.mentorId,
          name: `${mentor.profile?.firstName || ""} ${mentor.profile?.lastName || ""}`.trim(),
          department: mentor.department,
          email: mentor.email,
        };
      }
    }

    const [applications, logbooks, notifications, recommended, activeInternships] = await Promise.all([
      Application.aggregate([
        { $match: { studentId: student._id } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
      Logbook.find({ studentId: student._id }).sort({ weekNumber: 1 }).lean(),
      Notification.find({ userId: student._id }).sort({ createdAt: -1 }).limit(10).lean(),
      recommendationService.getRecommendedInternships(student._id.toString(), []),
      Application.find({ studentId: student._id, status: "accepted" })
        .populate("internshipId", "internshipId title department companyId startDate")
        .populate("companyId", "companyName")
        .limit(5)
        .lean(),
    ]);

    const pendingLogbooks = logbooks.filter((lb) => lb.status === "draft" || lb.status === "submitted").length;

    const stats = applications.reduce(
      (acc, entry) => {
        acc[entry._id] = entry.count;
        return acc;
      },
      {
        total: applications.reduce((sum, entry) => sum + entry.count, 0),
        pendingLogbooks
      },
    );

    const deadlines = logbooks
      .filter((lb) => lb.status === "draft" || lb.status === "submitted")
      .map((lb) => ({
        type: "logbook",
        weekNumber: lb.weekNumber,
        dueDate: lb.endDate,
        status: lb.status,
      }));

    const response = {
      student: sanitizeDoc(student, "student"),
      mentorInfo,
      stats,
      credits: student.credits,
      activeInternships,
      logbooks: logbooks.slice(-3),
      notifications,
      recommendations: recommended.slice(0, 5),
      deadlines,
    };

    await redisSet(cacheKey, JSON.stringify(response), 300);
    return res.json(apiSuccess(response, "Student dashboard"));
  } catch (error) {
    next(error);
  }
};

export const browseInternships = async (req, res, next) => {
  try {
    const student = await ensureStudentContext(req);

    // Build filters from query parameters
    const filters = {
      page: req.query.page,
      limit: req.query.limit,
      location: req.query.location,
      workMode: req.query.workMode,
      skills: req.query.skills,
      minStipend: req.query.minStipend,
      maxStipend: req.query.maxStipend,
      search: req.query.search,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder,
    };

    // Get internships using the internship service
    const result = await internshipService.getInternshipsForStudent(
      student.studentId,
      student.profile?.department || student.department,
      filters
    );

    // Get applications to check which internships student has already applied to
    const appliedIds = await Application.find({ studentId: student._id }).distinct("internshipId");
    const appliedSet = new Set(appliedIds.map((id) => id.toString()));

    // Enhance internships with additional student-specific data
    const enhancedInternships = await Promise.all(
      result.internships.map(async (internship) => {
        // Check eligibility
        const eligible =
          (!internship.eligibilityRequirements?.minReadinessScore ||
            student.readinessScore >= internship.eligibilityRequirements.minReadinessScore) &&
          (!internship.eligibilityRequirements?.requiredModules ||
            internship.eligibilityRequirements.requiredModules.every((module) =>
              student.completedModules?.includes(module)
            ));

        // Calculate AI match score if requested and AI tags exist
        let matchScore = null;
        if (req.query.includeMatchScore === "true" && internship.aiTags) {
          try {
            const matchResult = await aiTaggingService.calculateMatchScore(
              {
                studentId: student.studentId,
                skills: student.skills || [],
                department: student.department,
                year: student.year,
                readinessScore: student.readinessScore,
              },
              {
                internshipId: internship.internshipId,
                requiredSkills: internship.requiredSkills,
                department: internship.department,
                aiTags: internship.aiTags,
              },
              { userId: student.studentId }
            );
            matchScore = matchResult;
          } catch (error) {
            logger.error("Failed to calculate match score", {
              studentId: student.studentId,
              internshipId: internship.internshipId,
              error: error.message,
            });
          }
        }

        return {
          ...internship,
          alreadyApplied: appliedSet.has(internship._id.toString()),
          eligible,
          matchScore,
        };
      })
    );

    res.json(
      apiSuccess(
        {
          internships: enhancedInternships,
          pagination: result.pagination,
        },
        "Available internships"
      )
    );
  } catch (error) {
    next(error);
  }
};

export const getInternshipDetails = async (req, res, next) => {
  try {
    const student = await ensureStudentContext(req);
    const { internshipId } = req.params;

    if (!internshipId) {
      throw createHttpError(400, "internshipId is required");
    }

    // Get internship details
    const internship = await Internship.findOne({ internshipId })
      .populate("companyId", "companyName industry logo description website")
      .lean();

    if (!internship) {
      throw createHttpError(404, "Internship not found");
    }

    // Check if student can view this internship
    if (internship.status !== "open_for_applications") {
      throw createHttpError(403, "This internship is not available for viewing");
    }

    if (internship.department !== student.department) {
      throw createHttpError(403, "This internship is not available for your department");
    }

    // Check if student has already applied
    const existingApplication = await Application.findOne({
      studentId: student._id,
      internshipId: internship._id,
    }).lean();

    // Check eligibility
    const eligible =
      (!internship.eligibilityRequirements?.minReadinessScore ||
        student.readinessScore >= internship.eligibilityRequirements.minReadinessScore) &&
      (!internship.eligibilityRequirements?.requiredModules ||
        internship.eligibilityRequirements.requiredModules.every((module) =>
          student.completedModules?.includes(module)
        ));

    // Calculate AI match score and analysis
    let matchAnalysis = null;
    if (internship.aiTags) {
      try {
        matchAnalysis = await aiTaggingService.calculateMatchScore(
          {
            studentId: student.studentId,
            skills: student.skills || [],
            department: student.department,
            year: student.year,
            readinessScore: student.readinessScore,
          },
          {
            internshipId: internship.internshipId,
            requiredSkills: internship.requiredSkills,
            department: internship.department,
            aiTags: internship.aiTags,
          },
          { userId: student.studentId }
        );
      } catch (error) {
        logger.error("Failed to calculate match analysis", {
          studentId: student.studentId,
          internshipId: internship.internshipId,
          error: error.message,
        });
      }
    }

    res.json(
      apiSuccess(
        {
          internship,
          alreadyApplied: !!existingApplication,
          application: existingApplication,
          eligible,
          matchAnalysis,
        },
        "Internship details"
      )
    );
  } catch (error) {
    next(error);
  }
};

export const getRecommendedInternships = async (req, res, next) => {
  try {
    const student = await ensureStudentContext(req);
    const cacheKey = `student:recommendations:${student._id}:${Math.floor(Date.now() / 600000)}`;
    const cached = await redisGet(cacheKey);
    if (cached) {
      return res.json(apiSuccess(JSON.parse(cached), "Recommended internships"));
    }

    const internships = await Internship.find({ status: "approved" }).limit(20).lean();
    const recommendations = await recommendationService.getRecommendedInternships(student._id.toString(), internships);
    await redisSet(cacheKey, JSON.stringify(recommendations), 600);
    res.json(apiSuccess(recommendations, "Recommended internships"));
  } catch (error) {
    next(error);
  }
};

export const applyToInternship = async (req, res, next) => {
  try {
    const student = await ensureStudentContext(req);
    const { internshipId } = req.params;
    const { coverLetter, resumeUrl } = req.body;

    if (!internshipId) {
      throw createHttpError(400, "internshipId is required");
    }

    if (!coverLetter) {
      throw createHttpError(400, "coverLetter is required");
    }

    // Use application service to create application
    const application = await applicationService.createApplication(
      student._id,
      internshipId,
      {
        coverLetter,
        resumeUrl: resumeUrl || student.profile?.resumeUrl,
      }
    );

    // Update student's applied internships list
    if (!student.appliedInternships) {
      student.appliedInternships = [];
    }
    student.appliedInternships.push(application._id);
    await student.save();

    res.status(201).json(apiSuccess({ application }, "Application submitted successfully"));
  } catch (error) {
    next(error);
  }
};

export const getMyApplications = async (req, res, next) => {
  try {
    const student = await ensureStudentContext(req);

    // Build filters from query parameters
    const filters = {
      status: req.query.status,
      companyFeedbackStatus: req.query.companyFeedbackStatus,
      appliedFrom: req.query.appliedFrom,
      appliedTo: req.query.appliedTo,
      page: req.query.page,
      limit: req.query.limit,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder,
    };

    // Get applications using the application service
    const result = await applicationService.getApplicationsByStudent(student._id, filters);

    // Import InternshipCompletion to check credit request availability
    const InternshipCompletion = (await import("../models/InternshipCompletion.js")).default;
    
    // Get completion records for all applications
    const completions = await InternshipCompletion.find({
      studentId: student._id,
      internshipId: { $in: result.applications.map(app => app.internshipId?._id).filter(Boolean) }
    }).lean();
    
    // Create a map of internshipId to completion data
    const completionMap = new Map();
    completions.forEach(completion => {
      completionMap.set(completion.internshipId.toString(), {
        isCompleted: completion.status === 'completed',
        creditRequestAvailable: completion.status === 'completed' && !completion.creditRequest?.requested,
        creditRequestStatus: completion.creditRequest?.status,
        creditRequestId: completion.creditRequest?.requestId,
        completionId: completion._id
      });
    });
    
    // Enhance applications with credit request availability
    const enhancedApplications = result.applications.map(app => {
      const internshipId = app.internshipId?._id?.toString();
      const completionData = completionMap.get(internshipId) || {
        isCompleted: false,
        creditRequestAvailable: false,
        creditRequestStatus: null,
        creditRequestId: null,
        completionId: null
      };
      
      return {
        ...app,
        creditRequest: completionData
      };
    });

    res.json(
      apiSuccess(
        {
          applications: enhancedApplications,
          pagination: result.pagination,
        },
        "Student applications"
      )
    );
  } catch (error) {
    next(error);
  }
};

export const getApplicationDetails = async (req, res, next) => {
  try {
    const student = await ensureStudentContext(req);
    const { applicationId } = req.params;

    if (!applicationId) {
      throw createHttpError(400, "applicationId is required");
    }

    // Find application by applicationId (custom ID) or MongoDB _id
    let application;
    if (mongoose.Types.ObjectId.isValid(applicationId) && applicationId.length === 24) {
      application = await Application.findOne({ _id: applicationId, studentId: student._id })
        .populate("internshipId")
        .populate("companyId", "companyName industry logo")
        .lean();
    } else {
      application = await Application.findOne({ applicationId, studentId: student._id })
        .populate("internshipId")
        .populate("companyId", "companyName industry logo")
        .lean();
    }

    if (!application) {
      throw createHttpError(404, "Application not found");
    }

    // Check credit request availability
    const InternshipCompletion = (await import("../models/InternshipCompletion.js")).default;
    const completion = await InternshipCompletion.findOne({
      studentId: student._id,
      internshipId: application.internshipId?._id
    }).lean();

    const creditRequest = completion ? {
      isCompleted: completion.status === 'completed',
      creditRequestAvailable: completion.status === 'completed' && !completion.creditRequest?.requested,
      creditRequestStatus: completion.creditRequest?.status,
      creditRequestId: completion.creditRequest?.requestId,
      completionId: completion._id
    } : {
      isCompleted: false,
      creditRequestAvailable: false,
      creditRequestStatus: null,
      creditRequestId: null,
      completionId: null
    };

    res.json(
      apiSuccess(
        {
          application: {
            ...application,
            creditRequest
          }
        },
        "Application details"
      )
    );
  } catch (error) {
    next(error);
  }
};

export const withdrawApplication = async (req, res, next) => {
  try {
    const student = await ensureStudentContext(req);
    const { applicationId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      throw createHttpError(400, "Invalid applicationId");
    }
    const application = await Application.findOne({ _id: applicationId, studentId: student._id });
    if (!application) throw createHttpError(404, "Application not found");
    if (["accepted", "shortlisted"].includes(application.status)) {
      throw createHttpError(400, "Cannot withdraw an application that is already accepted/shortlisted");
    }

    application.status = "withdrawn";
    application.timeline.push({
      event: "application_withdrawn",
      performedBy: student.studentId,
      notes: "Student withdrew the application",
    });
    await application.save();

    await Internship.findByIdAndUpdate(application.internshipId, { $inc: { appliedCount: -1 } });
    student.appliedInternships = student.appliedInternships.filter(
      (id) => id.toString() !== application._id.toString(),
    );
    await student.save();
    res.json(apiSuccess({ application }, "Application withdrawn"));
  } catch (error) {
    next(error);
  }
};

export const getRecommendedModules = async (req, res, next) => {
  try {
    const student = await ensureStudentContext(req);
    const { targetInternshipId } = req.query;
    let internship = null;
    if (targetInternshipId && mongoose.Types.ObjectId.isValid(targetInternshipId)) {
      internship = await Internship.findById(targetInternshipId).lean();
    }
    const recommendations = await recommendationService.recommendModules(student._id.toString(), internship);
    res.json(apiSuccess(recommendations, "Recommended modules"));
  } catch (error) {
    next(error);
  }
};

export const startModule = async (req, res, next) => {
  try {
    const student = await ensureStudentContext(req);
    const { moduleCode } = req.body;
    if (!moduleCode) throw createHttpError(400, "moduleCode is required");

    const alreadyStarted = student.moduleProgress?.find((m) => m.code === moduleCode);
    if (alreadyStarted) {
      return res.json(apiSuccess({ module: alreadyStarted }, "Module already in progress"));
    }

    student.moduleProgress.push({
      code: moduleCode,
      status: "in_progress",
      startedAt: new Date(),
    });
    await student.save();

    res.json(apiSuccess({ moduleCode }, "Module started"));
  } catch (error) {
    next(error);
  }
};

export const completeModule = async (req, res, next) => {
  try {
    const student = await ensureStudentContext(req);
    const { moduleCode, score } = req.body;
    if (!moduleCode) throw createHttpError(400, "moduleCode is required");

    const moduleEntry = student.moduleProgress.find((m) => m.code === moduleCode);
    if (!moduleEntry) throw createHttpError(404, "Module not found in progress list");

    moduleEntry.status = "completed";
    moduleEntry.completedAt = new Date();
    if (score !== undefined) moduleEntry.score = score;

    if (!student.completedModules.includes(moduleCode)) {
      student.completedModules.push(moduleCode);
    }

    student.calculateReadinessScore();
    await student.save();

    res.json(apiSuccess({ moduleCode }, "Module completed"));
  } catch (error) {
    next(error);
  }
};

export const startInterviewPractice = async (req, res, next) => {
  try {
    const student = await ensureStudentContext(req);
    const { domain, difficulty = "beginner" } = req.body;
    if (!domain) throw createHttpError(400, "domain is required");

    const session = await InterviewSession.create({
      sessionId: `INT-${Date.now()}`,
      studentId: student._id,
      domain,
      difficulty,
    });

    const bot = new AIInterviewBot(session.sessionId, domain, student.profile, difficulty);
    const firstQuestion = await bot.startInterview();

    session.conversationHistory = [
      {
        role: "model",
        parts: [{ text: firstQuestion.question }],
      },
    ];
    session.questionCount = 1;
    await session.save();

    res.status(201).json(
      apiSuccess(
        {
          sessionId: session.sessionId,
          question: firstQuestion.question,
          questionNumber: firstQuestion.questionNumber,
        },
        "Interview session started",
      ),
    );
  } catch (error) {
    next(error);
  }
};

const getInterviewBot = async (session) => {
  const bot = new AIInterviewBot(session.sessionId, session.domain, {}, session.difficulty);
  bot.history = session.conversationHistory || [];
  bot.questionCount = session.questionCount;
  return bot;
};

export const submitInterviewAnswer = async (req, res, next) => {
  try {
    const student = await ensureStudentContext(req);
    const { sessionId, answer } = req.body;
    if (!sessionId || !answer) throw createHttpError(400, "sessionId and answer are required");

    const session = await InterviewSession.findOne({ sessionId, studentId: student._id });
    if (!session) throw createHttpError(404, "Interview session not found");
    if (session.status !== "active") throw createHttpError(400, "Interview session is no longer active");

    const bot = await getInterviewBot(session);
    const response = await bot.processAnswer(answer);

    session.conversationHistory.push({
      role: "user",
      parts: [{ text: answer }],
      timestamp: new Date(),
    });

    if (response.finished) {
      session.status = "completed";
      session.feedback = response.feedback;
      session.completedAt = new Date();
      await session.save();
      student.interviewAttempts += 1;
      student.calculateReadinessScore();
      await student.save();
      return res.json(apiSuccess({ feedback: response.feedback }, "Interview completed"));
    }

    session.conversationHistory.push({
      role: "model",
      parts: [{ text: response.nextQuestion }],
      timestamp: new Date(),
    });
    session.questionCount = response.questionNumber;
    await session.save();

    res.json(apiSuccess(response, "Next interview question"));
  } catch (error) {
    next(error);
  }
};

export const endInterview = async (req, res, next) => {
  try {
    const student = await ensureStudentContext(req);
    const { sessionId } = req.body;
    if (!sessionId) throw createHttpError(400, "sessionId is required");

    const session = await InterviewSession.findOne({ sessionId, studentId: student._id });
    if (!session) throw createHttpError(404, "Interview session not found");

    const bot = await getInterviewBot(session);
    const feedback = await bot.endInterview();

    session.status = "completed";
    session.feedback = feedback;
    session.completedAt = new Date();
    await session.save();

    student.interviewAttempts += 1;
    student.calculateReadinessScore();
    await student.save();

    res.json(apiSuccess({ feedback }, "Interview completed"));
  } catch (error) {
    next(error);
  }
};

export const getInterviewHistory = async (req, res, next) => {
  try {
    const student = await ensureStudentContext(req);
    const sessions = await InterviewSession.find({ studentId: student._id, status: "completed" })
      .sort({ completedAt: -1 })
      .lean();
    res.json(apiSuccess(sessions, "Interview history"));
  } catch (error) {
    next(error);
  }
};

export const submitLogbook = async (req, res, next) => {
  try {
    const student = await ensureStudentContext(req);
    const payload = req.body;
    if (!payload.internshipId || !payload.weekNumber || !payload.activities) {
      throw createHttpError(400, "internshipId, weekNumber and activities are required");
    }

    const internship = await Internship.findById(payload.internshipId);
    if (!internship) throw createHttpError(404, "Internship not found");

    const existing = await Logbook.findOne({
      studentId: student._id,
      internshipId: payload.internshipId,
      weekNumber: payload.weekNumber,
    });
    if (existing) throw createHttpError(409, "Logbook already exists for this week");

    const logbook = await Logbook.create({
      ...payload,
      logbookId: `LOG-${Date.now()}`,
      studentId: student._id,
      companyId: internship.companyId,
      status: "submitted",
      submittedAt: new Date(),
    });

    // async summary generation (fire and forget)
    logbookSummaryService.generateLogbookSummary(logbook._id).catch((err) => logger.error("Logbook summary failed", err));

    res.status(201).json(apiSuccess({ logbook }, "Logbook submitted"));
  } catch (error) {
    next(error);
  }
};

export const getMyLogbooks = async (req, res, next) => {
  try {
    const student = await ensureStudentContext(req);
    const query = { studentId: student._id };
    if (req.query.status) query.status = req.query.status;
    const logbooks = await Logbook.find(query).populate("internshipId").sort({ weekNumber: 1 }).lean();
    res.json(apiSuccess(logbooks, "Student logbooks"));
  } catch (error) {
    next(error);
  }
};

export const getCreditsSummary = async (req, res, next) => {
  try {
    const student = await ensureStudentContext(req);
    const logbooks = await Logbook.find({ studentId: student._id, status: "approved" }).lean();
    const totalHours = logbooks.reduce((sum, lb) => sum + lb.hoursWorked, 0);
    const creditsEarned = Math.floor(totalHours / 30);

    res.json(
      apiSuccess(
        {
          credits: student.credits,
          logbooks,
          totalHours,
          creditsEarned,
          compliance: creditsEarned >= student.credits.approved,
        },
        "Credits summary",
      ),
    );
  } catch (error) {
    next(error);
  }
};

export const generateNEPReport = async (req, res, next) => {
  try {
    const student = await ensureStudentContext(req);
    // In a full implementation, enqueue reportWorker job. For now respond with placeholder job id.
    const jobId = `NEP-${Date.now()}`;
    logger.info("NEP report requested", { studentId: student._id, jobId });
    res.status(202).json(apiSuccess({ jobId }, "NEP report generation started"));
  } catch (error) {
    next(error);
  }
};

export const chatbotQuery = async (req, res, next) => {
  try {
    const student = await ensureStudentContext(req);
    const { prompt } = req.body;
    if (!prompt) throw createHttpError(400, "prompt is required");

    const response = await aiService.generateContent(
      `You are Prashiskshan assistant helping student ${student.profile.name}. Their department is ${student.profile.department}, readiness score ${student.readinessScore}. Question: ${prompt}`,
      { model: "flash" },
    );

    res.json(apiSuccess({ response }, "Chatbot response"));
  } catch (error) {
    next(error);
  }
};

export const getCompletedInternshipsWithCreditStatus = async (req, res, next) => {
  try {
    const student = await ensureStudentContext(req);
    const { page, limit, skip } = buildPagination(req);
    
    const InternshipCompletion = (await import("../models/InternshipCompletion.js")).default;
    
    // Find all completed internships for this student
    const query = {
      studentId: student._id,
      status: 'completed'
    };
    
    const [completions, total] = await Promise.all([
      InternshipCompletion.find(query)
        .populate('internshipId')
        .populate('companyId')
        .sort({ completionDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      InternshipCompletion.countDocuments(query)
    ]);
    
    // Enhance with credit request availability
    const enhancedCompletions = completions.map(completion => ({
      ...completion,
      creditRequestAvailable: !completion.creditRequest?.requested,
      canRequestCredit: !completion.creditRequest?.requested,
      creditRequestStatus: completion.creditRequest?.status || null,
      creditRequestId: completion.creditRequest?.requestId || null
    }));
    
    res.json(
      apiSuccess(
        {
          items: enhancedCompletions,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        },
        "Completed internships with credit status"
      )
    );
  } catch (error) {
    next(error);
  }
};


