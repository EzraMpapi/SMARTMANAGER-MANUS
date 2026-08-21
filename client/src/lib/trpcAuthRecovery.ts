import { UNAUTHED_ERR_MSG } from "@shared/const";

type TrpcAuthErrorLike = {
  message?: unknown;
  data?: {
    code?: unknown;
    httpStatus?: unknown;
  };
};

export function isUnauthenticatedTrpcFailure(error: unknown): boolean {
  const candidate = error as TrpcAuthErrorLike | null;
  return candidate?.message === UNAUTHED_ERR_MSG
    || candidate?.data?.code === "UNAUTHORIZED"
    || Number(candidate?.data?.httpStatus) === 401;
}

export function hasStoredSupabaseSession(storage: Pick<Storage, "getItem">): boolean {
  return Boolean(storage.getItem("bs_access_token") || storage.getItem("bs_session_access_token"));
}
