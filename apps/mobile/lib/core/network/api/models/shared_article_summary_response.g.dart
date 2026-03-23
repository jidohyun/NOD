// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'shared_article_summary_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_SharedArticleSummaryResponse _$SharedArticleSummaryResponseFromJson(
  Map<String, dynamic> json,
) => _SharedArticleSummaryResponse(
  shareId: json['share_id'] as String,
  shareSlug: json['share_slug'] as String,
  shareSid: json['share_sid'] as String,
  canonicalSharePath: json['canonical_share_path'] as String,
  articleId: json['article_id'] as String,
  title: json['title'] as String,
  source: json['source'] as String,
  createdAt: DateTime.parse(json['created_at'] as String),
  summary: json['summary'] as String,
  keyPoints: (json['key_points'] as List<dynamic>)
      .map((e) => e as String)
      .toList(),
  concepts: (json['concepts'] as List<dynamic>)
      .map((e) => e as String)
      .toList(),
  contentType: json['content_type'] as String,
  typeMetadata: json['type_metadata'],
  sharer: SharedArticleSharerResponse.fromJson(
    json['sharer'] as Map<String, dynamic>,
  ),
  empathyCount: (json['empathy_count'] as num?)?.toInt() ?? 0,
  viewerHasEmpathy: json['viewer_has_empathy'] as bool? ?? false,
  urlMode: json['url_mode'] as String? ?? 'default',
  thumbnailMode: json['thumbnail_mode'] as String? ?? 'default',
  url: json['url'] as String?,
  markdownNote: json['markdown_note'] as String?,
  readingTimeMinutes: (json['reading_time_minutes'] as num?)?.toInt(),
  language: json['language'] as String?,
  customUrl: json['custom_url'] as String?,
  thumbnailUrl: json['thumbnail_url'] as String?,
);

Map<String, dynamic> _$SharedArticleSummaryResponseToJson(
  _SharedArticleSummaryResponse instance,
) => <String, dynamic>{
  'share_id': instance.shareId,
  'share_slug': instance.shareSlug,
  'share_sid': instance.shareSid,
  'canonical_share_path': instance.canonicalSharePath,
  'article_id': instance.articleId,
  'title': instance.title,
  'source': instance.source,
  'created_at': instance.createdAt.toIso8601String(),
  'summary': instance.summary,
  'key_points': instance.keyPoints,
  'concepts': instance.concepts,
  'content_type': instance.contentType,
  'type_metadata': instance.typeMetadata,
  'sharer': instance.sharer,
  'empathy_count': instance.empathyCount,
  'viewer_has_empathy': instance.viewerHasEmpathy,
  'url_mode': instance.urlMode,
  'thumbnail_mode': instance.thumbnailMode,
  'url': instance.url,
  'markdown_note': instance.markdownNote,
  'reading_time_minutes': instance.readingTimeMinutes,
  'language': instance.language,
  'custom_url': instance.customUrl,
  'thumbnail_url': instance.thumbnailUrl,
};
