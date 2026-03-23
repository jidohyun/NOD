// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, unused_import, invalid_annotation_target, unnecessary_import

import 'package:freezed_annotation/freezed_annotation.dart';

import 'shared_article_sharer_response.dart';

part 'shared_article_summary_response.freezed.dart';
part 'shared_article_summary_response.g.dart';

@Freezed()
abstract class SharedArticleSummaryResponse with _$SharedArticleSummaryResponse {
  const factory SharedArticleSummaryResponse({
    @JsonKey(name: 'share_id')
    required String shareId,
    @JsonKey(name: 'share_slug')
    required String shareSlug,
    @JsonKey(name: 'share_sid')
    required String shareSid,
    @JsonKey(name: 'canonical_share_path')
    required String canonicalSharePath,
    @JsonKey(name: 'article_id')
    required String articleId,
    required String title,
    required String source,
    @JsonKey(name: 'created_at')
    required DateTime createdAt,
    required String summary,
    @JsonKey(name: 'key_points')
    required List<String> keyPoints,
    required List<String> concepts,
    @JsonKey(name: 'content_type')
    required String contentType,
    @JsonKey(name: 'type_metadata')
    required dynamic typeMetadata,
    required SharedArticleSharerResponse sharer,
    @JsonKey(name: 'empathy_count')
    @Default(0)
    int empathyCount,
    @JsonKey(name: 'viewer_has_empathy')
    @Default(false)
    bool viewerHasEmpathy,
    @JsonKey(name: 'url_mode')
    @Default('default')
    String urlMode,
    @JsonKey(name: 'thumbnail_mode')
    @Default('default')
    String thumbnailMode,
    String? url,
    @JsonKey(name: 'markdown_note')
    String? markdownNote,
    @JsonKey(name: 'reading_time_minutes')
    int? readingTimeMinutes,
    String? language,
    @JsonKey(name: 'custom_url')
    String? customUrl,
    @JsonKey(name: 'thumbnail_url')
    String? thumbnailUrl,
  }) = _SharedArticleSummaryResponse;
  
  factory SharedArticleSummaryResponse.fromJson(Map<String, Object?> json) => _$SharedArticleSummaryResponseFromJson(json);
}
