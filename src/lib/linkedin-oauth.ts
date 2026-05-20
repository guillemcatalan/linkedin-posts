const LINKEDIN_AUTH_URL = "https://www.linkedin.com/oauth/v2/authorization";

const SCOPES = ["openid", "profile", "email", "w_member_social"];

const CALLBACK_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL +
  "/functions/v1/linkedin-callback";

export function getLinkedInAuthUrl(userId: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID ?? "",
    redirect_uri: CALLBACK_URL,
    scope: SCOPES.join(" "),
    state: userId,
  });
  return `${LINKEDIN_AUTH_URL}?${params.toString()}`;
}
