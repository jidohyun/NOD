// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'article_share_link_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_ArticleShareLinkResponse _$ArticleShareLinkResponseFromJson(
  Map<String, dynamic> json,
) => _ArticleShareLinkResponse(
  shareId: json['share_id'] as String,
  shareUrl: json['share_url'] as String,
  shareSlug: json['share_slug'] as String,
  canonicalShareUrl: json['canonical_share_url'] as String,
  urlMode: json['url_mode'] as String? ?? 'default',
  thumbnailMode: json['thumbnail_mode'] as String? ?? 'default',
  expiresAt: json['expires_at'] == null
      ? null
      : DateTime.parse(json['expires_at'] as String),
  customUrl: json['custom_url'] as String?,
  thumbnailUrl: json['thumbnail_url'] as String?,
);

Map<String, dynamic> _$ArticleShareLinkResponseToJson(
  _ArticleShareLinkResponse instance,
) => <String, dynamic>{
  'share_id': instance.shareId,
  'share_url': instance.shareUrl,
  'share_slug': instance.shareSlug,
  'canonical_share_url': instance.canonicalShareUrl,
  'url_mode': instance.urlMode,
  'thumbnail_mode': instance.thumbnailMode,
  'expires_at': instance.expiresAt?.toIso8601String(),
  'custom_url': instance.customUrl,
  'thumbnail_url': instance.thumbnailUrl,
};
