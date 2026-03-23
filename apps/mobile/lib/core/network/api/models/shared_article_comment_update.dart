// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, unused_import, invalid_annotation_target, unnecessary_import

import 'package:freezed_annotation/freezed_annotation.dart';

part 'shared_article_comment_update.freezed.dart';
part 'shared_article_comment_update.g.dart';

@Freezed()
abstract class SharedArticleCommentUpdate with _$SharedArticleCommentUpdate {
  const factory SharedArticleCommentUpdate({
    required String content,
  }) = _SharedArticleCommentUpdate;
  
  factory SharedArticleCommentUpdate.fromJson(Map<String, Object?> json) => _$SharedArticleCommentUpdateFromJson(json);
}
