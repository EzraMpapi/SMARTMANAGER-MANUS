import { COOKIE_NAME } from "@shared/const";
import { parse as parseCookie } from "cookie";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getBearerToken } from "./_core/authHeaders";
import { createReportSchedule, deleteReportSchedule, listReportSchedules, sendReportScheduleNow, updateReportSchedule } from "./reportSchedules";
import { listAuditLogs, recordAuditLog } from "./auditLogs";
import { verifyDatabaseBackupStatus } from "./backupVerification";
import { getWebhookConfig, updateWebhookConfig, testWebhookPing, getDeadLetterQueue, listWebhookDeliveryHistory, retryWebhookDelivery } from "./webhooks";
import { TRPCError } from "@trpc/server";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { activateSchemaDriftMonitor, getSchemaDriftMonitor, listSchemaDriftRuns, runSchemaDriftCheck } from "./schemaDriftMonitor";
import { AssistantProviderError, runSmartAssistant } from "./smartAssistant";
import { getGlobalAdminExecutiveSnapshot, getGlobalAdminSnapshot, globalAdminActionInput, recordGlobalAdminAction } from "./globalAdmin";
import { decideActionApproval, requestActionApproval, resolveVerifiedProfile } from "./aiApprovals";
import { decideRoleChangeApproval, dismissNotification, listRoleChangeApprovals, markNotificationRead, requestRoleChangeApproval } from "./roleChangeApprovals";
import { saveWorkspaceBranding } from "./workspaceBranding";
import { getWorkspaceSettings, saveWorkspaceSettings } from "./workspaceSettings";
import { dashboardPreferencesInput, getDashboardPreferences, saveDashboardPreferences } from "./dashboardPreferences";
import { acceptTeamInvitation, createTeamInvitation, listTeamInvitations, resendTeamInvitation, revokeTeamInvitation } from "./teamInvitations";
import { getTeamWorkforceSnapshot } from "./teamWorkforce";
import { sendWorkspaceEmail } from "./transactionalEmail";
import { provisionConfirmedPasswordAccount } from "./passwordAccountProvisioning";
import { addSupportInternalNote, createSupportTicket, draftSupportTicketReply, getSupportWhatsAppProviderReadiness, testSupportWhatsAppProviderConfig, listSupportSlaPolicies, listSupportTicketTimeline, listSupportTickets, listSupportWorkflowPolicies, saveSupportSlaPolicy, saveSupportWorkflowPolicy, searchSupportTickets, updateSupportTicket } from "./supportOperations";
import { publicFeedbackInput, submitPublicFeedback } from "./feedbackOperations";
import { traFiscalRouter } from "./traFiscalRouter";
import { canReadTenantPushDeliveryHistory, listTenantPushDeliveryHistory } from "./notificationHistory";
import { getMarketIntelligenceSnapshot, marketIntelligenceConfig } from "./marketIntelligence";
import { getMarketGovernanceData, upsertMarketProviderSettings } from "./marketGovernance";
import { notifyPasskeyRegistration } from "./passkeyRegistrationNotification";
import { dispatchEmailTemplateWorkflowEvent, getEmailTemplateWorkflowStatus, testEmailTemplateWorkflowWebhook } from "./emailTemplateWorkflow";
import { assertPayloadContract } from "./schemaDriftChecker";
import { CRITICAL_SUPABASE_TABLES, persistSupabaseRow } from "./supabasePersistence";
import { archiveHealthcareRecord, createHealthcareRecord, getHealthcareAccess, healthcareArchiveInput, healthcareCreateInput, healthcareListInput, healthcareUpdateInput, listHealthcareRecords, updateHealthcareRecord } from "./healthcareOperations";
import { exportHealthcareFhirBundle, getHealthcareClinicianAnalytics, healthcareAnalyticsInput, healthcareFhirExportInput } from "./healthcareInteroperability";
import { getReminderSettings, listReminderDeliveries, reminderDeliveryListInput, reminderSettingsInput, requestReminderTest, saveReminderSettings } from "./healthcareReminders";
import { getPatientSmsConsentPreferences, patientSmsConsentUpdateInput, updatePatientSmsConsentPreferences } from "./healthcareSelfService";
import { clearPatientPortalReference, clearPatientPortalReferenceInput, linkPatientPortalReference, linkPatientPortalReferenceInput, listPortalReferenceReconciliation, portalReferenceListInput } from "./healthcarePortalReconciliation";
import { applyPortalReferenceImport, decidePortalReferenceApproval, exportPortalReferenceErrors, getPortalReferenceDailySummary, getPortalReferenceSummarySettings, listPortalReferenceDeliveryHistory, listPortalReferenceWorkflow, portalReferenceApprovalDecisionInput, portalReferenceApprovalRequestInput, portalReferenceAuditSearchInput, portalReferenceCsvInput, portalReferenceDeliveryHistoryInput, portalReferenceErrorExportInput, portalReferenceImportApplyInput, portalReferenceSummarySettingsInput, portalReferenceWorkflowListInput, requestPortalReferenceReplacement, savePortalReferenceSummarySettings, searchPortalReferenceAudit, stagePortalReferenceCsvImport } from "./healthcarePortalReconciliationWorkflow";
import { closeMicrofinanceCashSession, createMicrofinanceBorrower, createMicrofinanceCollateral, createMicrofinanceCollection, createMicrofinanceGroup, createMicrofinanceGuarantor, createMicrofinanceProduct, decideMicrofinanceApplication, disburseMicrofinanceLoan, getMicrofinanceCreditScoringSettings, getMicrofinanceEscalationSettings, listMicrofinanceAudit, listMicrofinanceDashboard, listMicrofinanceEscalationHistory, microfinanceApplicationInput, microfinanceBorrowerInput, microfinanceCashCloseInput, microfinanceCashOpenInput, microfinanceCollateralInput, microfinanceCollectionInput, microfinanceCreditScoringSettingsInput, microfinanceDecisionInput, microfinanceDisbursementInput, microfinanceEscalationSettingsInput, microfinanceGroupInput, microfinanceGuarantorInput, microfinanceListInput, microfinanceProductInput, microfinanceRepaymentInput, microfinanceSavingsInput, openMicrofinanceCashSession, recordMicrofinanceRepayment, recordMicrofinanceSavings, saveMicrofinanceCreditScoringSettings, saveMicrofinanceEscalationSettings, submitMicrofinanceApplication } from "./microfinanceOperations";
import { getMoneyAgentCustomerSnapshot, getMoneyAgentSnapshot, moneyAgentActionInput, moneyAgentListInput, runMoneyAgentAction } from "./moneyAgentOperations";
import { getPropertySnapshot, propertyActionInput, propertyDocumentUploadInput, propertyListInput, runPropertyAction, uploadPropertyDocument } from "./propertyManagementOperations";
import { adjustPharmacyStock, archivePharmacyRecord, completePharmacySale, createPharmacyBrand, createPharmacyCategory, createPharmacyInsuranceClaim, createPharmacyMedicine, createPharmacyPurchaseOrder, createPharmacySupplier, createPharmacyTransfer, dispensePharmacyPrescription, getPharmacyAccess, getPharmacyClinicalQueue, getPharmacyDashboard, getPharmacyReports, listPharmacyAudit, listPharmacyRecords, markPharmacyNotificationRead, pharmacyAdjustmentInput, pharmacyArchiveInput, pharmacyBrandInput, pharmacyBrandUpdateInput, pharmacyCategoryInput, pharmacyCategoryUpdateInput, pharmacyClinicalQueueInput, pharmacyDispenseInput, pharmacyInsuranceClaimInput, pharmacyListInput, pharmacyMedicineInput, pharmacyMedicineUpdateInput, pharmacyNotificationInput, pharmacyPaymentInput, pharmacyPurchaseOrderInput, pharmacyReceiptInput, pharmacyReturnInput, pharmacySaleInput, pharmacySupplierInput, pharmacySupplierPaymentInput, pharmacySupplierUpdateInput, pharmacyTransferInput, receivePharmacyStock, recordPharmacySalePayment, recordPharmacySupplierPayment, returnPharmacySaleItems, updatePharmacyBrand, updatePharmacyCategory, updatePharmacyMedicine, updatePharmacySupplier } from "./pharmacyOperations";
import { archiveSchoolRecord, assignSchoolService, createSchoolAcademicYear, createSchoolAdmission, createSchoolAnnouncement, createSchoolAssignment, createSchoolAssessment, createSchoolClass, createSchoolDepartment, createSchoolDisciplineRecord, createSchoolDocument, createSchoolFeeStructure, createSchoolGradingScale, createSchoolLibraryLoan, createSchoolServiceRecord, createSchoolStream, createSchoolSubject, createSchoolTeacher, createSchoolTeacherAssignment, createSchoolTerm, createSchoolTimetable, decideSchoolAdmission, decideSchoolApproval, decideSchoolScholarship, getSchoolAccess, getSchoolDashboard, getSchoolPortal, getSchoolReports, issueSchoolFeeInvoice, linkSchoolPortal, listSchoolAudit, listSchoolRecords, markSchoolNotificationRead, openSchoolAttendanceSession, publishSchoolReportCard, recordSchoolAssessmentScores, recordSchoolAttendance, recordSchoolInventoryMovement, recordSchoolPayment, requestSchoolApproval, requestSchoolScholarship, schoolAcademicYearInput, schoolAdmissionDecisionInput, schoolAdmissionInput, schoolAnnouncementInput, schoolApprovalDecisionInput, schoolApprovalRequestInput, schoolArchiveInput, schoolAssignmentInput, schoolAssignmentSubmissionInput, schoolAssessmentInput, schoolAttendanceInput, schoolAttendanceSessionInput, schoolClassInput, schoolDepartmentInput, schoolDisciplineInput, schoolDocumentInput, schoolDocumentUploadInput, schoolFeeStructureInput, schoolGradingScaleInput, schoolIdInput, schoolInventoryMovementInput, schoolInvoiceInput, schoolLibraryLoanInput, schoolListInput, schoolMessageInput, schoolPaymentInput, schoolPortalLinkInput, schoolReportCardInput, schoolScoreInput, schoolScholarshipDecisionInput, schoolScholarshipInput, schoolServiceAssignmentInput, schoolServiceInput, schoolStreamInput, schoolSubjectInput, schoolTeacherAssignmentInput, schoolTeacherInput, schoolTermInput, schoolTimetableInput, sendSchoolMessage, submitSchoolAssignment, uploadSchoolDocument } from "./schoolOperations";
import { activateStandingOrder, addBeneficiary, addCollateral, addGroupMember, addGuarantor, approveStandingOrder, cancelStandingOrder, confirmStandingOrderProviderPayment, createAmlAlert, createGroup, createLoanProduct, createPaymentInstruction, createReconciliation, createStandingOrder, createAccountType as createBankAccountType, customerStatement, decideLoanApplication, disburseLoan, getStandingOrder, listBankMfiSnapshot, listStandingOrders, moveCash, pauseStandingOrder, recordSharePurchase, retryStandingOrderRun, resumeStandingOrder, runStandingOrders, scoreLoanApplication, openAccount, postTransaction, recordRepayment, registerCustomer, resolveAmlAlert, restructureLoan, runDailyControls, setupInstitution, submitLoanApplication, submitStandingOrder, updateKyc, writeOffLoan } from "./bankMfiOperations";
import { getProfileIdentity, removeProfileAvatar, updateProfileIdentity, uploadProfileAvatar } from "./profileIdentity";
import {
  acceptPosSyncSequence,
  completePosSale,
  decideWorkforceRoleAssignment,
  openPosShift,
  posCashMovementInput,
  posCompleteSaleInput,
  posOpenShiftInput,
  posSyncSequenceInput,
  recordPosCashMovement,
  requestWorkforceRoleAssignment,
  workforceRoleAssignmentInput,
  workforceRoleDecisionInput,
} from "./posWorkforceRpcAdapters";

