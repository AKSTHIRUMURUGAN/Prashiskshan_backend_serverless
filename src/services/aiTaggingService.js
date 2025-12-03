import { models } from "../config/gemini.js";
import config from "../config/index.js";
import { logger } from "../utils/logger.js";
import { trackUsage, estimateTokens } from "./aiService.js";

/**
 * AITaggingService - Provides intelligent tagging and categorization for internships
 * using Google's Gemini API with fallback to rule-based tagging
 */
class AITaggingService {
  constructor() {
    this.flashModel = models.flash;
    this.maxRetries = 2;
    this.retryDelay = 500; // milliseconds
    this.rateLimitDelay = 1000; // milliseconds between requests
    this.lastRequestTime = 0;
  }

  /**
   * Apply rate limiting to prevent API throttling
   */
  async _applyRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.rateLimitDelay) {
      const waitTime = this.rateLimitDelay - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }

  /**
   * Build the prompt for AI tagging
   */
  _buildTaggingPrompt(internship) {
    return `Analyze this internship posting and provide structured tags in JSON format.

Internship Details:
Title: ${internship.title}
Description: ${internship.description}
Required Skills: ${internship.requiredSkills.join(", ")}
Department: ${internship.department}
Duration: ${internship.duration}
Responsibilities: ${(internship.responsibilities || []).join(", ")}

Provide a JSON response with the following structure:
{
  "skills": ["skill1", "skill2", ...],
  "difficulty": "beginner|intermediate|advanced",
  "careerPath": "Software Engineering|Data Science|DevOps|etc",
  "industries": ["industry1", "industry2"],
  "learningIntensity": "low|moderate|high",
  "technicalDepth": "shallow|moderate|deep"
}

Consider:
- Difficulty based on required skills complexity and experience level
- Career path based on role type and responsibilities
- Learning intensity based on duration and scope
- Technical depth based on technical requirements

Return only valid JSON, no additional text.`;
  }

  /**
   * Build the prompt for match score calculation
   */
  _buildMatchScorePrompt(studentProfile, internshipData) {
    return `Calculate a match score (0-100) between this student and internship.

Student Profile:
- Skills: ${(studentProfile.skills || []).join(", ")}
- Department: ${studentProfile.department}
- Year: ${studentProfile.year || "N/A"}
- Readiness Score: ${studentProfile.readinessScore || "N/A"}

Internship:
- Required Skills: ${(internshipData.requiredSkills || []).join(", ")}
- Department: ${internshipData.department}
- Difficulty: ${internshipData.aiTags?.difficulty || "intermediate"}

Provide a JSON response:
{
  "matchScore": 85,
  "reasoning": "Brief explanation",
  "strengths": ["strength1", "strength2"],
  "concerns": ["concern1", "concern2"]
}

Return only valid JSON.`;
  }

  /**
   * Parse JSON response from Gemini, handling various formats
   */
  _parseJSONResponse(text) {
    try {
      // Remove markdown code blocks if present
      const cleanText = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      return JSON.parse(cleanText);
    } catch (error) {
      logger.error("Failed to parse AI JSON response", { text, error: error.message });
      throw new Error("AI response was not valid JSON");
    }
  }

  /**
   * Make API call with retry logic
   */
  async _callGeminiWithRetry(prompt, retries = this.maxRetries) {
    try {
      await this._applyRateLimit();
      
      const result = await this.flashModel.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3, // Lower temperature for more consistent structured output
          maxOutputTokens: config.gemini.maxOutputTokens,
        },
      });

      const response = result.response;
      const text = response.text();
      
      return text;
    } catch (error) {
      if (retries > 0) {
        logger.warn(`Gemini API call failed, retrying... (${retries} retries left)`, {
          error: error.message,
        });
        
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * (this.maxRetries - retries + 1)));
        return this._callGeminiWithRetry(prompt, retries - 1);
      }
      
      throw error;
    }
  }

  /**
   * Infer difficulty based on skill count and complexity
   */
  _inferDifficulty(internship) {
    const skillCount = (internship.requiredSkills || []).length;
    const hasAdvancedKeywords = /senior|lead|architect|expert|advanced/i.test(
      internship.title + " " + internship.description
    );
    
    if (hasAdvancedKeywords || skillCount > 8) return "advanced";
    if (skillCount <= 3) return "beginner";
    return "intermediate";
  }

  /**
   * Infer career path from department
   */
  _inferCareerPath(department) {
    const pathMap = {
      "Computer Science": "Software Engineering",
      "Information Technology": "Software Engineering",
      "Data Science": "Data Science",
      "Artificial Intelligence": "AI/ML Engineering",
      "Machine Learning": "AI/ML Engineering",
      "Mechanical": "Mechanical Engineering",
      "Electrical": "Electrical Engineering",
      "Electronics": "Electronics Engineering",
      "Civil": "Civil Engineering",
      "Chemical": "Chemical Engineering",
      "Business": "Business Management",
      "Marketing": "Marketing",
      "Finance": "Finance",
      "Design": "Design",
    };
    
    // Try exact match first
    if (pathMap[department]) return pathMap[department];
    
    // Try partial match
    for (const [key, value] of Object.entries(pathMap)) {
      if (department.includes(key) || key.includes(department)) {
        return value;
      }
    }
    
    return "General";
  }

  /**
   * Extract industries from description and department
   */
  _inferIndustries(internship) {
    const industries = new Set();
    const text = (internship.title + " " + internship.description).toLowerCase();
    
    const industryKeywords = {
      "Technology": ["software", "tech", "digital", "it", "computer"],
      "Finance": ["finance", "banking", "fintech", "investment"],
      "Healthcare": ["health", "medical", "pharma", "biotech"],
      "E-commerce": ["ecommerce", "e-commerce", "retail", "shopping"],
      "Education": ["education", "edtech", "learning", "training"],
      "Manufacturing": ["manufacturing", "production", "industrial"],
      "Consulting": ["consulting", "advisory", "strategy"],
      "Media": ["media", "entertainment", "content", "publishing"],
    };
    
    for (const [industry, keywords] of Object.entries(industryKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        industries.add(industry);
      }
    }
    
    // Add department as fallback
    if (industries.size === 0) {
      industries.add(internship.department);
    }
    
    return Array.from(industries);
  }

  /**
   * Get fallback tags using rule-based logic
   */
  _getFallbackTags(internship) {
    return {
      primarySkills: (internship.requiredSkills || []).slice(0, 7),
      difficulty: this._inferDifficulty(internship),
      careerPath: this._inferCareerPath(internship.department),
      industryFit: this._inferIndustries(internship),
      learningIntensity: "moderate",
      technicalDepth: "moderate",
      generatedAt: new Date(),
    };
  }

  /**
   * Generate AI tags for an internship
   * @param {Object} internshipData - Internship data to tag
   * @param {Object} options - Options including userId for tracking
   * @returns {Object} AI-generated tags
   */
  async generateTags(internshipData, options = {}) {
    const { userId = "system", trackUsageFlag = true } = options;
    
    try {
      const prompt = this._buildTaggingPrompt(internshipData);
      const responseText = await this._callGeminiWithRetry(prompt);
      
      // Track usage
      if (trackUsageFlag) {
        const inputTokens = estimateTokens(prompt);
        const outputTokens = estimateTokens(responseText);
        
        await trackUsage({
          userId,
          role: "system",
          feature: "internship_tagging",
          model: "flash",
          tokensUsed: { input: inputTokens, output: outputTokens },
          metadata: { internshipId: internshipData.internshipId },
        });
      }
      
      const tags = this._parseJSONResponse(responseText);
      
      return {
        primarySkills: tags.skills || [],
        difficulty: tags.difficulty || "intermediate",
        careerPath: tags.careerPath || "General",
        industryFit: tags.industries || [],
        learningIntensity: tags.learningIntensity || "moderate",
        technicalDepth: tags.technicalDepth || "moderate",
        generatedAt: new Date(),
      };
    } catch (error) {
      logger.error("AI tagging failed, using fallback", {
        error: error.message,
        internshipId: internshipData.internshipId,
      });
      
      return this._getFallbackTags(internshipData);
    }
  }

  /**
   * Calculate match score between student and internship
   * @param {Object} studentProfile - Student profile data
   * @param {Object} internshipData - Internship data
   * @param {Object} options - Options including userId for tracking
   * @returns {Object} Match score and analysis
   */
  async calculateMatchScore(studentProfile, internshipData, options = {}) {
    const { userId = "system", trackUsageFlag = true } = options;
    
    try {
      const prompt = this._buildMatchScorePrompt(studentProfile, internshipData);
      const responseText = await this._callGeminiWithRetry(prompt);
      
      // Track usage
      if (trackUsageFlag) {
        const inputTokens = estimateTokens(prompt);
        const outputTokens = estimateTokens(responseText);
        
        await trackUsage({
          userId,
          role: "student",
          feature: "internship_matching",
          model: "flash",
          tokensUsed: { input: inputTokens, output: outputTokens },
          metadata: {
            studentId: studentProfile.studentId,
            internshipId: internshipData.internshipId,
          },
        });
      }
      
      const result = this._parseJSONResponse(responseText);
      
      return {
        matchScore: result.matchScore || 50,
        reasoning: result.reasoning || "Unable to calculate detailed match",
        strengths: result.strengths || [],
        concerns: result.concerns || [],
      };
    } catch (error) {
      logger.error("Match score calculation failed", {
        error: error.message,
        studentId: studentProfile.studentId,
        internshipId: internshipData.internshipId,
      });
      
      // Return basic fallback score
      return {
        matchScore: 50,
        reasoning: "Unable to calculate detailed match due to AI service error",
        strengths: [],
        concerns: [],
      };
    }
  }
}

// Export singleton instance
export const aiTaggingService = new AITaggingService();
export default aiTaggingService;
