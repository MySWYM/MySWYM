import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

async function verifyStripeSignature(body: string, sigHeader: string, secret: string): Promise<boolean> {
  const timestamp = sigHeader.split(",").find(p => p.startsWith("t="))?.slice(2);
  const signature = sigHeader.split(",").find(p => p.startsWith("v1="))?.slice(3);
  if (!timestamp || !signature) return false;

  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}.${body}`));
  const computed = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
  return computed === signature;
}

Deno.serve(async (req) => {
  const sigHeader = req.headers.get("stripe-signature") ?? "";
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";

  const body = await req.text();

  const valid = await verifyStripeSignature(body, sigHeader, webhookSecret);
  if (!valid) return new Response("Invalid signature", { status: 400 });

  const event = JSON.parse(body);

  if (event.type === "checkout.session.completed") {
    const session = event.data?.object;
    const userId = session?.client_reference_id;

    if (userId) {
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: { subscription: "premium" },
      });
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
