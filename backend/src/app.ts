import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env";
import { errorHandler } from "./shared/middlewares/errorHandler";
import authRoutes from "./modules/auth/auth.routes";
import contactsRoutes from "./modules/contacts/contacts.routes";
import campaignsRoutes from "./modules/campaigns/campaigns.routes";
import interactionsRoutes from "./modules/interactions/interactions.routes";
import aiRoutes from "./modules/ai/ai.routes";
import dashboardRoutes from "./modules/dashboard/dashboard.routes";
import messagingRoutes from "./modules/messaging/messaging.routes";

const app = express();

app.set("trust proxy", 1);
app.use(helmet());
const allowedOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim());
app.use(cors({ origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins }));
app.use(express.json({ limit: "100kb" }));

app.get("/health", (_, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/contacts", contactsRoutes);
app.use("/api/campaigns", campaignsRoutes);
app.use("/api/interactions", interactionsRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/messaging", messagingRoutes);

app.use(errorHandler);

export default app;