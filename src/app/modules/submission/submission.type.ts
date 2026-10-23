export interface ProjectSubmissionPayload {
  projectName: string;
  projectLiveLink: string;
  githubLink: string;
  description: string;
}
export interface ReviewSubmissionPayload {
  status: "APPROVED" | "REJECTED";
  rejectReason?: string;
}
