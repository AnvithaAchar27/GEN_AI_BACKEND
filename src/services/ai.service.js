const { GoogleGenAI } = require("@google/genai")
const { z } = require("zod")
const { zodToJsonSchema } = require("zod-to-json-schema")
const puppeteer = require("puppeteer")


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

  // ✅ Added title
  title: z
    .string()
    .describe("The title of the job for which the interview report is generated")
})

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {

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
title,
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

  console.log("RAW RESPONSE:")
  console.log(response.text)

  const result = JSON.parse(response.text)

  console.log("RESULT:")
  console.log(result)

  return result
}

async function generatePdfFromHtml(htmlContent) {
  const browser = await puppeteer.launch()
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: "networkidle0" })

  const pdfBuffer = await page.pdf({ format: "A4", margin:{top:"20mm", bottom:"20mm", left:"15mm", right:"15mm"} })

  await browser.close() 

  return pdfBuffer
}

async function generateResumePdf({ resume, selfDescription, jobDescription }) {

    const resumePdfSchema = z.object({
        html: z
            .string()
            .describe(
                "The HTML content of the resume which can be converted to PDF using Puppeteer."
            )
    });

 const prompt = `
You are a senior resume writer and career consultant with over 20 years of experience creating resumes that successfully pass ATS systems and help candidates get interviews at top technology companies such as Google, Microsoft, Amazon, Meta, Apple, Adobe, Atlassian, NVIDIA, and Uber.

Your task is to generate a COMPLETE, PROFESSIONAL, HUMAN-LIKE HTML resume.

Candidate Resume:
${resume}

Self Description:
${selfDescription}

Target Job Description:
${jobDescription}

=========================
OBJECTIVE
=========================

Create a resume that looks exactly like one written by an experienced professional resume writer.

The resume should maximize the candidate's chances of getting shortlisted for the given job.

Tailor every section according to the job description.

Do NOT simply copy the provided resume.

Rewrite and improve the wording professionally.

=========================
RULES
=========================

• Return ONLY JSON.
• The JSON must contain exactly one field named "html".
• The html field must contain a COMPLETE HTML document.

Do NOT return markdown.

Do NOT return explanations.

Do NOT return plain text.

=========================
CONTENT REQUIREMENTS
=========================

The resume should contain:

• Full Name
• Contact Information
• Professional Summary
• Technical Skills
• Projects
• Work Experience (if available)
• Education
• Certifications (if available)
• Achievements (if available)

Professional Summary:

- 3-5 lines.
- Human sounding.
- Tailored specifically for this job.
- Highlight strengths relevant to the job.

Projects:

For every project include

• Technologies used
• What was built
• Candidate's contribution
• Business impact

Skills:

Prioritize skills mentioned in the Job Description.

Do NOT include irrelevant technologies.

Use professional bullet points.

=========================
DESIGN REQUIREMENTS
=========================

Generate a COMPLETE HTML document.

Include:

<html>
<head>
<style>
...
</style>
</head>
<body>
...
</body>
</html>

The resume must look like a professionally designed resume.

Use:

• White background
• Dark blue section headings
• Black text
• Modern typography
• Arial, Calibri or Segoe UI
• Horizontal divider lines
• Proper spacing
• Equal margins
• Clean layout
• Bullet points
• Responsive A4 layout
• ATS Friendly formatting

Do NOT use:

❌ Tables
❌ Emojis
❌ Icons
❌ Fancy graphics
❌ Bright colors
❌ AI wording

=========================
VERY IMPORTANT
=========================

The resume should NOT sound AI generated.

Use natural, fluent English.

Write like an experienced recruiter.

Do not exaggerate.

Do not invent fake companies.

Do not invent fake achievements.

If information is missing, organize the available information professionally.

The final resume should be realistic enough that a recruiter cannot distinguish it from a professionally written real-world resume.

Return ONLY valid JSON.
`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(resumePdfSchema),
        },
    });

    const jsonContent = JSON.parse(response.text);

    const pdfBuffer = await generatePdfFromHtml(jsonContent.html);

    return pdfBuffer;
}

  module.exports = {  generateInterviewReport, generateResumePdf }