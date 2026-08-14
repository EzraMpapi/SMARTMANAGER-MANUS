const recipient = process.env.TRANSACTIONAL_EMAIL_TEST_RECIPIENT;
const apiKey = process.env.RESEND_API_KEY;
const from = process.env.RESEND_FROM_EMAIL;

if (!recipient || !apiKey || !from) {
  console.error("Transactional email test is not configured.");
  process.exit(1);
}

const response = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: {
    accept: "application/json",
    "content-type": "application/json",
    authorization: `Bearer ${apiKey}`,
  },
  body: JSON.stringify({
    from,
    to: [recipient],
    subject: "Smart Manager transactional email delivery test",
    text: "This is an authorised Smart Manager delivery test. No action is required.",
    html: "<!doctype html><html><body style=\"margin:0;background:#f4f7f6;font-family:Arial,sans-serif;color:#172033\"><table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"padding:28px 12px\"><tr><td align=\"center\"><table role=\"presentation\" width=\"100%\" style=\"max-width:600px;background:#ffffff;border:1px solid #e5e7eb;border-radius:18px\"><tr><td style=\"background:#0b2d22;padding:22px 28px;color:#ffffff\"><strong style=\"font-size:18px\">Smart Manager</strong><span style=\"display:block;margin-top:4px;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#a7f3d0\">Enterprise ERP</span></td></tr><tr><td style=\"padding:30px 28px\"><h1 style=\"margin:0 0 14px;font-size:23px;color:#111827\">Transactional delivery test</h1><p style=\"margin:0;font-size:15px;line-height:1.7;color:#475569\">This is an authorised Smart Manager delivery test. No action is required.</p></td></tr></table></td></tr></table></body></html>",
    tags: [{ name: "category", value: "notification" }, { name: "purpose", value: "delivery-test" }],
  }),
});

const body = await response.json().catch(() => ({}));
if (!response.ok || !body?.id) {
  const safeMessage = typeof body?.message === "string" ? body.message.replace(/[\r\n]/g, " ").slice(0, 180) : "no provider message";
  console.error(`Transactional email provider rejected the test (${response.status}): ${safeMessage}`);
  process.exit(1);
}

console.log("Transactional email provider accepted the authorised delivery test.");
