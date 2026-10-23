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

export const SubmissionRoutes = router;
