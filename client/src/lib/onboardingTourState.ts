export type OnboardingCompletionState = {
  localStorageValue?: string | null;
  profileCompletedAt?: string | null;
};

function hasValue(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * The tour is complete when either persistence source confirms completion.
 * Local storage is scoped by the caller to user + workspace; profile metadata
 * is scoped to the authenticated user by the server.
 */
export function hasOnboardingCompletion({ localStorageValue, profileCompletedAt }: OnboardingCompletionState): boolean {
  return hasValue(localStorageValue) || hasValue(profileCompletedAt);
}

export function shouldOpenOnboardingTour(state: OnboardingCompletionState): boolean {
  return !hasOnboardingCompletion(state);
}
