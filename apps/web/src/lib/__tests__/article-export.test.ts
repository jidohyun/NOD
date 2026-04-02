import { describe, expect, it } from "vitest";
import { formatArticleAsMarkdown } from "../article-export";

const baseArticle = {
  title: "Test Article Title",
  url: "https://example.com/article",
  summary: "This is a test summary.",
  markdown_note: "## Deep Dive\nSome detailed notes here.",
  key_points: ["Point one", "Point two"],
  concepts: ["React", "TypeScript"],
  reading_time_minutes: 5,
  content_type: "tech_blog",
  type_metadata: {},
  created_at: "2026-03-30T12:00:00Z",
};

describe("formatArticleAsMarkdown", () => {
  it("B1: formats full article with all fields", () => {
    const result = formatArticleAsMarkdown(baseArticle);

    expect(result).toContain("# Test Article Title");
    expect(result).toContain("> Source: https://example.com/article");
    expect(result).toContain("> Saved with NOD on");
    expect(result).toContain("## Summary\nThis is a test summary.");
    expect(result).toContain("## Key Points\n- Point one\n- Point two");
    expect(result).toContain("## Concepts\n#React #TypeScript");
    expect(result).toContain("## Notes\n## Deep Dive\nSome detailed notes here.");
    expect(result).toContain("Reading time: 5 min");
    expect(result).toContain("Type: tech_blog");
  });

  it("B2: handles markdown_note null with summary + key_points fallback", () => {
    const result = formatArticleAsMarkdown({ ...baseArticle, markdown_note: null });

    expect(result).toContain("## Summary");
    expect(result).toContain("## Key Points");
    expect(result).not.toContain("## Notes");
  });

  it("B3: handles empty key_points", () => {
    const result = formatArticleAsMarkdown({ ...baseArticle, key_points: [] });

    expect(result).not.toContain("## Key Points");
    expect(result).toContain("## Summary");
  });

  it("B4: handles empty concepts", () => {
    const result = formatArticleAsMarkdown({ ...baseArticle, concepts: [] });

    expect(result).not.toContain("## Concepts");
    expect(result).toContain("## Summary");
  });

  it("B5: handles url null", () => {
    const result = formatArticleAsMarkdown({ ...baseArticle, url: null });

    expect(result).not.toContain("> Source:");
    expect(result).toContain("> Saved with NOD on");
  });

  it("B6: handles concepts with spaces by replacing with underscores", () => {
    const result = formatArticleAsMarkdown({
      ...baseArticle,
      concepts: ["Machine Learning", "Web Dev"],
    });

    expect(result).toContain("#Machine_Learning #Web_Dev");
  });

  it("B7: appends discussion metadata sections for discussion exports", () => {
    const result = formatArticleAsMarkdown({
      ...baseArticle,
      content_type: "discussion",
      type_metadata: {
        central_question: "Should teams optimize for latency or correctness first?",
        insider_takeaways: [
          "Infra teams often regret cache-first rollouts without invalidation ownership.",
        ],
        disagreement_points: [
          "Some engineers prioritize responsiveness while others prioritize stale-read safety.",
        ],
        evidence_signals: [
          "One operator cited a production billing incident caused by stale cache data.",
        ],
      },
    });

    expect(result).toContain("## Discussion Details");
    expect(result).toContain("### Central Question");
    expect(result).toContain("Should teams optimize for latency or correctness first?");
    expect(result).toContain("### Insider Takeaways");
    expect(result).toContain(
      "- Infra teams often regret cache-first rollouts without invalidation ownership."
    );
    expect(result).toContain("### Main Disagreements");
    expect(result).toContain(
      "- Some engineers prioritize responsiveness while others prioritize stale-read safety."
    );
    expect(result).toContain("### Evidence Signals");
    expect(result).toContain(
      "- One operator cited a production billing incident caused by stale cache data."
    );
  });
});
