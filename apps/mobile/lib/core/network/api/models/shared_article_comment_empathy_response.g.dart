// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'shared_article_comment_empathy_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_SharedArticleCommentEmpathyResponse
_$SharedArticleCommentEmpathyResponseFromJson(Map<String, dynamic> json) =>
    _SharedArticleCommentEmpathyResponse(
      empathyCount: (json['empathy_count'] as num).toInt(),
      viewerHasEmpathy: json['viewer_has_empathy'] as bool,
    );

Map<String, dynamic> _$SharedArticleCommentEmpathyResponseToJson(
  _SharedArticleCommentEmpathyResponse instance,
) => <String, dynamic>{
  'empathy_count': instance.empathyCount,
  'viewer_has_empathy': instance.viewerHasEmpathy,
};
