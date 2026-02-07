import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile/features/articles/providers/article_providers.dart';
import 'package:url_launcher/url_launcher.dart';

class ArticleDetailScreen extends ConsumerWidget {
  const ArticleDetailScreen({required this.id, super.key});

  final String id;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final articleAsync = ref.watch(articleDetailProvider(id));
    final similarAsync = ref.watch(similarArticlesProvider(id));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Article'),
      ),
      body: articleAsync.when(
        data: (article) {
          final title = article['title'] as String? ?? 'Untitled';
          final status = article['status'] as String? ?? '';
          final url = article['url'] as String?;
          final source = article['source'] as String? ?? '';
          final summary = article['summary'] as Map<String, dynamic>?;

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Title & status
                Text(title, style: Theme.of(context).textTheme.headlineSmall),
                const SizedBox(height: 8),
                Row(
                  children: [
                    _StatusChip(status: status),
                    const SizedBox(width: 8),
                    Text(source, style: Theme.of(context).textTheme.bodySmall),
                  ],
                ),

                // Open in browser
                if (url != null) ...[
                  const SizedBox(height: 12),
                  OutlinedButton.icon(
                    onPressed: () async {
                      final uri = Uri.parse(url);
                      if (await canLaunchUrl(uri)) {
                        await launchUrl(
                          uri,
                          mode: LaunchMode.externalApplication,
                        );
                      }
                    },
                    icon: const Icon(Icons.open_in_browser, size: 18),
                    label: const Text('Open in browser'),
                  ),
                ],

                // Analyzing indicator
                if (status == 'pending' || status == 'analyzing') ...[
                  const SizedBox(height: 16),
                  const LinearProgressIndicator(),
                  const SizedBox(height: 8),
                  Text(
                    status == 'pending'
                        ? 'Waiting for analysis...'
                        : 'AI is analyzing this article...',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],

                // Summary section
                if (summary != null) ...[
                  const SizedBox(height: 24),
                  const _SectionTitle('Summary'),
                  const SizedBox(height: 8),
                  Text(
                    summary['summary'] as String? ?? '',
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                  if (summary['reading_time_minutes'] != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      '~${summary['reading_time_minutes']} min read',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Colors.grey[600],
                          ),
                    ),
                  ],

                  // Concepts
                  if (summary['concepts'] != null) ...[
                    const SizedBox(height: 16),
                    const _SectionTitle('Concepts'),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 6,
                      runSpacing: 6,
                      children: [
                        for (final concept in summary['concepts'] as List)
                          Chip(
                            label: Text(
                              concept.toString(),
                              style: const TextStyle(fontSize: 12),
                            ),
                            materialTapTargetSize:
                                MaterialTapTargetSize.shrinkWrap,
                            visualDensity: VisualDensity.compact,
                          ),
                      ],
                    ),
                  ],

                  // Key points
                  if (summary['key_points'] != null) ...[
                    const SizedBox(height: 16),
                    const _SectionTitle('Key Points'),
                    const SizedBox(height: 8),
                    for (final point in summary['key_points'] as List) ...[
                      Padding(
                        padding: const EdgeInsets.only(bottom: 4),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              '  ',
                              style: TextStyle(fontWeight: FontWeight.bold),
                            ),
                            Expanded(child: Text(point.toString())),
                          ],
                        ),
                      ),
                    ],
                  ],

                  const SizedBox(height: 8),
                  Text(
                    'Analyzed by ${summary['ai_provider']}/${summary['ai_model']}',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.grey[500],
                          fontSize: 11,
                        ),
                  ),
                ],

                // Similar articles
                const SizedBox(height: 24),
                similarAsync.when(
                  data: (similar) {
                    if (similar.isEmpty) return const SizedBox.shrink();
                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const _SectionTitle('Similar Articles'),
                        const SizedBox(height: 8),
                        for (final item in similar) ...[
                          _SimilarArticleCard(
                            article: item as Map<String, dynamic>,
                            onTap: () {
                              context.push('/articles/${item['id']}');
                            },
                          ),
                        ],
                      ],
                    );
                  },
                  loading: () => const SizedBox.shrink(),
                  error: (_, __) => const SizedBox.shrink(),
                ),
              ],
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(child: Text('Error: $error')),
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle(this.text);
  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: Theme.of(context).textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.bold,
          ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.status});
  final String status;

  Color get _color {
    switch (status) {
      case 'pending':
        return Colors.orange;
      case 'analyzing':
        return Colors.blue;
      case 'completed':
        return Colors.green;
      case 'failed':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: _color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        status,
        style: TextStyle(
          fontSize: 12,
          color: _color,
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }
}

class _SimilarArticleCard extends StatelessWidget {
  const _SimilarArticleCard({required this.article, required this.onTap});
  final Map<String, dynamic> article;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final similarity = (article['similarity'] as num?)?.toDouble() ?? 0;
    final sharedConcepts = article['shared_concepts'] as List? ?? [];

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      article['title'] as String? ?? '',
                      style: const TextStyle(
                        fontWeight: FontWeight.w500,
                        fontSize: 14,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  Text(
                    '${(similarity * 100).round()}%',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: Theme.of(context).colorScheme.primary,
                    ),
                  ),
                ],
              ),
              if (sharedConcepts.isNotEmpty) ...[
                const SizedBox(height: 6),
                Wrap(
                  spacing: 4,
                  runSpacing: 4,
                  children: [
                    for (final concept in sharedConcepts)
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 1,
                        ),
                        decoration: BoxDecoration(
                          color: Theme.of(context)
                              .colorScheme
                              .primary
                              .withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          concept.toString(),
                          style: TextStyle(
                            fontSize: 10,
                            color: Theme.of(context).colorScheme.primary,
                          ),
                        ),
                      ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
