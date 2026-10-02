import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const workerSecret = Deno.env.get("EXPIRATION_WORKER_SECRET");

if (!supabaseUrl || !serviceRoleKey || !workerSecret) {
  throw new Error("Required Edge Function secrets are not configured.");
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({
        error: "Method not allowed."
      }),
      {
        status: 405,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }

  const authorization = req.headers.get("Authorization");

  if (authorization !== `Bearer ${workerSecret}`) {
    return new Response(
      JSON.stringify({
        error: "Unauthorized."
      }),
      {
        status: 401,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }

  const supabase = createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    }
  );

  const { data, error } = await supabase.rpc(
    "expire_payment_holds"
  );

  if (error) {
    console.error("expire_payment_holds failed:", error);

    return new Response(
      JSON.stringify({
        error: "Expiration job failed."
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }

  return new Response(
    JSON.stringify({
      success: true,
      result: data
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    }
  );
});
