// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, unused_import, invalid_annotation_target, unnecessary_import

import 'package:freezed_annotation/freezed_annotation.dart';

part 'shared_article_comment_empathy_response.freezed.dart';
part 'shared_article_comment_empathy_response.g.dart';

@Freezed()
abstract class SharedArticleCommentEmpathyResponse with _$SharedArticleCommentEmpathyResponse {
  const factory SharedArticleCommentEmpathyResponse({
    @JsonKey(name: 'empathy_count')
    required int empathyCount,
    @JsonKey(name: 'viewer_has_empathy')
    required bool viewerHasEmpathy,
  }) = _SharedArticleCommentEmpathyResponse;
  
  factory SharedArticleCommentEmpathyResponse.fromJson(Map<String, Object?> json) => _$SharedArticleCommentEmpathyResponseFromJson(json);
}
