import { Prisma } from "../../../../generated/prisma/browser";
import { SubmissionWhereInput } from "../../../../generated/prisma/models";
import { IQuery } from "../../interfaces";
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

const mySubmission = async (studentId: string) => {
  const submission = await prisma.submission.findUnique({
    where: {
      studentId,
    },
  });

  if (!submission) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "You have not submitted any project yet.",
    );
  }

  return submission;
};

const getAllSubmission = async (query: IQuery) => {
  const limit = query.limit ? Number(query.limit) : 10;
  const page = query.page ? Number(query.page) : 1;
  const skip = (page - 1) * limit;

  const sortBy = query.sortBy || "createdAt";
  const sortOrder = query.sortOrder || "desc";

  const andConditions: SubmissionWhereInput[] = [];
  // Search
  if (query.searchTerm) {
    andConditions.push({
      OR: [
        {
          projectName: {
            contains: query.searchTerm,
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: query.searchTerm,
            mode: "insensitive",
          },
        },
      ],
    });
  }

  // Filter by status
  if (query.status) {
    andConditions.push({
      status: query.status,
    });
  }

  const whereConditions: Prisma.SubmissionWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const [submissions, total] = await prisma.$transaction([
    prisma.submission.findMany({
      where: whereConditions,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
    }),
    prisma.submission.count({
      where: whereConditions,
    }),
  ]);

  return {
    data: submissions,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const SubmissionService = {
  projectSubmission,
  mySubmission,
  getAllSubmission,
};
