import { aiTaggingService } from "../../../src/services/aiTaggingService.js";

describe("AITaggingService", () => {
  describe("generateTags", () => {
    it("should generate fallback tags when AI fails", async () => {
      const internshipData = {
        internshipId: "INT-TEST-001",
        title: "Software Engineering Intern",
        description: "Work on web development projects using React and Node.js",
        requiredSkills: ["JavaScript", "React", "Node.js"],
        department: "Computer Science",
        duration: "12 weeks",
        responsibilities: ["Develop features", "Write tests", "Code reviews"],
      };

      const tags = await aiTaggingService.generateTags(internshipData, {
        trackUsageFlag: false,
      });

      // Verify structure
      expect(tags).toHaveProperty("primarySkills");
      expect(tags).toHaveProperty("difficulty");
      expect(tags).toHaveProperty("careerPath");
      expect(tags).toHaveProperty("industryFit");
      expect(tags).toHaveProperty("learningIntensity");
      expect(tags).toHaveProperty("technicalDepth");
      expect(tags).toHaveProperty("generatedAt");

      // Verify types
      expect(Array.isArray(tags.primarySkills)).toBe(true);
      expect(typeof tags.difficulty).toBe("string");
      expect(typeof tags.careerPath).toBe("string");
      expect(Array.isArray(tags.industryFit)).toBe(true);
      expect(tags.generatedAt).toBeInstanceOf(Date);
    });

    it("should infer beginner difficulty for simple internships", async () => {
      const internshipData = {
        internshipId: "INT-TEST-002",
        title: "Junior Developer Intern",
        description: "Learn basic programming concepts",
        requiredSkills: ["HTML", "CSS"],
        department: "Computer Science",
        duration: "8 weeks",
        responsibilities: ["Learn coding"],
      };

      const tags = await aiTaggingService.generateTags(internshipData, {
        trackUsageFlag: false,
      });

      expect(tags.difficulty).toBe("beginner");
    });

    it("should infer advanced difficulty for complex internships", async () => {
      const internshipData = {
        internshipId: "INT-TEST-003",
        title: "Senior Software Engineering Intern",
        description: "Lead development of microservices architecture",
        requiredSkills: [
          "Kubernetes",
          "Docker",
          "AWS",
          "Microservices",
          "GraphQL",
          "TypeScript",
          "React",
          "Node.js",
          "PostgreSQL",
        ],
        department: "Computer Science",
        duration: "16 weeks",
        responsibilities: ["Architecture design", "Team leadership"],
      };

      const tags = await aiTaggingService.generateTags(internshipData, {
        trackUsageFlag: false,
      });

      expect(tags.difficulty).toBe("advanced");
    });

    it("should map department to career path correctly", async () => {
      const testCases = [
        { department: "Computer Science", expectedPath: "Software Engineering" },
        { department: "Data Science", expectedPath: "Data Science" },
        { department: "Mechanical", expectedPath: "Mechanical Engineering" },
      ];

      for (const testCase of testCases) {
        const internshipData = {
          internshipId: `INT-TEST-${testCase.department}`,
          title: "Test Intern",
          description: "Test description",
          requiredSkills: ["Skill1", "Skill2"],
          department: testCase.department,
          duration: "10 weeks",
          responsibilities: ["Task1"],
        };

        const tags = await aiTaggingService.generateTags(internshipData, {
          trackUsageFlag: false,
        });

        expect(tags.careerPath).toBe(testCase.expectedPath);
      }
    });

    it("should extract industries from description", async () => {
      const internshipData = {
        internshipId: "INT-TEST-004",
        title: "Fintech Software Developer",
        description: "Work on banking software and financial technology solutions",
        requiredSkills: ["Java", "Spring Boot"],
        department: "Computer Science",
        duration: "12 weeks",
        responsibilities: ["Develop banking features"],
      };

      const tags = await aiTaggingService.generateTags(internshipData, {
        trackUsageFlag: false,
      });

      expect(tags.industryFit).toContain("Finance");
    });
  });

  describe("calculateMatchScore", () => {
    it("should return fallback score when AI fails", async () => {
      const studentProfile = {
        studentId: "STU-001",
        skills: ["JavaScript", "React"],
        department: "Computer Science",
        year: 3,
        readinessScore: 75,
      };

      const internshipData = {
        internshipId: "INT-001",
        requiredSkills: ["JavaScript", "React", "Node.js"],
        department: "Computer Science",
        aiTags: {
          difficulty: "intermediate",
        },
      };

      const result = await aiTaggingService.calculateMatchScore(
        studentProfile,
        internshipData,
        { trackUsageFlag: false }
      );

      // Verify structure
      expect(result).toHaveProperty("matchScore");
      expect(result).toHaveProperty("reasoning");
      expect(result).toHaveProperty("strengths");
      expect(result).toHaveProperty("concerns");

      // Verify types
      expect(typeof result.matchScore).toBe("number");
      expect(typeof result.reasoning).toBe("string");
      expect(Array.isArray(result.strengths)).toBe(true);
      expect(Array.isArray(result.concerns)).toBe(true);

      // Verify score is in valid range
      expect(result.matchScore).toBeGreaterThanOrEqual(0);
      expect(result.matchScore).toBeLessThanOrEqual(100);
    });
  });

  describe("_inferDifficulty", () => {
    it("should return beginner for few skills", () => {
      const internship = {
        title: "Junior Intern",
        description: "Basic tasks",
        requiredSkills: ["HTML", "CSS"],
      };

      const difficulty = aiTaggingService._inferDifficulty(internship);
      expect(difficulty).toBe("beginner");
    });

    it("should return advanced for many skills", () => {
      const internship = {
        title: "Intern",
        description: "Complex tasks",
        requiredSkills: [
          "Skill1",
          "Skill2",
          "Skill3",
          "Skill4",
          "Skill5",
          "Skill6",
          "Skill7",
          "Skill8",
          "Skill9",
        ],
      };

      const difficulty = aiTaggingService._inferDifficulty(internship);
      expect(difficulty).toBe("advanced");
    });

    it("should return advanced for senior keywords", () => {
      const internship = {
        title: "Senior Software Engineer Intern",
        description: "Lead development",
        requiredSkills: ["JavaScript"],
      };

      const difficulty = aiTaggingService._inferDifficulty(internship);
      expect(difficulty).toBe("advanced");
    });

    it("should return intermediate for moderate skills", () => {
      const internship = {
        title: "Developer Intern",
        description: "Development tasks",
        requiredSkills: ["JavaScript", "React", "Node.js", "MongoDB"],
      };

      const difficulty = aiTaggingService._inferDifficulty(internship);
      expect(difficulty).toBe("intermediate");
    });
  });

  describe("_inferCareerPath", () => {
    it("should map known departments correctly", () => {
      expect(aiTaggingService._inferCareerPath("Computer Science")).toBe("Software Engineering");
      expect(aiTaggingService._inferCareerPath("Data Science")).toBe("Data Science");
      expect(aiTaggingService._inferCareerPath("Mechanical")).toBe("Mechanical Engineering");
      expect(aiTaggingService._inferCareerPath("Finance")).toBe("Finance");
    });

    it("should return General for unknown departments", () => {
      expect(aiTaggingService._inferCareerPath("Unknown Department")).toBe("General");
    });

    it("should handle partial matches", () => {
      expect(aiTaggingService._inferCareerPath("Computer Science and Engineering")).toBe(
        "Software Engineering"
      );
    });
  });

  describe("_inferIndustries", () => {
    it("should extract technology industry", () => {
      const internship = {
        title: "Software Developer",
        description: "Work on tech products",
        department: "Computer Science",
      };

      const industries = aiTaggingService._inferIndustries(internship);
      expect(industries).toContain("Technology");
    });

    it("should extract finance industry", () => {
      const internship = {
        title: "Banking Analyst",
        description: "Work in fintech",
        department: "Finance",
      };

      const industries = aiTaggingService._inferIndustries(internship);
      expect(industries).toContain("Finance");
    });

    it("should extract multiple industries", () => {
      const internship = {
        title: "Healthcare Tech Developer",
        description: "Build medical software for healthcare providers",
        department: "Computer Science",
      };

      const industries = aiTaggingService._inferIndustries(internship);
      expect(industries.length).toBeGreaterThan(0);
    });

    it("should use department as fallback", () => {
      const internship = {
        title: "Generic Intern",
        description: "General work",
        department: "Engineering",
      };

      const industries = aiTaggingService._inferIndustries(internship);
      expect(industries).toContain("Engineering");
    });
  });
});
