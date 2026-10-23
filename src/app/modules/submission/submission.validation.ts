import { z } from "zod";

export const reviewSubmissionSchema = z
  .object({
    status: z.enum(["APPROVED", "REJECTED"]),
    rejectReason: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.status === "REJECTED" && !data.rejectReason) {
      ctx.addIssue({
        code: "custom",
        path: ["rejectReason"],
        message: "Rejection reason is required.",
      });
    }
  });