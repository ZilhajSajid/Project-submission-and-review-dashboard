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

export const SubmissionRoutes = router;
