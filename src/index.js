export default {
  async fetch(request, env, ctx) {
    // 1. Define CORS Headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*", // Allows savieregroup.com to connect
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Accept",
    };

    // 2. Handle CORS Preflight Requests
    if (request.method === "OPTIONS") {
      return new Response(null, { 
        status: 204, 
        headers: corsHeaders 
      });
    }

    // 3. Handle the Waitlist POST
    if (request.method === "POST" && new URL(request.url).pathname === "/api/waitlist") {
      try {
        const formData = await request.formData();
        const email = formData.get("email");

        if (!email) {
          return new Response(JSON.stringify({ ok: false, message: "Email is required." }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        // Write to the D1 notifications table
        await env.DB.prepare(
          "INSERT INTO notifications (email, created_at) VALUES (?, datetime('now'))"
        ).bind(email).run();

        // Success Response
        return new Response(JSON.stringify({ ok: true, message: "Thank you! You've been added to the waitlist." }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

      } catch (error) {
        // 4. Graceful Error Responses (CRITICAL: Must include CORS headers)
        let errorMessage = "The waitlist service is temporarily unavailable.";
        let statusCode = 500;

        // Catch specific SQLite errors rather than crashing silently
        if (error.message.includes("UNIQUE constraint failed")) {
           return new Response(JSON.stringify({ ok: true, message: "You are already on the waitlist!" }), {
             status: 200,
             headers: { ...corsHeaders, "Content-Type": "application/json" }
           });
        } else if (error.message.includes("no such table")) {
           errorMessage = "Database misconfigured. Missing notifications table.";
        }

        return new Response(JSON.stringify({ ok: false, message: errorMessage }), {
          status: statusCode,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    return new Response("Not found", { status: 404 });
  },
};