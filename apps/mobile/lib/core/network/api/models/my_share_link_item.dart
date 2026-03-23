// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, unused_import, invalid_annotation_target, unnecessary_import

import 'package:freezed_annotation/freezed_annotation.dart';

part 'my_share_link_item.freezed.dart';
part 'my_share_link_item.g.dart';

@Freezed()
abstract class MyShareLinkItem with _$MyShareLinkItem {
  const factory MyShareLinkItem({
    @JsonKey(name: 'share_id')
    required String shareId,
    @JsonKey(name: 'article_id')
    required String articleId,
    @JsonKey(name: 'article_title')
    required String articleTitle,
    @JsonKey(name: 'share_slug')
    required String shareSlug,
    @JsonKey(name: 'canonical_share_url')
    required String canonicalShareUrl,
    @JsonKey(name: 'created_at')
    required DateTime createdAt,
    @JsonKey(name: 'view_count')
    @Default(0)
    int viewCount,
    @JsonKey(name: 'empathy_count')
    @Default(0)
    int empathyCount,
    @JsonKey(name: 'comment_count')
    @Default(0)
    int commentCount,
    @Default([])
    List<String> concepts,
    @JsonKey(name: 'article_url')
    String? articleUrl,
    @JsonKey(name: 'public_url')
    String? publicUrl,
    @JsonKey(name: 'summary_preview')
    String? summaryPreview,
    @JsonKey(name: 'content_type')
    String? contentType,
    @JsonKey(name: 'thumbnail_url')
    String? thumbnailUrl,
    @JsonKey(name: 'expires_at')
    DateTime? expiresAt,
  }) = _MyShareLinkItem;
  
  factory MyShareLinkItem.fromJson(Map<String, Object?> json) => _$MyShareLinkItemFromJson(json);
}
