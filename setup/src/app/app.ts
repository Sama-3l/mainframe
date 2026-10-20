import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";

export function createApp(): Application {
  const app = express();

  app.set("trust proxy", 1); // needed for correct req.ip behind a reverse proxy / load balancer

  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  return app;
}
