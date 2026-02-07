import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/core/network/api_client.dart';
import 'package:mobile/features/articles/data/article_repository.dart';

final apiClientProvider = Provider<ApiClient>((ref) {
  return ApiClient();
});

final articleRepositoryProvider = Provider<ArticleRepository>((ref) {
  return ArticleRepository(apiClient: ref.watch(apiClientProvider));
});

final articlesProvider = FutureProvider.family<Map<String, dynamic>,
    ({int page, String? search, String? status})>(
  (ref, params) async {
    final repo = ref.watch(articleRepositoryProvider);
    return repo.getArticles(
      page: params.page,
      search: params.search,
      status: params.status,
    );
  },
);

final articleDetailProvider =
    FutureProvider.family<Map<String, dynamic>, String>(
  (ref, id) async {
    final repo = ref.watch(articleRepositoryProvider);
    return repo.getArticle(id);
  },
);

final similarArticlesProvider =
    FutureProvider.family<List<dynamic>, String>(
  (ref, id) async {
    final repo = ref.watch(articleRepositoryProvider);
    return repo.getSimilarArticles(id);
  },
);
