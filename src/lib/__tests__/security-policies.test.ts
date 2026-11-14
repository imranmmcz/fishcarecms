import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const blogAndLoginMigration = readFileSync(
  resolve(process.cwd(), "drizzle/migrations/0000_secure_blog_and_login_tracking_policies.sql"),
  "utf8"
);
const reviewVotesMigration = readFileSync(
  resolve(process.cwd(), "drizzle/migrations/0001_restrict_review_helpful_vote_visibility.sql"),
  "utf8"
);
const loginFunction = readFileSync(
  resolve(process.cwd(), "supabase/functions/secure-login/index.ts"),
  "utf8"
);

describe("security policy ownership", () => {
  it("allows comments only when they belong to the signed-in caller", () => {
    expect(blogAndLoginMigration).toMatch(/WITH CHECK \(auth\.uid\(\) IS NOT NULL AND user_id = auth\.uid\(\)\)/);
  });

  it("limits blog and product-review vote reads to each authenticated owner", () => {
    expect(blogAndLoginMigration).toMatch(/ON public\.blog_comment_votes FOR SELECT TO authenticated\s+USING \(auth\.uid\(\) = user_id\)/);
    expect(reviewVotesMigration).toMatch(/ON public\.review_helpful_votes FOR SELECT TO authenticated\s+USING \(auth\.uid\(\) = user_id\)/);
  });

  it("removes direct login-attempt writes and records them from secure login", () => {
    expect(blogAndLoginMigration).toMatch(/REVOKE INSERT, UPDATE, DELETE ON public\.login_attempts FROM anon, authenticated/);
    expect(loginFunction).toMatch(/adminClient\.from\("login_attempts"\)\.insert/);
  });
});