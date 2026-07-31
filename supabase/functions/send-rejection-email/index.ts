import { createClient } from "npm:@supabase/supabase-js@2";

const allowedTables = new Set([
  "field_entries",
  "athani_field_entries",
  "anthiyur_field_entries",
]);

const configuredOrigins = (Deno.env.get("ALLOWED_ORIGINS") || "http://localhost:5173,http://127.0.0.1:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

function corsHeaders(request: Request) {
  const origin = request.headers.get("origin");
  const allowedOrigin = origin && configuredOrigins.includes(origin) ? origin : configuredOrigins[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

function json(request: Request, body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(request), "Content-Type": "application/json" },
  });
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(request) });
  if (request.method !== "POST") return json(request, { success: false, error: "Method not allowed." }, 405);

  const origin = request.headers.get("origin");
  if (origin && !configuredOrigins.includes(origin)) return json(request, { success: false, error: "Origin not allowed." }, 403);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const emailFrom = Deno.env.get("EMAIL_FROM");
    const authorization = request.headers.get("Authorization");

    if (!supabaseUrl || !anonKey || !serviceRoleKey || !resendApiKey || !emailFrom) {
      return json(request, { success: false, error: "Email service is not configured." }, 500);
    }
    if (!authorization?.startsWith("Bearer ")) return json(request, { success: false, error: "Authentication required." }, 401);

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false },
    });
    const { data: userData, error: userError } = await callerClient.auth.getUser(authorization.slice(7));
    if (userError || !userData.user) return json(request, { success: false, error: "Invalid authentication." }, 401);

    const { data: isAdmin, error: adminError } = await callerClient.rpc("is_admin");
    if (adminError || !isAdmin) return json(request, { success: false, error: "Verified administrator access required." }, 403);

    const body = await request.json().catch(() => ({}));
    const sourceTable = typeof body.source_table === "string" ? body.source_table : "";
    const recordId = typeof body.record_id === "string" ? body.record_id : "";
    if (!allowedTables.has(sourceTable) || !recordId) return json(request, { success: false, error: "Invalid source table or record ID." }, 400);

    const serviceClient = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
    const { data: record, error: recordError } = await serviceClient.from(sourceTable).select("*").eq("id", recordId).single();
    if (recordError || !record) return json(request, { success: false, error: "Rejected record not found." }, 404);
    if (record.status !== "Rejected") return json(request, { success: false, error: "The record is not rejected." }, 409);
    if (!record.rejection_feedback?.trim()) return json(request, { success: false, error: "The rejected record has no feedback." }, 409);
    if (record.rejection_email_sent_at) return json(request, { success: true, already_sent: true });
    if (!record.created_by) return json(request, { success: false, error: "The record has no submitter identity." }, 409);

    const { data: submitterData, error: submitterError } = await serviceClient.auth.admin.getUserById(record.created_by);
    const submitterEmail = submitterData.user?.email;
    if (submitterError || !submitterEmail) return json(request, { success: false, error: "Unable to resolve the submitter email." }, 404);

    const observationDate = sourceTable === "field_entries" ? record.observation_date : record.date_of_obs;
    const subject = "Sugarcane Field Entry Rejected – Action Required";
    const plainText = `Hello,

Your field-data submission has been rejected by the administrator.

Location: ${record.location_name}
Plot: ${record.plot}
Treatment: ${record.treatment}
Observation Day: ${record.observation_day}
Observation Date: ${observationDate}

Reason for rejection:
${record.rejection_feedback}

Please review the feedback, correct the entry, and submit it again.

Regards,
Sugarcane Survey Administration Team`;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `rejection-${sourceTable}-${recordId}-${record.rejected_at || "current"}`,
      },
      body: JSON.stringify({
        from: emailFrom,
        to: [submitterEmail],
        subject,
        text: plainText,
        html: `<p>Hello,</p><p>Your field-data submission has been rejected by the administrator.</p><ul><li><b>Location:</b> ${escapeHtml(record.location_name)}</li><li><b>Plot:</b> ${escapeHtml(record.plot)}</li><li><b>Treatment:</b> ${escapeHtml(record.treatment)}</li><li><b>Observation Day:</b> ${escapeHtml(record.observation_day)}</li><li><b>Observation Date:</b> ${escapeHtml(observationDate)}</li></ul><p><b>Reason for rejection:</b></p><p>${escapeHtml(record.rejection_feedback).replaceAll("\n", "<br>")}</p><p>Please review the feedback, correct the entry, and submit it again.</p><p>Regards,<br>Sugarcane Survey Administration Team</p>`,
      }),
    });

    if (!emailResponse.ok) {
      console.error("Rejection email provider error", emailResponse.status, await emailResponse.text());
      return json(request, { success: false, error: "The rejection was saved, but email delivery failed." }, 502);
    }

    const sentAt = new Date().toISOString();
    const { error: markError } = await serviceClient.from(sourceTable).update({ rejection_email_sent_at: sentAt }).eq("id", recordId);
    if (markError) console.error("Email sent but delivery timestamp could not be saved", markError.message);

    return json(request, { success: true, sent_at: sentAt });
  } catch (error) {
    console.error("send-rejection-email failed", error);
    return json(request, { success: false, error: "Unable to process the rejection notification." }, 500);
  }
});
