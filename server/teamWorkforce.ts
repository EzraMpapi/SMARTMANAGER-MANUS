import { TRPCError } from "@trpc/server";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { resolveVerifiedProfile } from "./aiApprovals";
import { listTeamInvitations } from "./teamInvitations";
import { ENV } from "./_core/env";

type JsonRecord = Record<string, unknown>;

type WorkforceEmployee = {
  id: string;
  profile_id?: string | null;
  full_name?: string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  department?: string | null;
  department_id?: string | null;
  position_id?: string | null;
  manager_employee_id?: string | null;
  employee_number?: string | null;
  employment_start_date?: string | null;
  employment_end_date?: string | null;
  status?: string | null;
  contract_type?: string | null;
  branch_id?: string | null;
  created_at?: string | null;
  data?: JsonRecord;
};

type WorkforceDepartment = { id: string; name?: string | null; status?: string | null };
type WorkforcePosition = { id: string; title?: string | null; department_id?: string | null; status?: string | null };

const MANAGE_WORKFORCE_ROLES = new Set([
  "organization owner",
  "ceo",
  "super administrator",
  "system administrator",
  "hr manager",
  "admin",
  "owner",
  "manager",
]);

function requireSupabase() {
  if (!ENV.supabaseUrl || !ENV.supabaseAnonKey) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Team & Workforce data services are not configured." });
  }
  return { url: ENV.supabaseUrl.replace(/\/$/, ""), anonKey: ENV.supabaseAnonKey };
}

async function supabaseGet<T>(path: string, token: string): Promise<T[]> {
  const { url, anonKey } = requireSupabase();
  const response = await fetch(`${url}/rest/v1/${path}`, {
    headers: { apikey: anonKey, authorization: `Bearer ${token}` },
  });
  const body = await response.json().catch(() => null) as unknown;
  if (!response.ok) {
    if (response.status === 401) throw new TRPCError({ code: "UNAUTHORIZED", message: "Your workspace session could not be verified." });
    if (response.status === 403) throw new TRPCError({ code: "FORBIDDEN", message: "Team & Workforce data is not available to this workspace." });
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Team & Workforce data could not be loaded." });
  }
  return Array.isArray(body) ? body as T[] : [];
}

