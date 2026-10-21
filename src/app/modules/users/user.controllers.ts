import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { UserService } from "./user.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";

const registerUser = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;

  const result = await UserService.registerUser(payload);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "user created successfully",
    data: result,
  });
});

export const UserController = { registerUser };
