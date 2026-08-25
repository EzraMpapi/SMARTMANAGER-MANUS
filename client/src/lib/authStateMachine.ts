export const AUTH_STATES = {
  INITIALIZING: "INITIALIZING",
  UNAUTHENTICATED: "UNAUTHENTICATED",
  AUTHENTICATED: "AUTHENTICATED",
  PROFILE_LOADING: "PROFILE_LOADING",
  WORKSPACE_LOADING: "WORKSPACE_LOADING",
  AUTHORIZED: "AUTHORIZED",
  UNAUTHORIZED: "UNAUTHORIZED",
  AUTH_ERROR: "AUTH_ERROR",
} as const;

export type AuthStateName = (typeof AUTH_STATES)[keyof typeof AUTH_STATES];

export type AuthIdentity = {
  profile: Record<string, unknown> | null;
  company: Record<string, unknown> | null;
  workspace: Record<string, unknown> | null;
  membership: Record<string, unknown> | null;
  role: string | null;
  permissions: string[];
};

export type AuthMachineState = AuthIdentity & {
  status: AuthStateName;
  session: any | null;
  user: any | null;
  error: { code?: string; message: string } | null;
  reason: string | null;
};

export const emptyIdentity: AuthIdentity = {
  profile: null,
  company: null,
  workspace: null,
  membership: null,
  role: null,
  permissions: [],
};

export const initialAuthState: AuthMachineState = {
  status: AUTH_STATES.INITIALIZING,
  session: null,
  user: null,
  ...emptyIdentity,
  error: null,
  reason: null,
};

type AuthAction =
  | { type: "SESSION_ESTABLISHED"; session: any; user?: any }
  | { type: "PROFILE_LOADING" }
  | { type: "WORKSPACE_LOADING"; profile: Record<string, unknown> }
  | { type: "AUTHORIZED"; session: any; user: any; identity: AuthIdentity }
  | { type: "INCOMPLETE_IDENTITY"; session: any; user: any; profile?: Record<string, unknown> | null; reason: string }
  | { type: "AUTH_ERROR"; error: unknown; reason?: string }
  | { type: "SIGNED_OUT" }
  | { type: "USER_UPDATED"; user: any; session?: any }
  | { type: "TOKEN_REFRESHED"; session: any; user?: any }
  | { type: "PASSWORD_RECOVERY"; session: any; user?: any };

function safeError(error: unknown) {
  if (error && typeof error === "object") {
    const candidate = error as { code?: unknown; message?: unknown };
    return {
      code: typeof candidate.code === "string" ? candidate.code : undefined,
      message: typeof candidate.message === "string" && candidate.message ? candidate.message : "Authentication could not be completed.",
    };
  }
  return { message: "Authentication could not be completed." };
}

export function authReducer(state: AuthMachineState, action: AuthAction): AuthMachineState {
  switch (action.type) {
    case "SESSION_ESTABLISHED":
      return {
        ...state,
        status: AUTH_STATES.AUTHENTICATED,
        session: action.session,
        user: action.user || action.session?.user || null,
        error: null,
        reason: null,
      };
    case "PROFILE_LOADING":
      return { ...state, status: AUTH_STATES.PROFILE_LOADING, error: null, reason: null };
    case "WORKSPACE_LOADING":
      return { ...state, status: AUTH_STATES.WORKSPACE_LOADING, profile: action.profile, error: null, reason: null };
    case "AUTHORIZED":
      return {
        ...state,
        status: AUTH_STATES.AUTHORIZED,
        session: action.session,
        user: action.user,
        ...action.identity,
        error: null,
        reason: null,
      };
    case "INCOMPLETE_IDENTITY":
      return {
        ...state,
        status: AUTH_STATES.UNAUTHORIZED,
        session: action.session,
        user: action.user,
        profile: action.profile || null,
        company: null,
        workspace: null,
        membership: null,
        role: null,
        permissions: [],
        error: null,
        reason: action.reason,
      };
    case "AUTH_ERROR":
      return {
        ...state,
        status: AUTH_STATES.AUTH_ERROR,
        error: safeError(action.error),
        reason: action.reason || "AUTH_ERROR",
      };
    case "SIGNED_OUT":
      return { ...initialAuthState, status: AUTH_STATES.UNAUTHENTICATED };
    case "USER_UPDATED":
      return { ...state, status: state.status === AUTH_STATES.UNAUTHENTICATED ? AUTH_STATES.AUTHENTICATED : state.status, user: action.user, session: action.session || state.session, error: null };
    case "TOKEN_REFRESHED":
      return { ...state, session: action.session, user: action.user || action.session?.user || state.user, error: null };
    case "PASSWORD_RECOVERY":
      return { ...state, status: AUTH_STATES.AUTHENTICATED, session: action.session, user: action.user || action.session?.user || null, error: null, reason: "PASSWORD_RECOVERY" };
    default:
      return state;
  }
}

export function isAuthLoading(status: AuthStateName) {
  return status === AUTH_STATES.INITIALIZING || status === AUTH_STATES.PROFILE_LOADING || status === AUTH_STATES.WORKSPACE_LOADING;
}
