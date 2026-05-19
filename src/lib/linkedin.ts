const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID!;
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET!;
const LINKEDIN_REDIRECT_URI = process.env.LINKEDIN_REDIRECT_URI!;

const SCOPES = ["openid", "profile", "email", "w_member_social"];

export function getAuthUrl(): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: LINKEDIN_CLIENT_ID,
    redirect_uri: LINKEDIN_REDIRECT_URI,
    scope: SCOPES.join(" "),
  });
  return `https://www.linkedin.com/oauth/v2/authorization?${params}`;
}

export async function exchangeCodeForToken(code: string): Promise<string> {
  const res = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: LINKEDIN_CLIENT_ID,
      client_secret: LINKEDIN_CLIENT_SECRET,
      redirect_uri: LINKEDIN_REDIRECT_URI,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token exchange failed: ${err}`);
  }

  const data = await res.json();
  return data.access_token;
}

export interface LinkedInProfile {
  sub: string;
  name: string;
  given_name: string;
  family_name: string;
  email: string;
  picture?: string;
}

export async function fetchProfile(token: string): Promise<LinkedInProfile> {
  const res = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Profile fetch failed: ${err}`);
  }

  return res.json();
}

export interface LinkedInPost {
  text: string;
  created_at: string;
  likes: number;
  comments: number;
}

export async function fetchUserPosts(
  token: string,
  personId: string
): Promise<LinkedInPost[]> {
  const author = encodeURIComponent(`urn:li:person:${personId}`);

  const res = await fetch(
    `https://api.linkedin.com/rest/posts?q=author&author=${author}&count=20`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "LinkedIn-Version": "202401",
        "X-Restli-Protocol-Version": "2.0.0",
      },
    }
  );

  if (!res.ok) {
    console.error("Posts fetch failed:", await res.text());
    return [];
  }

  const data = await res.json();
  const elements = data.elements || [];

  return elements.map((post: Record<string, unknown>) => ({
    text: (post.commentary as string) || "",
    created_at: post.createdAt
      ? new Date(post.createdAt as number).toISOString()
      : "",
    likes: 0,
    comments: 0,
  }));
}
