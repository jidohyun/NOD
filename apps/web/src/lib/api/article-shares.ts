/**
 * Share link types & hooks for articles.
 *
 * Separated from articles.ts to avoid being wiped by Orval's "Cleaning output folder".
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

// ── Types ────────────────────────────────────────────────────────────────

export interface ArticleShareLink {
  share_id: string;
  expires_at: string | null;
  share_url: string;
  share_slug: string;
  canonical_share_url: string;
  url_mode: string;
  custom_url: string | null;
  thumbnail_mode: string;
  thumbnail_url: string | null;
}

export interface SharedArticle {
  share_id: string;
  share_slug: string;
  share_sid: string;
  canonical_share_path: string;
  article_id: string;
  title: string;
  source: string;
  url: string | null;
  created_at: string;
  summary: string;
  markdown_note?: string | null;
  key_points: string[];
  concepts: string[];
  reading_time_minutes: number | null;
  language: string | null;
  content_type: string;
  type_metadata: Record<string, unknown>;
  empathy_count: number;
  viewer_has_empathy: boolean;
  is_owner: boolean;
  sharer: { display_name: string; avatar_url: string | null; name?: string; image?: string | null };
  url_mode: string;
  custom_url?: string | null;
  thumbnail_mode: string;
  thumbnail_url?: string | null;
  og_image_url?: string | null;
}

export interface SharedArticleComment {
  id: string;
  share_link_id: string;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  author_name?: string;
  author_image?: string | null;
  author_user_id?: string;
  parent_comment_id: string | null;
  content: string;
  empathy_count: number;
  viewer_has_empathy: boolean;
  replies: SharedArticleComment[];
  created_at: string;
  updated_at: string | null;
}

export async function createArticleShareLink(
  articleId: string,
  options?: { url_mode?: string; custom_url?: string; thumbnail_mode?: string; thumbnail_url?: string },
) {
  const { data } = await apiClient.post<ArticleShareLink>(`/api/articles/${articleId}/share-link`, options);
  return data;
}

export async function revokeArticleShareLink(articleId: string) {
  await apiClient.delete(`/api/articles/${articleId}/share-link`);
}

export async function fetchSharedArticle(shareId: string, token: string) {
  const { data } = await apiClient.get<SharedArticle>(`/api/articles/share/${shareId}`, {
    params: { token },
    headers: { "Cache-Control": "no-cache" },
  });
  return data;
}

export async function fetchSharedArticleBySlug(shareSlug: string, token: string) {
  const { data } = await apiClient.get<SharedArticle>(
    `/api/articles/share/by-slug/${encodeURIComponent(shareSlug)}`,
    {
      params: { token },
      headers: { "Cache-Control": "no-cache" },
    },
  );
  return data;
}

// ── Hooks ────────────────────────────────────────────────────────────────

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function useCreateArticleShareLink() {
  return useMutation({
    mutationFn: async ({ articleId, options }: {
      articleId: string;
      options?: { url_mode?: string; custom_url?: string; thumbnail_mode?: string; thumbnail_url?: string };
    }) => {
      const { data } = await apiClient.post<ArticleShareLink>(`/api/articles/${articleId}/share-link`, options);
      return data;
    },
  });
}

export function useSharedArticle(shareId: string, token: string) {
  const isUuid = UUID_RE.test(shareId);
  return useQuery({
    queryKey: ["shared-articles", shareId, token],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (token) params.token = token;
      const url = isUuid
        ? `/api/articles/share/${shareId}`
        : `/api/articles/share/by-slug/${encodeURIComponent(shareId)}`;
      const { data } = await apiClient.get<SharedArticle>(url, { params });
      return data;
    },
    enabled: !!shareId,
  });
}

export function useSharedArticleByUsername(username: string, slug: string) {
  return useQuery({
    queryKey: ["shared-articles", "by-user", username, slug],
    queryFn: async () => {
      const { data } = await apiClient.get<SharedArticle>(
        `/api/articles/share/by-user/${encodeURIComponent(username)}/${encodeURIComponent(slug)}`
      );
      return data;
    },
    enabled: !!username && !!slug,
  });
}

export function useSharedArticleComments(shareId: string, token: string) {
  return useQuery({
    queryKey: ["shared-articles", shareId, "comments", token],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (token) params.token = token;
      const { data } = await apiClient.get<SharedArticleComment[]>(`/api/articles/share/${shareId}/comments`, { params });
      return data;
    },
    enabled: !!shareId,
  });
}

export function useCreateSharedArticleComment(shareId: string, token: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ content, parent_comment_id }: { content: string; parent_comment_id?: string | null }) => {
      const params: Record<string, string> = {};
      if (token) params.token = token;
      const { data } = await apiClient.post<SharedArticleComment>(`/api/articles/share/${shareId}/comments`, { content, parent_comment_id }, { params });
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["shared-articles", shareId, "comments"] }); },
  });
}

export function useUpdateSharedArticleComment(shareId: string, token: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ commentId, content }: { commentId: string; content: string }) => {
      const params: Record<string, string> = {};
      if (token) params.token = token;
      const { data } = await apiClient.patch<SharedArticleComment>(`/api/articles/share/${shareId}/comments/${commentId}`, { content }, { params });
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["shared-articles", shareId, "comments"] }); },
  });
}

export function useDeleteSharedArticleComment(shareId: string, token: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ commentId }: { commentId: string }) => {
      const params: Record<string, string> = {};
      if (token) params.token = token;
      await apiClient.delete(`/api/articles/share/${shareId}/comments/${commentId}`, { params });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["shared-articles", shareId, "comments"] }); },
  });
}

export function useToggleSharedArticleEmpathy(shareId: string, token: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const params: Record<string, string> = {};
      if (token) params.token = token;
      const { data } = await apiClient.post<{ empathy_count: number; has_empathy: boolean; viewer_has_empathy: boolean }>(`/api/articles/share/${shareId}/empathy`, undefined, { params });
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["shared-articles", shareId] }); },
  });
}

export function useToggleSharedArticleCommentEmpathy(shareId: string, token: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ commentId }: { commentId: string }) => {
      const params: Record<string, string> = {};
      if (token) params.token = token;
      const { data } = await apiClient.post<{ empathy_count: number; has_empathy: boolean; viewer_has_empathy: boolean }>(`/api/articles/share/${shareId}/comments/${commentId}/empathy`, undefined, { params });
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["shared-articles", shareId, "comments"] }); },
  });
}
