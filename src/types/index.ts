export interface User {
  id: string;
  name: string;
  email: string;
  linkedin_url: string;
  created_at: string;
}

export interface Profile {
  user_id: string;
  headline: string;
  about: string;
  current_role: string;
  company: string;
  location: string;
  scraped_at: string;
}

export interface UserPost {
  user_id: string;
  post_text: string;
  post_date: string;
  likes: number;
  comments: number;
}

export interface UserStyle {
  user_id: string;
  tone: string;
  avg_word_count: number;
  emoji_usage: "none" | "low" | "medium" | "high";
  common_topics: string;
  writing_notes: string;
}

export interface GeneratedPost {
  id: string;
  user_id: string;
  input_what_happened: string;
  input_the_point: string;
  variant_1: string;
  variant_2: string;
  variant_3: string;
  created_at: string;
}

export interface GenerateRequest {
  userId: string;
  whatHappened: string;
  thePoint: string;
  vibe: string;
  whatToAvoid: string;
}

export interface GenerateResponse {
  variants: PostVariant[];
}

export interface PostVariant {
  text: string;
  wordCount: number;
  qualityScore: QualityScore;
}

export interface QualityScore {
  hookStartsWithI: boolean;
  wordCountInRange: boolean;
  hashtagCount: number;
  hasBannedPhrases: string[];
  passed: boolean;
}

export interface BenchmarkPost {
  id: string;
  text: string;
  author: string;
  source: "enginy" | "factorial" | "other";
  why_its_good: string;
  tags: string[];
}

export interface PipelineContext {
  user: User | null;
  profile: Profile | null;
  userStyle: UserStyle | null;
  userPosts: UserPost[];
  factorialContext: string;
  benchmarkPosts: BenchmarkPost[];
  systemPrompt: string;
  postStructure: string;
}
