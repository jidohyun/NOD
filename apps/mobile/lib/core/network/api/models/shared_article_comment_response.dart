// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, unused_import, invalid_annotation_target, unnecessary_import

import 'package:freezed_annotation/freezed_annotation.dart';

import 'shared_article_comment_response.dart';

part 'shared_article_comment_response.freezed.dart';
part 'shared_article_comment_response.g.dart';

@Freezed()
abstract class SharedArticleCommentResponse with _$SharedArticleCommentResponse {
  const factory SharedArticleCommentResponse({
    required String id,
    @JsonKey(name: 'author_name')
    required String authorName,
    required String content,
    @JsonKey(name: 'created_at')
    required DateTime createdAt,
    @JsonKey(name: 'empathy_count')
    @Default(0)
    int empathyCount,
    @JsonKey(name: 'viewer_has_empathy')
    @Default(false)
    bool viewerHasEmpathy,
    @JsonKey(name: 'author_image')
    String? authorImage,
    @JsonKey(name: 'author_user_id')
    String? authorUserId,
    @JsonKey(name: 'parent_comment_id')
    String? parentCommentId,
    List<SharedArticleCommentResponse>? replies,
  }) = _SharedArticleCommentResponse;
  
  factory SharedArticleCommentResponse.fromJson(Map<String, Object?> json) => _$SharedArticleCommentResponseFromJson(json);
}
