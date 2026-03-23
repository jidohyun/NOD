// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'shared_article_empathy_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_SharedArticleEmpathyResponse _$SharedArticleEmpathyResponseFromJson(
  Map<String, dynamic> json,
) => _SharedArticleEmpathyResponse(
  empathyCount: (json['empathy_count'] as num).toInt(),
  viewerHasEmpathy: json['viewer_has_empathy'] as bool,
);

Map<String, dynamic> _$SharedArticleEmpathyResponseToJson(
  _SharedArticleEmpathyResponse instance,
) => <String, dynamic>{
  'empathy_count': instance.empathyCount,
  'viewer_has_empathy': instance.viewerHasEmpathy,
};
