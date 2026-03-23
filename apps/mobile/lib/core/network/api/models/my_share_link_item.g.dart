// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'my_share_link_item.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_MyShareLinkItem _$MyShareLinkItemFromJson(Map<String, dynamic> json) =>
    _MyShareLinkItem(
      shareId: json['share_id'] as String,
      articleId: json['article_id'] as String,
      articleTitle: json['article_title'] as String,
      shareSlug: json['share_slug'] as String,
      canonicalShareUrl: json['canonical_share_url'] as String,
      createdAt: DateTime.parse(json['created_at'] as String),
      viewCount: (json['view_count'] as num?)?.toInt() ?? 0,
      empathyCount: (json['empathy_count'] as num?)?.toInt() ?? 0,
      commentCount: (json['comment_count'] as num?)?.toInt() ?? 0,
      concepts:
          (json['concepts'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          const [],
      articleUrl: json['article_url'] as String?,
      publicUrl: json['public_url'] as String?,
      summaryPreview: json['summary_preview'] as String?,
      contentType: json['content_type'] as String?,
      thumbnailUrl: json['thumbnail_url'] as String?,
      expiresAt: json['expires_at'] == null
          ? null
          : DateTime.parse(json['expires_at'] as String),
    );

Map<String, dynamic> _$MyShareLinkItemToJson(_MyShareLinkItem instance) =>
    <String, dynamic>{
      'share_id': instance.shareId,
      'article_id': instance.articleId,
      'article_title': instance.articleTitle,
      'share_slug': instance.shareSlug,
      'canonical_share_url': instance.canonicalShareUrl,
      'created_at': instance.createdAt.toIso8601String(),
      'view_count': instance.viewCount,
      'empathy_count': instance.empathyCount,
      'comment_count': instance.commentCount,
      'concepts': instance.concepts,
      'article_url': instance.articleUrl,
      'public_url': instance.publicUrl,
      'summary_preview': instance.summaryPreview,
      'content_type': instance.contentType,
      'thumbnail_url': instance.thumbnailUrl,
      'expires_at': instance.expiresAt?.toIso8601String(),
    };