function safeText(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function roleCanManage(role: string) {
  return MANAGE_WORKFORCE_ROLES.has(role.trim().toLowerCase());
}

function profileCompletion(employee: WorkforceEmployee) {
  const data = employee.data || {};
  const checks = [
    data.full_name || data.name || employee.name,
    data.email,
    data.phone,
    employee.employee_number,
    employee.department_id || data.department,
    employee.position_id,
    employee.employment_start_date || data.hire_date,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export async function getTeamWorkforceSnapshot(req: CreateExpressContextOptions["req"]) {
  const { profile, token } = await resolveVerifiedProfile(req);
  const role = safeText(profile.role, "Employee");
  if (!roleCanManage(role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Your workspace role cannot view Team & Workforce administration." });
  }

  const companyId = profile.company_id;
  const companyFilter = `company_id=eq.${encodeURIComponent(companyId)}`;
  const [employees, departments, positions, onboardingCases, invitations] = await Promise.all([
    supabaseGet<WorkforceEmployee>(`hr_employees?select=id,profile_id,name,status,amount,notes,data,created_at,updated_at,department_id,position_id,manager_employee_id,employee_number,employment_start_date,employment_end_date,timezone&${companyFilter}&order=created_at.desc&limit=500`, token),
    supabaseGet<WorkforceDepartment>(`departments?select=id,name,status&${companyFilter}&order=name.asc&limit=200`, token),
    supabaseGet<WorkforcePosition>(`hr_positions?select=id,title,department_id,status&${companyFilter}&order=title.asc&limit=200`, token),
    supabaseGet<JsonRecord>(`hr_onboarding_cases?select=id,employee_id,status,start_date,due_date&${companyFilter}&order=created_at.desc&limit=500`, token),
    listTeamInvitations(req).catch((error) => {
      if (error instanceof TRPCError && error.code === "FORBIDDEN") return [];
      throw error;
    }),
  ]);

  const normalizedEmployees = employees.map((employee) => {
    const data = employee.data || {};
    return {
      id: employee.id,
      name: safeText(data.full_name || data.name || employee.name, "Unnamed employee"),
      email: safeText(data.email, "Not provided"),
      phone: safeText(data.phone),
      role: safeText(data.role, "Employee"),
      department: safeText(data.department, departments.find((department) => department.id === employee.department_id)?.name || "Unassigned"),
      position: positions.find((position) => position.id === employee.position_id)?.title || "Unassigned",
      status: safeText(employee.status || data.status, "Active"),
      contractType: safeText(data.contract_type),
      employeeNumber: safeText(employee.employee_number, "Not assigned"),
      branchId: safeText(data.branch_id) || null,
      managerEmployeeId: employee.manager_employee_id || null,
      employmentStartDate: employee.employment_start_date || (typeof data.hire_date === "string" ? data.hire_date : null),
      profileCompletion: profileCompletion(employee),
      createdAt: employee.created_at || null,
    };
  });

  const onboardingByEmployee = new Map(onboardingCases.map((item) => [String(item.employee_id || ""), item]));
  const activeEmployees = normalizedEmployees.filter((employee) => !["inactive", "terminated", "offboarded", "suspended"].includes(employee.status.toLowerCase()));
  const suspendedEmployees = normalizedEmployees.filter((employee) => employee.status.toLowerCase() === "suspended");
  const now = Date.now();
  const pendingInvitations = invitations.filter((invitation) => ["pending", "delivery_failed"].includes(String(invitation.status).toLowerCase()));
  const expiringInvitations = pendingInvitations.filter((invitation) => {
    const expiresAt = Date.parse(String(invitation.expiresAt || ""));
    return Number.isFinite(expiresAt) && expiresAt > now && expiresAt <= now + 72 * 60 * 60 * 1000;
  });
  const requiringOnboarding = normalizedEmployees.filter((employee) => {
    const onboarding = onboardingByEmployee.get(employee.id);
    return onboarding && String(onboarding.status || "").toLowerCase() !== "completed";
  });
  const recentCutoff = now - 30 * 24 * 60 * 60 * 1000;
  const recentlyJoined = normalizedEmployees.filter((employee) => employee.createdAt && Date.parse(employee.createdAt) >= recentCutoff);
  const employeesMissingProfiles = normalizedEmployees.filter((employee) => employee.profileCompletion < 100);
  const roleCounts = normalizedEmployees.reduce<Record<string, number>>((counts, employee) => {
    const key = employee.role.toLowerCase();
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});

  return {
    viewer: { role, canManage: true },
    overview: {
      totalEmployees: normalizedEmployees.length,
      activeEmployees: activeEmployees.length,
      suspendedAccounts: suspendedEmployees.length,
      pendingInvitations: pendingInvitations.length,
      expiringInvitations: expiringInvitations.length,
      administrators: normalizedEmployees.filter((employee) => /administrator|owner|ceo|admin/i.test(employee.role)).length,
      managers: normalizedEmployees.filter((employee) => /manager/i.test(employee.role)).length,
      employees: roleCounts.employee || 0,
      externalContractMembers: normalizedEmployees.filter((employee) => /contract|consultant|temporary|volunteer/i.test(`${employee.contractType || ""} ${employee.status}`)).length,
      membersOnline: null,
      recentlyJoined: recentlyJoined.length,
      accessRequests: null,
    },
    coverage: {
      completeProfiles: normalizedEmployees.length - employeesMissingProfiles.length,
      missingProfiles: employeesMissingProfiles.length,
      withoutAssignedRoles: normalizedEmployees.filter((employee) => employee.role === "Employee" && !employee.position).length,
      withoutModulePermissions: null,
      requiringOnboarding: requiringOnboarding.length,
    },
    security: {
      accountsWithoutMfa: null,
      temporaryPasswords: null,
      recentlyFailedLogins: null,
      suspendedAccounts: suspendedEmployees.length,
      dormantAccounts: null,
    },
    departments: departments.filter((department) => String(department.status || "Active").toLowerCase() !== "inactive").map((department) => ({ id: department.id, name: safeText(department.name, "Unnamed department") })),
    positions: positions.filter((position) => String(position.status || "Active").toLowerCase() !== "inactive").map((position) => ({ id: position.id, title: safeText(position.title, "Unnamed position"), departmentId: position.department_id || null })),
    employees: normalizedEmployees,
    invitations: pendingInvitations.map((invitation) => ({
      id: invitation.id,
      fullName: invitation.fullName,
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      createdAt: invitation.createdAt,
    })),
    generatedAt: new Date().toISOString(),
  };
}
