import type { NextFunction, Request, Response } from "express";
import type { JwtPayload } from "jsonwebtoken";
import httpStatus from "http-status";
import { UserRole } from "../../../generated/prisma/enums";
import { catchAsync } from "../utils/catchAsync";
import { AppError } from "../utils/AppError";
import { jwtUtils } from "../utils/jwt";
import config from "../config";
import { prisma } from "../lib/prisma";

export interface RequestUser {
  email: string;
  name: string;
  userId: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: RequestUser;
    }
  }
}

export const auth = (...requiredRoles: UserRole[]) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies?.accessToken
      ? req.cookies.accessToken
      : req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.slice(7)
        : undefined;

    if (!token) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        "You are not logged in. Please log in to access this resource.",
      );
    }

    const verifiedToken = jwtUtils.verifyToken(token, config.jwt_access_secret);

    if (!verifiedToken.success) {
      throw new AppError(httpStatus.UNAUTHORIZED, verifiedToken.error);
    }

    const { userId } = verifiedToken.data as JwtPayload & {
      userId: string;
    };

    if (!userId) {
      throw new AppError(httpStatus.UNAUTHORIZED, "Invalid access token.");
    }

    // 1. Find the user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    // 2. Ensure the user exists
    if (!user) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        "User not found. Please log in again.",
      );
    }

    // 3. Check account status
    if (user.useStatus === "BLOCKED") {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "Your account has been blocked. Please contact support.",
      );
    }

    // 4. Check the current database role
    if (requiredRoles.length > 0 && !requiredRoles.includes(user.userRole)) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "Forbidden. You don't have permission to access this resource.",
      );
    }

    // 5. Attach authenticated user data
    req.user = {
      email: user.email,
      name: user.name,
      userId: user.id,
      role: user.userRole,
    };

    next();
  });
};
