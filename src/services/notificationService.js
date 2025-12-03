import mongoose from "mongoose";
import Notification from "../models/Notification.js";
import Student from "../models/Student.js";
import Mentor from "../models/Mentor.js";
import Company from "../models/Company.js";
import Admin from "../models/Admin.js";
import { emailService } from "./emailService.js";
import { smsService } from "./smsService.js";
import { logger } from "../utils/logger.js";

const modelMap = {
  student: Student,
  mentor: Mentor,
  company: Company,
  admin: Admin,
};

const loadUserContext = async (role, mongoId) => {
  const Model = modelMap[role];
  if (!Model || !mongoId) return {};
  const doc = await Model.findById(mongoId).lean();
  if (!doc) return {};
  const preferences =
    role === "student"
      ? doc.preferences?.notificationChannels || {}
      : role === "mentor"
        ? doc.preferences?.notifications || {}
        : { email: true, realtime: true };
  const email = doc.email || doc.profile?.email || doc.pointOfContact?.email;
  const phone = doc.profile?.phone || doc.pointOfContact?.phone || doc.phone;
  return { preferences, email, phone };
};

const sendEmailChannel = async ({ to, title, message, actionUrl }) => {
  if (!to) return { status: "failed", metadata: { reason: "missing-email" } };
  try {
    await emailService.sendEmail({
      to,
      subject: title,
      html: `<p>${message}</p>${actionUrl ? `<p><a href="${actionUrl}">View details</a></p>` : ""}`,
    });
    return { status: "sent" };
  } catch (error) {
    return { status: "failed", metadata: { reason: error.message } };
  }
};

const sendSmsChannel = async ({ to, message }) => {
  if (!to) return { status: "failed", metadata: { reason: "missing-phone" } };
  try {
    await smsService.sendSMS({ to, body: message });
    return { status: "sent" };
  } catch (error) {
    return { status: "failed", metadata: { reason: error.message } };
  }
};

// Notification templates for workflow events
const notificationTemplates = {
  internshipCreated: {
    title: "New Internship Pending Verification",
    message: (data) => `A new internship "${data.title}" from ${data.companyName} requires verification.`,
    priority: "medium",
    actionUrl: (data) => `/admin/internships/${data.internshipId}`,
  },
  adminApproved: {
    company: {
      title: "Internship Approved by Admin",
      message: (data) => `Your internship "${data.title}" has been approved by admin and is now pending mentor approval.`,
      priority: "medium",
      actionUrl: (data) => `/company/internships/${data.internshipId}`,
    },
    mentor: {
      title: "New Internship Pending Your Approval",
      message: (data) => `Internship "${data.title}" from ${data.companyName} requires your department approval.`,
      priority: "high",
      actionUrl: (data) => `/mentor/internships/pending`,
    },
  },
  adminRejected: {
    title: "Internship Verification Rejected",
    message: (data) => `Your internship "${data.title}" was not approved. Reason: ${data.reasons || "See details for more information."}`,
    priority: "high",
    actionUrl: (data) => `/company/internships/${data.internshipId}`,
  },
  mentorApproved: {
    company: {
      title: "Internship Approved - Now Open for Applications",
      message: (data) => `Your internship "${data.title}" has been approved and is now visible to students.`,
      priority: "medium",
      actionUrl: (data) => `/company/internships/${data.internshipId}`,
    },
    student: {
      title: "New Internship Available",
      message: (data) => `A new internship "${data.title}" from ${data.companyName} is now available in your department.`,
      priority: "low",
      actionUrl: (data) => `/student/internships/${data.internshipId}`,
    },
  },
  mentorRejected: {
    company: {
      title: "Internship Not Approved by Mentor",
      message: (data) => `Your internship "${data.title}" was not approved by the department mentor. Reason: ${data.reasons || "See details for more information."}`,
      priority: "high",
      actionUrl: (data) => `/company/internships/${data.internshipId}`,
    },
    admin: {
      title: "Internship Rejected by Mentor",
      message: (data) => `Internship "${data.title}" from ${data.companyName} was rejected by mentor.`,
      priority: "medium",
      actionUrl: (data) => `/admin/internships/${data.internshipId}`,
    },
  },
  applicationSubmitted: {
    title: "New Application Received",
    message: (data) => `${data.studentName} has applied for your internship "${data.internshipTitle}".`,
    priority: "medium",
    actionUrl: (data) => `/company/applications/${data.applicationId}`,
  },
  applicationAccepted: {
    title: "Application Accepted",
    message: (data) => `Congratulations! Your application for "${data.internshipTitle}" at ${data.companyName} has been accepted.`,
    priority: "high",
    actionUrl: (data) => `/student/applications/${data.applicationId}`,
  },
  applicationRejected: {
    title: "Application Update",
    message: (data) => `Your application for "${data.internshipTitle}" at ${data.companyName} was not successful. ${data.feedback || ""}`,
    priority: "medium",
    actionUrl: (data) => `/student/applications/${data.applicationId}`,
  },
  deadlineApproaching: {
    company: {
      title: "Application Deadline Approaching",
      message: (data) => `Your internship "${data.title}" application deadline is in ${data.daysRemaining} day(s).`,
      priority: "medium",
      actionUrl: (data) => `/company/internships/${data.internshipId}`,
    },
    student: {
      title: "Internship Deadline Approaching",
      message: (data) => `The application deadline for "${data.title}" at ${data.companyName} is in ${data.daysRemaining} day(s).`,
      priority: "high",
      actionUrl: (data) => `/student/internships/${data.internshipId}`,
    },
  },
  internshipClosed: {
    title: "Internship Closed",
    message: (data) => `The internship "${data.title}" at ${data.companyName} is now closed.`,
    priority: "low",
    actionUrl: (data) => `/student/applications`,
  },
  internshipCancelled: {
    title: "Internship Cancelled",
    message: (data) => `The internship "${data.title}" at ${data.companyName} has been cancelled.`,
    priority: "high",
    actionUrl: (data) => `/student/applications`,
  },
};

