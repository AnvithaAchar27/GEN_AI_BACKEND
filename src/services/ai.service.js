const {GoogleGenAI} = require("@google/genai")
const {z} = require("zod");
const {zodToJsonSchema} = require("zod-to-json-schema")

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY
})


const interviewReportSchema = z.object({
  matchScore: z
    .number()
    .min(0)
    .max(100)
    .describe(
      "A score between 0 and 100 indicating how well the candidate matches the job description"
    ),

  technicalQuestions: z.array(
    z.object({
      question: z
        .string()
        .describe("The technical question can be asked in the interview"),
      intention: z
        .string()
        .describe("The intention of interviewer behind asking this question"),
      answer: z
        .string()
        .describe(
          "How to answer this question, what points to cover, what approach to follow"
        ),
    })
  ).describe(
    "Technical questions that can be asked in the interview along with their intention"
  ),

  behavioralQuestions: z.array(
    z.object({
      question: z
        .string()
        .describe("The behavioral question can be asked in the interview"),
      intention: z
        .string()
        .describe("The intention of interviewer behind asking this question"),
      answer: z
        .string()
        .describe(
          "How to answer this question, what points to cover, what approach to follow"
        ),
    })
  ).describe(
    "Behavioral questions that can be asked in the interview along with their intention"
  ),

  skillGaps: z.array(
    z.object({
      skill: z
        .string()
        .describe("The skill which the candidate is lacking"),
      severity: z
        .enum(["low", "medium", "high"])
        .describe("The severity of this skill gap"),
    })
  ).describe(
    "List of skill gaps in the candidate's profile along with their severity"
  ),

  preparationPlan: z.array(
    z.object({
      day: z
        .number()
        .describe("The day number in the preparation plan"),
      focus: z
        .string()
        .describe("The main focus of this day in the preparation"),
      tasks: z
        .array(z.string())
        .describe("List of tasks to be done on this day"),
    })
  ).describe(
    "A day-wise preparation plan for the candidate to follow"
  ),
});


async function generateInterviewReport({resume, selfDescription, jobDescription}){

const prompt = `
Generate a structured interview report in STRICT JSON format.

IMPORTANT:
matchScore must be a NUMBER between 0 and 100.

technicalQuestions must be:

[
  {
    "question":"...",
    "intention":"...",
    "answer":"..."
  }
]

behavioralQuestions must be:

[
  {
    "question":"...",
    "intention":"...",
    "answer":"..."
  }
]

skillGaps must be:

[
  {
    "skill":"...",
    "severity":"low"
  }
]

preparationPlan must be:

[
  {
    "day":1,
    "focus":"...",
    "tasks":["...","..."]
  }
]

RULES:
- Return ONLY valid JSON
- Do NOT return null
- Do NOT return arrays of strings
- Do NOT return explanations
- Do NOT return key-value pairs in sequence
- Every array item must be an object
- matchScore must be a number

Fields required:
matchScore,
technicalQuestions,
behavioralQuestions,
skillGaps,
preparationPlan

Resume: ${resume}

Self Description: ${selfDescription}

Job Description: ${jobDescription}
`;


    const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
        responseMimeType: "application/json"
    }
})

   console.log("RAW RESPONSE:");
console.log(response.text);

const result = JSON.parse(response.text);

console.log("RESULT:");
console.log(result);

return result;
}

module.exports = generateInterviewReport;