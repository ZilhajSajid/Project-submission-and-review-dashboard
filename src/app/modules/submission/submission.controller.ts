import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { SubmissionService } from "./submission.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";
import { reviewSubmissionSchema } from "./submission.validation";
import { AppError } from "../../utils/AppError";

const projectSubmission = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const studentId = req.user?.userId!;

  const result = await SubmissionService.projectSubmission(payload, studentId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Project Submitted",
    data: result,
  });
});
const mySubmission = catchAsync(async (req: Request, res: Response) => {
  const studentId = req.user?.userId!;

  const result = await SubmissionService.mySubmission(studentId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "My Submissions retrieved successfully",
    data: result,
  });
});
const getAllSubmission = catchAsync(async (req: Request, res: Response) => {
  const query = req.query;
  const result = await SubmissionService.getAllSubmission(query);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "All Submissions retrieved successfully",
    data: result,
  });
});
const reviewSubmission = catchAsync(async (req: Request, res: Response) => {
  const adminId = req.user?.userId!;
  const payload = reviewSubmissionSchema.parse(req.body);
  const submissionId = req.params.submissionId;
  if (typeof submissionId !== "string" || !submissionId.trim()) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid submission ID.");
  }
  const result = await SubmissionService.reviewSubmission(
    submissionId,
    adminId,
    payload,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: `Submission ${payload.status.toLowerCase()} successfully.`,
    data: result,
  });
});

export const SubmissionController = {
  projectSubmission,
  mySubmission,
  getAllSubmission,
  reviewSubmission,
};
