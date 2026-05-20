import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req: Request) => {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state"); // userId
  const error = url.searchParams.get("error");

  const clientId = Deno.env.get("LINKEDIN_CLIENT_ID")!;
  const clientSecret = Deno.env.get("LINKEDIN_CLIENT_SECRET")!;
  const redirectUri = Deno.env.get("LINKEDIN_REDIRECT_URI")!;
  const frontendUrl = Deno.env.get("FRONTEND_URL") ?? "https://guillemcatalan.github.io/linkedin-posts";

  if (error || !code || !state) {
    return Response.redirect(
      `${frontendUrl}/onboarding/import/?linkedin=error`,
      302
    );
  }

  try {
    // Exchange authorization code for access token
    const tokenRes = await fetch(
      "https://www.linkedin.com/oauth/v2/accessToken",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
          client_id: clientId,
          client_secret: clientSecret,
        }),
      }
    );

    if (!tokenRes.ok) {
      console.error("Token exchange failed:", await tokenRes.text());
      return Response.redirect(
        `${frontendUrl}/onboarding/import/?linkedin=error`,
        302
      );
    }

    const tokens = await tokenRes.json();
    const accessToken = tokens.access_token;
    const expiresIn = tokens.expires_in ?? 5184000; // 60 days default
    const refreshToken = tokens.refresh_token ?? null;

    // Get user info from LinkedIn
    const userInfoRes = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userInfoRes.ok) {
      console.error("Userinfo failed:", await userInfoRes.text());
      return Response.redirect(
        `${frontendUrl}/onboarding/import/?linkedin=error`,
        302
      );
    }

    const userInfo = await userInfoRes.json();
    const linkedinSub = userInfo.sub;

    // Save tokens to database
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    await supabaseAdmin.from("linkedin_tokens").upsert({
      user_id: state,
      linkedin_sub: linkedinSub,
      access_token: accessToken,
      refresh_token: refreshToken,
      token_expires_at: expiresAt,
      scopes: "openid profile email w_member_social",
      updated_at: new Date().toISOString(),
    });

    return Response.redirect(
      `${frontendUrl}/onboarding/import/?linkedin=connected`,
      302
    );
  } catch (err) {
    console.error("LinkedIn callback error:", err);
    return Response.redirect(
      `${frontendUrl}/onboarding/import/?linkedin=error`,
      302
    );
  }
});
