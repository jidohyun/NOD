// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'shared_article_comment_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_SharedArticleCommentResponse _$SharedArticleCommentResponseFromJson(
  Map<String, dynamic> json,
) => _SharedArticleCommentResponse(
  id: json['id'] as String,
  authorName: json['author_name'] as String,
  content: json['content'] as String,
  createdAt: DateTime.parse(json['created_at'] as String),
  empathyCount: (json['empathy_count'] as num?)?.toInt() ?? 0,
  viewerHasEmpathy: json['viewer_has_empathy'] as bool? ?? false,
  authorImage: json['author_image'] as String?,
  authorUserId: json['author_user_id'] as String?,
  parentCommentId: json['parent_comment_id'] as String?,
  replies: (json['replies'] as List<dynamic>?)
      ?.map(
        (e) => SharedArticleCommentResponse.fromJson(e as Map<String, dynamic>),
      )
      .toList(),
);

Map<String, dynamic> _$SharedArticleCommentResponseToJson(
  _SharedArticleCommentResponse instance,
) => <String, dynamic>{
  'id': instance.id,
  'author_name': instance.authorName,
  'content': instance.content,
  'created_at': instance.createdAt.toIso8601String(),
  'empathy_count': instance.empathyCount,
  'viewer_has_empathy': instance.viewerHasEmpathy,
  'author_image': instance.authorImage,
  'author_user_id': instance.authorUserId,
  'parent_comment_id': instance.parentCommentId,
  'replies': instance.replies,
};
