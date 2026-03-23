// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, unused_import, invalid_annotation_target, unnecessary_import

import 'package:freezed_annotation/freezed_annotation.dart';

part 'shared_article_sharer_response.freezed.dart';
part 'shared_article_sharer_response.g.dart';

@Freezed()
abstract class SharedArticleSharerResponse with _$SharedArticleSharerResponse {
  const factory SharedArticleSharerResponse({
    String? name,
    String? image,
  }) = _SharedArticleSharerResponse;
  
  factory SharedArticleSharerResponse.fromJson(Map<String, Object?> json) => _$SharedArticleSharerResponseFromJson(json);
}
