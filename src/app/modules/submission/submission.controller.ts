import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { SubmissionService } from "./submission.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";

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

export const SubmissionController = { projectSubmission };
