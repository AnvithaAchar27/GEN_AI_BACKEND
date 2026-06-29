const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const interviewController = require("../controller/interview.controller");
const upload = require("../middlewares/file.middleware");

const interviewRouter = express.Router();

/**
 * @route POST /api/interview/
 * @description generate new interview report based on the given resume, job description and self description
 * @access private
 * 
 */

interviewRouter.post("/", authMiddleware.authUser, upload.single("resume"), interviewController.generateInterviewReportController);

/**
 * @route GET /api/interview/report/:interviewId
 * @description get interview report by interviewId
 * @access private
 */
interviewRouter.get("/report/:interviewId", authMiddleware.authUser, interviewController.getInterviewReportByIdController);


/**
 * @route GET /api/interview/
 * @description get all interview reports of the logged in user
 * @access private
 */

interviewRouter.get("/", authMiddleware.authUser, interviewController.getAllInterviewReportsController);

/**
 * @route POST /api/interview/resume/pdf
 * @description generate resume pdf based on the given resume, job description and self description
 * @access private
 */

interviewRouter.post("/resume/pdf/:interviewReportId", authMiddleware.authUser, interviewController.generateResumePdfController);

module.exports = interviewRouter;