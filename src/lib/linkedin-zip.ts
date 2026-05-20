import type { SupabaseClient } from "@supabase/supabase-js";

interface ImportResult {
  postsCount: number;
  profileImported: boolean;
  positionsCount: number;
  skillsCount: number;
  educationCount: number;
  certificationsCount: number;
  projectsCount: number;
  languagesCount: number;
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
    educationCount: 0,
    certificationsCount: 0,
    projectsCount: 0,
    languagesCount: 0,
  };

  // Clean previous imports to avoid duplicates on re-upload
  await Promise.all([
    supabase.from("user_positions").delete().eq("user_id", userId),
    supabase.from("user_education").delete().eq("user_id", userId),
    supabase.from("user_certifications").delete().eq("user_id", userId),
    supabase.from("user_projects").delete().eq("user_id", userId),
    supabase.from("user_posts").delete().eq("user_id", userId),
  ]);

  // 1. Profile.csv → profiles table
  const profileFile = findFile(zip, "Profile.csv");
  if (profileFile) {
    const content = await profileFile.async("text");
    const rows = parseCSV(content);
    if (rows.length > 0) {
      const row = rows[0];
      await supabase.from("profiles").upsert({
        user_id: userId,
        headline: row["Headline"] || "",
        about: row["Summary"] || "",
        location: row["Geo Location"] || "",
      });
      result.profileImported = true;
    }
  }

  // 2. Positions.csv → user_positions (ALL) + profiles (current)
  const positionsFile = findFile(zip, "Positions.csv");
  if (positionsFile) {
    const content = await positionsFile.async("text");
    const rows = parseCSV(content);

    const inserts = rows.map((r) => ({
      user_id: userId,
      title: r["Title"] || "",
      company: r["Company Name"] || "",
      description: r["Description"] || "",
      location: r["Location"] || "",
      started_on: r["Started On"] || "",
      finished_on: r["Finished On"] || "",
      is_current: !r["Finished On"]?.trim(),
    }));

    if (inserts.length > 0) {
      await supabase.from("user_positions").insert(inserts);
      result.positionsCount = inserts.length;
    }

    const currentPosition = rows.find((r) => !r["Finished On"]?.trim());
    if (currentPosition) {
      await supabase.from("profiles").upsert({
        user_id: userId,
        role_title: currentPosition["Title"] || "",
        company: currentPosition["Company Name"] || "",
      });
    }
  }

  // 3. Skills.csv → user_style.common_topics
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

  // 4. Shares.csv → user_posts
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

  // 5. Education.csv → user_education
  const educationFile = findFile(zip, "Education.csv");
  if (educationFile) {
    const content = await educationFile.async("text");
    const rows = parseCSV(content);
    const inserts = rows
      .filter((r) => (r["School Name"] || "").trim())
      .map((r) => ({
        user_id: userId,
        school: r["School Name"] || "",
        degree: r["Degree Name"] || "",
        field_of_study: r["Field Of Study"] || r["Fields of Study"] || "",
        started_on: r["Start Date"] || r["Started On"] || "",
        finished_on: r["End Date"] || r["Finished On"] || "",
        notes: r["Notes"] || r["Activities and Societies"] || "",
      }));

    if (inserts.length > 0) {
      await supabase.from("user_education").insert(inserts);
      result.educationCount = inserts.length;
    }
  }

  // 6. Certifications.csv → user_certifications
  const certsFile = findFile(zip, "Certifications.csv");
  if (certsFile) {
    const content = await certsFile.async("text");
    const rows = parseCSV(content);
    const inserts = rows
      .filter((r) => (r["Name"] || "").trim())
      .map((r) => ({
        user_id: userId,
        name: r["Name"] || "",
        authority: r["Authority"] || "",
        started_on: r["Started On"] || r["Start Date"] || "",
        finished_on: r["Finished On"] || r["End Date"] || "",
        url: r["Url"] || r["URL"] || "",
      }));

    if (inserts.length > 0) {
      await supabase.from("user_certifications").insert(inserts);
      result.certificationsCount = inserts.length;
    }
  }

  // 7. Projects.csv → user_projects
  const projectsFile = findFile(zip, "Projects.csv");
  if (projectsFile) {
    const content = await projectsFile.async("text");
    const rows = parseCSV(content);
    const inserts = rows
      .filter((r) => (r["Title"] || "").trim())
      .map((r) => ({
        user_id: userId,
        title: r["Title"] || "",
        description: r["Description"] || "",
        started_on: r["Started On"] || r["Start Date"] || "",
        finished_on: r["Finished On"] || r["End Date"] || "",
        url: r["Url"] || r["URL"] || "",
      }));

    if (inserts.length > 0) {
      await supabase.from("user_projects").insert(inserts);
      result.projectsCount = inserts.length;
    }
  }

  // 8. Languages.csv → profiles.languages
  const languagesFile = findFile(zip, "Languages.csv");
  if (languagesFile) {
    const content = await languagesFile.async("text");
    const rows = parseCSV(content);
    const langs = rows
      .map((r) => {
        const name = r["Name"] || "";
        const proficiency = r["Proficiency"] || "";
        return proficiency ? `${name} (${proficiency})` : name;
      })
      .filter(Boolean);

    if (langs.length > 0) {
      await supabase.from("profiles").upsert({
        user_id: userId,
        languages: langs.join(", "),
      });
      result.languagesCount = langs.length;
    }
  }

  return result;
}

export function formatImportResult(result: ImportResult): string {
  const parts: string[] = [];
  if (result.profileImported) parts.push("profile info");
  if (result.positionsCount > 0)
    parts.push(`${result.positionsCount} positions`);
  if (result.educationCount > 0)
    parts.push(`${result.educationCount} education`);
  if (result.certificationsCount > 0)
    parts.push(`${result.certificationsCount} certifications`);
  if (result.projectsCount > 0)
    parts.push(`${result.projectsCount} projects`);
  if (result.languagesCount > 0)
    parts.push(`${result.languagesCount} languages`);
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
