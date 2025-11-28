import Internship from "../models/Internship.js";
import { apiSuccess } from "../utils/apiResponse.js";

export const browseInternships = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, department, location, workMode, skills, minStipend, maxStipend, search } = req.query;

        const query = { status: "approved" }; // Only show approved internships

        if (department) query.department = department;
        if (location) query.location = { $regex: location, $options: "i" };
        if (workMode) query.workMode = workMode;
        if (minStipend) query.stipend = { ...query.stipend, $gte: Number(minStipend) };
        if (maxStipend) query.stipend = { ...query.stipend, $lte: Number(maxStipend) };

        if (skills) {
            const skillsArray = skills.split(",").map((s) => s.trim());
            query.requiredSkills = { $in: skillsArray };
        }

        if (search) {
            query.$text = { $search: search };
        }

        const skip = (Number(page) - 1) * Number(limit);

        const [internships, total] = await Promise.all([
            Internship.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .populate("companyId", "companyName industry logo")
                .lean(),
            Internship.countDocuments(query),
        ]);

        res.json(
            apiSuccess(
                {
                    internships,
                    pagination: {
                        page: Number(page),
                        limit: Number(limit),
                        total,
                        pages: Math.ceil(total / Number(limit)),
                    },
                },
                "Internships fetched successfully",
            ),
        );
    } catch (error) {
        next(error);
    }
};
