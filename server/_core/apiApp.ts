import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { ENV } from "./env";
import { appRouter } from "../routers";
import { createContext } from "./context";
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
import { scheduledPropertyControlsHandler } from "../propertyManagement";
import {
  harakaPayBalanceHandler,
  harakaPayCollectHandler,
  harakaPayStatusHandler,
  harakaPayWebhookHandler,
  subscriptionBillingAccessHandler,
  subscriptionBillingCatalogHandler,
  subscriptionBillingPlanHandler,
  subscriptionBillingProfileHandler,
  subscriptionBillingSelectTrialPlanHandler,
  subscriptionBillingSnapshotHandler,
  subscriptionBillingStartTrialHandler,
} from "../subscriptionBilling";

/**
 * Build the API-only Express application used by Vercel and by the local server.
 * Static hosting is deliberately kept outside this function so /api/* cannot fall
 * through to the SPA index.html on a serverless deployment.
 */
export function createApiApp() {
  const app = express();

  app.post("/api/webhooks/healthcare-sms-delivery", express.raw({ type: "application/json", limit: "64kb" }), healthcareReminderDeliveryWebhookHandler);
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.post("/api/payments/harakapay/webhook", harakaPayWebhookHandler);
  app.get("/api/config/public", (_req, res) => {
    if (!ENV.supabaseUrl || !ENV.supabaseAnonKey) {
      res.status(503).json({ error: "Public authentication configuration is not available." });
      return;
    }
    res.set("Cache-Control", "no-store").json({ url: ENV.supabaseUrl, anonKey: ENV.supabaseAnonKey });
  });
  app.get("/api/billing/catalog", subscriptionBillingCatalogHandler);
  app.get("/api/billing/access", subscriptionBillingAccessHandler);
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
  app.post("/api/scheduled/propertyControls", scheduledPropertyControlsHandler);
  app.post("/api/webhooks/backup-complete", async (req, res) => {
    try {
      const { handleBackupCompletionWebhook } = await import("../backupWebhook");
      await handleBackupCompletionWebhook(req, res);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  return app;
}
