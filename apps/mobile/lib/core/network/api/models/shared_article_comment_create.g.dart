// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'shared_article_comment_create.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_SharedArticleCommentCreate _$SharedArticleCommentCreateFromJson(
  Map<String, dynamic> json,
) => _SharedArticleCommentCreate(
  content: json['content'] as String,
  parentCommentId: json['parent_comment_id'] as String?,
);

Map<String, dynamic> _$SharedArticleCommentCreateToJson(
  _SharedArticleCommentCreate instance,
) => <String, dynamic>{
  'content': instance.content,
  'parent_comment_id': instance.parentCommentId,
};