const assistantRateWindows = new Map<string, { startedAt: number; requestCount: number }>();

function enforceAssistantRateLimit(identity: string) {
  const now = Date.now();
  const prior = assistantRateWindows.get(identity);
  const window = !prior || now - prior.startedAt >= 60_000 ? { startedAt: now, requestCount: 0 } : prior;
  window.requestCount += 1;
  assistantRateWindows.set(identity, window);
  if (window.requestCount > 12) {
    throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "The AI Assistant is receiving too many requests. Please wait a minute and try again." });
  }
}

async function requireVerifiedAuditCompany(req: Parameters<typeof resolveVerifiedProfile>[0], companyId: string) {
  const { profile } = await resolveVerifiedProfile(req);
  if (profile.company_id !== companyId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "You cannot access audit history for another workspace." });
  }
  return profile;
}

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  publicFeedback: publicProcedure
    .input(publicFeedbackInput)
    .mutation(({ ctx, input }) => submitPublicFeedback(ctx.req, input)),
  traFiscal: traFiscalRouter,
  globalAdmin: router({
    snapshot: protectedProcedure
      .query(({ ctx }) => getGlobalAdminSnapshot(ctx.req)),
    executiveSnapshot: protectedProcedure
      .query(({ ctx }) => getGlobalAdminExecutiveSnapshot(ctx.req)),
    recordAction: protectedProcedure
      .input(globalAdminActionInput)
      .mutation(({ ctx, input }) => recordGlobalAdminAction(ctx.req, input)),
  }),
  schemaContractAssertion: protectedProcedure
    .input(z.object({ tableName: z.string(), payload: z.record(z.string(), z.unknown()) }))
    .mutation(({ input }) => {
      return assertPayloadContract(input.tableName, input.payload);
    }),
  persistSupabaseCriticalRow: protectedProcedure
    .input(z.object({
      companyId: z.string().uuid(),
      tableName: z.enum(CRITICAL_SUPABASE_TABLES),
      payload: z.record(z.string(), z.unknown()),
    }))
    .mutation(async ({ ctx, input }) => {
      const { profile } = await resolveVerifiedProfile(ctx.req);
      if (profile.company_id !== input.companyId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You cannot write records for another workspace." });
      }
      if (input.payload.company_id !== undefined && input.payload.company_id !== input.companyId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "The payload workspace does not match the authenticated workspace." });
      }
      return persistSupabaseRow(input.tableName, { ...input.payload, company_id: input.companyId });
    }),
  microfinance: router({
    dashboard: protectedProcedure
      .input(microfinanceListInput)
      .query(({ ctx, input }) => listMicrofinanceDashboard(ctx.req, input)),
    auditHistory: protectedProcedure
      .input(microfinanceListInput)
      .query(({ ctx, input }) => listMicrofinanceAudit(ctx.req, input)),
    creditScoringSettings: protectedProcedure
      .query(({ ctx }) => getMicrofinanceCreditScoringSettings(ctx.req)),
    saveCreditScoringSettings: protectedProcedure
      .input(microfinanceCreditScoringSettingsInput)
      .mutation(({ ctx, input }) => saveMicrofinanceCreditScoringSettings(ctx.req, input)),
    escalationSettings: protectedProcedure
      .query(({ ctx }) => getMicrofinanceEscalationSettings(ctx.req)),
    escalationHistory: protectedProcedure
      .input(microfinanceListInput)
      .query(({ ctx, input }) => listMicrofinanceEscalationHistory(ctx.req, input)),
    saveEscalationSettings: protectedProcedure
      .input(microfinanceEscalationSettingsInput)
      .mutation(({ ctx, input }) => saveMicrofinanceEscalationSettings(ctx.req, input, { userSession: getSessionToken(ctx.req) })),
    createBorrower: protectedProcedure
      .input(microfinanceBorrowerInput)
      .mutation(({ ctx, input }) => createMicrofinanceBorrower(ctx.req, input)),
    createGroup: protectedProcedure
      .input(microfinanceGroupInput)
      .mutation(({ ctx, input }) => createMicrofinanceGroup(ctx.req, input)),
    createLoanProduct: protectedProcedure
      .input(microfinanceProductInput)
      .mutation(({ ctx, input }) => createMicrofinanceProduct(ctx.req, input)),
    createGuarantor: protectedProcedure
      .input(microfinanceGuarantorInput)
      .mutation(({ ctx, input }) => createMicrofinanceGuarantor(ctx.req, input)),
    createCollateral: protectedProcedure
      .input(microfinanceCollateralInput)
      .mutation(({ ctx, input }) => createMicrofinanceCollateral(ctx.req, input)),
    submitApplication: protectedProcedure
      .input(microfinanceApplicationInput)
      .mutation(({ ctx, input }) => submitMicrofinanceApplication(ctx.req, input)),
    decideApplication: protectedProcedure
      .input(microfinanceDecisionInput)
      .mutation(({ ctx, input }) => decideMicrofinanceApplication(ctx.req, input)),
    disburseLoan: protectedProcedure
      .input(microfinanceDisbursementInput)
      .mutation(({ ctx, input }) => disburseMicrofinanceLoan(ctx.req, input)),
    recordRepayment: protectedProcedure
      .input(microfinanceRepaymentInput)
      .mutation(({ ctx, input }) => recordMicrofinanceRepayment(ctx.req, input)),
    recordSavings: protectedProcedure
      .input(microfinanceSavingsInput)
      .mutation(({ ctx, input }) => recordMicrofinanceSavings(ctx.req, input)),
    openCashSession: protectedProcedure
      .input(microfinanceCashOpenInput)
      .mutation(({ ctx, input }) => openMicrofinanceCashSession(ctx.req, input)),
    closeCashSession: protectedProcedure
      .input(microfinanceCashCloseInput)
      .mutation(({ ctx, input }) => closeMicrofinanceCashSession(ctx.req, input)),
    createCollectionAction: protectedProcedure
      .input(microfinanceCollectionInput)
      .mutation(({ ctx, input }) => createMicrofinanceCollection(ctx.req, input)),
  }),
  propertyManagement: router({
    snapshot: protectedProcedure.input(propertyListInput).query(({ ctx, input }) => getPropertySnapshot(ctx.req, input)),
    action: protectedProcedure.input(propertyActionInput).mutation(({ ctx, input }) => runPropertyAction(ctx.req, input)),
    uploadDocument: protectedProcedure.input(propertyDocumentUploadInput).mutation(({ ctx, input }) => uploadPropertyDocument(ctx.req, input)),
  }),
  moneyAgent: router({
    snapshot: protectedProcedure
      .input(moneyAgentListInput)
      .query(({ ctx, input }) => getMoneyAgentSnapshot(ctx.req, input)),
    customerSnapshot: protectedProcedure
      .input(moneyAgentListInput)
      .query(({ ctx, input }) => getMoneyAgentCustomerSnapshot(ctx.req, input)),
    action: protectedProcedure
      .input(moneyAgentActionInput)
      .mutation(({ ctx, input }) => runMoneyAgentAction(ctx.req, input)),
  }),
  pharmacy: router({
    access: protectedProcedure.query(({ ctx }) => getPharmacyAccess(ctx.req)),
    dashboard: protectedProcedure.query(({ ctx }) => getPharmacyDashboard(ctx.req)),
    list: protectedProcedure.input(pharmacyListInput).query(({ ctx, input }) => listPharmacyRecords(ctx.req, input)),
    reports: protectedProcedure.query(({ ctx }) => getPharmacyReports(ctx.req)),
    clinicalQueue: protectedProcedure.input(pharmacyClinicalQueueInput).query(({ ctx, input }) => getPharmacyClinicalQueue(ctx.req, input)),
    audit: protectedProcedure.input(pharmacyListInput).query(({ ctx, input }) => listPharmacyAudit(ctx.req, input)),
    createCategory: protectedProcedure.input(pharmacyCategoryInput).mutation(({ ctx, input }) => createPharmacyCategory(ctx.req, input)),
    createBrand: protectedProcedure.input(pharmacyBrandInput).mutation(({ ctx, input }) => createPharmacyBrand(ctx.req, input)),
    createSupplier: protectedProcedure.input(pharmacySupplierInput).mutation(({ ctx, input }) => createPharmacySupplier(ctx.req, input)),
    createMedicine: protectedProcedure.input(pharmacyMedicineInput).mutation(({ ctx, input }) => createPharmacyMedicine(ctx.req, input)),
    updateCategory: protectedProcedure.input(pharmacyCategoryUpdateInput).mutation(({ ctx, input }) => updatePharmacyCategory(ctx.req, input)),
    updateBrand: protectedProcedure.input(pharmacyBrandUpdateInput).mutation(({ ctx, input }) => updatePharmacyBrand(ctx.req, input)),
    updateSupplier: protectedProcedure.input(pharmacySupplierUpdateInput).mutation(({ ctx, input }) => updatePharmacySupplier(ctx.req, input)),
    updateMedicine: protectedProcedure.input(pharmacyMedicineUpdateInput).mutation(({ ctx, input }) => updatePharmacyMedicine(ctx.req, input)),
    archive: protectedProcedure.input(pharmacyArchiveInput).mutation(({ ctx, input }) => archivePharmacyRecord(ctx.req, input)),
    createPurchaseOrder: protectedProcedure.input(pharmacyPurchaseOrderInput).mutation(({ ctx, input }) => createPharmacyPurchaseOrder(ctx.req, input)),
    receiveStock: protectedProcedure.input(pharmacyReceiptInput).mutation(({ ctx, input }) => receivePharmacyStock(ctx.req, input)),
    adjustStock: protectedProcedure.input(pharmacyAdjustmentInput).mutation(({ ctx, input }) => adjustPharmacyStock(ctx.req, input)),
    createStockTransfer: protectedProcedure.input(pharmacyTransferInput).mutation(({ ctx, input }) => createPharmacyTransfer(ctx.req, input)),
    dispensePrescription: protectedProcedure.input(pharmacyDispenseInput).mutation(({ ctx, input }) => dispensePharmacyPrescription(ctx.req, input)),
    completeSale: protectedProcedure.input(pharmacySaleInput).mutation(({ ctx, input }) => completePharmacySale(ctx.req, input)),
    recordSalePayment: protectedProcedure.input(pharmacyPaymentInput).mutation(({ ctx, input }) => recordPharmacySalePayment(ctx.req, input)),
    recordSupplierPayment: protectedProcedure.input(pharmacySupplierPaymentInput).mutation(({ ctx, input }) => recordPharmacySupplierPayment(ctx.req, input)),
    createInsuranceClaim: protectedProcedure.input(pharmacyInsuranceClaimInput).mutation(({ ctx, input }) => createPharmacyInsuranceClaim(ctx.req, input)),
    returnSaleItems: protectedProcedure.input(pharmacyReturnInput).mutation(({ ctx, input }) => returnPharmacySaleItems(ctx.req, input)),
    markNotificationRead: protectedProcedure.input(pharmacyNotificationInput).mutation(({ ctx, input }) => markPharmacyNotificationRead(ctx.req, input)),
  }),
  school: router({
    access: protectedProcedure.query(({ ctx }) => getSchoolAccess(ctx.req)),
    dashboard: protectedProcedure.query(({ ctx }) => getSchoolDashboard(ctx.req)),
    reports: protectedProcedure.query(({ ctx }) => getSchoolReports(ctx.req)),
    portal: protectedProcedure.query(({ ctx }) => getSchoolPortal(ctx.req)),
    list: protectedProcedure.input(schoolListInput).query(({ ctx, input }) => listSchoolRecords(ctx.req, input)),
    audit: protectedProcedure.input(schoolListInput).query(({ ctx, input }) => listSchoolAudit(ctx.req, input)),
    createAcademicYear: protectedProcedure.input(schoolAcademicYearInput).mutation(({ ctx, input }) => createSchoolAcademicYear(ctx.req, input)),
    createTerm: protectedProcedure.input(schoolTermInput).mutation(({ ctx, input }) => createSchoolTerm(ctx.req, input)),
    createDepartment: protectedProcedure.input(schoolDepartmentInput).mutation(({ ctx, input }) => createSchoolDepartment(ctx.req, input)),
    createSubject: protectedProcedure.input(schoolSubjectInput).mutation(({ ctx, input }) => createSchoolSubject(ctx.req, input)),
    createClass: protectedProcedure.input(schoolClassInput).mutation(({ ctx, input }) => createSchoolClass(ctx.req, input)),
    createStream: protectedProcedure.input(schoolStreamInput).mutation(({ ctx, input }) => createSchoolStream(ctx.req, input)),
    createGradingScale: protectedProcedure.input(schoolGradingScaleInput).mutation(({ ctx, input }) => createSchoolGradingScale(ctx.req, input)),
    createTeacher: protectedProcedure.input(schoolTeacherInput).mutation(({ ctx, input }) => createSchoolTeacher(ctx.req, input)),
    createAdmission: protectedProcedure.input(schoolAdmissionInput).mutation(({ ctx, input }) => createSchoolAdmission(ctx.req, input)),
    decideAdmission: protectedProcedure.input(schoolAdmissionDecisionInput).mutation(({ ctx, input }) => decideSchoolAdmission(ctx.req, input)),
    createTeacherAssignment: protectedProcedure.input(schoolTeacherAssignmentInput).mutation(({ ctx, input }) => createSchoolTeacherAssignment(ctx.req, input)),
    createTimetable: protectedProcedure.input(schoolTimetableInput).mutation(({ ctx, input }) => createSchoolTimetable(ctx.req, input)),
    openAttendanceSession: protectedProcedure.input(schoolAttendanceSessionInput).mutation(({ ctx, input }) => openSchoolAttendanceSession(ctx.req, input)),
    recordAttendance: protectedProcedure.input(schoolAttendanceInput).mutation(({ ctx, input }) => recordSchoolAttendance(ctx.req, input)),
    createAssessment: protectedProcedure.input(schoolAssessmentInput).mutation(({ ctx, input }) => createSchoolAssessment(ctx.req, input)),
    recordAssessmentScores: protectedProcedure.input(schoolScoreInput).mutation(({ ctx, input }) => recordSchoolAssessmentScores(ctx.req, input)),
    publishReportCard: protectedProcedure.input(schoolReportCardInput).mutation(({ ctx, input }) => publishSchoolReportCard(ctx.req, input)),
    createAssignment: protectedProcedure.input(schoolAssignmentInput).mutation(({ ctx, input }) => createSchoolAssignment(ctx.req, input)),
    submitAssignment: protectedProcedure.input(schoolAssignmentSubmissionInput).mutation(({ ctx, input }) => submitSchoolAssignment(ctx.req, input)),
    createFeeStructure: protectedProcedure.input(schoolFeeStructureInput).mutation(({ ctx, input }) => createSchoolFeeStructure(ctx.req, input)),
    issueFeeInvoice: protectedProcedure.input(schoolInvoiceInput).mutation(({ ctx, input }) => issueSchoolFeeInvoice(ctx.req, input)),
    recordPayment: protectedProcedure.input(schoolPaymentInput).mutation(({ ctx, input }) => recordSchoolPayment(ctx.req, input)),
    requestScholarship: protectedProcedure.input(schoolScholarshipInput).mutation(({ ctx, input }) => requestSchoolScholarship(ctx.req, input)),
    decideScholarship: protectedProcedure.input(schoolScholarshipDecisionInput).mutation(({ ctx, input }) => decideSchoolScholarship(ctx.req, input)),
    createServiceRecord: protectedProcedure.input(schoolServiceInput).mutation(({ ctx, input }) => createSchoolServiceRecord(ctx.req, input)),
    assignService: protectedProcedure.input(schoolServiceAssignmentInput).mutation(({ ctx, input }) => assignSchoolService(ctx.req, input)),
    createLibraryLoan: protectedProcedure.input(schoolLibraryLoanInput).mutation(({ ctx, input }) => createSchoolLibraryLoan(ctx.req, input)),
    recordInventoryMovement: protectedProcedure.input(schoolInventoryMovementInput).mutation(({ ctx, input }) => recordSchoolInventoryMovement(ctx.req, input)),
    createDisciplineRecord: protectedProcedure.input(schoolDisciplineInput).mutation(({ ctx, input }) => createSchoolDisciplineRecord(ctx.req, input)),
    createAnnouncement: protectedProcedure.input(schoolAnnouncementInput).mutation(({ ctx, input }) => createSchoolAnnouncement(ctx.req, input)),
    sendMessage: protectedProcedure.input(schoolMessageInput).mutation(({ ctx, input }) => sendSchoolMessage(ctx.req, input)),
    linkPortal: protectedProcedure.input(schoolPortalLinkInput).mutation(({ ctx, input }) => linkSchoolPortal(ctx.req, input)),
    createDocument: protectedProcedure.input(schoolDocumentInput).mutation(({ ctx, input }) => createSchoolDocument(ctx.req, input)),
    uploadDocument: protectedProcedure.input(schoolDocumentUploadInput).mutation(({ ctx, input }) => uploadSchoolDocument(ctx.req, input)),
    requestApproval: protectedProcedure.input(schoolApprovalRequestInput).mutation(({ ctx, input }) => requestSchoolApproval(ctx.req, input)),
    decideApproval: protectedProcedure.input(schoolApprovalDecisionInput).mutation(({ ctx, input }) => decideSchoolApproval(ctx.req, input)),
    markNotificationRead: protectedProcedure.input(schoolIdInput).mutation(({ ctx, input }) => markSchoolNotificationRead(ctx.req, input)),
    archive: protectedProcedure.input(schoolArchiveInput).mutation(({ ctx, input }) => archiveSchoolRecord(ctx.req, input)),
  }),
  healthcare: router({
    access: protectedProcedure
      .query(async ({ ctx }) => getHealthcareAccess(ctx.req)),
    fhirExport: protectedProcedure
      .input(healthcareFhirExportInput)
      .query(async ({ ctx, input }) => {
        const result = await exportHealthcareFhirBundle(ctx.req, input);
        const { profile } = await resolveVerifiedProfile(ctx.req);
        void recordAuditLog(ctx.user, { companyId: profile.company_id, action: "Healthcare FHIR R4 export generated", module: "Healthcare", details: `Patient-scoped collection with ${result.resourceCount} resources.` }).catch(() => undefined);
        return result;
      }),
    clinicianAnalytics: protectedProcedure
      .input(healthcareAnalyticsInput)
      .query(async ({ ctx, input }) => getHealthcareClinicianAnalytics(ctx.req, input)),
    reminderSettings: protectedProcedure
      .query(async ({ ctx }) => getReminderSettings(ctx.req)),
    saveReminderSettings: protectedProcedure
      .input(reminderSettingsInput)
      .mutation(async ({ ctx, input }) => {
        const result = await saveReminderSettings(ctx.req, input);
        const { profile } = await resolveVerifiedProfile(ctx.req);
        void recordAuditLog(ctx.user, { companyId: profile.company_id, action: "Healthcare reminder settings updated", module: "Healthcare", details: "Appointment reminder configuration updated without enabling provider delivery." }).catch(() => undefined);
        return result;
      }),
    reminderDeliveries: protectedProcedure
      .input(reminderDeliveryListInput)
      .query(async ({ ctx, input }) => listReminderDeliveries(ctx.req, input)),
    testReminder: protectedProcedure
      .mutation(async ({ ctx }) => requestReminderTest(ctx.req)),
    patientSmsConsent: protectedProcedure
      .query(async ({ ctx }) => getPatientSmsConsentPreferences(ctx.req)),
    updatePatientSmsConsent: protectedProcedure
      .input(patientSmsConsentUpdateInput)
      .mutation(async ({ ctx, input }) => {
        const result = await updatePatientSmsConsentPreferences(ctx.req, input);
        const { profile } = await resolveVerifiedProfile(ctx.req);
        void recordAuditLog(ctx.user, { companyId: profile.company_id, action: "Patient SMS consent preference updated", module: "Healthcare", details: "Patient self-service preference updated without exposing clinical record details." }).catch(() => undefined);
        return result;
      }),
    portalReferenceReconciliation: protectedProcedure
      .input(portalReferenceListInput)
      .query(async ({ ctx, input }) => listPortalReferenceReconciliation(ctx.req, input)),
    linkPatientPortalReference: protectedProcedure
      .input(linkPatientPortalReferenceInput)
      .mutation(async ({ ctx, input }) => {
        const result = await linkPatientPortalReference(ctx.req, input);
        const { profile } = await resolveVerifiedProfile(ctx.req);
        void recordAuditLog(ctx.user, { companyId: profile.company_id, action: "Patient portal reference linked", module: "Healthcare", details: "Clinic staff linked a verified patient portal reference without logging its value." }).catch(() => undefined);
        return result;
      }),
    clearPatientPortalReference: protectedProcedure
      .input(clearPatientPortalReferenceInput)
      .mutation(async ({ ctx, input }) => {
        const result = await clearPatientPortalReference(ctx.req, input);
        const { profile } = await resolveVerifiedProfile(ctx.req);
        void recordAuditLog(ctx.user, { companyId: profile.company_id, action: "Patient portal reference cleared", module: "Healthcare", details: "Clinic staff cleared a patient portal reference after explicit confirmation." }).catch(() => undefined);
        return result;
      }),
    stagePortalReferenceCsvImport: protectedProcedure
      .input(portalReferenceCsvInput)
      .mutation(async ({ ctx, input }) => {
        const result = await stagePortalReferenceCsvImport(ctx.req, input);
        const { profile } = await resolveVerifiedProfile(ctx.req);
        void recordAuditLog(ctx.user, { companyId: profile.company_id, action: "Portal-reference CSV import staged", module: "Healthcare", details: `${result.staged} portal-reference rows staged for review without logging reference values.` }).catch(() => undefined);
        return result;
      }),
    applyPortalReferenceImport: protectedProcedure
      .input(portalReferenceImportApplyInput)
      .mutation(async ({ ctx, input }) => {
        const result = await applyPortalReferenceImport(ctx.req, input);
        const { profile } = await resolveVerifiedProfile(ctx.req);
        void recordAuditLog(ctx.user, { companyId: profile.company_id, action: "Validated portal-reference import applied", module: "Healthcare", details: "A reviewed unlinked portal-reference row was applied." }).catch(() => undefined);
        return result;
      }),
    requestPortalReferenceReplacement: protectedProcedure
      .input(portalReferenceApprovalRequestInput)
      .mutation(async ({ ctx, input }) => {
        const result = await requestPortalReferenceReplacement(ctx.req, input);
        const { profile } = await resolveVerifiedProfile(ctx.req);
        void recordAuditLog(ctx.user, { companyId: profile.company_id, action: "Portal-reference replacement approval requested", module: "Healthcare", details: "A replacement request was created without logging portal-reference values." }).catch(() => undefined);
        return result;
      }),
    decidePortalReferenceApproval: protectedProcedure
      .input(portalReferenceApprovalDecisionInput)
      .mutation(async ({ ctx, input }) => {
        const result = await decidePortalReferenceApproval(ctx.req, input);
        const { profile } = await resolveVerifiedProfile(ctx.req);
        void recordAuditLog(ctx.user, { companyId: profile.company_id, action: `Portal-reference replacement ${result.status.toLowerCase()}`, module: "Healthcare", details: "A supervisor decided a portal-reference replacement request." }).catch(() => undefined);
        return result;
      }),
    portalReferenceWorkflow: protectedProcedure
      .input(portalReferenceWorkflowListInput)
      .query(async ({ ctx, input }) => listPortalReferenceWorkflow(ctx.req, input)),
    portalReferenceDailySummary: protectedProcedure
      .query(async ({ ctx }) => getPortalReferenceDailySummary(ctx.req)),
    portalReferenceErrorExport: protectedProcedure
      .input(portalReferenceErrorExportInput)
      .query(async ({ ctx, input }) => exportPortalReferenceErrors(ctx.req, input)),
    portalReferenceAuditSearch: protectedProcedure
      .input(portalReferenceAuditSearchInput)
      .query(async ({ ctx, input }) => searchPortalReferenceAudit(ctx.req, input)),
    portalReferenceSummarySettings: protectedProcedure
      .query(async ({ ctx }) => getPortalReferenceSummarySettings(ctx.req)),
    portalReferenceDeliveryHistory: protectedProcedure
      .input(portalReferenceDeliveryHistoryInput)
      .query(async ({ ctx, input }) => listPortalReferenceDeliveryHistory(ctx.req, input)),
    savePortalReferenceSummarySettings: protectedProcedure
      .input(portalReferenceSummarySettingsInput)
      .mutation(async ({ ctx, input }) => {
        const result = await savePortalReferenceSummarySettings(ctx.req, input, { userSession: getSessionToken(ctx.req) });
        const { profile } = await resolveVerifiedProfile(ctx.req);
        void recordAuditLog(ctx.user, { companyId: profile.company_id, action: "Reconciliation email recipient configuration updated", module: "Healthcare", details: result.settings.deliveryEnabled ? "Role-based and managed recipients were configured with active daily delivery." : "Role-based and managed recipients were configured with daily delivery inactive." }).catch(() => undefined);
        return result;
      }),
    activatePortalReferenceDailySchedule: protectedProcedure
      .mutation(async ({ ctx }) => {
        const current = await getPortalReferenceSummarySettings(ctx.req);
        const settings = current.settings;
        if (settings.recipientMode === "managed" && !settings.managedRecipients.length) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Add at least one approved managed recipient before activating this delivery mode." });
        const result = await savePortalReferenceSummarySettings(ctx.req, { recipientMode: settings.recipientMode, managedRecipients: settings.managedRecipients, timezone: "Africa/Dar_es_Salaam", deliveryEnabled: true }, { userSession: getSessionToken(ctx.req) });
        const { profile } = await resolveVerifiedProfile(ctx.req);
        void recordAuditLog(ctx.user, { companyId: profile.company_id, action: "Daily reconciliation email schedule activated", module: "Healthcare", details: "A clinic supervisor activated the privacy-safe daily reconciliation digest at 10:38 Africa/Dar_es_Salaam." }).catch(() => undefined);
        return result;
      }),
    deactivatePortalReferenceDailySchedule: protectedProcedure
      .mutation(async ({ ctx }) => {
        const current = await getPortalReferenceSummarySettings(ctx.req);
        const settings = current.settings;
        const result = await savePortalReferenceSummarySettings(ctx.req, { recipientMode: settings.recipientMode, managedRecipients: settings.managedRecipients, timezone: "Africa/Dar_es_Salaam", deliveryEnabled: false }, { userSession: getSessionToken(ctx.req) });
        const { profile } = await resolveVerifiedProfile(ctx.req);
        void recordAuditLog(ctx.user, { companyId: profile.company_id, action: "Daily reconciliation email schedule deactivated", module: "Healthcare", details: "A clinic supervisor deactivated the privacy-safe daily reconciliation digest." }).catch(() => undefined);
        return result;
      }),
    list: protectedProcedure
      .input(healthcareListInput)
      .query(async ({ ctx, input }) => listHealthcareRecords(ctx.req, input)),
    create: protectedProcedure
      .input(healthcareCreateInput)
      .mutation(async ({ ctx, input }) => {
        const result = await createHealthcareRecord(ctx.req, input);
        await recordAuditLog(ctx.user, { companyId: (await resolveVerifiedProfile(ctx.req)).profile.company_id, action: `Healthcare ${result.audit.action}`, module: "Healthcare", details: `${input.table} record` });
        return result;
      }),
    update: protectedProcedure
      .input(healthcareUpdateInput)
      .mutation(async ({ ctx, input }) => {
        const result = await updateHealthcareRecord(ctx.req, input);
        await recordAuditLog(ctx.user, { companyId: (await resolveVerifiedProfile(ctx.req)).profile.company_id, action: `Healthcare ${result.audit.action}`, module: "Healthcare", details: `${input.table} record` });
        return result;
      }),
    archive: protectedProcedure
      .input(healthcareArchiveInput)
      .mutation(async ({ ctx, input }) => {
        const result = await archiveHealthcareRecord(ctx.req, input);
        await recordAuditLog(ctx.user, { companyId: (await resolveVerifiedProfile(ctx.req)).profile.company_id, action: `Healthcare ${result.audit.action}`, module: "Healthcare", details: `${input.table} record` });
        return result;
      }),
  }),
  listRoleChangeApprovals: protectedProcedure
    .query(async ({ ctx }) => listRoleChangeApprovals(ctx.req)),
  requestRoleChangeApproval: protectedProcedure
    .input(z.object({ requestedRole: z.string().min(1).max(80), reason: z.string().max(500).optional() }))
    .mutation(async ({ ctx, input }) => {
      const result = await requestRoleChangeApproval(ctx.req, input);
      await recordAuditLog(ctx.user, { companyId: result.requester.company_id, action: "Role change submitted for approval", module: "Security", details: `${result.requester.role} → ${input.requestedRole}; requested by verified user.` });
      return result;
    }),
  marketIntelligence: router({
    configuration: protectedProcedure
      .input(z.object({ companyId: z.string().min(1).max(100) }))
      .query(async ({ ctx, input }) => {
        const { profile } = await resolveVerifiedProfile(ctx.req);
        if (profile.company_id !== input.companyId) throw new TRPCError({ code: "FORBIDDEN", message: "You cannot access market-intelligence configuration for another workspace." });
        return {
          ...marketIntelligenceConfig,
          bankSource: "Bank of Tanzania or an approved bank-rate provider",
          dseSource: "Dar es Salaam Stock Exchange or an approved DSE distributor",
        };
      }),
    snapshot: protectedProcedure
      .input(z.object({ companyId: z.string().min(1).max(100) }))
      .query(async ({ ctx, input }) => {
        const { profile } = await resolveVerifiedProfile(ctx.req);
        if (profile.company_id !== input.companyId) throw new TRPCError({ code: "FORBIDDEN", message: "You cannot access market intelligence for another workspace." });
        const snapshot = await getMarketIntelligenceSnapshot(input.companyId);
        return { ...snapshot, configuration: marketIntelligenceConfig };
      }),
    governance: protectedProcedure
      .input(z.object({ companyId: z.string().min(1).max(100) }))
      .query(async ({ ctx, input }) => {
        const profile = await resolveVerifiedProfile(ctx.req);
        if (profile.profile.company_id !== input.companyId) throw new TRPCError({ code: "FORBIDDEN", message: "Unauthorized workspace governance query." });
        return getMarketGovernanceData(input.companyId);
      }),
    saveGovernanceSettings: protectedProcedure
      .input(z.object({
        companyId: z.string().min(1).max(100),
        bankProviderUrl: z.string().url().max(500).or(z.literal("")).optional(),
        bankProviderApiKey: z.string().max(300).optional(),
        dseProviderUrl: z.string().url().max(500).or(z.literal("")).optional(),
        dseProviderApiKey: z.string().max(300).optional(),
        cbkProviderUrl: z.string().url().max(500).or(z.literal("")).optional(),
        cbkProviderApiKey: z.string().max(300).optional(),
        bouProviderUrl: z.string().url().max(500).or(z.literal("")).optional(),
        bouProviderApiKey: z.string().max(300).optional(),
        bnrProviderUrl: z.string().url().max(500).or(z.literal("")).optional(),
        bnrProviderApiKey: z.string().max(300).optional(),
        slackWebhookUrl: z.string().url().max(500).or(z.literal("")).optional(),
        outageEmailRecipients: z.string().max(500).optional(),
        alertOnOutage: z.boolean(),
        refreshIntervalSeconds: z.number().int().min(15).max(3600).optional(),
        scheduleWeeklyEmail: z.boolean().optional(),
        latencyThresholdMs: z.number().int().min(200).max(30000).optional(),
        alertCooldownMinutes: z.number().int().min(5).max(1440).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const profile = await resolveVerifiedProfile(ctx.req);
        if (profile.profile.company_id !== input.companyId) throw new TRPCError({ code: "FORBIDDEN", message: "Unauthorized workspace governance update." });
        const { companyId, ...settings } = input;
        const sessionToken = parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? "";
        const updated = await upsertMarketProviderSettings(companyId, settings, sessionToken);
        await recordAuditLog({ openId: profile.profile.id, name: profile.profile.full_name }, {
          companyId,
          action: "Market provider governance settings saved",
          module: "Market Intelligence",
          details: `Updated provider configuration and Slack/email outage routing for ${companyId}`,
        });
        return updated;
      }),
  }),
  accountRegistration: router({
    createConfirmedPasswordAccount: publicProcedure
      .input(z.object({ email: z.string().email().max(320), password: z.string().min(1).max(256) }))
      .mutation(async ({ ctx, input }) => provisionConfirmedPasswordAccount(input, ctx.req.ip || ctx.req.socket.remoteAddress || "unknown")),
  }),
  passkeySecurity: router({
    notifyRegistered: protectedProcedure
      .input(z.object({ friendlyName: z.string().trim().max(120).optional() }))
      .mutation(({ ctx, input }) => notifyPasskeyRegistration(ctx.req, input)),
  }),
  ai: router({
    listModels: protectedProcedure.query(async () => {
      try {
        const { listLLMModels } = await import("./_core/llm");
        const res = await listLLMModels();
        return res.data || [];
      } catch (err) {
        return [
          { id: "gpt-5-mini", name: "GPT-5 Mini (Fast & Efficient)" },
          { id: "claude-sonnet-4-6", name: "Claude Sonnet 4.6 (Balanced Reasoning)" },
          { id: "gemini-3-flash-preview", name: "Gemini 3 Flash (Multimodal & Fast)" },
        ];
      }
    }),
    chat: protectedProcedure
      .input(z.object({
        model: z.string().optional(),
        messages: z.array(z.object({
          role: z.enum(["system", "user", "assistant"]),
          content: z.string(),
        })),
      }))
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import("./_core/llm");
        const res = await invokeLLM({
          model: input.model,
          messages: input.messages,
        });
        return {
          content: res.choices[0]?.message?.content || "No response generated.",
          model: res.model || input.model || "default",
        };
      }),
    summarizeNotes: protectedProcedure
      .input(z.object({ notes: z.array(z.object({ id: z.string(), name: z.string(), note: z.string(), status: z.string().optional() })) }))
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import("./_core/llm");
        const prompt = `Analyze and categorize the following review notes recorded across Smart Manager ERP presentation modules. Group the overview by completion status (e.g., Pending Quota, Completed) and highlight key executive action items:\n\n${input.notes.map(n => `Module #${n.id} (${n.name}) [Status: ${n.status || 'Pending'}]: ${n.note}`).join("\n")}`;
        const res = await invokeLLM({
          model: "gpt-5-mini",
          messages: [
            { role: "system", content: "You are an executive enterprise ERP program manager. Provide a categorized, structured summary of module review notes grouped by completion status." },
            { role: "user", content: prompt }
          ],
        });
        return { summary: res.choices[0]?.message?.content || "No summary generated." };
      }),
    sendSummaryEmail: protectedProcedure
      .input(z.object({ recipient: z.string().email(), summary: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        try {
          await sendWorkspaceEmail(ctx.req, {
            to: input.recipient,
            subject: "Smart Manager ERP - AI Categorized Review Summary Report",
            body: input.summary,
          });
          return { success: true };
        } catch (err: any) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: err.message || "Failed to dispatch email summary." });
        }
      }),
    triggerNoteWebhook: protectedProcedure
      .input(z.object({ moduleId: z.string(), moduleName: z.string(), note: z.string(), webhookUrl: z.string().url() }))
      .mutation(async ({ input }) => {
        try {
          const payload = {
            event: "presentation_module_note_updated",
            timestamp: new Date().toISOString(),
            module: { id: input.moduleId, name: input.moduleName },
            note: input.note,
          };
          const response = await fetch(input.webhookUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-SmartManager-Signature": "sha256-verified-enterprise-hook",
            },
            body: JSON.stringify(payload),
          });
          if (!response.ok) {
            throw new Error(`Webhook endpoint returned status ${response.status}`);
          }
          return { success: true };
        } catch (err: any) {
          throw new TRPCError({ code: "BAD_GATEWAY", message: `Webhook dispatch failed: ${err.message}` });
        }
      }),
    assist: protectedProcedure
      .input(z.object({
        task: z.enum(["chat", "document", "meeting"]).default("chat"),
        message: z.string().min(1).max(8_000),
        history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(3_000) })).max(12).default([]),
        company: z.object({
          name: z.string().min(1).max(160),
          industry: z.string().max(160).optional(),
          country: z.string().max(100).optional(),
          currency: z.string().max(12).optional(),
        }),
        persona: z.object({
          name: z.string().min(1).max(160),
          tagline: z.string().max(360).optional(),
          scope: z.array(z.string().max(80)).max(20).optional(),
        }).optional(),
        context: z.record(z.string(), z.unknown()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        enforceAssistantRateLimit(ctx.user.openId);
        try {
          return await runSmartAssistant(input);
        } catch (error) {
          if (error instanceof AssistantProviderError) {
            if (error.status === 429) {
              throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "The AI provider is busy. Please try again shortly." });
            }
            if (error.status === 400) {
              throw new TRPCError({ code: "BAD_REQUEST", message: "The assistant request could not be processed. Please shorten or rephrase it." });
            }
            if (error.status === 401 || error.status === 403 || error.status === 503) {
              throw new TRPCError({ code: "PRECONDITION_FAILED", message: "The AI Assistant service is temporarily unavailable. Please contact an administrator." });
            }
          }
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "The AI Assistant could not be reached. Please try again shortly." });
        }
      }),
    requestActionApproval: protectedProcedure
      .input(z.object({
        operation: z.enum(["create_lead", "adjust_stock", "mark_invoice_paid", "record_expense", "approve_leave", "create_invoice", "create_quotation", "create_workflow"]),
        input: z.record(z.string(), z.unknown()),
        rationale: z.string().min(1).max(1_000),
        requesterMessage: z.string().min(1).max(8_000),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await requestActionApproval(ctx.req, input);
        void recordAuditLog(ctx.user, {
          companyId: result.requester.company_id,
          action: "AI action submitted for approval",
          module: result.rule.module,
          details: `${result.rule.label}; requested by verified ${result.requester.role} role.`,
        }).catch(() => undefined);
        return result;
      }),
    decideActionApproval: protectedProcedure
      .input(z.object({ approvalId: z.string().uuid(), decision: z.enum(["approve", "reject"]), note: z.string().max(500).optional() }))
      .mutation(async ({ ctx, input }) => {
        const result = await decideActionApproval(ctx.req, input);
        void recordAuditLog(ctx.user, {
          companyId: result.approver.company_id,
          action: `AI action ${input.decision === "approve" ? "approved" : "rejected"}`,
          module: result.rule.module,
          details: `${result.rule.label}; decided by verified ${result.approver.role} role.`,
        }).catch(() => undefined);
        return result;
      }),
    requestRoleChangeApproval: protectedProcedure
      .input(z.object({ requestedRole: z.string().min(1).max(80), reason: z.string().max(500).optional() }))
      .mutation(async ({ ctx, input }) => {
        const result = await requestRoleChangeApproval(ctx.req, input);
        await recordAuditLog(ctx.user, { companyId: result.requester.company_id, action: "Role change submitted for approval", module: "Security", details: `${result.requester.role} → ${input.requestedRole}; requested by verified user.` });
        return result;
      }),
    listRoleChangeApprovals: protectedProcedure
      .query(async ({ ctx }) => listRoleChangeApprovals(ctx.req)),
    decideRoleChangeApproval: protectedProcedure
      .input(z.object({ approvalId: z.string().uuid(), decision: z.enum(["approve", "reject"]), note: z.string().max(500).optional() }))
      .mutation(async ({ ctx, input }) => {
        const result = await decideRoleChangeApproval(ctx.req, input);
        await recordAuditLog(ctx.user, { companyId: result.approver.company_id, action: `Role change ${input.decision === "approve" ? "approved" : "rejected"}`, module: "Security", details: `${result.requestedRole}; decided by verified ${result.approver.role} role.` });
        return result;
      }),
    analyzeAnomalies: protectedProcedure
      .input(z.object({
        model: z.string().optional(),
        currency: z.string().default("TZS"),
        totals: z.object({
          revenue: z.number(),
          expenses: z.number(),
          outstanding: z.number(),
          inventoryValue: z.number(),
          lowStockCount: z.number().int(),
          inventoryCount: z.number().int(),
        }),
        inventory: z.array(z.object({
          sku: z.string(), name: z.string(), qty: z.number(), reorder: z.number(), unitCost: z.number(), category: z.string(),
        })).max(200),
        monthly: z.array(z.object({ month: z.string(), revenue: z.number(), expenses: z.number(), profit: z.number() })).max(24),
      }))
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import("./_core/llm");
        const fallback = () => {
          const findings: Array<{ severity: "high" | "medium" | "low"; area: "cash_flow" | "inventory"; title: string; detail: string; recommendation: string }> = [];
          if (input.totals.outstanding > input.totals.revenue * 0.35 && input.totals.revenue > 0) {
            findings.push({ severity: "high", area: "cash_flow", title: "Receivables concentration", detail: `${input.currency} ${Math.round(input.totals.outstanding).toLocaleString()} remains outstanding, above 35% of collected revenue.`, recommendation: "Review overdue invoices and prioritize collection follow-ups this week." });
          }
          if (input.totals.lowStockCount > 0) {
            findings.push({ severity: "medium", area: "inventory", title: "Replenishment pressure", detail: `${input.totals.lowStockCount} of ${input.totals.inventoryCount} tracked items are at or below reorder level.`, recommendation: "Review replenishment proposals and confirm supplier lead times before the next cycle." });
          }
          if (input.totals.expenses > input.totals.revenue && input.totals.revenue > 0) {
            findings.push({ severity: "high", area: "cash_flow", title: "Expense-to-revenue inversion", detail: `Recorded expenses exceed collected revenue in the supplied period.`, recommendation: "Investigate the largest expense categories and protect near-term cash commitments." });
          }
          return findings;
        };
        try {
          const res = await invokeLLM({
            model: input.model,
            maxTokens: 1800,
            messages: [
              { role: "system", content: "You are a cautious ERP risk analyst. Analyze only the supplied live tenant metrics. Never invent transactions, causes, or figures. Return at most five actionable findings. If evidence is insufficient, return an empty array." },
              { role: "user", content: JSON.stringify(input) },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "erp_anomaly_findings",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    findings: { type: "array", maxItems: 5, items: { type: "object", properties: { severity: { type: "string", enum: ["high", "medium", "low"] }, area: { type: "string", enum: ["cash_flow", "inventory"] }, title: { type: "string" }, detail: { type: "string" }, recommendation: { type: "string" } }, required: ["severity", "area", "title", "detail", "recommendation"], additionalProperties: false } },
                  },
                  required: ["findings"],
                  additionalProperties: false,
                },
              },
            },
          });
          const content = res.choices[0]?.message?.content;
          const parsed = typeof content === "string" ? JSON.parse(content) : content;
          return { findings: Array.isArray(parsed?.findings) ? parsed.findings : fallback(), model: res.model || input.model || "default", source: "ai" as const };
        } catch (_error) {
          return { findings: fallback(), model: input.model || "deterministic-fallback", source: "rule-based-fallback" as const };
        }
      }),
    configurePreferences: protectedProcedure
      .input(z.object({
        model: z.string().optional(),
        goal: z.string().min(2).max(300),
        current: z.object({
          theme: z.enum(["dark", "light"]),
          language: z.enum(["en", "sw"]),
          currency: z.enum(["TZS", "USD"]),
          density: z.enum(["comfortable", "compact"]),
          showMetricsStrip: z.boolean(),
          showActivityFeed: z.boolean(),
          showQuickActions: z.boolean(),
          showSmartAlerts: z.boolean(),
        }),
      }))
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import("./_core/llm");
        const fallbackPreferences = () => {
          const lower = input.goal.toLowerCase();
          const target = { ...input.current };
          if (lower.includes("compact") || lower.includes("dense") || lower.includes("space")) target.density = "compact";
          if (lower.includes("comfortable") || lower.includes("spacious")) target.density = "comfortable";
          if (lower.includes("usd") || lower.includes("dollar") || lower.includes("international")) target.currency = "USD";
          if (lower.includes("tzs") || lower.includes("tanzania") || lower.includes("shilling")) target.currency = "TZS";
          if (lower.includes("swahili") || lower.includes("kiswahili")) target.language = "sw";
          if (lower.includes("english") || lower.includes("en")) target.language = "en";
          if (lower.includes("dark") || lower.includes("night") || lower.includes("boardroom")) target.theme = "dark";
          if (lower.includes("light") || lower.includes("bright")) target.theme = "light";
          if (lower.includes("minimal") || lower.includes("focus")) {
            target.showActivityFeed = false;
            target.showQuickActions = false;
          }
          if (lower.includes("all") || lower.includes("complete") || lower.includes("full")) {
            target.showMetricsStrip = true;
            target.showActivityFeed = true;
            target.showQuickActions = true;
            target.showSmartAlerts = true;
          }
          return {
            preferences: target,
            explanation: `Applied recommended adjustments based on your goal: "${input.goal}".`,
            source: "rule-based-fallback" as const,
          };
        };

        try {
          const res = await invokeLLM({
            model: input.model,
            maxTokens: 1200,
            messages: [
              {
                role: "system",
                content: "You are Smart Manager's AI Assistant for executive dashboard preferences. Given the user's natural language goal and their current preferences, return a JSON object with 'preferences' (updated values for theme, language, currency, density, showMetricsStrip, showActivityFeed, showQuickActions, showSmartAlerts) and a concise 'explanation' (1-2 sentences in English describing why these changes match their goal).",
              },
              {
                role: "user",
                content: JSON.stringify(input),
              },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "dashboard_ai_preferences",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    preferences: {
                      type: "object",
                      properties: {
                        theme: { type: "string", enum: ["dark", "light"] },
                        language: { type: "string", enum: ["en", "sw"] },
                        currency: { type: "string", enum: ["TZS", "USD"] },
                        density: { type: "string", enum: ["comfortable", "compact"] },
                        showMetricsStrip: { type: "boolean" },
                        showActivityFeed: { type: "boolean" },
                        showQuickActions: { type: "boolean" },
                        showSmartAlerts: { type: "boolean" },
                      },
                      required: ["theme", "language", "currency", "density", "showMetricsStrip", "showActivityFeed", "showQuickActions", "showSmartAlerts"],
                      additionalProperties: false,
                    },
                    explanation: { type: "string" },
                  },
                  required: ["preferences", "explanation"],
                  additionalProperties: false,
                },
              },
            },
          });
          const content = res.choices[0]?.message?.content;
          const parsed = typeof content === "string" ? JSON.parse(content) : content;
          if (!parsed?.preferences) return fallbackPreferences();
          return {
            preferences: {
              theme: parsed.preferences.theme || input.current.theme,
              language: parsed.preferences.language || input.current.language,
              currency: parsed.preferences.currency || input.current.currency,
              density: parsed.preferences.density || input.current.density,
              showMetricsStrip: typeof parsed.preferences.showMetricsStrip === "boolean" ? parsed.preferences.showMetricsStrip : input.current.showMetricsStrip,
              showActivityFeed: typeof parsed.preferences.showActivityFeed === "boolean" ? parsed.preferences.showActivityFeed : input.current.showActivityFeed,
              showQuickActions: typeof parsed.preferences.showQuickActions === "boolean" ? parsed.preferences.showQuickActions : input.current.showQuickActions,
              showSmartAlerts: typeof parsed.preferences.showSmartAlerts === "boolean" ? parsed.preferences.showSmartAlerts : input.current.showSmartAlerts,
            },
            explanation: parsed.explanation || `Configured according to your goal: "${input.goal}".`,
            model: res.model || input.model || "default",
            source: "ai" as const,
          };
        } catch (_err) {
          return fallbackPreferences();
        }
      }),
  }),
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  workspaceBranding: router({
    save: protectedProcedure.input(z.object({
      primaryColor: z.string().min(7).max(7),
      accentColor: z.string().min(7).max(7),
      industryFocus: z.enum(["general", "retail", "manufacturing", "services", "healthcare", "education", "hospitality"]).optional(),
      logo: z.object({
        mimeType: z.enum(["image/png", "image/jpeg", "image/webp", "image/svg+xml"]),
        base64: z.string().min(4).max(2_800_000),
      }).nullable().optional(),
      removeLogo: z.boolean().optional(),
    })).mutation(({ ctx, input }) => saveWorkspaceBranding(ctx.req, input)),
  }),

  emailTemplateWorkflow: router({
    status: protectedProcedure.query(({ ctx }) => getEmailTemplateWorkflowStatus(ctx.req)),
    dispatch: protectedProcedure.input(z.object({
      action: z.enum(["EMAIL_TEMPLATE_SAVED", "EMAIL_TEMPLATE_EXPORTED"]),
      subject: z.string().max(240),
      recipientCount: z.number().int().min(0).max(1000),
      attachmentCount: z.number().int().min(0).max(100),
    })).mutation(({ ctx, input }) => dispatchEmailTemplateWorkflowEvent(ctx.req, input)),
    test: protectedProcedure.mutation(({ ctx }) => testEmailTemplateWorkflowWebhook(ctx.req)),
  }),

  profileIdentity: router({
    get: protectedProcedure.query(({ ctx }) => getProfileIdentity(ctx.req)),
    update: protectedProcedure.input(z.object({
      preferredName: z.string().trim().max(120).nullable().optional(),
      firstName: z.string().trim().max(120).nullable().optional(),
      middleName: z.string().trim().max(120).nullable().optional(),
      lastName: z.string().trim().max(120).nullable().optional(),
      fullName: z.string().trim().min(1).max(240).nullable().optional(),
      dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
      gender: z.string().trim().max(40).nullable().optional(),
      phone: z.string().trim().max(40).regex(/^[+()\d\s.-]*$/).nullable().optional(),
      address: z.string().trim().max(500).nullable().optional(),
      country: z.string().trim().max(80).nullable().optional(),
      preferredLanguage: z.string().trim().max(12).nullable().optional(),
      currencyDisplay: z.string().trim().length(3).toUpperCase().nullable().optional(),
      timezone: z.string().trim().max(100).nullable().optional(),
      dateFormat: z.enum(["dd/MM/yyyy", "MM/dd/yyyy", "yyyy-MM-dd"]).nullable().optional(),
      theme: z.enum(["system", "light", "dark"]).nullable().optional(),
      notificationPreferences: z.object({ email: z.boolean().optional(), push: z.boolean().optional(), sms: z.boolean().optional() }).strict().nullable().optional(),
    }).strict()).mutation(({ ctx, input }) => updateProfileIdentity(ctx.req, input)),
    uploadAvatar: protectedProcedure.input(z.object({
      mimeType: z.enum(["image/png", "image/jpeg", "image/webp"]),
      base64: z.string().min(1).max(2_800_000),
    }).strict()).mutation(({ ctx, input }) => uploadProfileAvatar(ctx.req, input)),
    removeAvatar: protectedProcedure.mutation(({ ctx }) => removeProfileAvatar(ctx.req)),
  }),

  workspaceSettings: router({
    get: protectedProcedure.query(({ ctx }) => getWorkspaceSettings(ctx.req)),
    save: protectedProcedure.input(z.object({
      name: z.string().trim().min(2).max(160), country: z.string().trim().min(2).max(100), currency: z.string().trim().min(3).max(8),
      tin: z.string().max(120).optional(), phone: z.string().max(80).optional(), email: z.string().email().max(320).or(z.literal("")).optional(), address: z.string().max(500).optional(), city: z.string().max(120).optional(), website: z.string().url().max(500).or(z.literal("")).optional(),
      taxRate: z.number().min(0).max(100), timezone: z.string().min(1).max(100), businessScale: z.enum(["small", "medium", "large"]), receiptWidth: z.enum(["58mm", "80mm", "A4"]), receiptFooter: z.string().max(500).optional(), receiptShowLogo: z.boolean(),
      primaryColor: z.string().min(7).max(7), accentColor: z.string().min(7).max(7), industryFocus: z.enum(["general", "retail", "manufacturing", "services", "healthcare", "education", "hospitality"]).optional(),
      logo: z.object({ mimeType: z.enum(["image/png", "image/jpeg", "image/webp", "image/svg+xml"]), base64: z.string().min(1).max(2_800_000) }).nullable().optional(), removeLogo: z.boolean().optional(),
      signatureLogo: z.object({ mimeType: z.enum(["image/png", "image/jpeg", "image/webp", "image/svg+xml"]), base64: z.string().min(1).max(2_800_000) }).nullable().optional(), removeSignatureLogo: z.boolean().optional(),
      cover: z.object({ mimeType: z.enum(["image/png", "image/jpeg", "image/webp"]), base64: z.string().min(1).max(7_000_000) }).nullable().optional(), removeCover: z.boolean().optional(),
      loginBackground: z.object({ mimeType: z.enum(["image/png", "image/jpeg", "image/webp"]), base64: z.string().min(1).max(7_000_000) }).nullable().optional(), removeLoginBackground: z.boolean().optional(),
      onboardingBackground: z.object({ mimeType: z.enum(["image/png", "image/jpeg", "image/webp"]), base64: z.string().min(1).max(7_000_000) }).nullable().optional(), removeOnboardingBackground: z.boolean().optional(),
      idleTimeoutMinutes: z.number().int().min(5).max(120).optional(),
      profileData: z.object({
        tagline: z.string().max(200).optional(), description: z.string().max(2_000).optional(), businessType: z.string().max(120).optional(), foundedYear: z.string().max(4).optional(), regNumber: z.string().max(160).optional(), postalCode: z.string().max(40).optional(),
        facebook: z.string().max(200).optional(), instagram: z.string().max(200).optional(), twitter: z.string().max(200).optional(), linkedin: z.string().max(200).optional(), tiktok: z.string().max(200).optional(), whatsappBusiness: z.string().max(80).optional(),
        bankName: z.string().max(160).optional(), bankAccountName: z.string().max(200).optional(), bankAccountNo: z.string().max(120).optional(), bankBranch: z.string().max(200).optional(), bankSwift: z.string().max(80).optional(),
        businessHours: z.record(z.string(), z.object({ open: z.string().max(10).optional(), close: z.string().max(10).optional(), closed: z.boolean().optional() })).optional(), coverPhoto: z.string().url().max(2_000).nullable().optional(),
        idleTimeoutMinutes: z.number().int().min(5).max(120).optional(), loginBackgroundImage: z.string().url().max(2_000).nullable().optional(), onboardingBackgroundImage: z.string().url().max(2_000).nullable().optional(),
        collaborationWorkflowWebhookEnabled: z.boolean().optional(), collaborationWorkflowWebhookUrl: z.string().url().max(2_000).or(z.literal("")).optional(), collaborationWorkflowWebhookSecret: z.string().max(512).optional(),
      }),
    })).mutation(({ ctx, input }) => saveWorkspaceSettings(ctx.req, input)),
  }),

  dashboardPreferences: router({
    get: protectedProcedure.query(({ ctx }) => getDashboardPreferences(ctx.req)),
    save: protectedProcedure.input(dashboardPreferencesInput).mutation(({ ctx, input }) => saveDashboardPreferences(ctx.req, input)),
  }),

  teamWorkforce: router({
    snapshot: protectedProcedure.query(({ ctx }) => getTeamWorkforceSnapshot(ctx.req)),
    requestRoleAssignment: protectedProcedure
      .input(workforceRoleAssignmentInput)
      .mutation(({ ctx, input }) => requestWorkforceRoleAssignment(ctx.req, input)),
    decideRoleAssignment: protectedProcedure
      .input(workforceRoleDecisionInput)
      .mutation(({ ctx, input }) => decideWorkforceRoleAssignment(ctx.req, input)),
  }),
  pos: router({
    openShift: protectedProcedure
      .input(posOpenShiftInput)
      .mutation(({ ctx, input }) => openPosShift(ctx.req, input)),
    recordCashMovement: protectedProcedure
      .input(posCashMovementInput)
      .mutation(({ ctx, input }) => recordPosCashMovement(ctx.req, input)),
    acceptSyncSequence: protectedProcedure
      .input(posSyncSequenceInput)
      .mutation(({ ctx, input }) => acceptPosSyncSequence(ctx.req, input)),
    completeSale: protectedProcedure
      .input(posCompleteSaleInput)
      .mutation(({ ctx, input }) => completePosSale(ctx.req, input)),
  }),
  teamInvitations: router({
    list: publicProcedure.query(({ ctx }) => listTeamInvitations(ctx.req)),
    create: publicProcedure.input(z.object({ fullName: z.string().min(2).max(120), email: z.string().email().max(320), role: z.string().min(2).max(80) })).mutation(({ ctx, input }) => createTeamInvitation(ctx.req, input)),
    resend: publicProcedure.input(z.object({ invitationId: z.string().min(8).max(72) })).mutation(({ ctx, input }) => resendTeamInvitation(ctx.req, input.invitationId)),
    revoke: publicProcedure.input(z.object({ invitationId: z.string().min(8).max(72) })).mutation(({ ctx, input }) => revokeTeamInvitation(ctx.req, input.invitationId)),
    accept: publicProcedure.input(z.object({ token: z.string().min(32).max(128) })).mutation(({ ctx, input }) => acceptTeamInvitation(ctx.req, input.token)),
  }),

  transactionalEmail: router({
    send: publicProcedure.input(z.object({ to: z.string().min(3).max(6_000), cc: z.string().max(6_000).optional(), bcc: z.string().max(6_000).optional(), subject: z.string().min(1).max(160), body: z.string().min(1).max(12_000) })).mutation(({ ctx, input }) => sendWorkspaceEmail(ctx.req, input)),
  }),

  support: router({
    listTickets: protectedProcedure.query(({ ctx }) => listSupportTickets(ctx.req)),
    searchTickets: protectedProcedure.input(z.object({ query: z.string().trim().min(2).max(120) })).query(({ ctx, input }) => searchSupportTickets(ctx.req, input.query)),
    draftTicketReply: protectedProcedure.input(z.object({ ticketId: z.string().uuid(), tone: z.enum(["professional", "empathetic", "concise"]).default("professional") })).mutation(({ ctx, input }) => draftSupportTicketReply(ctx.req, input)),
    whatsappProviderReadiness: protectedProcedure.query(({ ctx }) => getSupportWhatsAppProviderReadiness(ctx.req)),
    testWhatsappProviderConfig: protectedProcedure.input(z.object({ apiKey: z.string().optional(), signingSecret: z.string().optional(), workspaceId: z.string().optional(), channelId: z.string().optional(), deliveryEnabled: z.boolean().optional() })).mutation(({ ctx, input }) => testSupportWhatsAppProviderConfig(ctx.req, input)),
    updateWhatsappProviderConfig: protectedProcedure.input(z.object({
      apiKey: z.string().optional(),
      signingSecret: z.string().optional(),
      workspaceId: z.string().optional(),
      channelId: z.string().optional(),
      deliveryEnabled: z.boolean().optional(),
    })).mutation(async ({ ctx, input }) => {
      // Securely store or persist configuration in runtime environment or company settings
      if (input.apiKey) process.env.BIRD_API_KEY = input.apiKey;
      if (input.signingSecret) process.env.BIRD_WEBHOOK_SIGNING_SECRET = input.signingSecret;
      if (input.workspaceId) process.env.BIRD_WORKSPACE_ID = input.workspaceId;
      if (input.channelId) process.env.BIRD_WHATSAPP_CHANNEL_ID = input.channelId;
      if (typeof input.deliveryEnabled === "boolean") {
        process.env.BIRD_WHATSAPP_DELIVERY_ENABLED = input.deliveryEnabled ? "true" : "false";
      }
      return getSupportWhatsAppProviderReadiness(ctx.req);
    }),
    listWorkflowPolicies: protectedProcedure.query(({ ctx }) => listSupportWorkflowPolicies(ctx.req)),
    saveWorkflowPolicy: protectedProcedure.input(z.object({
      workflowId: z.string().uuid().optional(),
      name: z.string().trim().min(2).max(160),
      trigger: z.enum(["support.ticket.created", "support.ticket.updated"]),
      condition: z.object({ priority: z.enum(["Low", "Medium", "High", "Urgent"]).optional(), status: z.enum(["Open", "In Progress", "Waiting", "Resolved", "Closed"]).optional() }).optional().nullable(),
      actions: z.array(z.object({ type: z.enum(["add_internal_note", "set_ticket_priority", "assign_support_team"]), config: z.record(z.string(), z.unknown()).optional() })).min(1).max(8),
      enabled: z.boolean(),
    })).mutation(async ({ ctx, input }) => {
      const result = await saveSupportWorkflowPolicy(ctx.req, input);
      await recordAuditLog(ctx.user, { companyId: result.profile.company_id, action: "Support workflow configuration saved", module: "Customer Support", details: `Confirmed support workflow ${result.workflow.name}; automatic execution remains disabled until a verified runner is implemented.` });
      return result;
    }),
    listSlaPolicies: protectedProcedure.query(({ ctx }) => listSupportSlaPolicies(ctx.req)),
    saveSlaPolicy: protectedProcedure.input(z.object({
      policyId: z.string().uuid().optional(),
      name: z.string().trim().min(2).max(160),
      priority: z.enum(["Low", "Medium", "High", "Urgent"]),
      firstResponseMinutes: z.number().int().positive().max(525_600),
      resolutionMinutes: z.number().int().positive().max(525_600),
      warningMinutes: z.number().int().min(0).max(525_600).nullable().optional(),
      isActive: z.boolean(),
    })).mutation(async ({ ctx, input }) => {
      const result = await saveSupportSlaPolicy(ctx.req, input);
      await recordAuditLog(ctx.user, { companyId: result.profile.company_id, action: "Support SLA policy saved", module: "Customer Support", details: `Confirmed ${result.policy.priority} SLA policy ${result.policy.name}; no breach or escalation is asserted by configuration alone.` });
      return result;
    }),
    createTicket: protectedProcedure.input(z.object({
      subject: z.string().trim().min(2).max(240),
      customer: z.string().trim().min(1).max(240),
      category: z.string().trim().max(100).optional(),
      priority: z.enum(["Low", "Medium", "High", "Urgent"]).optional(),
      sourceChannel: z.enum(["manual", "web", "email", "whatsapp", "phone"]).optional(),
      customerReference: z.string().trim().max(160).optional(),
      initialMessage: z.string().trim().max(8_000).optional(),
      teamId: z.string().uuid().optional(),
      dueAt: z.string().datetime().optional(),
    })).mutation(async ({ ctx, input }) => {
      const result = await createSupportTicket(ctx.req, input);
      await recordAuditLog(ctx.user, { companyId: result.profile.company_id, action: "Support ticket created", module: "Customer Support", details: `Confirmed ticket ${result.ticket.doc_number || result.ticket.id}.` });
      return result;
    }),
    updateTicket: protectedProcedure.input(z.object({
      ticketId: z.string().uuid(),
      status: z.enum(["Open", "In Progress", "Waiting", "Resolved", "Closed"]).optional(),
      priority: z.enum(["Low", "Medium", "High", "Urgent"]).optional(),
      assignedProfileId: z.string().uuid().nullable().optional(),
      teamId: z.string().uuid().nullable().optional(),
      dueAt: z.string().datetime().nullable().optional(),
    })).mutation(async ({ ctx, input }) => {
      const result = await updateSupportTicket(ctx.req, input);
      await recordAuditLog(ctx.user, { companyId: result.profile.company_id, action: "Support ticket updated", module: "Customer Support", details: `Confirmed ticket ${result.ticket.doc_number || result.ticket.id} update.` });
      return result;
    }),
    addInternalNote: protectedProcedure.input(z.object({ ticketId: z.string().uuid(), body: z.string().trim().min(1).max(8_000) })).mutation(async ({ ctx, input }) => {
      const result = await addSupportInternalNote(ctx.req, input);
      await recordAuditLog(ctx.user, { companyId: result.profile.company_id, action: "Support internal note created", module: "Customer Support", details: "Confirmed internal note; it is excluded from outbound channel delivery." });
      return result;
    }),
    ticketTimeline: protectedProcedure.input(z.object({ ticketId: z.string().uuid() })).query(({ ctx, input }) => listSupportTicketTimeline(ctx.req, input.ticketId)),
  }),

  roleChangeApprovals: router({
    list: protectedProcedure.query(({ ctx }) => listRoleChangeApprovals(ctx.req)),
    request: protectedProcedure.input(z.object({ requestedRole: z.string().min(1).max(80), reason: z.string().max(500).optional() })).mutation(({ ctx, input }) => requestRoleChangeApproval(ctx.req, input)),
    decide: protectedProcedure.input(z.object({ approvalId: z.string().min(1), decision: z.enum(["approve", "reject"]), note: z.string().max(500).optional() })).mutation(({ ctx, input }) => decideRoleChangeApproval(ctx.req, input)),
    markRead: protectedProcedure.input(z.object({ notificationId: z.string().min(1) })).mutation(({ ctx, input }) => markNotificationRead(ctx.req, input)),
    dismiss: protectedProcedure.input(z.object({ notificationId: z.string().min(1) })).mutation(({ ctx, input }) => dismissNotification(ctx.req, input)),
  }),

  reportSchedules: router({
    list: protectedProcedure.query(({ ctx }) => listReportSchedules(ctx.user.openId)),
    create: protectedProcedure.input(z.object({
      companyId: z.string().min(1).max(100),
      name: z.string().min(1).max(120),
      recipientEmail: z.string().email(),
      ccEmails: z.string().max(2000).optional(),
      frequency: z.enum(["daily", "weekly", "monthly"]),
      format: z.enum(["csv", "pdf"]),
      modules: z.object({ finance: z.boolean(), sales: z.boolean(), crm: z.boolean(), inventory: z.boolean(), operations: z.boolean() }),
      dateRange: z.object({ start: z.string(), end: z.string() }),
    })).mutation(({ ctx, input }) => createReportSchedule(ctx.user, getSessionToken(ctx.req), input)),
    update: protectedProcedure.input(z.object({
      id: z.number().int().positive(),
      companyId: z.string().min(1).max(100).optional(),
      name: z.string().min(1).max(120).optional(),
      recipientEmail: z.string().email().optional(),
      ccEmails: z.string().max(2000).optional(),
      frequency: z.enum(["daily", "weekly", "monthly"]).optional(),
      format: z.enum(["csv", "pdf"]).optional(),
      modules: z.object({ finance: z.boolean(), sales: z.boolean(), crm: z.boolean(), inventory: z.boolean(), operations: z.boolean() }).optional(),
      dateRange: z.object({ start: z.string(), end: z.string() }).optional(),
      isActive: z.boolean().optional(),
    })).mutation(({ ctx, input }) => {
      const { id, ...patch } = input;
      return updateReportSchedule(ctx.user.openId, getSessionToken(ctx.req), id, patch);
    }),
    remove: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => deleteReportSchedule(ctx.user.openId, getSessionToken(ctx.req), input.id)),
    toggleActive: protectedProcedure.input(z.object({ id: z.number().int().positive(), isActive: z.boolean() })).mutation(({ ctx, input }) => updateReportSchedule(ctx.user.openId, getSessionToken(ctx.req), input.id, { isActive: input.isActive })),
    sendNow: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => sendReportScheduleNow(ctx.user.openId, input.id)),
  }),

  security: router({
    pushDeliveryHistory: protectedProcedure
      .input(z.object({ companyId: z.string().min(1), limit: z.number().int().min(1).max(100).optional() }))
      .query(async ({ ctx, input }) => {
        const profile = await requireVerifiedAuditCompany(ctx.req, input.companyId);
        const canReadSecurity = canReadTenantPushDeliveryHistory(profile.role);
        if (!canReadSecurity) throw new TRPCError({ code: "FORBIDDEN", message: "Only tenant security administrators can view push delivery history." });
        return listTenantPushDeliveryHistory(input.companyId, input.limit);
      }),
  }),

  auditLogs: router({
    list: protectedProcedure.input(z.object({ companyId: z.string().min(1), limit: z.number().int().positive().optional(), module: z.string().optional(), startDate: z.string().optional(), endDate: z.string().optional() })).query(async ({ ctx, input }) => {
      await requireVerifiedAuditCompany(ctx.req, input.companyId);
      const logs = await listAuditLogs(input.companyId, input.limit || 100);
      return logs.filter(l => {
        if (input.module && l.module !== input.module) return false;
        if (input.startDate && new Date(l.createdAt) < new Date(input.startDate)) return false;
        if (input.endDate && new Date(l.createdAt) > new Date(input.endDate)) return false;
        return true;
      });
    }),
    complianceExport: protectedProcedure.input(z.object({ companyId: z.string().min(1), limit: z.number().int().positive().max(100).optional(), module: z.string().optional(), startDate: z.string().optional(), endDate: z.string().optional() })).query(async ({ ctx, input }) => {
      const approvalResult = await listRoleChangeApprovals(ctx.req);
      if (approvalResult.profile.company_id !== input.companyId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You cannot export compliance evidence for another workspace." });
      }
      const logs = await listAuditLogs(input.companyId, input.limit || 100);
      const filteredLogs = logs.filter((log) => {
        if (input.module && log.module !== input.module) return false;
        if (input.startDate && new Date(log.createdAt) < new Date(input.startDate)) return false;
        if (input.endDate && new Date(log.createdAt) > new Date(input.endDate)) return false;
        return true;
      });
      return { logs: filteredLogs, approvals: approvalResult.approvals };
    }),
    record: protectedProcedure.input(z.object({ companyId: z.string().min(1), action: z.string().min(1), module: z.string().min(1), details: z.string().optional() })).mutation(async ({ ctx, input }) => {
      const profile = await requireVerifiedAuditCompany(ctx.req, input.companyId);
      return recordAuditLog({ ...ctx.user, openId: profile.id, name: profile.full_name || ctx.user.name }, input);
    }),
  }),

  bankMfi: router({
    snapshot: protectedProcedure.query(({ ctx }) => listBankMfiSnapshot(ctx.req)),
    createAccountType: protectedProcedure.input(z.object({ payload: z.record(z.string(), z.unknown()) })).mutation(({ ctx, input }) => createBankAccountType(ctx.req, input.payload)),
    createLoanProduct: protectedProcedure.input(z.object({ payload: z.record(z.string(), z.unknown()) })).mutation(({ ctx, input }) => createLoanProduct(ctx.req, input.payload)),
    setupInstitution: protectedProcedure.input(z.object({ payload: z.record(z.string(), z.unknown()) })).mutation(({ ctx, input }) => setupInstitution(ctx.req, input.payload)),
    registerCustomer: protectedProcedure.input(z.object({ payload: z.record(z.string(), z.unknown()) })).mutation(({ ctx, input }) => registerCustomer(ctx.req, input.payload)),
    updateKyc: protectedProcedure.input(z.object({ customerId: z.string().uuid(), payload: z.record(z.string(), z.unknown()) })).mutation(({ ctx, input }) => updateKyc(ctx.req, input.customerId, input.payload)),
    openAccount: protectedProcedure.input(z.object({ payload: z.record(z.string(), z.unknown()) })).mutation(({ ctx, input }) => openAccount(ctx.req, input.payload)),
    postTransaction: protectedProcedure.input(z.object({ payload: z.record(z.string(), z.unknown()) })).mutation(({ ctx, input }) => postTransaction(ctx.req, input.payload)),
    submitLoanApplication: protectedProcedure.input(z.object({ payload: z.record(z.string(), z.unknown()) })).mutation(({ ctx, input }) => submitLoanApplication(ctx.req, input.payload)),
    scoreLoanApplication: protectedProcedure.input(z.object({ applicationId: z.string().uuid(), payload: z.record(z.string(), z.unknown()) })).mutation(({ ctx, input }) => scoreLoanApplication(ctx.req, input.applicationId, input.payload)),
    decideLoanApplication: protectedProcedure.input(z.object({ applicationId: z.string().uuid(), decision: z.enum(["APPROVED", "REJECTED"]), note: z.string().max(1000).optional() })).mutation(({ ctx, input }) => decideLoanApplication(ctx.req, input.applicationId, input.decision, input.note)),
    disburseLoan: protectedProcedure.input(z.object({ applicationId: z.string().uuid(), payload: z.record(z.string(), z.unknown()) })).mutation(({ ctx, input }) => disburseLoan(ctx.req, input.applicationId, input.payload)),
    recordRepayment: protectedProcedure.input(z.object({ payload: z.record(z.string(), z.unknown()) })).mutation(({ ctx, input }) => recordRepayment(ctx.req, input.payload)),
    addBeneficiary: protectedProcedure.input(z.object({ payload: z.record(z.string(), z.unknown()) })).mutation(({ ctx, input }) => addBeneficiary(ctx.req, input.payload)),
    addGuarantor: protectedProcedure.input(z.object({ payload: z.record(z.string(), z.unknown()) })).mutation(({ ctx, input }) => addGuarantor(ctx.req, input.payload)),
    addCollateral: protectedProcedure.input(z.object({ payload: z.record(z.string(), z.unknown()) })).mutation(({ ctx, input }) => addCollateral(ctx.req, input.payload)),
    recordSharePurchase: protectedProcedure.input(z.object({ payload: z.record(z.string(), z.unknown()) })).mutation(({ ctx, input }) => recordSharePurchase(ctx.req, input.payload)),
    customerStatement: protectedProcedure.input(z.object({ accountId: z.string().uuid(), from: z.string().date().optional(), to: z.string().date().optional() })).query(({ ctx, input }) => customerStatement(ctx.req, input.accountId, input.from, input.to)),
    createPaymentInstruction: protectedProcedure.input(z.object({ payload: z.record(z.string(), z.unknown()) })).mutation(({ ctx, input }) => createPaymentInstruction(ctx.req, input.payload)),
    listStandingOrders: protectedProcedure.input(z.object({ status: z.string().max(40).optional(), search: z.string().max(100).optional(), limit: z.number().int().min(1).max(100).optional(), offset: z.number().int().min(0).optional() }).optional()).query(({ ctx, input }) => listStandingOrders(ctx.req, input ?? {})),
    getStandingOrder: protectedProcedure.input(z.object({ orderId: z.string().uuid() })).query(({ ctx, input }) => getStandingOrder(ctx.req, input.orderId)),
    createStandingOrder: protectedProcedure.input(z.object({ payload: z.record(z.string(), z.unknown()) })).mutation(({ ctx, input }) => createStandingOrder(ctx.req, input.payload)),
    submitStandingOrder: protectedProcedure.input(z.object({ orderId: z.string().uuid(), expectedVersion: z.number().int().nonnegative(), idempotencyKey: z.string().trim().min(12).max(200).optional() })).mutation(({ ctx, input }) => submitStandingOrder(ctx.req, input.orderId, input.expectedVersion, input.idempotencyKey)),
    approveStandingOrder: protectedProcedure.input(z.object({ orderId: z.string().uuid(), decision: z.enum(["APPROVE", "APPROVED", "REJECT", "REJECTED"]), note: z.string().max(1000).optional(), expectedVersion: z.number().int().nonnegative(), idempotencyKey: z.string().trim().min(12).max(200).optional() })).mutation(({ ctx, input }) => approveStandingOrder(ctx.req, input.orderId, input.decision, input.note, input.expectedVersion, input.idempotencyKey)),
    activateStandingOrder: protectedProcedure.input(z.object({ orderId: z.string().uuid(), expectedVersion: z.number().int().nonnegative(), idempotencyKey: z.string().trim().min(12).max(200).optional() })).mutation(({ ctx, input }) => activateStandingOrder(ctx.req, input.orderId, input.expectedVersion, input.idempotencyKey)),
    pauseStandingOrder: protectedProcedure.input(z.object({ orderId: z.string().uuid(), reason: z.string().trim().min(1).max(1000), expectedVersion: z.number().int().nonnegative(), idempotencyKey: z.string().trim().min(12).max(200).optional() })).mutation(({ ctx, input }) => pauseStandingOrder(ctx.req, input.orderId, input.reason, input.expectedVersion, input.idempotencyKey)),
    resumeStandingOrder: protectedProcedure.input(z.object({ orderId: z.string().uuid(), expectedVersion: z.number().int().nonnegative(), idempotencyKey: z.string().trim().min(12).max(200).optional() })).mutation(({ ctx, input }) => resumeStandingOrder(ctx.req, input.orderId, input.expectedVersion, input.idempotencyKey)),
    cancelStandingOrder: protectedProcedure.input(z.object({ orderId: z.string().uuid(), reason: z.string().trim().min(1).max(1000), expectedVersion: z.number().int().nonnegative(), idempotencyKey: z.string().trim().min(12).max(200).optional() })).mutation(({ ctx, input }) => cancelStandingOrder(ctx.req, input.orderId, input.reason, input.expectedVersion, input.idempotencyKey)),
    confirmStandingOrderProviderPayment: protectedProcedure.input(z.object({ runId: z.string().uuid(), providerReference: z.string().trim().min(1).max(200), providerStatus: z.string().trim().min(1).max(100), providerEventId: z.string().trim().min(1).max(200), idempotencyKey: z.string().trim().min(12).max(200) })).mutation(({ ctx, input }) => confirmStandingOrderProviderPayment(ctx.req, input.runId, input.providerReference, input.providerStatus, input.providerEventId, input.idempotencyKey)),
    retryStandingOrderRun: protectedProcedure.input(z.object({ runId: z.string().uuid(), idempotencyKey: z.string().trim().min(12).max(200) })).mutation(({ ctx, input }) => retryStandingOrderRun(ctx.req, input.runId, input.idempotencyKey)),
    createGroup: protectedProcedure.input(z.object({ payload: z.record(z.string(), z.unknown()) })).mutation(({ ctx, input }) => createGroup(ctx.req, input.payload)),
    addGroupMember: protectedProcedure.input(z.object({ payload: z.record(z.string(), z.unknown()) })).mutation(({ ctx, input }) => addGroupMember(ctx.req, input.payload)),
    createReconciliation: protectedProcedure.input(z.object({ payload: z.record(z.string(), z.unknown()) })).mutation(({ ctx, input }) => createReconciliation(ctx.req, input.payload)),
    createAmlAlert: protectedProcedure.input(z.object({ payload: z.record(z.string(), z.unknown()) })).mutation(({ ctx, input }) => createAmlAlert(ctx.req, input.payload)),
    resolveAmlAlert: protectedProcedure.input(z.object({ alertId: z.string().uuid(), decision: z.string().min(1).max(100), note: z.string().max(1000).optional() })).mutation(({ ctx, input }) => resolveAmlAlert(ctx.req, input.alertId, input.decision, input.note)),
    writeOffLoan: protectedProcedure.input(z.object({ loanId: z.string().uuid(), note: z.string().min(1).max(1000) })).mutation(({ ctx, input }) => writeOffLoan(ctx.req, input.loanId, input.note)),
    restructureLoan: protectedProcedure.input(z.object({ loanId: z.string().uuid(), payload: z.record(z.string(), z.unknown()) })).mutation(({ ctx, input }) => restructureLoan(ctx.req, input.loanId, input.payload)),
    moveCash: protectedProcedure.input(z.object({ payload: z.record(z.string(), z.unknown()) })).mutation(({ ctx, input }) => moveCash(ctx.req, input.payload)),
    runDailyControls: protectedProcedure.mutation(({ ctx }) => runDailyControls(ctx.req)),
    runStandingOrders: protectedProcedure.input(z.object({ runDate: z.string().date().optional(), orderId: z.string().uuid().optional(), maxOrders: z.number().int().min(1).max(250).optional() }).optional()).mutation(({ ctx, input }) => runStandingOrders(ctx.req, input ?? {})),
  }),
  admin: router({
    verifyBackup: protectedProcedure.query(({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Only administrators can verify backup connectivity." });
      return verifyDatabaseBackupStatus();
    }),
    getSchemaDriftMonitor: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      return getSchemaDriftMonitor();
    }),
    activateSchemaDriftMonitor: protectedProcedure.mutation(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      return activateSchemaDriftMonitor(getSessionToken(ctx.req));
    }),
    runSchemaDriftMonitorNow: protectedProcedure.mutation(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      return runSchemaDriftCheck();
    }),
    listSchemaDriftRuns: protectedProcedure.input(z.object({ limit: z.number().int().positive().max(100).optional() })).query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      return listSchemaDriftRuns(input.limit);
    }),
    listUsers: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only administrators can view user directories." });
      }
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
      return db.select({ id: users.id, openId: users.openId, name: users.name, email: users.email, role: users.role, lastSignedIn: users.lastSignedIn }).from(users);
    }),
    updateUserRole: protectedProcedure.input(z.object({ openId: z.string(), role: z.enum(["user", "admin"]) })).mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only administrators can update user roles." });
      }
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
      await db.update(users).set({ role: input.role }).where(eq(users.openId, input.openId));
      return { success: true, openId: input.openId, newRole: input.role };
    }),
    getWebhook: protectedProcedure.query(({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      return getWebhookConfig();
    }),
    updateWebhook: protectedProcedure.input(z.object({ url: z.string(), enabled: z.boolean(), secret: z.string().optional() })).mutation(({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      return updateWebhookConfig(input);
    }),
    testWebhookPing: protectedProcedure.mutation(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      return testWebhookPing();
    }),
    getDeadLetterQueue: protectedProcedure.query(({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      return getDeadLetterQueue();
    }),
    getWebhookDeliveries: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      return listWebhookDeliveryHistory();
    }),
    retryWebhookDelivery: protectedProcedure.input(z.object({ deliveryId: z.string().min(1) })).mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      return retryWebhookDelivery(input.deliveryId);
    }),
  }),
});

function getSessionToken(req: { headers: { cookie?: string; authorization?: string | string[]; "x-supabase-authorization"?: string | string[] } }): string {
  const cookieToken = parseCookie(req.headers.cookie ?? "")[COOKIE_NAME];
  if (cookieToken) return cookieToken;
  return getBearerToken(req) || "";
}

export type AppRouter = typeof appRouter;
