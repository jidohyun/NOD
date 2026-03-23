// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'article_share_link_create.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_ArticleShareLinkCreate _$ArticleShareLinkCreateFromJson(
  Map<String, dynamic> json,
) => _ArticleShareLinkCreate(
  customUrl: json['custom_url'] as String?,
  thumbnailUrl: json['thumbnail_url'] as String?,
  urlMode: json['url_mode'] as String? ?? 'default',
  thumbnailMode: json['thumbnail_mode'] as String? ?? 'default',
);

Map<String, dynamic> _$ArticleShareLinkCreateToJson(
  _ArticleShareLinkCreate instance,
) => <String, dynamic>{
  'custom_url': instance.customUrl,
  'thumbnail_url': instance.thumbnailUrl,
  'url_mode': instance.urlMode,
  'thumbnail_mode': instance.thumbnailMode,
};
