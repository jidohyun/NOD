import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile/features/articles/presentation/widgets/article_card.dart';
import 'package:mobile/features/articles/providers/article_providers.dart';

class ArticleListScreen extends ConsumerStatefulWidget {
  const ArticleListScreen({super.key});

  @override
  ConsumerState<ArticleListScreen> createState() => _ArticleListScreenState();
}

class _ArticleListScreenState extends ConsumerState<ArticleListScreen> {
  int _page = 1;
  String _search = '';

  @override
  Widget build(BuildContext context) {
    final articlesAsync = ref.watch(
      articlesProvider(
        (page: _page, search: _search.isEmpty ? null : _search, status: null),
      ),
    );

    return Scaffold(
      appBar: AppBar(
        title: const Text('NOD'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(56),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: TextField(
              decoration: InputDecoration(
                hintText: 'Search articles...',
                prefixIcon: const Icon(Icons.search, size: 20),
                isDense: true,
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 8,
                ),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              onChanged: (value) {
                setState(() {
                  _search = value;
                  _page = 1;
                });
              },
            ),
          ),
        ),
      ),
      body: articlesAsync.when(
        data: (response) {
          final articles = response['data'] as List<dynamic>? ?? [];
          final meta = response['meta'] as Map<String, dynamic>? ?? {};
          final hasNext = meta['has_next'] as bool? ?? false;

          if (articles.isEmpty) {
            return const Center(
              child: Text('No articles yet'),
            );
          }

          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(
                articlesProvider(
                  (
                    page: _page,
                    search: _search.isEmpty ? null : _search,
                    status: null,
                  ),
                ),
              );
            },
            child: ListView.builder(
              itemCount: articles.length + (hasNext ? 1 : 0),
              itemBuilder: (context, index) {
                if (index == articles.length) {
                  return Padding(
                    padding: const EdgeInsets.all(16),
                    child: Center(
                      child: TextButton(
                        onPressed: () {
                          setState(() => _page++);
                        },
                        child: const Text('Load more'),
                      ),
                    ),
                  );
                }

                final article = articles[index] as Map<String, dynamic>;
                return ArticleCard(
                  article: article,
                  onTap: () {
                    context.push('/articles/${article['id']}');
                  },
                );
              },
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('Error: $error'),
              const SizedBox(height: 8),
              TextButton(
                onPressed: () {
                  ref.invalidate(
                    articlesProvider(
                      (
                        page: _page,
                        search: _search.isEmpty ? null : _search,
                        status: null,
                      ),
                    ),
                  );
                },
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
