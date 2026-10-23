import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { AuthService } from "./auth.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";
import config from "../../config";

const loginUser = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const { accessToken, refreshToken } = await AuthService.loginUser(payload);

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: config.node_env !== "development",
    sameSite:
      config.node_env === "development" ? ("lax" as const) : ("none" as const),
    maxAge: 1000 * 60 * 60 * 24,
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: config.node_env !== "development",
    sameSite:
      config.node_env === "development" ? ("lax" as const) : ("none" as const),
    maxAge: 1000 * 68 * 60 * 24 * 7,
  });

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "User logged successfully",
    data: { accessToken, refreshToken },
  });
});

const logout = catchAsync(async (req, res, next) => {
  const cookieOptions = {
    httpOnly: true,
    secure: config.node_env !== "development",
    sameSite:
      config.node_env === "development" ? ("lax" as const) : ("none" as const),
    path: "/",
  };

  res.clearCookie("accessToken", cookieOptions);
  res.clearCookie("refreshToken", cookieOptions);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User logged out successfully",
    data: null,
  });
});
export const AuthController = { loginUser,logout };
