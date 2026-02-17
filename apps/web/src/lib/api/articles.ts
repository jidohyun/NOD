import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface ArticleSummary {
  id: string;
  summary: string;
  markdown_note?: string | null;
  concepts: string[];
  key_points: string[];
  reading_time_minutes: number | null;
  language: string | null;
  ai_provider: string;
  ai_model: string;
  created_at: string;
  content_type?: string;
  type_metadata?: Record<string, unknown>;
}

export interface Article {
  id: string;
  user_id: string;
  url: string | null;
  title: string;
  source: string;
  status: string;
  created_at: string;
  updated_at: string | null;
  summary: ArticleSummary | null;
}

export interface ArticleListItem {
  id: string;
  url: string | null;
  title: string;
  source: string;
  status: string;
  created_at: string;
  summary_preview: string | null;
  content_type?: string;
}

export interface SimilarArticle {
  id: string;
  title: string;
  url: string | null;
  source: string;
  similarity: number;
  shared_concepts: string[];
  summary_preview: string | null;
}

export interface ConceptGraphNode {
  id: string;
  label: string;
  value: number;
}

export interface ConceptGraphEdge {
  source: string;
  target: string;
  weight: number;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export function useArticles(params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: ["articles", params],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<ArticleListItem>>(
        "/api/articles",
        { params }
      );
      return data;
    },
  });
}

export function useInfiniteArticles(params: {
  limit?: number;
  search?: string;
  status?: string;
}) {
  return useInfiniteQuery({
    queryKey: ["articles", "infinite", params],
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await apiClient.get<PaginatedResponse<ArticleListItem>>(
        "/api/articles",
        { params: { ...params, page: pageParam } }
      );
      return data;
    },
    getNextPageParam: (lastPage) =>
      lastPage.meta.has_next ? lastPage.meta.page + 1 : undefined,
    initialPageParam: 1,
  });
}

export function useArticle(id: string) {
  return useQuery({
    queryKey: ["articles", id],
    queryFn: async () => {
      const { data } = await apiClient.get<Article>(`/api/articles/${id}`);
      return data;
    },
    enabled: !!id,
    refetchInterval: (query) => {
      const article = query.state.data;
      if (article && (article.status === "pending" || article.status === "processing" || article.status === "analyzing")) {
        return 3000;
      }
      return false;
    },
  });
}

export function useSimilarArticles(id: string) {
  return useQuery({
    queryKey: ["articles", id, "similar"],
    queryFn: async () => {
      const { data } = await apiClient.get<SimilarArticle[]>(
        `/api/articles/${id}/similar`
      );
      return data;
    },
    enabled: !!id,
  });
}

export function useSemanticSearch(params: {
  q: string;
  limit?: number;
  status?: string;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: ["articles", "semantic-search", params.q, params.status, params.limit],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<ArticleListItem>>(
        "/api/articles/search",
        { params: { q: params.q, limit: params.limit, status: params.status } }
      );
      return data;
    },
    enabled: params.enabled !== false && params.q.length >= 2,
  });
}

export function useDeleteArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api/articles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
    },
  });
}

export function useRetryArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post<Article>(`/api/articles/${id}/retry`);
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["articles", id] });
      queryClient.invalidateQueries({ queryKey: ["articles"] });
    },
  });
}