export const notificationService = {
  async notifyUser({
    userId,
    mongoId,
    role,
    email,
    phone,
    title,
    message,
    priority = "medium",
    actionUrl,
    metadata,
    channelOverrides,
  }) {
    const context = await loadUserContext(role, mongoId);
    const preferences = context.preferences || {};
    const channels = {
      email: channelOverrides?.email ?? preferences.email ?? true,
      sms: channelOverrides?.sms ?? preferences.sms ?? false,
      realtime: channelOverrides?.realtime ?? preferences.realtime ?? true,
    };

    const deliveries = [];
    if (channels.email) {
      deliveries.push({
        channel: "email",
        ...(await sendEmailChannel({ to: email || context.email, title, message, actionUrl })),
      });
    }
    if (channels.sms) {
      deliveries.push({
        channel: "sms",
        ...(await sendSmsChannel({ to: phone || context.phone, message })),
      });
    }

    try {
      await Notification.create({
        notificationId: `NTF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId: mongoId || userId,
        role,
        type: "system",
        title,
        message,
        priority,
        actionUrl,
        deliveries,
        metadata,
      });
    } catch (error) {
      logger.error("Failed to persist notification", { error: error.message });
    }

    return { deliveries, channels };
  },

  /**
   * Notify stakeholders about internship status changes
   * @param {Object} internship - The internship document
   * @param {string} oldStatus - Previous status
   * @param {string} newStatus - New status
   * @param {Object} additionalData - Additional context data
   */
  async notifyInternshipStatusChange(internship, oldStatus, newStatus, additionalData = {}) {
    try {
      const stakeholders = await this._getStakeholdersForStatusChange(internship, oldStatus, newStatus);
      const notifications = [];

      for (const stakeholder of stakeholders) {
        const template = this._getTemplateForStatusChange(newStatus, stakeholder.role, stakeholder.subType);
        if (!template) continue;

        const data = {
          title: internship.title,
          internshipId: internship.internshipId,
          companyName: additionalData.companyName || "the company",
          reasons: additionalData.reasons?.join(", "),
          comments: additionalData.comments,
          ...additionalData,
        };

        const notification = this.notifyUser({
          mongoId: stakeholder.mongoId,
          role: stakeholder.role,
          email: stakeholder.email,
          title: template.title,
          message: typeof template.message === "function" ? template.message(data) : template.message,
          priority: template.priority,
          actionUrl: typeof template.actionUrl === "function" ? template.actionUrl(data) : template.actionUrl,
          metadata: {
            internshipId: internship.internshipId,
            statusChange: { from: oldStatus, to: newStatus },
            ...additionalData,
          },
        });

        notifications.push(notification);
      }

      await Promise.allSettled(notifications);
      logger.info("Status change notifications sent", {
        internshipId: internship.internshipId,
        statusChange: { from: oldStatus, to: newStatus },
        recipientCount: stakeholders.length,
      });

      return { success: true, notificationCount: stakeholders.length };
    } catch (error) {
      logger.error("Failed to send status change notifications", {
        error: error.message,
        internshipId: internship.internshipId,
      });
      return { success: false, error: error.message };
    }
  },

  /**
   * Notify company when a student submits an application
   * @param {Object} application - The application document
   * @param {Object} studentData - Student information
   * @param {Object} internshipData - Internship information
   */
  async notifyApplicationSubmitted(application, studentData, internshipData) {
    try {
      const company = await Company.findById(application.companyId).lean();
      if (!company) {
        logger.warn("Company not found for application notification", {
          applicationId: application.applicationId,
          companyId: application.companyId,
        });
        return { success: false, error: "Company not found" };
      }

      const template = notificationTemplates.applicationSubmitted;
      const data = {
        studentName: studentData.name || "A student",
        internshipTitle: internshipData.title,
        applicationId: application.applicationId,
        internshipId: internshipData.internshipId,
      };

      await this.notifyUser({
        mongoId: company._id,
        role: "company",
        email: company.pointOfContact?.email || company.email,
        title: template.title,
        message: template.message(data),
        priority: template.priority,
        actionUrl: template.actionUrl(data),
        metadata: {
          applicationId: application.applicationId,
          internshipId: internshipData.internshipId,
          studentId: application.studentId,
        },
      });

      logger.info("Application submitted notification sent", {
        applicationId: application.applicationId,
        companyId: company._id,
      });

      return { success: true };
    } catch (error) {
      logger.error("Failed to send application submitted notification", {
        error: error.message,
        applicationId: application.applicationId,
      });
      return { success: false, error: error.message };
    }
  },

  /**
   * Notify about approaching deadlines
   * @param {Object} internship - The internship document
   * @param {number} daysRemaining - Days until deadline
   */
  async notifyDeadlineApproaching(internship, daysRemaining) {
    try {
      const notifications = [];

      // Notify company
      const company = await Company.findById(internship.companyId).lean();
      if (company) {
        const companyTemplate = notificationTemplates.deadlineApproaching.company;
        const data = {
          title: internship.title,
          internshipId: internship.internshipId,
          daysRemaining,
        };

        notifications.push(
          this.notifyUser({
            mongoId: company._id,
            role: "company",
            email: company.pointOfContact?.email || company.email,
            title: companyTemplate.title,
            message: companyTemplate.message(data),
            priority: companyTemplate.priority,
            actionUrl: companyTemplate.actionUrl(data),
            metadata: {
              internshipId: internship.internshipId,
              daysRemaining,
              reminderType: "deadline",
            },
          })
        );
      }

      // Notify students in the department who haven't applied
      const studentTemplate = notificationTemplates.deadlineApproaching.student;
      const students = await Student.find({
        department: internship.department,
        status: "active",
      }).lean();

      // Get students who have already applied
      const Application = mongoose.model("Application");
      const appliedStudentIds = await Application.find({
        internshipId: internship._id,
      }).distinct("studentId");

      const appliedStudentIdStrings = appliedStudentIds.map((id) => id.toString());

      for (const student of students) {
        // Skip if student already applied
        if (appliedStudentIdStrings.includes(student._id.toString())) continue;

        const data = {
          title: internship.title,
          internshipId: internship.internshipId,
          companyName: company?.companyName || "the company",
          daysRemaining,
        };

        notifications.push(
          this.notifyUser({
            mongoId: student._id,
            role: "student",
            email: student.email,
            title: studentTemplate.title,
            message: studentTemplate.message(data),
            priority: studentTemplate.priority,
            actionUrl: studentTemplate.actionUrl(data),
            metadata: {
              internshipId: internship.internshipId,
              daysRemaining,
              reminderType: "deadline",
            },
          })
        );
      }

      await Promise.allSettled(notifications);
      logger.info("Deadline approaching notifications sent", {
        internshipId: internship.internshipId,
        daysRemaining,
        recipientCount: notifications.length,
      });

      return { success: true, notificationCount: notifications.length };
    } catch (error) {
      logger.error("Failed to send deadline approaching notifications", {
        error: error.message,
        internshipId: internship.internshipId,
      });
      return { success: false, error: error.message };
    }
  },

  /**
   * Send notifications to multiple recipients
   * @param {Array} recipients - Array of recipient objects with mongoId, role, email
   * @param {Object} notificationData - Notification content
   */
  async notifyBulk(recipients, notificationData) {
    try {
      const notifications = recipients.map((recipient) =>
        this.notifyUser({
          mongoId: recipient.mongoId,
          role: recipient.role,
          email: recipient.email,
          phone: recipient.phone,
          title: notificationData.title,
          message: notificationData.message,
          priority: notificationData.priority || "medium",
          actionUrl: notificationData.actionUrl,
          metadata: notificationData.metadata,
          channelOverrides: notificationData.channelOverrides,
        })
      );

      const results = await Promise.allSettled(notifications);
      const successCount = results.filter((r) => r.status === "fulfilled").length;
      const failureCount = results.filter((r) => r.status === "rejected").length;

      logger.info("Bulk notifications sent", {
        total: recipients.length,
        success: successCount,
        failed: failureCount,
      });

      return {
        success: true,
        total: recipients.length,
        successCount,
        failureCount,
      };
    } catch (error) {
      logger.error("Failed to send bulk notifications", { error: error.message });
      return { success: false, error: error.message };
    }
  },

  /**
   * Get stakeholders who should be notified for a status change
   * @private
   */
  async _getStakeholdersForStatusChange(internship, oldStatus, newStatus) {
    const stakeholders = [];

    try {
      // Get company
      const company = await Company.findById(internship.companyId).lean();

      switch (newStatus) {
        case "pending_admin_verification":
          // Notify all active admins
          const admins = await Admin.find({ status: "active" }).lean();
          stakeholders.push(
            ...admins.map((admin) => ({
              mongoId: admin._id,
              role: "admin",
              email: admin.email,
            }))
          );
          break;

        case "admin_approved":
          // Notify company
          if (company) {
            stakeholders.push({
              mongoId: company._id,
              role: "company",
              email: company.pointOfContact?.email || company.email,
              subType: "company",
            });
          }

          // Notify mentors in the department
          const mentors = await Mentor.find({
            department: internship.department,
            status: "active",
          }).lean();
          stakeholders.push(
            ...mentors.map((mentor) => ({
              mongoId: mentor._id,
              role: "mentor",
              email: mentor.email,
              subType: "mentor",
            }))
          );
          break;

        case "admin_rejected":
          // Notify company
          if (company) {
            stakeholders.push({
              mongoId: company._id,
              role: "company",
              email: company.pointOfContact?.email || company.email,
            });
          }
          break;

        case "open_for_applications":
          // Notify company
          if (company) {
            stakeholders.push({
              mongoId: company._id,
              role: "company",
              email: company.pointOfContact?.email || company.email,
              subType: "company",
            });
          }

          // Notify students in the department
          const students = await Student.find({
            department: internship.department,
            status: "active",
          }).lean();
          stakeholders.push(
            ...students.map((student) => ({
              mongoId: student._id,
              role: "student",
              email: student.email,
              subType: "student",
            }))
          );
          break;

        case "mentor_rejected":
          // Notify company
          if (company) {
            stakeholders.push({
              mongoId: company._id,
              role: "company",
              email: company.pointOfContact?.email || company.email,
              subType: "company",
            });
          }

          // Notify admins
          const adminsForRejection = await Admin.find({ status: "active" }).lean();
          stakeholders.push(
            ...adminsForRejection.map((admin) => ({
              mongoId: admin._id,
              role: "admin",
              email: admin.email,
              subType: "admin",
            }))
          );
          break;

        case "closed":
        case "cancelled":
          // Notify pending applicants
          const Application = mongoose.model("Application");
          const applications = await Application.find({
            internshipId: internship._id,
            status: { $in: ["pending", "shortlisted"] },
          })
            .populate("studentId", "email")
            .lean();

          stakeholders.push(
            ...applications.map((app) => ({
              mongoId: app.studentId._id,
              role: "student",
              email: app.studentId.email,
            }))
          );
          break;
      }

      return stakeholders;
    } catch (error) {
      logger.error("Failed to get stakeholders for status change", {
        error: error.message,
        internshipId: internship.internshipId,
      });
      return [];
    }
  },

  /**
   * Get notification template for status change
   * @private
   */
  _getTemplateForStatusChange(newStatus, role, subType) {
    const templateMap = {
      pending_admin_verification: notificationTemplates.internshipCreated,
      admin_approved: notificationTemplates.adminApproved[subType],
      admin_rejected: notificationTemplates.adminRejected,
      open_for_applications: notificationTemplates.mentorApproved[subType],
      mentor_rejected: notificationTemplates.mentorRejected[subType],
      closed: notificationTemplates.internshipClosed,
      cancelled: notificationTemplates.internshipCancelled,
    };

    return templateMap[newStatus];
  },
};


