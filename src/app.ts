import cors from "cors";
import config from "./app/config";
import express, { Application, Request, Response } from "express";
import cookieParser from "cookie-parser";
import { UserRoutes } from "./app/modules/users/user.route";
import { AuthRoutes } from "./app/modules/auth/auth.route";

const app: Application = express();

app.use(
  cors({
    origin: config.app_url,
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (req: Request, res: Response) => {
  res.send("Welcome to simple project submission and review dashboard");
});

app.use("/api/v1/user", UserRoutes);
app.use("/api/v1/auth", AuthRoutes);

export default app;
