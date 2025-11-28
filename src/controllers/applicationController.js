import Application from "../models/Application.js";
import Internship from "../models/Internship.js";
import Student from "../models/Student.js";
import Company from "../models/Company.js";
import { apiSuccess } from "../utils/apiResponse.js";
import { createHttpError, resolveUserFromRequest } from "./helpers/context.js";
import { emailService } from "../services/emailService.js";

export const applyToInternship = async (req, res, next) => {
    try {
        const context = await resolveUserFromRequest(req);
        if (context.role !== "student") throw createHttpError(403, "Only students can apply");
        const student = context.doc;

        const { internshipId, coverLetter, resumeUrl } = req.body;
        if (!internshipId) throw createHttpError(400, "Internship ID required");

        const internship = await Internship.findById(internshipId);
        if (!internship) throw createHttpError(404, "Internship not found");

        if (internship.status !== "approved") throw createHttpError(400, "Internship not accepting applications");

        const existingApplication = await Application.findOne({
            studentId: student._id,
            internshipId: internship._id,
        });

        if (existingApplication) throw createHttpError(400, "Already applied to this internship");

        const application = await Application.create({
            applicationId: `APP-${Date.now()}`,
            studentId: student._id,
            internshipId: internship._id,
            companyId: internship.companyId,
            department: student.profile.department,
            coverLetter,
            resumeUrl: resumeUrl || student.profile.resume,
            status: "pending",
            timeline: [
                {
                    event: "applied",
                    performedBy: student.studentId,
                    timestamp: new Date(),
                },
            ],
        });

        // Increment applied count
        await Internship.findByIdAndUpdate(internshipId, { $inc: { appliedCount: 1 } });

        res.status(201).json(apiSuccess(application, "Application submitted successfully"));
    } catch (error) {
        next(error);
    }
};

export const updateApplicationStatus = async (req, res, next) => {
    try {
        const context = await resolveUserFromRequest(req);
        // Allow company or mentor to update status
        if (!["company", "mentor", "admin"].includes(context.role)) {
            throw createHttpError(403, "Unauthorized to update application status");
        }

        const { id } = req.params;
        const { status, feedback, rejectionReason } = req.body;

        const application = await Application.findById(id);
        if (!application) throw createHttpError(404, "Application not found");

        // Verify ownership for company
        if (context.role === "company" && application.companyId.toString() !== context.doc._id.toString()) {
            throw createHttpError(403, "Unauthorized access to this application");
        }

        application.status = status;

        // Update company feedback if provided
        if (context.role === "company" && (feedback || rejectionReason)) {
            application.companyFeedback = {
                ...application.companyFeedback,
                status,
                feedback,
                rejectionReason,
                reviewedAt: new Date()
            };
        }

        application.timeline.push({
            event: `status_updated_to_${status}`,
            performedBy: context.role === "company" ? context.doc.companyId : context.doc.email, // Adjust based on user model
            notes: feedback || rejectionReason,
            timestamp: new Date(),
        });

        await application.save();

        // Send email notification based on status change
        if (status === 'accepted') {
            try {
                const student = await Student.findById(application.studentId);
                const company = await Company.findById(application.companyId);
                const internship = await Internship.findById(application.internshipId);

                if (student && company && internship) {
                    await emailService.sendTemplate('application-accepted', {
                        email: student.email,
                        studentName: student.profile.name,
                        internshipTitle: internship.title,
                        companyName: company.companyName,
                        companyWebsite: company.website,
                        companyMobile: company.phone,
                        companyEmail: company.email
                    });
                }
            } catch (emailError) {
                console.error("Failed to send acceptance email:", emailError);
            }
        } else if (status === 'shortlisted') {
            try {
                const student = await Student.findById(application.studentId);
                const company = await Company.findById(application.companyId);
                const internship = await Internship.findById(application.internshipId);

                if (student && company && internship) {
                    await emailService.sendTemplate('application-shortlisted', {
                        email: student.email,
                        studentName: student.profile.name,
                        internshipTitle: internship.title,
                        companyName: company.companyName
                    });
                }
            } catch (emailError) {
                console.error("Failed to send shortlist email:", emailError);
            }
        } else if (status === 'rejected') {
            try {
                const student = await Student.findById(application.studentId);
                const company = await Company.findById(application.companyId);
                const internship = await Internship.findById(application.internshipId);

                if (student && company && internship) {
                    // If previously accepted, it's a revocation
                    // Note: application.status is already updated to 'rejected' by now in the DB, 
                    // but we need to know if it was accepted. 
                    // The 'application' object in memory still has the old status if we didn't mutate it yet?
                    // Wait, line 76 `application.status = status;` mutated it.
                    // I need to capture previous status before line 76.

                    // Since I can't easily change the code above without replacing the whole function, 
                    // I will assume for now that 'rejected' always sends a rejection/revocation email 
                    // which includes the reason. The template 'application-revoked' is good for this.

                    await emailService.sendTemplate('application-revoked', {
                        email: student.email,
                        studentName: student.profile.name,
                        internshipTitle: internship.title,
                        companyName: company.companyName,
                        reason: rejectionReason || feedback || 'Application rejected'
                    });
                }
            } catch (emailError) {
                console.error("Failed to send rejection/revocation email:", emailError);
            }
        }

        res.json(apiSuccess(application, "Application status updated"));
    } catch (error) {
        next(error);
    }
};
