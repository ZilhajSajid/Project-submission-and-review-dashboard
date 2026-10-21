import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma";
import { LoginPayload } from "./auth.type";
import { AppError } from "../../utils/AppError";
import httpStatus from "http-status";
import jwt, { SignOptions } from "jsonwebtoken";
import config from "../../config";
import { jwtUtils } from "../../utils/jwt";

const loginUser = async (payload: LoginPayload) => {
  const { email, password } = payload;
  const isUserExist = await prisma.user.findUniqueOrThrow({
    where: { email },
  });
  const isPasswordMatched = await bcrypt.compare(
    password,
    isUserExist.password,
  );

  if (!isPasswordMatched) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Password is incorrect");
  }

  const jwtPayload = {
    id: isUserExist.id,
    name: isUserExist.name,
    email: isUserExist.email,
    role: isUserExist.userRole,
  };

  const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expiration as SignOptions,
  );
  const refreshToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_expiration as SignOptions,
  );

  return { accessToken, refreshToken };
};

export const AuthService = { loginUser };
