import ExcelJS from "exceljs";
import { join } from "path";
import { v4 as uuid } from "uuid";
import type {
  User,
  Profile,
  UserPost,
  UserStyle,
  GeneratedPost,
} from "@/types";

const DB_PATH = join(process.cwd(), "data", "database.xlsx");

const SHEETS = {
  Users: ["id", "name", "email", "linkedin_url", "department", "created_at"],
  Profiles: [
    "user_id",
    "headline",
    "about",
    "current_role",
    "company",
    "location",
    "scraped_at",
  ],
  UserPosts: ["user_id", "post_text", "post_date", "likes", "comments"],
  UserStyle: [
    "user_id",
    "tone",
    "avg_word_count",
    "emoji_usage",
    "common_topics",
    "writing_notes",
  ],
  GeneratedPosts: [
    "id",
    "user_id",
    "input_what_happened",
    "input_the_point",
    "variant_1",
    "variant_2",
    "variant_3",
    "created_at",
  ],
} as const;

async function getWorkbook(): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.readFile(DB_PATH);
    for (const [name, columns] of Object.entries(SHEETS)) {
      const sheet = workbook.getWorksheet(name);
      if (sheet) {
        sheet.columns = columns.map((col) => ({ header: col, key: col }));
      }
    }
  } catch {
    for (const [name, columns] of Object.entries(SHEETS)) {
      const sheet = workbook.addWorksheet(name);
      sheet.columns = columns.map((col) => ({ header: col, key: col }));
    }
    await workbook.xlsx.writeFile(DB_PATH);
  }
  return workbook;
}

function sheetToRows<T>(sheet: ExcelJS.Worksheet): T[] {
  const rows: T[] = [];
  const headers = (sheet.getRow(1).values as string[]).slice(1);
  sheet.eachRow((row, index) => {
    if (index === 1) return;
    const obj: Record<string, unknown> = {};
    headers.forEach((header, i) => {
      obj[header] = row.getCell(i + 1).value;
    });
    rows.push(obj as T);
  });
  return rows;
}

// --- Users ---

export async function createUser(
  name: string,
  email: string,
  linkedinUrl: string,
  department: string = ""
): Promise<User> {
  const workbook = await getWorkbook();
  const sheet = workbook.getWorksheet("Users")!;
  const user: User = {
    id: uuid(),
    name,
    email,
    linkedin_url: linkedinUrl,
    department,
    created_at: new Date().toISOString(),
  };
  sheet.addRow(user);
  await workbook.xlsx.writeFile(DB_PATH);
  return user;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const workbook = await getWorkbook();
  const sheet = workbook.getWorksheet("Users")!;
  const users = sheetToRows<User>(sheet);
  return users.find((u) => u.email === email) ?? null;
}

export async function getUserById(id: string): Promise<User | null> {
  const workbook = await getWorkbook();
  const sheet = workbook.getWorksheet("Users")!;
  const users = sheetToRows<User>(sheet);
  return users.find((u) => u.id === id) ?? null;
}

// --- Profiles ---

export async function getProfile(userId: string): Promise<Profile | null> {
  const workbook = await getWorkbook();
  const sheet = workbook.getWorksheet("Profiles")!;
  const profiles = sheetToRows<Profile>(sheet);
  return profiles.find((p) => p.user_id === userId) ?? null;
}

export async function saveProfile(profile: Profile): Promise<void> {
  const workbook = await getWorkbook();
  const sheet = workbook.getWorksheet("Profiles")!;
  sheet.addRow(profile);
  await workbook.xlsx.writeFile(DB_PATH);
}

// --- User Posts ---

export async function getUserPosts(userId: string): Promise<UserPost[]> {
  const workbook = await getWorkbook();
  const sheet = workbook.getWorksheet("UserPosts")!;
  const posts = sheetToRows<UserPost>(sheet);
  return posts.filter((p) => p.user_id === userId);
}

export async function saveUserPost(post: UserPost): Promise<void> {
  const workbook = await getWorkbook();
  const sheet = workbook.getWorksheet("UserPosts")!;
  sheet.addRow(post);
  await workbook.xlsx.writeFile(DB_PATH);
}

// --- User Style ---

export async function getUserStyle(userId: string): Promise<UserStyle | null> {
  const workbook = await getWorkbook();
  const sheet = workbook.getWorksheet("UserStyle")!;
  const styles = sheetToRows<UserStyle>(sheet);
  return styles.find((s) => s.user_id === userId) ?? null;
}

export async function saveUserStyle(style: UserStyle): Promise<void> {
  const workbook = await getWorkbook();
  const sheet = workbook.getWorksheet("UserStyle")!;
  sheet.addRow(style);
  await workbook.xlsx.writeFile(DB_PATH);
}

// --- Generated Posts ---

export async function saveGeneratedPost(
  post: GeneratedPost
): Promise<void> {
  const workbook = await getWorkbook();
  const sheet = workbook.getWorksheet("GeneratedPosts")!;
  sheet.addRow(post);
  await workbook.xlsx.writeFile(DB_PATH);
}

export async function getGeneratedPosts(
  userId: string
): Promise<GeneratedPost[]> {
  const workbook = await getWorkbook();
  const sheet = workbook.getWorksheet("GeneratedPosts")!;
  const posts = sheetToRows<GeneratedPost>(sheet);
  return posts.filter((p) => p.user_id === userId);
}
