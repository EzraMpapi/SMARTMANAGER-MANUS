import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { scheduledDashboardReportHandler } from "../scheduledDashboardReport";
import { scheduledSchemaDriftMonitorHandler } from "../scheduledSchemaDriftMonitor";
import { scheduledTraVatAnomalyHandler } from "../scheduledTraVatAnomaly";
import { scheduledTraZReportArchiveHandler } from "../scheduledTraZReportArchive";
import { scheduledMarketHealthDigestHandler } from "../scheduledMarketHealthDigest";
import { scheduledAppointmentRemindersHandler } from "../scheduledAppointmentReminders";
import { healthcareReminderDeliveryWebhookHandler } from "../healthcareReminderWebhook";
import { scheduledPortalReferenceReconciliationDigestHandler } from "../scheduledPortalReferenceReconciliationDigest";
import { scheduledMicrofinanceParCollectionsEscalationHandler } from "../scheduledMicrofinanceParCollectionsEscalation";
import { scheduledSubscriptionTrialLifecycleHandler } from "../scheduledSubscriptionTrialLifecycle";
import { fleetActionHandler, fleetSnapshotHandler, fleetTelematicsWebhookHandler, scheduledFleetAlertsHandler } from "../fleetManagement";
import { scheduledRestaurantAlertsHandler } from "../restaurantManagement";
import {
  harakaPayBalanceHandler,
  harakaPayCollectHandler,
  harakaPayStatusHandler,
  harakaPayWebhookHandler,
  subscriptionBillingCatalogHandler,
  subscriptionBillingPlanHandler,
  subscriptionBillingProfileHandler,
  subscriptionBillingSelectTrialPlanHandler,
  subscriptionBillingSnapshotHandler,
  subscriptionBillingStartTrialHandler,
} from "../subscriptionBilling";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  app.post("/api/webhooks/healthcare-sms-delivery", express.raw({ type: "application/json", limit: "64kb" }), healthcareReminderDeliveryWebhookHandler);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.post("/api/payments/harakapay/webhook", harakaPayWebhookHandler);
  app.get("/api/billing/catalog", subscriptionBillingCatalogHandler);
  app.get("/api/billing/subscription", subscriptionBillingSnapshotHandler);
  app.get("/api/fleet/snapshot", fleetSnapshotHandler);
  app.post("/api/fleet/action", fleetActionHandler);
  app.post("/api/webhooks/fleet-telematics", fleetTelematicsWebhookHandler);
  app.post("/api/billing/trial/start", subscriptionBillingStartTrialHandler);
  app.post("/api/billing/trial/select-plan", subscriptionBillingSelectTrialPlanHandler);
  app.post("/api/billing/profile", subscriptionBillingProfileHandler);
  app.post("/api/billing/plans", subscriptionBillingPlanHandler);
  app.post("/api/payments/harakapay/collect", harakaPayCollectHandler);
  app.get("/api/payments/harakapay/status/:orderId", harakaPayStatusHandler);
  app.get("/api/payments/harakapay/balance", harakaPayBalanceHandler);
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  app.post("/api/scheduled/dashboardReport", scheduledDashboardReportHandler);
  app.post("/api/scheduled/schemaDriftMonitor", scheduledSchemaDriftMonitorHandler);
  app.post("/api/scheduled/traVatAnomaly", scheduledTraVatAnomalyHandler);
  app.post("/api/scheduled/traZReportArchive", scheduledTraZReportArchiveHandler);
  app.post("/api/scheduled/marketHealthDigest", scheduledMarketHealthDigestHandler);
  app.post("/api/scheduled/appointmentReminders", scheduledAppointmentRemindersHandler);
  app.post("/api/scheduled/portalReferenceReconciliationDigest", scheduledPortalReferenceReconciliationDigestHandler);
  app.post("/api/scheduled/microfinanceParCollectionsEscalation", scheduledMicrofinanceParCollectionsEscalationHandler);
  app.post("/api/scheduled/subscriptionTrialLifecycle", scheduledSubscriptionTrialLifecycleHandler);
  app.post("/api/scheduled/fleetAlerts", scheduledFleetAlertsHandler);
  app.post("/api/scheduled/restaurantAlerts", scheduledRestaurantAlertsHandler);
  app.post("/api/webhooks/backup-complete", async (req, res) => {
    try {
      const { handleBackupCompletionWebhook } = await import("../backupWebhook");
      await handleBackupCompletionWebhook(req, res);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
