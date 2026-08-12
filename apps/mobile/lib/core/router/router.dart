import 'package:go_router/go_router.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:mobile/features/articles/presentation/screens/article_detail_screen.dart';
import 'package:mobile/features/articles/presentation/screens/article_list_screen.dart';

part 'router.g.dart';

@riverpod
GoRouter router(Ref ref) {
  return GoRouter(
    initialLocation: '/articles',
    routes: [
      GoRoute(
        path: '/',
        builder: (context, state) => const ArticleListScreen(),
      ),
      GoRoute(
        path: '/articles',
        builder: (context, state) => const ArticleListScreen(),
      ),
      GoRoute(
        path: '/articles/:id',
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          return ArticleDetailScreen(id: id);
        },
      ),
    ],
  );
}
