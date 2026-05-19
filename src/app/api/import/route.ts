import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import { saveUserPost } from "@/lib/excel";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const userId = formData.get("userId") as string | null;

    if (!file || !userId) {
      return NextResponse.json(
        { error: "Missing file or userId" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const zip = await JSZip.loadAsync(buffer);

    let postsCount = 0;
    let commentsCount = 0;

    const sharesFile =
      zip.file("Shares.csv") ?? findFile(zip, "shares.csv");
    if (sharesFile) {
      const content = await sharesFile.async("text");
      const posts = parseCSV(content);
      for (const row of posts) {
        const text = row["ShareCommentary"] || row["shareCommentary"] || "";
        if (!text.trim()) continue;
        const date = row["Date"] || row["SharedDate"] || row["date"] || "";
        await saveUserPost({
          user_id: userId,
          post_text: text,
          post_date: date,
          likes: 0,
          comments: 0,
        });
        postsCount++;
      }
    }

    const commentsFile =
      zip.file("Comments.csv") ?? findFile(zip, "comments.csv");
    if (commentsFile) {
      const content = await commentsFile.async("text");
      const comments = parseCSV(content);
      commentsCount = comments.length;
    }

    return NextResponse.json({ posts: postsCount, comments: commentsCount });
  } catch (error) {
    console.error("Import failed:", error);
    return NextResponse.json(
      { error: "Failed to process LinkedIn data export" },
      { status: 500 }
    );
  }
}

function findFile(zip: JSZip, name: string): JSZip.JSZipObject | null {
  const lowerName = name.toLowerCase();
  for (const [path, file] of Object.entries(zip.files)) {
    if (path.toLowerCase().endsWith(lowerName) && !file.dir) {
      return file;
    }
  }
  return null;
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
