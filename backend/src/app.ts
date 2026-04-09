import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { errorHandler } from "./shared/middlewares/errorHandler";
import authRoutes from "./modules/auth/auth.routes";
import contactsRoutes from "./modules/contacts/contacts.routes";
import campaignsRoutes from "./modules/campaigns/campaigns.routes";

const app = express();

app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json());

app.get("/health", (_, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/contacts", contactsRoutes);
app.use("/api/campaigns", campaignsRoutes);

app.use(errorHandler);

export default app;