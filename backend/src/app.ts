import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env";
import { errorHandler } from "./shared/middlewares/errorHandler";
import authRoutes from "./modules/auth/auth.routes";
import contactsRoutes from "./modules/contacts/contacts.routes";
import campaignsRoutes from "./modules/campaigns/campaigns.routes";
import interactionsRoutes from "./modules/interactions/interactions.routes";

const app = express();

app.set("trust proxy", 1);
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json({ limit: "100kb" }));

app.get("/health", (_, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/contacts", contactsRoutes);
app.use("/api/campaigns", campaignsRoutes);
app.use("/api/interactions", interactionsRoutes);

app.use(errorHandler);

export default app;