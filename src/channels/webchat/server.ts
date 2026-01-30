import express from "express";
import { logger } from "../../utils/logger";

export function registerWebChat(app: express.Express, staticDir: string): void {
  app.use("/webchat", express.static(staticDir));
  logger.info("WebChat available at /webchat");
}
