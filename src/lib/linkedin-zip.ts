import type { SupabaseClient } from "@supabase/supabase-js";

interface ImportResult {
  postsCount: number;
  profileImported: boolean;
  positionsCount: number;
  skillsCount: number;
}

export async function processLinkedInZip(
  file: File,
  userId: string,
  supabase: SupabaseClient
): Promise<ImportResult> {
  const JSZip = (await import("jszip")).default;
  const buffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(buffer);

  const result: ImportResult = {
    postsCount: 0,
    profileImported: false,
    positionsCount: 0,
    skillsCount: 0,
  };

  // 1. Parse Profile.csv → update profiles table
  const profileFile = findFile(zip, "Profile.csv");
  if (profileFile) {
    const content = await profileFile.async("text");
    const rows = parseCSV(content);
    if (rows.length > 0) {
      const row = rows[0];
      const headline = row["Headline"] || "";
      const about = row["Summary"] || "";
      const location = row["Geo Location"] || "";

      await supabase.from("profiles").upsert({
        user_id: userId,
        headline,
        about,
        location,
      });
      result.profileImported = true;
    }
  }

  // 2. Parse Positions.csv → update profiles with current role + company
  const positionsFile = findFile(zip, "Positions.csv");
  if (positionsFile) {
    const content = await positionsFile.async("text");
    const rows = parseCSV(content);
    const currentPosition = rows.find((r) => !r["Finished On"]?.trim());
    if (currentPosition) {
      await supabase
        .from("profiles")
        .upsert({
          user_id: userId,
          role_title: currentPosition["Title"] || "",
          company: currentPosition["Company Name"] || "",
        });
    }
    result.positionsCount = rows.length;
  }

  // 3. Parse Skills.csv → store in user_style.common_topics
  const skillsFile = findFile(zip, "Skills.csv");
  if (skillsFile) {
    const content = await skillsFile.async("text");
    const rows = parseCSV(content);
    const skills = rows
      .map((r) => r["Name"] || "")
      .filter(Boolean)
      .slice(0, 20);
    if (skills.length > 0) {
      await supabase.from("user_style").upsert({
        user_id: userId,
        common_topics: skills.join(", "),
      });
      result.skillsCount = skills.length;
    }
  }

  // 4. Parse Shares.csv → user_posts (only in Larger export)
  const sharesFile = findFile(zip, "Shares.csv");
  if (sharesFile) {
    const content = await sharesFile.async("text");
    const rows = parseCSV(content);
    const inserts = rows
      .map((row) => {
        const text = row["ShareCommentary"] || row["shareCommentary"] || "";
        if (!text.trim()) return null;
        const date = row["Date"] || row["SharedDate"] || row["date"] || "";
        return { user_id: userId, post_text: text, post_date: date || null };
      })
      .filter(
        (r): r is { user_id: string; post_text: string; post_date: string | null } =>
          r !== null
      );

    if (inserts.length > 0) {
      await supabase.from("user_posts").insert(inserts);
      result.postsCount = inserts.length;
    }
  }

  return result;
}

export function formatImportResult(result: ImportResult): string {
  const parts: string[] = [];
  if (result.profileImported) parts.push("profile info");
  if (result.positionsCount > 0)
    parts.push(`${result.positionsCount} positions`);
  if (result.skillsCount > 0) parts.push(`${result.skillsCount} skills`);
  if (result.postsCount > 0) parts.push(`${result.postsCount} posts`);

  if (parts.length === 0) return "No data found in the ZIP file.";
  return `Imported ${parts.join(", ")}. This data will personalize your posts.`;
}

function findFile(zip: InstanceType<typeof import("jszip")>, name: string) {
  return (
    zip.file(name) ??
    Object.values(zip.files).find(
      (f) => !f.dir && f.name.toLowerCase().endsWith(name.toLowerCase())
    ) ??
    null
  );
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split("\n");
  if (lines.length < 2) return [];
  const headers = parseCSVLine(lines[0]);
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = parseCSVLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h.trim()] = (values[idx] || "").trim();
    });
    rows.push(row);
  }
  return rows;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }
  }
  result.push(current);
  return result;
}
