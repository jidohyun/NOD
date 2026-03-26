"use client";

import {
  Check,
  Copy,
  Ellipsis,
  Flag,
  Globe,
  Heart,
  MessageCircle,
  Pencil,
  Share2,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { type FocusEvent, type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { ArticleMarkdownNote } from "@/components/articles/article-markdown-note";
import { NodWordmark } from "@/components/brand/nod-wordmark";
import { LandingFooter } from "@/components/landing/footer";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  type SharedArticleComment,
  useCreateSharedArticleComment,
  useDeleteSharedArticleComment,
  useSharedArticle,
  useSharedArticleByUsername,
  useSharedArticleComments,
  useToggleSharedArticleCommentEmpathy,
  useToggleSharedArticleEmpathy,
  useUpdateSharedArticleComment,
} from "@/lib/api/articles";
import { apiClient } from "@/lib/api-client";
import { getSupabase } from "@/lib/auth/auth-client";
import { locales } from "@/lib/i18n/config";
import { Link, usePathname, useRouter } from "@/lib/i18n/routing";

interface SharedArticleViewProps {
  shareId?: string;
  token?: string;
  mode?: "token" | "username";
  username?: string;
  slug?: string;
}

const LOCALE_LABELS: Record<string, { name: string; code: string }> = {
  ko: { name: "한국어", code: "KO" },
  en: { name: "English", code: "EN" },
  ja: { name: "日本語", code: "JA" },
  es: { name: "Español", code: "ES" },
  "pt-BR": { name: "Português", code: "PT" },
  "zh-CN": { name: "中文", code: "ZH" },
  de: { name: "Deutsch", code: "DE" },
  fr: { name: "Français", code: "FR" },
};

const LOCALE_PREFIX_RE = /^\/[a-z]{2}(?:[-][A-Z]{2})?(?=\/|$)/;
const UUID_LIKE_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function LocaleSwitcher() {
  const pathname = usePathname();
  const basePath = pathname.replace(LOCALE_PREFIX_RE, "") || "/";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Change language">
          <Globe className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {locales.map((loc) => {
          const label = LOCALE_LABELS[loc];
          if (!label) return null;
          return (
            <DropdownMenuItem
              key={loc}
              onSelect={() => {
                window.location.assign(`/${loc}${basePath}`);
              }}
            >
              <span className="flex-1">{label.name}</span>
              <span className="text-xs text-muted-foreground">{label.code}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function isUuidLike(value: string): boolean {
  return UUID_LIKE_RE.test(value);
}

interface ViewerProfile {
  id: string | null;
  name: string | null;
  image: string | null;
}

type CommentSortOption = "latest" | "recommended";

const CONTENT_TYPE_STYLES: Record<string, { labelKey: ContentTypeLabelKey; className: string }> = {
  tech_blog: {
    labelKey: "typeTechBlog",
    className:
      "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-400/40 dark:bg-blue-500/15 dark:text-blue-200",
  },
  academic_paper: {
    labelKey: "typePaper",
    className:
      "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-400/40 dark:bg-purple-500/15 dark:text-purple-200",
  },
  general_news: {
    labelKey: "typeNews",
    className:
      "border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-400/40 dark:bg-gray-500/15 dark:text-gray-200",
  },
  github_repo: {
    labelKey: "typeGitHub",
    className:
      "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-400/40 dark:bg-slate-500/15 dark:text-slate-200",
  },
  official_docs: {
    labelKey: "typeDocs",
    className:
      "border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-400/40 dark:bg-teal-500/15 dark:text-teal-200",
  },
  video_podcast: {
    labelKey: "typeVideo",
    className:
      "border-pink-200 bg-pink-50 text-pink-700 dark:border-pink-400/40 dark:bg-pink-500/15 dark:text-pink-200",
  },
};

type ContentTypeLabelKey =
  | "typeTechBlog"
  | "typePaper"
  | "typeNews"
  | "typeGitHub"
  | "typeDocs"
  | "typeVideo";

function readMetadataValue(metadata: unknown, key: string): string | null {
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

function extractViewerProfile(user: unknown): ViewerProfile | null {
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

function formatPublishedDate(value: string, locale: string): string | null {
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

function withThreadDefaults(comments: SharedArticleComment[]): SharedArticleComment[] {
  return comments.map((comment) => ({
    ...comment,
    author_image: comment.author_image ?? null,
    parent_comment_id: comment.parent_comment_id ?? null,
    empathy_count: comment.empathy_count ?? 0,
    viewer_has_empathy: comment.viewer_has_empathy ?? false,
    replies: withThreadDefaults(comment.replies ?? []),
  }));
}

function updateCommentTree(
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

function insertCommentTree(
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

function removeCommentTree(
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

function formatCommentDate(
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

function normalizeDisplayName(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function toCommentSortOption(value: string): CommentSortOption {
  return value === "recommended" ? "recommended" : "latest";
}

function getCommentTimestamp(comment: SharedArticleComment): number {
  const timestamp = Date.parse(comment.created_at);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function getCommentEmpathyCount(comment: SharedArticleComment): number {
  return typeof comment.empathy_count === "number" ? comment.empathy_count : 0;
}

function sortCommentThread(
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

export function SharedArticleView({
  shareId = "",
  token = "",
  mode = "token",
  username = "",
  slug = "",
}: SharedArticleViewProps) {
  const locale = useLocale();
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");
  const tLogin = useTranslations("login");
  const tSignup = useTranslations("signup");
  const router = useRouter();
  const tokenQuery = useSharedArticle(shareId, token);
  const usernameQuery = useSharedArticleByUsername(username, slug);
  const { data, isLoading, isError } = mode === "username" ? usernameQuery : tokenQuery;
  const resolvedShareId =
    data && "share_id" in data && typeof data.share_id === "string"
      ? data.share_id
      : isUuidLike(shareId)
        ? shareId
        : "";
  const commentsQuery = useSharedArticleComments(resolvedShareId, token);
  const createComment = useCreateSharedArticleComment(resolvedShareId, token);
  const updateComment = useUpdateSharedArticleComment(resolvedShareId, token);
  const deleteComment = useDeleteSharedArticleComment(resolvedShareId, token);
  const toggleEmpathy = useToggleSharedArticleEmpathy(resolvedShareId, token);
  const toggleCommentEmpathy = useToggleSharedArticleCommentEmpathy(resolvedShareId, token);
  const [viewer, setViewer] = useState<ViewerProfile | null>(null);
  const [authResolved, setAuthResolved] = useState(false);
  const [failedViewerImageSrc, setFailedViewerImageSrc] = useState<string | null>(null);
  const [failedSharerImageSrc, setFailedSharerImageSrc] = useState<string | null>(null);
  const [commentContent, setCommentContent] = useState("");
  const [isCommentComposerActive, setIsCommentComposerActive] = useState(false);
  const [replyContents, setReplyContents] = useState<Record<string, string>>({});
  const [activeReplyComposers, setActiveReplyComposers] = useState<Record<string, boolean>>({});
  const [replyComposerOpen, setReplyComposerOpen] = useState<Record<string, boolean>>({});
  const [visibleReplies, setVisibleReplies] = useState<Record<string, boolean>>({});
  const [comments, setComments] = useState<SharedArticleComment[]>([]);
  const [commentSort, setCommentSort] = useState<CommentSortOption>("latest");
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isEmpathyActive, setIsEmpathyActive] = useState(false);
  const [empathyCount, setEmpathyCount] = useState(0);
  const [copiedShareLink, setCopiedShareLink] = useState(false);
  const [articleOgImage, setArticleOgImage] = useState<string | null>(null);
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);

  useEffect(() => {
    if (!data) return;
    // Use original blog og:image directly if available
    if (data.og_image_url) {
      setArticleOgImage(data.og_image_url);
      return;
    }
    // Fallback: use API OG image endpoint (live extraction + caching)
    const ogUrl = new URL(
      `/_proxy/api/articles/share/og-image/${encodeURIComponent(shareId)}`,
      window.location.origin
    );
    if (token) {
      ogUrl.searchParams.set("token", token);
    }
    setArticleOgImage(ogUrl.toString());
  }, [data, shareId, token]);
  const [openCommentMenuId, setOpenCommentMenuId] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState("");
  const allowCommentComposerBlurRef = useRef(false);
  const allowReplyComposerBlurRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    const supabase = getSupabase();
    let isActive = true;

    const syncViewer = (user: unknown) => {
      if (!isActive) {
        return;
      }

      setViewer(extractViewerProfile(user));
      setAuthResolved(true);
    };

    void supabase.auth.getUser().then(({ data: { user } }) => {
      syncViewer(user);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      syncViewer(session?.user ?? null);
    });

    return () => {
      isActive = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!data) {
      return;
    }

    setEmpathyCount(data.empathy_count);
    setIsEmpathyActive(data.viewer_has_empathy);
  }, [data]);

  useEffect(() => {
    setComments(withThreadDefaults(commentsQuery.data ?? []));
  }, [commentsQuery.data]);

  const sortedComments = useMemo(
    () => sortCommentThread(comments, commentSort),
    [comments, commentSort]
  );
  const isCommentComposerExpanded = isCommentComposerActive || commentContent.trim().length > 0;

  const canonicalSharePath =
    data &&
    "canonical_share_path" in data &&
    typeof data.canonical_share_path === "string" &&
    data.canonical_share_path.length > 0
      ? data.canonical_share_path
      : `/share/${shareId}`;
  const redirectPath = `${canonicalSharePath}?token=${token}`;
  const encodedRedirect = encodeURIComponent(redirectPath);
  const viewerUserId = viewer?.id ?? null;
  const viewerName = viewer?.name?.trim() || t("sharedTrustFallbackName");
  const viewerInitial = viewerName.charAt(0).toUpperCase();
  const panelClass =
    "cm-doodle-border rounded-2xl border-2 border-cm-text/18 bg-white/95 p-6 shadow-[0_2px_0_rgba(17,24,39,0.06)] dark:bg-cm-surface/95";

  const fixedHeader = (
    <header className="fixed inset-x-0 top-0 z-40 h-14 border-b border-dashed border-cm-text/10 bg-white/80 backdrop-blur-sm dark:bg-cm-surface/80">
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between gap-3 px-4 md:px-6">
        <Link href={viewer ? "/dashboard" : "/"} className="group inline-flex items-center gap-2">
          <NodWordmark
            size="sm"
            className="opacity-90 transition-opacity group-hover:opacity-100"
          />
        </Link>

        {authResolved ? (
          viewer ? (
            <div className="flex flex-wrap items-center justify-end gap-2">
              <ThemeToggle />
              <LocaleSwitcher />
              {viewer.image && viewer.image !== failedViewerImageSrc ? (
                <Image
                  src={viewer.image}
                  alt={viewerName}
                  width={32}
                  height={32}
                  unoptimized
                  className="h-8 w-8 rounded-full border border-cm-text/15 object-cover"
                  onError={() => {
                    setFailedViewerImageSrc(viewer.image);
                  }}
                />
              ) : (
                <div
                  role="img"
                  aria-label={viewerName}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-cm-text/15 bg-cm-bg font-creative-body text-xs font-black text-cm-text/80"
                >
                  {viewerInitial}
                </div>
              )}
              <span className="font-creative-body text-sm font-black text-cm-text">
                {viewerName}
              </span>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-lg border border-cm-text/20 bg-nod-gold px-3 py-1.5 font-creative-body text-xs font-black text-black transition-colors hover:bg-[#f0c958]"
              >
                {tCommon("dashboard")}
              </Link>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-end gap-2">
              <ThemeToggle />
              <LocaleSwitcher />
              <Link
                href={`/login?redirect=${encodedRedirect}`}
                className="inline-flex items-center justify-center rounded-lg border border-cm-text/20 bg-white px-3 py-1.5 font-creative-body text-xs font-black text-cm-text transition-colors hover:bg-cm-bg dark:bg-cm-surface dark:hover:bg-cm-surface-raised"
              >
                {tLogin("signInTitle")}
              </Link>
              <Link
                href={`/signup?redirect=${encodedRedirect}`}
                className="inline-flex items-center justify-center rounded-lg border border-cm-text/20 bg-nod-gold px-3 py-1.5 font-creative-body text-xs font-black text-black transition-colors hover:bg-[#f0c958]"
              >
                {tSignup("title")}
              </Link>
            </div>
          )
        ) : (
          <span className="font-creative-body text-xs font-black text-cm-text/55">
            {tCommon("loading")}
          </span>
        )}
      </div>
    </header>
  );

  if (isLoading) {
    return (
      <>
        {fixedHeader}
        <div className="mx-auto max-w-3xl px-4 pb-8 pt-20 md:px-6 md:pt-24">
          <p className="font-creative-body text-sm text-cm-text/60">{t("loadingArticles")}</p>
        </div>
      </>
    );
  }

  if (isError || !data) {
    return (
      <>
        {fixedHeader}
        <div className="mx-auto max-w-3xl px-4 pb-8 pt-20 md:px-6 md:pt-24">
          <p className="font-creative-body text-sm text-red-500">{t("articleNotFound")}</p>
        </div>
      </>
    );
  }

  const sharerName = data.sharer?.name?.trim() || t("sharedTrustFallbackName");
  const sharerInitial = sharerName.charAt(0).toUpperCase();
  const publishedDate = formatPublishedDate(data.created_at, locale);

  const contentType = data.content_type || "general_news";
  const contentTypeStyle = CONTENT_TYPE_STYLES[contentType] || CONTENT_TYPE_STYLES.general_news;

  async function handleRevokeShare() {
    if (!data?.article_id) return;
    try {
      await apiClient.delete(`/api/articles/${data.article_id}/share-link`);
      window.localStorage.removeItem(`article-share-link:${data.article_id}`);
      router.push("/shared");
    } catch {
      // silently fail
    }
  }

  async function handleCopyShareLink() {
    if (typeof window === "undefined") {
      return;
    }

    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedShareLink(true);
      window.setTimeout(() => {
        setCopiedShareLink(false);
      }, 1600);
    } catch (error) {
      console.error("Failed to copy shared link", error);
      setCopiedShareLink(false);
    }
  }

  async function handleToggleEmpathy() {
    if (!viewer || toggleEmpathy.isPending) {
      return;
    }

    const result = await toggleEmpathy.mutateAsync();
    setEmpathyCount(result.empathy_count);
    setIsEmpathyActive(result.viewer_has_empathy);
  }

  async function submitComment(content: string, parentCommentId?: string) {
    const created = await createComment.mutateAsync({
      content,
      parent_comment_id: parentCommentId,
    });
    setComments((current) => insertCommentTree(current, withThreadDefaults([created])[0]));
  }

  function blurActiveElement() {
    if (typeof document === "undefined") {
      return;
    }

    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement) {
      activeElement.blur();
    }
  }

  function handleCommentComposerBlur(event: FocusEvent<HTMLTextAreaElement>) {
    if (allowCommentComposerBlurRef.current) {
      allowCommentComposerBlurRef.current = false;
      return;
    }

    void event;
  }

  function handleReplyComposerBlur(event: FocusEvent<HTMLTextAreaElement>, commentId: string) {
    if (allowReplyComposerBlurRef.current[commentId]) {
      allowReplyComposerBlurRef.current[commentId] = false;
      return;
    }

    void event;
  }

  function handleCancelCommentComposer() {
    setCommentContent("");
    setIsCommentComposerActive(false);
    allowCommentComposerBlurRef.current = true;
    blurActiveElement();
  }

  function handleCancelReplyComposer(commentId: string) {
    setReplyContents((current) => ({
      ...current,
      [commentId]: "",
    }));
    setActiveReplyComposers((current) => ({
      ...current,
      [commentId]: false,
    }));
    setReplyComposerOpen((current) => ({
      ...current,
      [commentId]: false,
    }));
    allowReplyComposerBlurRef.current[commentId] = true;
    blurActiveElement();
  }

  async function handleCommentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedContent = commentContent.trim();
    if (!viewer || !trimmedContent) {
      return;
    }

    await submitComment(trimmedContent);
    setCommentContent("");
    setIsCommentComposerActive(false);
    allowCommentComposerBlurRef.current = true;
    blurActiveElement();
  }

  async function handleReplySubmit(commentId: string) {
    const replyContent = (replyContents[commentId] ?? "").trim();
    if (!viewer || !replyContent || createComment.isPending) {
      return;
    }

    await submitComment(replyContent, commentId);
    setReplyContents((current) => ({
      ...current,
      [commentId]: "",
    }));
    setReplyComposerOpen((current) => ({
      ...current,
      [commentId]: false,
    }));
    setActiveReplyComposers((current) => ({
      ...current,
      [commentId]: false,
    }));
    allowReplyComposerBlurRef.current[commentId] = true;
    blurActiveElement();
  }

  async function handleToggleCommentEmpathy(commentId: string) {
    if (!viewer || toggleCommentEmpathy.isPending) {
      return;
    }

    const result = await toggleCommentEmpathy.mutateAsync({ commentId });
    setComments((current) =>
      updateCommentTree(current, commentId, (comment) => ({
        ...comment,
        empathy_count: result.empathy_count,
        viewer_has_empathy: result.viewer_has_empathy,
      }))
    );
  }

  function startCommentEdit(comment: SharedArticleComment) {
    setEditingCommentId(comment.id);
    setEditingCommentContent(comment.content);
  }

  function cancelCommentEdit() {
    setEditingCommentId(null);
    setEditingCommentContent("");
  }

  async function handleCommentEditSubmit(commentId: string) {
    const nextContent = editingCommentContent.trim();
    if (!viewer || !nextContent || updateComment.isPending) {
      return;
    }

    const updated = await updateComment.mutateAsync({
      commentId,
      content: nextContent,
    });

    setComments((current) =>
      updateCommentTree(current, commentId, (comment) => ({
        ...comment,
        content: updated.content,
      }))
    );
    cancelCommentEdit();
  }

  async function handleCommentDelete(commentId: string) {
    if (!viewer || deleteComment.isPending) {
      return;
    }

    await deleteComment.mutateAsync({ commentId });
    setComments((current) => removeCommentTree(current, commentId));
    if (editingCommentId === commentId) {
      cancelCommentEdit();
    }
  }

  function handleReportComment(comment: SharedArticleComment) {
    if (typeof window === "undefined") {
      return;
    }

    const subject = "NOD Shared Comment Report";
    const body = [
      `Share ID: ${shareId}`,
      `Comment ID: ${comment.id}`,
      `Author: ${comment.author_name}`,
      "",
      `Content: ${comment.content}`,
      "",
      `Page: ${window.location.href}`,
    ].join("\n");

    const mailto = `mailto:support@nod-archive.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailto, "_blank", "noopener,noreferrer");
  }

  function renderInlineComment(comment: SharedArticleComment, isLast: boolean, depth = 0) {
    const authorName = comment.author_name?.trim() || t("sharedTrustFallbackName");
    const authorInitial = authorName.charAt(0).toUpperCase();
    const createdAt = formatCommentDate(comment.created_at, locale);
    const isSharerComment = normalizeDisplayName(authorName) === normalizeDisplayName(sharerName);
    const replyInputValue = replyContents[comment.id] ?? "";
    const isReplyOpen = replyComposerOpen[comment.id] ?? false;
    const replyCount = comment.replies.length;
    const isRepliesVisible = visibleReplies[comment.id] ?? false;
    const isEditingComment = editingCommentId === comment.id;
    const isOwnComment =
      !!viewer &&
      ((viewerUserId !== null && comment.author_user_id === viewerUserId) ||
        (!comment.author_user_id &&
          normalizeDisplayName(authorName) === normalizeDisplayName(viewerName)));
    const isReplyComposerExpanded =
      (activeReplyComposers[comment.id] ?? false) || replyInputValue.trim().length > 0;
    const canReply = depth === 0;

    return (
      <article
        key={comment.id}
        className={`py-4 ${depth === 0 && !isLast ? "border-b border-cm-text/12" : ""}`}
      >
        <div className="flex items-start gap-3">
          {comment.author_image ? (
            <Image
              src={comment.author_image}
              alt={authorName}
              width={32}
              height={32}
              unoptimized
              className="h-8 w-8 rounded-full border border-cm-text/15 object-cover"
            />
          ) : (
            <div
              role="img"
              aria-label={authorName}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-cm-text/15 bg-cm-bg font-creative-body text-xs font-black text-cm-text/80"
            >
              {authorInitial}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex flex-wrap items-center gap-2">
                <p className="font-creative-body text-sm font-black text-cm-text">{authorName}</p>
                {createdAt ? (
                  <time
                    data-testid={`shared-comment-time-${comment.id}`}
                    dateTime={createdAt.dateTime}
                    className="font-creative-body text-xs text-cm-text/55"
                  >
                    {createdAt.label}
                  </time>
                ) : null}
                {isSharerComment ? (
                  <span
                    data-testid={`shared-comment-sharer-badge-${comment.id}`}
                    className="inline-flex items-center rounded-full border border-nod-gold/35 bg-nod-gold/12 px-2 py-0.5 font-creative-body text-[10px] font-black uppercase tracking-wide text-nod-gold"
                  >
                    {t("sharedCommentsSharerBadge")}
                  </span>
                ) : null}
              </div>

              {viewer ? (
                <DropdownMenu
                  open={openCommentMenuId === comment.id}
                  onOpenChange={(open) => {
                    setOpenCommentMenuId(open ? comment.id : null);
                  }}
                >
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      data-testid={`shared-comment-menu-trigger-${comment.id}`}
                      onClick={() => {
                        setOpenCommentMenuId((current) =>
                          current === comment.id ? null : comment.id
                        );
                      }}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-cm-text/60 transition-colors hover:bg-cm-bg hover:text-cm-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nod-gold/35 focus-visible:ring-offset-1"
                      aria-label={t("sharedCommentsActionMenuLabel")}
                    >
                      <Ellipsis className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-36">
                    {isOwnComment ? (
                      <>
                        <DropdownMenuItem
                          data-testid={`shared-comment-menu-edit-${comment.id}`}
                          onSelect={() => {
                            setOpenCommentMenuId(null);
                            startCommentEdit(comment);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          <span>{tCommon("edit")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          data-testid={`shared-comment-menu-delete-${comment.id}`}
                          onSelect={() => {
                            setOpenCommentMenuId(null);
                            void handleCommentDelete(comment.id);
                          }}
                          variant="destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>{tCommon("delete")}</span>
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <DropdownMenuItem
                        data-testid={`shared-comment-menu-report-${comment.id}`}
                        onSelect={() => {
                          setOpenCommentMenuId(null);
                          handleReportComment(comment);
                        }}
                      >
                        <Flag className="h-3.5 w-3.5" />
                        <span>{t("sharedCommentsActionReport")}</span>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
            </div>

            {isEditingComment ? (
              <form
                className="mt-1 space-y-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleCommentEditSubmit(comment.id);
                }}
              >
                <textarea
                  data-testid={`shared-comment-edit-input-${comment.id}`}
                  value={editingCommentContent}
                  onChange={(event) => {
                    setEditingCommentContent(event.target.value);
                  }}
                  maxLength={2000}
                  className="w-full resize-none rounded-lg border border-nod-gold/45 bg-white px-3 py-2 font-creative-body text-sm text-cm-text outline-none transition-colors focus-visible:ring-2 focus-visible:ring-nod-gold/45 focus-visible:ring-offset-1"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    data-testid={`shared-comment-edit-cancel-${comment.id}`}
                    onClick={cancelCommentEdit}
                    className="inline-flex h-8 items-center justify-center rounded-md border border-cm-text/20 bg-white dark:bg-cm-surface px-2.5 font-creative-body text-xs font-bold text-cm-text/80 transition-colors hover:bg-cm-bg dark:hover:bg-cm-surface-raised"
                  >
                    {tCommon("cancel")}
                  </button>
                  <button
                    type="submit"
                    data-testid={`shared-comment-edit-save-${comment.id}`}
                    disabled={updateComment.isPending}
                    className="inline-flex h-8 items-center justify-center rounded-md border border-cm-text/20 bg-nod-gold px-2.5 font-creative-body text-xs font-black text-black transition-colors hover:bg-[#f0c958] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {updateComment.isPending ? tCommon("loading") : t("sharedCommentsEditSave")}
                  </button>
                </div>
              </form>
            ) : (
              <p className="mt-1 whitespace-pre-wrap font-creative-body text-sm leading-relaxed text-cm-text/82">
                {comment.content}
              </p>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-4">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                data-testid={`shared-comment-empathy-${comment.id}`}
                onClick={() => {
                  void handleToggleCommentEmpathy(comment.id);
                }}
                disabled={!viewer || toggleCommentEmpathy.isPending}
                className={`h-7 rounded-md px-2 text-xs ${
                  comment.viewer_has_empathy
                    ? "bg-nod-gold/15 text-nod-gold"
                    : "text-cm-text/60 hover:bg-cm-bg"
                }`}
              >
                <Heart
                  className={`h-3.5 w-3.5 ${comment.viewer_has_empathy ? "fill-current" : ""}`}
                />
                <span>{comment.empathy_count}</span>
              </Button>

              <div className="inline-flex items-center gap-2">
                {canReply && replyCount > 0 ? (
                  <button
                    type="button"
                    aria-pressed={isRepliesVisible}
                    data-testid={`shared-comment-replies-toggle-${comment.id}`}
                    onClick={() => {
                      setVisibleReplies((current) => ({
                        ...current,
                        [comment.id]: !(current[comment.id] ?? false),
                      }));
                    }}
                    className={`inline-flex h-7 items-center gap-1.5 rounded-md px-2 font-creative-body text-xs font-bold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-nod-gold/35 focus-visible:ring-offset-1 dark:hover:bg-cm-surface-raised ${
                      isRepliesVisible
                        ? "bg-cm-bg text-cm-text"
                        : "text-cm-text/70 hover:bg-cm-bg hover:text-cm-text"
                    }`}
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    {isRepliesVisible ? (
                      <span>{t("sharedCommentsHideReplies")}</span>
                    ) : (
                      <span>
                        {replyCount}{" "}
                        {replyCount === 1
                          ? t("sharedCommentsReplyCountSingle")
                          : t("sharedCommentsReplyCountPlural")}
                      </span>
                    )}
                  </button>
                ) : null}

                {canReply ? (
                  <button
                    type="button"
                    data-testid={`shared-comment-add-reply-${comment.id}`}
                    onClick={() => {
                      setReplyComposerOpen((current) => ({
                        ...current,
                        [comment.id]: true,
                      }));
                      setActiveReplyComposers((current) => ({
                        ...current,
                        [comment.id]: true,
                      }));
                    }}
                    className={`inline-flex h-7 items-center rounded-md px-2 font-creative-body text-xs font-bold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-nod-gold/35 focus-visible:ring-offset-1 dark:hover:bg-cm-surface-raised ${
                      isReplyOpen
                        ? "bg-cm-bg text-cm-text"
                        : "text-cm-text/70 hover:bg-cm-bg hover:text-cm-text"
                    }`}
                  >
                    {t("sharedCommentsAddReplyAction")}
                  </button>
                ) : null}
              </div>
            </div>

            {canReply && isReplyOpen && viewer ? (
              <form
                className="mt-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleReplySubmit(comment.id);
                }}
              >
                <div className="relative">
                  <textarea
                    data-testid={`shared-comment-reply-input-${comment.id}`}
                    data-expanded={isReplyComposerExpanded}
                    value={replyInputValue}
                    onFocus={() => {
                      setActiveReplyComposers((current) => ({
                        ...current,
                        [comment.id]: true,
                      }));
                    }}
                    onBlur={(event) => {
                      handleReplyComposerBlur(event, comment.id);
                    }}
                    onChange={(event) => {
                      const value = event.target.value;
                      setReplyContents((current) => ({
                        ...current,
                        [comment.id]: value,
                      }));
                      if (value.trim().length > 0) {
                        setActiveReplyComposers((current) => ({
                          ...current,
                          [comment.id]: true,
                        }));
                      }
                    }}
                    maxLength={2000}
                    placeholder={t("sharedCommentsReplyPlaceholder")}
                    className={`w-full resize-none overflow-y-auto rounded-lg border px-3 font-creative-body text-sm text-cm-text outline-none placeholder:text-cm-text/45 transition-[height,box-shadow,border-color,background-color] duration-500 ease-out focus-visible:ring-2 focus-visible:ring-nod-gold/45 focus-visible:ring-offset-1 dark:bg-cm-surface-raised ${
                      isReplyComposerExpanded
                        ? "h-[112px] border-nod-gold/60 bg-white pb-12 pt-2.5 shadow-[0_0_0_3px_rgba(232,185,49,0.14)]"
                        : "h-9 border-cm-text/15 bg-cm-bg/70 py-2"
                    }`}
                  />

                  {isReplyComposerExpanded ? (
                    <div className="pointer-events-none absolute bottom-4 right-2 flex items-center gap-2">
                      <button
                        type="button"
                        data-testid={`shared-comment-reply-cancel-${comment.id}`}
                        onMouseDown={() => {
                          allowReplyComposerBlurRef.current[comment.id] = true;
                        }}
                        onClick={() => {
                          handleCancelReplyComposer(comment.id);
                        }}
                        className="pointer-events-auto inline-flex h-8 items-center justify-center rounded-md border border-cm-text/20 bg-white dark:bg-cm-surface px-2.5 font-creative-body text-xs font-bold text-cm-text/80 transition-colors hover:bg-cm-bg dark:hover:bg-cm-surface-raised"
                      >
                        {tCommon("cancel")}
                      </button>
                      <button
                        type="submit"
                        data-testid={`shared-comment-reply-submit-${comment.id}`}
                        onMouseDown={() => {
                          allowReplyComposerBlurRef.current[comment.id] = true;
                        }}
                        disabled={createComment.isPending}
                        className="pointer-events-auto inline-flex h-8 items-center justify-center rounded-md border border-cm-text/20 bg-nod-gold px-2.5 font-creative-body text-xs font-black text-black transition-colors hover:bg-[#f0c958] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {createComment.isPending
                          ? tCommon("loading")
                          : t("sharedCommentsReplySubmit")}
                      </button>
                    </div>
                  ) : null}
                </div>
              </form>
            ) : null}

            {replyCount > 0 && isRepliesVisible ? (
              <div className="mt-3 space-y-2 border-l border-cm-text/12 pl-4">
                {comment.replies.map((reply, replyIndex) =>
                  renderInlineComment(reply, replyIndex === comment.replies.length - 1, depth + 1)
                )}
              </div>
            ) : null}
          </div>
        </div>
      </article>
    );
  }

  const quickActions = (
    quickActionsTestId: string,
    leftActionsTestId: string,
    containerClassName: string
  ) => (
    <div data-testid={quickActionsTestId} className={containerClassName}>
      <div
        data-testid={leftActionsTestId}
        className="inline-flex items-center gap-1 rounded-xl bg-white/85 p-1 dark:bg-cm-surface-raised/70"
      >
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label={t("sharedQuickActionEmpathy")}
          onClick={handleToggleEmpathy}
          disabled={!viewer || toggleEmpathy.isPending}
          className={`h-8 rounded-lg px-2.5 transition-colors ${
            isEmpathyActive ? "bg-nod-gold/15 text-nod-gold" : "text-cm-text/65 hover:bg-cm-bg"
          }`}
        >
          <Heart className={`h-4 w-4 ${isEmpathyActive ? "fill-current" : ""}`} />
          <span className="font-creative-body text-xs font-black">{empathyCount}</span>
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label={t("sharedQuickActionComments")}
          onClick={() => setIsCommentsOpen(true)}
          className="h-8 rounded-lg px-2.5 text-cm-text/65 transition-colors hover:bg-cm-bg"
        >
          <MessageCircle className="h-4 w-4" />
          <span className="font-creative-body text-xs font-black">{comments.length}</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t("sharedQuickActionShare")}
              className="rounded-lg text-cm-text/65 transition-colors hover:bg-cm-bg"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault();
                void handleCopyShareLink();
              }}
            >
              {copiedShareLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copiedShareLink ? t("sharedShareCopied") : t("sharedShareCopyLink")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {data.is_owner ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="More options"
                className="rounded-lg text-cm-text/65 transition-colors hover:bg-cm-bg"
              >
                <Ellipsis className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem
                variant="destructive"
                onSelect={(event) => {
                  event.preventDefault();
                  setShowRevokeConfirm(true);
                }}
              >
                <Trash2 className="h-4 w-4" />
                Revoke
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
    </div>
  );

  return (
    <>
      {fixedHeader}

      {/* Revoke confirmation modal */}
      {showRevokeConfirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="cm-doodle-border mx-4 w-full max-w-sm bg-white p-6 dark:bg-cm-surface">
            <h3 className="font-creative-display text-lg font-black text-cm-text">
              공유를 취소하시겠습니까?
            </h3>
            <p className="mt-2 font-creative-body text-sm text-cm-text/60">
              이 공유 링크가 삭제되며, 더 이상 다른 사람이 볼 수 없게 됩니다.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowRevokeConfirm(false)}
                className="inline-flex h-9 items-center justify-center rounded-lg border border-cm-text/20 bg-white px-4 font-creative-body text-sm font-bold text-cm-text/80 transition-colors hover:bg-cm-bg dark:bg-cm-surface dark:hover:bg-cm-surface-raised"
              >
                {tCommon("cancel")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowRevokeConfirm(false);
                  void handleRevokeShare();
                }}
                className="inline-flex h-9 items-center justify-center rounded-lg bg-red-500 px-4 font-creative-body text-sm font-bold text-white transition-colors hover:bg-red-600"
              >
                {tCommon("delete")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <main className="mx-auto max-w-3xl space-y-6 px-4 pb-8 pt-20 md:px-6 md:pt-24">
        <section data-testid="shared-title-hero" className={panelClass}>
          {/* OG image from original article */}
          {articleOgImage ? (
            <div className="mb-4 overflow-hidden rounded-xl border border-cm-text/10">
              <Image
                src={articleOgImage}
                alt={data.title}
                width={1200}
                height={630}
                unoptimized
                className="h-auto max-h-[280px] w-full object-cover"
                onError={() => setArticleOgImage(null)}
              />
            </div>
          ) : null}
          <div data-testid="shared-title-hero-top" className="flex items-center gap-3">
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-creative-body text-xs font-black ${contentTypeStyle.className}`}
            >
              {t(contentTypeStyle.labelKey)}
            </span>
          </div>

          <h1 className="mt-4 font-creative-display text-3xl font-black leading-tight text-cm-text md:text-[2.2rem]">
            {data.title}
          </h1>

          {data.concepts.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {data.concepts.map((concept) => (
                <span
                  key={concept}
                  className="rounded-full border border-nod-gold/30 bg-nod-gold/10 px-3 py-1 font-creative-body text-xs font-black text-nod-gold"
                >
                  {concept}
                </span>
              ))}
            </div>
          ) : null}

          {data.url ? (
            <div data-testid="shared-title-origin-link-row" className="mt-2">
              <a
                href={data.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-creative-body text-xs font-black text-nod-gold underline decoration-dotted"
              >
                {t("sharedTrustOriginalLink")}
              </a>
            </div>
          ) : null}

          <div data-testid="shared-title-hero-meta" className="mt-5 px-1">
            <div className="flex items-center gap-3">
              {data.sharer?.image && data.sharer.image !== failedSharerImageSrc ? (
                <Image
                  src={data.sharer.image}
                  alt={sharerName}
                  width={40}
                  height={40}
                  unoptimized
                  className="h-10 w-10 rounded-full border border-cm-text/15 object-cover"
                  onError={() => {
                    setFailedSharerImageSrc(data.sharer?.image ?? null);
                  }}
                />
              ) : (
                <div
                  role="img"
                  aria-label={sharerName}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-cm-text/15 bg-cm-bg font-creative-body text-sm font-black text-cm-text/80"
                >
                  {sharerInitial}
                </div>
              )}

              <div>
                <p className="font-creative-body text-xs font-black uppercase tracking-wide text-cm-text/55">
                  {t("sharedTrustSummarizedBy")}
                </p>
                <p className="font-creative-body text-sm font-black text-cm-text">{sharerName}</p>
              </div>
            </div>

            {data.reading_time_minutes || publishedDate ? (
              <div className="mt-2 flex flex-wrap items-center gap-3">
                {data.reading_time_minutes ? (
                  <p className="font-creative-body text-xs font-bold text-cm-text/55">
                    {t("readTime", { minutes: data.reading_time_minutes })}
                  </p>
                ) : null}
                {publishedDate ? (
                  <p className="font-creative-body text-xs font-bold text-cm-text/55">
                    {publishedDate}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          <Separator className="mt-4 bg-cm-text/12" />

          {quickActions(
            "shared-title-hero-quick-actions",
            "shared-title-hero-left-actions",
            "mt-3 flex items-center gap-2"
          )}
        </section>

        <section className={panelClass}>
          <h2 className="font-creative-display text-2xl font-black text-cm-text">{t("summary")}</h2>
          <p className="mt-3 font-creative-body text-sm leading-relaxed text-cm-text/80">
            {data.summary}
          </p>
        </section>

        {data.markdown_note ? (
          <section className={panelClass}>
            <h2 className="font-creative-display text-2xl font-black text-cm-text">
              {t("markdownNote")}
            </h2>
            <ArticleMarkdownNote markdownNote={data.markdown_note} />
          </section>
        ) : null}

        {data.key_points.length > 0 ? (
          <section className={panelClass}>
            <h2 className="font-creative-display text-2xl font-black text-cm-text">
              {t("keyPoints")}
            </h2>
            <ul className="mt-3 list-disc space-y-1.5 pl-5">
              {data.key_points.map((point) => (
                <li key={point} className="font-creative-body text-sm text-cm-text/80">
                  {point}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {quickActions(
          "shared-footer-quick-actions",
          "shared-footer-left-actions",
          "flex items-center justify-center"
        )}

        <div data-testid="shared-closing-separator" className="py-2 md:py-3">
          <Separator className="h-[2px] bg-cm-text/24" />
        </div>

        <section className="rounded-2xl border border-cm-text/16 bg-white/96 shadow-[0_1px_0_rgba(17,24,39,0.08)] dark:bg-cm-surface/96">
          <div className="border-b border-cm-text/12 px-6 py-5">
            <h2 className="font-creative-display text-2xl font-black text-cm-text">
              {t("sharedCommentsTitle")}
            </h2>
          </div>

          <div className="border-b border-cm-text/12 px-6 py-5">
            {authResolved ? (
              viewer ? (
                <form className="space-y-3" onSubmit={handleCommentSubmit}>
                  <div className="flex items-center gap-2.5">
                    <div
                      role="img"
                      aria-label={viewerName}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-cm-text/80 font-creative-body text-[11px] font-black text-white"
                    >
                      {viewerInitial}
                    </div>
                    <p className="font-creative-body text-sm font-black text-cm-text">
                      {viewerName}
                    </p>
                  </div>

                  <label className="block space-y-1.5">
                    <span className="font-creative-body text-xs font-black uppercase tracking-wide text-cm-text/55">
                      {t("sharedCommentsContentLabel")}
                    </span>
                    <div className="relative">
                      <textarea
                        data-testid="shared-comment-input-inline"
                        data-expanded={isCommentComposerExpanded}
                        value={commentContent}
                        onFocus={() => {
                          setIsCommentComposerActive(true);
                        }}
                        onBlur={handleCommentComposerBlur}
                        onChange={(event) => {
                          const value = event.target.value;
                          setCommentContent(value);
                          if (value.trim().length > 0) {
                            setIsCommentComposerActive(true);
                          }
                        }}
                        maxLength={2000}
                        placeholder={t("sharedCommentsContentPlaceholder")}
                        className={`w-full resize-none overflow-y-auto rounded-xl border px-3 font-creative-body text-sm text-cm-text outline-none placeholder:text-cm-text/45 transition-[height,box-shadow,border-color,background-color] duration-500 ease-out focus-visible:ring-2 focus-visible:ring-nod-gold/45 focus-visible:ring-offset-1 dark:bg-cm-surface-raised ${
                          isCommentComposerExpanded
                            ? "h-[148px] border-nod-gold/60 bg-white pb-12 pt-3 shadow-[0_0_0_3px_rgba(232,185,49,0.14)]"
                            : "h-10 border-cm-text/15 bg-cm-bg/70 py-2.5"
                        }`}
                      />

                      {isCommentComposerExpanded ? (
                        <div className="pointer-events-none absolute bottom-4 right-2 flex items-center gap-2">
                          <button
                            type="button"
                            data-testid="shared-comment-cancel-inline"
                            onMouseDown={() => {
                              allowCommentComposerBlurRef.current = true;
                            }}
                            onClick={handleCancelCommentComposer}
                            className="pointer-events-auto inline-flex h-8 items-center justify-center rounded-md border border-cm-text/20 bg-white dark:bg-cm-surface px-2.5 font-creative-body text-xs font-bold text-cm-text/80 transition-colors hover:bg-cm-bg dark:hover:bg-cm-surface-raised"
                          >
                            {tCommon("cancel")}
                          </button>
                          <button
                            type="submit"
                            data-testid="shared-comment-submit-inline"
                            onMouseDown={() => {
                              allowCommentComposerBlurRef.current = true;
                            }}
                            disabled={createComment.isPending}
                            className="pointer-events-auto inline-flex h-8 items-center justify-center rounded-md border border-cm-text/20 bg-nod-gold px-2.5 font-creative-body text-xs font-black text-black transition-colors hover:bg-[#f0c958] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {createComment.isPending
                              ? tCommon("loading")
                              : t("sharedCommentsReplySubmit")}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </label>
                </form>
              ) : (
                <div className="space-y-3">
                  <p className="font-creative-body text-sm text-cm-text/70">
                    {t("sharedCommentsSignInRequired")}
                  </p>
                  <Link
                    href={`/login?redirect=${encodedRedirect}`}
                    className="inline-flex items-center justify-center rounded-lg border border-cm-text/20 bg-white px-3 py-1.5 font-creative-body text-xs font-black text-cm-text transition-colors hover:bg-cm-bg dark:bg-cm-surface dark:hover:bg-cm-surface-raised"
                  >
                    {tLogin("signInTitle")}
                  </Link>
                </div>
              )
            ) : (
              <p className="font-creative-body text-sm text-cm-text/60">{tCommon("loading")}</p>
            )}
          </div>

          <div className="px-6 py-5">
            <div className="flex items-center justify-between gap-3">
              <p className="font-creative-body text-xs font-black uppercase tracking-wide text-cm-text/50">
                {t("sharedCommentsSortLabel")}
              </p>
              <select
                data-testid="shared-comments-sort-select-inline"
                aria-label={t("sharedCommentsSortLabel")}
                value={commentSort}
                onChange={(event) => {
                  setCommentSort(toCommentSortOption(event.target.value));
                }}
                className="h-8 rounded-lg border border-cm-text/15 bg-white px-2.5 font-creative-body text-xs font-bold text-cm-text outline-none transition-colors focus:border-nod-gold focus-visible:ring-2 focus-visible:ring-nod-gold/45 focus-visible:ring-offset-1 dark:bg-cm-surface"
              >
                <option value="latest">{t("sharedCommentsSortLatest")}</option>
                <option value="recommended">{t("sharedCommentsSortRecommended")}</option>
              </select>
            </div>

            <div className="mt-3 space-y-0">
              {commentsQuery.isLoading ? (
                <p className="font-creative-body text-sm text-cm-text/60">{tCommon("loading")}</p>
              ) : comments.length === 0 ? (
                <p className="font-creative-body text-sm text-cm-text/70">
                  {t("sharedCommentsEmpty")}
                </p>
              ) : (
                sortedComments.map((comment, index) =>
                  renderInlineComment(comment, index === sortedComments.length - 1)
                )
              )}
            </div>
          </div>
        </section>
      </main>
      <div className="mt-3 md:mt-4">
        <LandingFooter />
      </div>

      <Sheet open={isCommentsOpen} onOpenChange={setIsCommentsOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 gap-0">
          <SheetHeader className="px-5 py-4">
            <SheetTitle className="font-creative-display text-2xl font-black text-cm-text pr-8">
              {t("sharedCommentsPanelTitle", { count: comments.length })}
            </SheetTitle>
            <SheetDescription className="sr-only">
              {t("sharedCommentsPanelDescription")}
            </SheetDescription>
          </SheetHeader>

          <Separator className="bg-cm-text/10" />

          <div className="flex h-full min-h-0 flex-col">
            <div className="px-5 py-4 space-y-3 border-b border-cm-text/10">
              {authResolved ? (
                viewer ? (
                  <form className="space-y-3" onSubmit={handleCommentSubmit}>
                    <div
                      data-testid="shared-comment-viewer-profile-panel"
                      className="flex items-center gap-2.5"
                    >
                      {viewer.image && viewer.image !== failedViewerImageSrc ? (
                        <Image
                          src={viewer.image}
                          alt={viewerName}
                          width={28}
                          height={28}
                          unoptimized
                          data-testid="shared-comment-viewer-avatar-panel-image"
                          className="h-7 w-7 rounded-full border border-cm-text/15 object-cover"
                          onError={() => {
                            setFailedViewerImageSrc(viewer.image);
                          }}
                        />
                      ) : (
                        <div
                          role="img"
                          aria-label={viewerName}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-cm-text/80 font-creative-body text-[11px] font-black text-white"
                        >
                          {viewerInitial}
                        </div>
                      )}
                      <p className="font-creative-body text-sm font-black text-cm-text">
                        {viewerName}
                      </p>
                    </div>

                    <label className="block space-y-1">
                      <span className="font-creative-body text-xs font-black uppercase tracking-wide text-cm-text/60">
                        {t("sharedCommentsContentLabel")}
                      </span>
                      <div className="relative">
                        <textarea
                          data-testid="shared-comment-input-panel"
                          data-expanded={isCommentComposerExpanded}
                          value={commentContent}
                          onFocus={() => {
                            setIsCommentComposerActive(true);
                          }}
                          onBlur={handleCommentComposerBlur}
                          onChange={(event) => {
                            const value = event.target.value;
                            setCommentContent(value);
                            if (value.trim().length > 0) {
                              setIsCommentComposerActive(true);
                            }
                          }}
                          maxLength={2000}
                          placeholder={t("sharedCommentsContentPlaceholder")}
                          className={`w-full resize-none overflow-y-auto rounded-lg border px-3 font-creative-body text-sm text-cm-text outline-none transition-[height,box-shadow,border-color,background-color] duration-500 ease-out focus-visible:ring-2 focus-visible:ring-nod-gold/45 focus-visible:ring-offset-1 dark:bg-cm-surface ${
                            isCommentComposerExpanded
                              ? "h-[148px] border-nod-gold/60 bg-white pb-12 pt-3 shadow-[0_0_0_3px_rgba(232,185,49,0.14)]"
                              : "h-10 border-cm-text/20 bg-white py-2.5"
                          }`}
                        />

                        {isCommentComposerExpanded ? (
                          <div className="pointer-events-none absolute bottom-4 right-2 flex items-center gap-2">
                            <button
                              type="button"
                              data-testid="shared-comment-cancel-panel"
                              onMouseDown={() => {
                                allowCommentComposerBlurRef.current = true;
                              }}
                              onClick={handleCancelCommentComposer}
                              className="pointer-events-auto inline-flex h-8 items-center justify-center rounded-md border border-cm-text/20 bg-white dark:bg-cm-surface px-2.5 font-creative-body text-xs font-bold text-cm-text/80 transition-colors hover:bg-cm-bg dark:hover:bg-cm-surface-raised"
                            >
                              {tCommon("cancel")}
                            </button>
                            <button
                              type="submit"
                              data-testid="shared-comment-submit-panel"
                              onMouseDown={() => {
                                allowCommentComposerBlurRef.current = true;
                              }}
                              disabled={createComment.isPending}
                              className="pointer-events-auto inline-flex h-8 items-center justify-center rounded-md border border-cm-text/20 bg-nod-gold px-2.5 font-creative-body text-xs font-black text-black transition-colors hover:bg-[#f0c958] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {createComment.isPending
                                ? tCommon("loading")
                                : t("sharedCommentsReplySubmit")}
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </label>
                  </form>
                ) : (
                  <div className="space-y-2">
                    <p className="font-creative-body text-sm text-cm-text/70">
                      {t("sharedCommentsSignInRequired")}
                    </p>
                    <Link
                      href={`/login?redirect=${encodedRedirect}`}
                      className="inline-flex items-center justify-center rounded-lg border border-cm-text/20 bg-white px-3 py-1.5 font-creative-body text-xs font-black text-cm-text transition-colors hover:bg-cm-bg dark:bg-cm-surface dark:hover:bg-cm-surface-raised"
                    >
                      {tLogin("signInTitle")}
                    </Link>
                  </div>
                )
              ) : (
                <p className="font-creative-body text-sm text-cm-text/60">{tCommon("loading")}</p>
              )}
            </div>

            <div className="px-5 py-3 border-b border-cm-text/10">
              <div className="flex items-center justify-between gap-3">
                <p className="font-creative-body text-xs font-black uppercase tracking-wide text-cm-text/60">
                  {t("sharedCommentsSortLabel")}
                </p>
                <select
                  data-testid="shared-comments-sort-select-panel"
                  aria-label={t("sharedCommentsSortLabel")}
                  value={commentSort}
                  onChange={(event) => {
                    setCommentSort(toCommentSortOption(event.target.value));
                  }}
                  className="h-8 rounded-lg border border-cm-text/15 bg-white px-2.5 font-creative-body text-xs font-bold text-cm-text outline-none transition-colors focus:border-nod-gold focus-visible:ring-2 focus-visible:ring-nod-gold/45 focus-visible:ring-offset-1 dark:bg-cm-surface"
                >
                  <option value="latest">{t("sharedCommentsSortLatest")}</option>
                  <option value="recommended">{t("sharedCommentsSortRecommended")}</option>
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {commentsQuery.isLoading ? (
                <p className="font-creative-body text-sm text-cm-text/60">{tCommon("loading")}</p>
              ) : comments.length === 0 ? (
                <p className="font-creative-body text-sm text-cm-text/70">
                  {t("sharedCommentsEmpty")}
                </p>
              ) : (
                sortedComments.map((comment, index) =>
                  renderInlineComment(comment, index === sortedComments.length - 1)
                )
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
