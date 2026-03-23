// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, unused_import, invalid_annotation_target, unnecessary_import

import 'package:freezed_annotation/freezed_annotation.dart';

part 'article_share_link_create.freezed.dart';
part 'article_share_link_create.g.dart';

@Freezed()
abstract class ArticleShareLinkCreate with _$ArticleShareLinkCreate {
  const factory ArticleShareLinkCreate({
    @JsonKey(name: 'custom_url')
    String? customUrl,
    @JsonKey(name: 'thumbnail_url')
    String? thumbnailUrl,
    @JsonKey(name: 'url_mode')
    @Default('default')
    String urlMode,
    @JsonKey(name: 'thumbnail_mode')
    @Default('default')
    String thumbnailMode,
  }) = _ArticleShareLinkCreate;
  
  factory ArticleShareLinkCreate.fromJson(Map<String, Object?> json) => _$ArticleShareLinkCreateFromJson(json);
}
