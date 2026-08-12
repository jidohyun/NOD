import 'package:dio/dio.dart';
import 'package:mobile/core/network/api_client.dart';

class ArticleRepository {
  ArticleRepository({required ApiClient apiClient}) : _dio = apiClient.dio;

  final Dio _dio;

  Future<Map<String, dynamic>> getArticles({
    int page = 1,
    int limit = 20,
    String? search,
    String? status,
  }) async {
    final params = <String, dynamic>{
      'page': page,
      'limit': limit,
    };
    if (search != null && search.isNotEmpty) params['search'] = search;
    if (status != null && status.isNotEmpty) params['status'] = status;

    final response = await _dio.get<Map<String, dynamic>>(
      '/api/articles',
      queryParameters: params,
    );
    return response.data!;
  }

  Future<Map<String, dynamic>> getArticle(String id) async {
    final response = await _dio.get<Map<String, dynamic>>(
      '/api/articles/$id',
    );
    return response.data!;
  }

  Future<List<dynamic>> getSimilarArticles(String id) async {
    final response = await _dio.get<List<dynamic>>(
      '/api/articles/$id/similar',
    );
    return response.data!;
  }
}
