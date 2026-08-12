import { describe, expect, it } from "vitest";

import {
  formatCommentDate,
  insertCommentTree,
  normalizeDisplayName,
  removeCommentTree,
  sortCommentThread,
  toCommentSortOption,
  updateCommentTree,
  withThreadDefaults,
} from "@/components/articles/shared-article-helpers";
import type { SharedArticleComment } from "@/lib/api/articles";

function makeComment(partial: Partial<SharedArticleComment>): SharedArticleComment {
  return {
    id: partial.id ?? "comment-1",
    content: partial.content ?? "hello",
    created_at: partial.created_at ?? "2026-03-30T08:00:00.000Z",
    updated_at: partial.updated_at ?? null,
    user_id: partial.user_id ?? null,
    author_name: partial.author_name ?? "tester",
    author_image: partial.author_image ?? null,
    parent_comment_id: partial.parent_comment_id ?? null,
    empathy_count: partial.empathy_count ?? 0,
    viewer_has_empathy: partial.viewer_has_empathy ?? false,
    replies: partial.replies ?? [],
  };
}

describe("shared article helpers", () => {
  it("defaults nullable thread fields", () => {
    const comments = withThreadDefaults([
      makeComment({
        author_image: undefined,
        parent_comment_id: undefined,
        empathy_count: undefined,
        viewer_has_empathy: undefined,
        replies: [makeComment({ id: "child-1" })],
      }),
    ]);

    expect(comments[0].author_image).toBeNull();
    expect(comments[0].parent_comment_id).toBeNull();
    expect(comments[0].empathy_count).toBe(0);
    expect(comments[0].viewer_has_empathy).toBe(false);
    expect(comments[0].replies[0].id).toBe("child-1");
  });

  it("sorts recommended threads by empathy then recency", () => {
    const comments = sortCommentThread(
      [
        makeComment({ id: "older", created_at: "2026-03-29T08:00:00.000Z", empathy_count: 1 }),
        makeComment({ id: "newer", created_at: "2026-03-30T08:00:00.000Z", empathy_count: 1 }),
        makeComment({ id: "top", created_at: "2026-03-28T08:00:00.000Z", empathy_count: 5 }),
      ],
      "recommended"
    );

    expect(comments.map((comment) => comment.id)).toEqual(["top", "newer", "older"]);
  });

  it("sorts latest threads by recency", () => {
    const comments = sortCommentThread(
      [
        makeComment({ id: "older", created_at: "2026-03-29T08:00:00.000Z" }),
        makeComment({ id: "newer", created_at: "2026-03-30T08:00:00.000Z" }),
      ],
      "latest"
    );

    expect(comments.map((comment) => comment.id)).toEqual(["newer", "older"]);
  });

  it("updates, inserts, and removes nested comments", () => {
    const child = makeComment({ id: "child", parent_comment_id: "parent" });
    const parent = makeComment({ id: "parent", replies: [child] });

    const updated = updateCommentTree([parent], "child", (comment) => ({
      ...comment,
      content: "updated",
    }));
    expect(updated[0].replies[0].content).toBe("updated");

    const inserted = insertCommentTree(
      updated,
      makeComment({ id: "child-2", parent_comment_id: "parent" })
    );
    expect(inserted[0].replies.map((comment) => comment.id)).toEqual(["child", "child-2"]);

    const removed = removeCommentTree(inserted, "child");
    expect(removed[0].replies.map((comment) => comment.id)).toEqual(["child-2"]);
  });

  it("normalizes display names and sort options", () => {
    expect(normalizeDisplayName("  Alice ")).toBe("alice");
    expect(toCommentSortOption("recommended")).toBe("recommended");
    expect(toCommentSortOption("anything-else")).toBe("latest");
  });

  it("formats valid comment dates", () => {
    const result = formatCommentDate("2026-03-30T08:00:00.000Z", "en");

    expect(result).not.toBeNull();
    expect(result?.label).toBeTruthy();
    expect(result?.dateTime).toBe("2026-03-30T08:00:00.000Z");
  });
});
