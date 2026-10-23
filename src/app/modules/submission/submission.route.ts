import { Router } from "express";
import { auth } from "../../middlewares/checkAuth";
import { UserRole } from "../../../../generated/prisma/enums";
import { SubmissionController } from "./submission.controller";

const router = Router();

router.post(
  "/submit",
  auth(UserRole.STUDENT),
  SubmissionController.projectSubmission,
);

router.get(
  "/my-submission",
  auth(UserRole.STUDENT),
  SubmissionController.mySubmission,
);

router.get(
  "/all-submissions",
  auth(UserRole.ADMIN),
  SubmissionController.getAllSubmission,
);

router.patch(
  "/review-submission/:submissionId",
  auth(UserRole.ADMIN),
  SubmissionController.reviewSubmission,
);

export const SubmissionRoutes = router;
