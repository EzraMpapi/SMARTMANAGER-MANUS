# Uploaded Error Evidence Notes

## Banking/MFI runtime failure

The photograph of the authenticated Banking/MFI route shows the address ending in `/app?module=banking` and a protected application error boundary. The visible runtime exception is:

> `Coins is not defined`

The boundary states that the error affected the screen and did not alter server data. The verified source investigation must therefore find an unimported or invalid `Coins` icon/component reference in the Banking/MFI rendering path and add regression coverage.

## Banking/MFI account-opening issue

The account-opening photograph shows the Banking/MFI **Accounts** tab, the **Open customer account** form, a verified customer labelled `GODFREY — CUS-2026`, and an account-type select that contains only the placeholder **Select account type**. The open-account action appears unavailable because no account-type option is loaded. This is recorded as an empty/failed resource state, not evidence that a new account type should be invented or seeded.

## Banking/MFI resource warning

The Banking/MFI overview photograph identifies the tenant as **NBM** and visibly reports:

> Some Bank & MFI resources are not yet available: `paymentInstructions`. No substitute figures are shown.

The cards correctly display **Insufficient confirmed data** rather than producing substitute financial figures. The dependency must be traced to its table or service contract and handled as a recoverable resource state; no deposit, loan, or arrears data should be created to suppress this warning.

## AI Assistant reachability failure

The AI Assistant photograph shows the Business Consultant interface and the error toast:

> The AI Assistant could not be reached. Please try again shortly.

The assistant screen remains rendered, but the submitted request did not receive a usable response. The fix must distinguish configuration, network, authentication, rate-limit, and provider failures without revealing credentials, business records, or an invented assistant answer.

## Read-only live dependency audit

The connected Supabase project `rlhngsrihahhyxnjxrxm` was active and healthy during the investigation. Read-only metadata inspection confirmed that both `bank_account_types` and `bank_payment_instructions` exist, have Row Level Security enabled, and have tenant select and write policies. `bank_payment_instructions` exposes `requested_at` but **does not expose `created_at`**.

The Banking/MFI snapshot requested `created_at` from `bank_payment_instructions`; that unsupported column is sufficient to make the resource request fail while other snapshot resources remain available. The repair should request only the verified column contract and retain `requested_at` as the ordering timestamp. The empty account-type control is a genuine no-record state: it should direct an authorized user to configure an account type instead of displaying a disabled unexplained select or creating a seeded product.
