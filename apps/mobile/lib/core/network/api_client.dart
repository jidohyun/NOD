import 'package:dio/dio.dart';

/// {@template api_client}
/// A client for making network requests.
/// {@endtemplate}
class ApiClient {
  /// {@macro api_client}
  ApiClient({String? baseUrl})
    : _dio = Dio(
        BaseOptions(
          baseUrl: baseUrl ?? 'http://localhost:8000',
          connectTimeout: const Duration(seconds: 30),
          receiveTimeout: const Duration(seconds: 30),
        ),
      );

  final Dio _dio;

  /// The underlying [Dio] instance.
  Dio get dio => _dio;
}
