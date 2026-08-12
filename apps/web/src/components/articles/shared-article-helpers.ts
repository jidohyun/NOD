import type { SharedArticleComment } from "@/lib/api/articles";

export interface ViewerProfile {
  id: string | null;
  name: string | null;
  image: string | null;
}

export type CommentSortOption = "latest" | "recommended";

export function readMetadataValue(metadata: unknown, key: string): string | null {
  if (typeof metadata !== "object" || metadata === null) {
    return null;
  }

  const value = (metadata as Record<string, unknown>)[key];
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function extractViewerProfile(user: unknown): ViewerProfile | null {
  if (typeof user !== "object" || user === null) {
    return null;
  }

  const userRecord = user as Record<string, unknown>;
  const id =
    typeof userRecord.id === "string" && userRecord.id.trim().length > 0 ? userRecord.id : null;
  const email =
    typeof userRecord.email === "string" && userRecord.email.trim().length > 0
      ? userRecord.email
      : null;
  const metadata = userRecord.user_metadata;

  const name =
    readMetadataValue(metadata, "full_name") ?? readMetadataValue(metadata, "name") ?? email;
  const image = readMetadataValue(metadata, "avatar_url") ?? readMetadataValue(metadata, "picture");

  return {
    id,
    name,
    image,
  };
}

export function formatPublishedDate(value: string, locale: string): string | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function withThreadDefaults(comments: SharedArticleComment[]): SharedArticleComment[] {
  return comments.map((comment) => ({
    ...comment,
    author_image: comment.author_image ?? null,
    parent_comment_id: comment.parent_comment_id ?? null,
    empathy_count: comment.empathy_count ?? 0,
    viewer_has_empathy: comment.viewer_has_empathy ?? false,
    replies: withThreadDefaults(comment.replies ?? []),
  }));
}

export function updateCommentTree(
  comments: SharedArticleComment[],
  targetCommentId: string,
  updater: (comment: SharedArticleComment) => SharedArticleComment
): SharedArticleComment[] {
  return comments.map((comment) => {
    if (comment.id === targetCommentId) {
      return updater(comment);
    }

    if (comment.replies.length === 0) {
      return comment;
    }

    return {
      ...comment,
      replies: updateCommentTree(comment.replies, targetCommentId, updater),
    };
  });
}

export function insertCommentTree(
  comments: SharedArticleComment[],
  newComment: SharedArticleComment
): SharedArticleComment[] {
  if (!newComment.parent_comment_id) {
    return [newComment, ...comments];
  }

  return updateCommentTree(comments, newComment.parent_comment_id, (comment) => ({
    ...comment,
    replies: [...comment.replies, newComment],
  }));
}

export function removeCommentTree(
  comments: SharedArticleComment[],
  targetCommentId: string
): SharedArticleComment[] {
  return comments.flatMap((comment) => {
    if (comment.id === targetCommentId) {
      return [];
    }

    if (comment.replies.length === 0) {
      return [comment];
    }

    return [
      {
        ...comment,
        replies: removeCommentTree(comment.replies, targetCommentId),
      },
    ];
  });
}

export function formatCommentDate(
  value: string,
  locale: string
): { label: string; dateTime: string } | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const now = new Date();
  const yearOptions = now.getFullYear() === date.getFullYear() ? {} : { year: "numeric" as const };

  return {
    label: new Intl.DateTimeFormat(locale, {
      month: "short",
      day: "numeric",
      ...yearOptions,
    }).format(date),
    dateTime: date.toISOString(),
  };
}

export function normalizeDisplayName(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

export function toCommentSortOption(value: string): CommentSortOption {
  return value === "recommended" ? "recommended" : "latest";
}

export function getCommentTimestamp(comment: SharedArticleComment): number {
  const timestamp = Date.parse(comment.created_at);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

export function getCommentEmpathyCount(comment: SharedArticleComment): number {
  return typeof comment.empathy_count === "number" ? comment.empathy_count : 0;
}

export function sortCommentThread(
  comments: SharedArticleComment[],
  sortOption: CommentSortOption
): SharedArticleComment[] {
  return [...comments]
    .sort((left, right) => {
      if (sortOption === "recommended") {
        const empathyDiff = getCommentEmpathyCount(right) - getCommentEmpathyCount(left);
        if (empathyDiff !== 0) {
          return empathyDiff;
        }
      }

      return getCommentTimestamp(right) - getCommentTimestamp(left);
    })
    .map((comment) => ({
      ...comment,
      replies: sortCommentThread(comment.replies, sortOption),
    }));
}
