import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { ProjectSubmissionPayload } from "./submission.type";
import httpStatus from "http-status";

const projectSubmission = async (
  payload: ProjectSubmissionPayload,
  studentId: string,
) => {
  const existingSubmission = await prisma.submission.findUnique({
    where: { studentId },
  });

  if (existingSubmission) {
    throw new AppError(
      httpStatus.CONFLICT,
      "You have already submitted your assignment",
    );
  }
  const submission = await prisma.submission.create({
    data: { ...payload, studentId },
  });
  return submission;
};

export const SubmissionService = { projectSubmission };
