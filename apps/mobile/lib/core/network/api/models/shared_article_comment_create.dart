// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, unused_import, invalid_annotation_target, unnecessary_import

import 'package:freezed_annotation/freezed_annotation.dart';

part 'shared_article_comment_create.freezed.dart';
part 'shared_article_comment_create.g.dart';

@Freezed()
abstract class SharedArticleCommentCreate with _$SharedArticleCommentCreate {
  const factory SharedArticleCommentCreate({
    required String content,
    @JsonKey(name: 'parent_comment_id')
    String? parentCommentId,
  }) = _SharedArticleCommentCreate;
  
  factory SharedArticleCommentCreate.fromJson(Map<String, Object?> json) => _$SharedArticleCommentCreateFromJson(json);
}
