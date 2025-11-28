import InterviewSession from "../models/InterviewSession.js";
import { AIInterviewBot } from "../services/interviewBotService.js";
import { apiSuccess } from "../utils/apiResponse.js";
import { createHttpError, resolveUserFromRequest } from "./helpers/context.js";

const ensureStudentContext = async (req) => {
    const context = await resolveUserFromRequest(req);
    if (context.role !== "student") {
        throw createHttpError(403, "Only students can access this resource");
    }
    return context.doc;
};

const getInterviewBot = async (session) => {
    const bot = new AIInterviewBot(session.sessionId, session.domain, {}, session.difficulty);
    bot.history = session.conversationHistory || [];
    bot.questionCount = session.questionCount;
    return bot;
};

export const startInterview = async (req, res, next) => {
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

export const submitAnswer = async (req, res, next) => {
    try {
        const student = await ensureStudentContext(req);
        const { sessionId } = req.params;
        const { answer } = req.body;

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

export const getSession = async (req, res, next) => {
    try {
        const student = await ensureStudentContext(req);
        const { sessionId } = req.params;

        const session = await InterviewSession.findOne({ sessionId, studentId: student._id }).lean();
        if (!session) throw createHttpError(404, "Interview session not found");

        res.json(apiSuccess(session, "Interview session details"));
    } catch (error) {
        next(error);
    }
};

export const getHistory = async (req, res, next) => {
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
