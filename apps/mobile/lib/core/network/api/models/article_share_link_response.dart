// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, unused_import, invalid_annotation_target, unnecessary_import

import 'package:freezed_annotation/freezed_annotation.dart';

part 'article_share_link_response.freezed.dart';
part 'article_share_link_response.g.dart';

@Freezed()
abstract class ArticleShareLinkResponse with _$ArticleShareLinkResponse {
  const factory ArticleShareLinkResponse({
    @JsonKey(name: 'share_id')
    required String shareId,
    @JsonKey(name: 'share_url')
    required String shareUrl,
    @JsonKey(name: 'share_slug')
    required String shareSlug,
    @JsonKey(name: 'canonical_share_url')
    required String canonicalShareUrl,
    @JsonKey(name: 'url_mode')
    @Default('default')
    String urlMode,
    @JsonKey(name: 'thumbnail_mode')
    @Default('default')
    String thumbnailMode,
    @JsonKey(name: 'expires_at')
    DateTime? expiresAt,
    @JsonKey(name: 'custom_url')
    String? customUrl,
    @JsonKey(name: 'thumbnail_url')
    String? thumbnailUrl,
  }) = _ArticleShareLinkResponse;
  
  factory ArticleShareLinkResponse.fromJson(Map<String, Object?> json) => _$ArticleShareLinkResponseFromJson(json);
}
