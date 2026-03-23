// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'shared_article_summary_response.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$SharedArticleSummaryResponse {

@JsonKey(name: 'share_id') String get shareId;@JsonKey(name: 'share_slug') String get shareSlug;@JsonKey(name: 'share_sid') String get shareSid;@JsonKey(name: 'canonical_share_path') String get canonicalSharePath;@JsonKey(name: 'article_id') String get articleId; String get title; String get source;@JsonKey(name: 'created_at') DateTime get createdAt; String get summary;@JsonKey(name: 'key_points') List<String> get keyPoints; List<String> get concepts;@JsonKey(name: 'content_type') String get contentType;@JsonKey(name: 'type_metadata') dynamic get typeMetadata; SharedArticleSharerResponse get sharer;@JsonKey(name: 'empathy_count') int get empathyCount;@JsonKey(name: 'viewer_has_empathy') bool get viewerHasEmpathy;@JsonKey(name: 'url_mode') String get urlMode;@JsonKey(name: 'thumbnail_mode') String get thumbnailMode; String? get url;@JsonKey(name: 'markdown_note') String? get markdownNote;@JsonKey(name: 'reading_time_minutes') int? get readingTimeMinutes; String? get language;@JsonKey(name: 'custom_url') String? get customUrl;@JsonKey(name: 'thumbnail_url') String? get thumbnailUrl;
/// Create a copy of SharedArticleSummaryResponse
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$SharedArticleSummaryResponseCopyWith<SharedArticleSummaryResponse> get copyWith => _$SharedArticleSummaryResponseCopyWithImpl<SharedArticleSummaryResponse>(this as SharedArticleSummaryResponse, _$identity);

  /// Serializes this SharedArticleSummaryResponse to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is SharedArticleSummaryResponse&&(identical(other.shareId, shareId) || other.shareId == shareId)&&(identical(other.shareSlug, shareSlug) || other.shareSlug == shareSlug)&&(identical(other.shareSid, shareSid) || other.shareSid == shareSid)&&(identical(other.canonicalSharePath, canonicalSharePath) || other.canonicalSharePath == canonicalSharePath)&&(identical(other.articleId, articleId) || other.articleId == articleId)&&(identical(other.title, title) || other.title == title)&&(identical(other.source, source) || other.source == source)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.summary, summary) || other.summary == summary)&&const DeepCollectionEquality().equals(other.keyPoints, keyPoints)&&const DeepCollectionEquality().equals(other.concepts, concepts)&&(identical(other.contentType, contentType) || other.contentType == contentType)&&const DeepCollectionEquality().equals(other.typeMetadata, typeMetadata)&&(identical(other.sharer, sharer) || other.sharer == sharer)&&(identical(other.empathyCount, empathyCount) || other.empathyCount == empathyCount)&&(identical(other.viewerHasEmpathy, viewerHasEmpathy) || other.viewerHasEmpathy == viewerHasEmpathy)&&(identical(other.urlMode, urlMode) || other.urlMode == urlMode)&&(identical(other.thumbnailMode, thumbnailMode) || other.thumbnailMode == thumbnailMode)&&(identical(other.url, url) || other.url == url)&&(identical(other.markdownNote, markdownNote) || other.markdownNote == markdownNote)&&(identical(other.readingTimeMinutes, readingTimeMinutes) || other.readingTimeMinutes == readingTimeMinutes)&&(identical(other.language, language) || other.language == language)&&(identical(other.customUrl, customUrl) || other.customUrl == customUrl)&&(identical(other.thumbnailUrl, thumbnailUrl) || other.thumbnailUrl == thumbnailUrl));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hashAll([runtimeType,shareId,shareSlug,shareSid,canonicalSharePath,articleId,title,source,createdAt,summary,const DeepCollectionEquality().hash(keyPoints),const DeepCollectionEquality().hash(concepts),contentType,const DeepCollectionEquality().hash(typeMetadata),sharer,empathyCount,viewerHasEmpathy,urlMode,thumbnailMode,url,markdownNote,readingTimeMinutes,language,customUrl,thumbnailUrl]);

@override
String toString() {
  return 'SharedArticleSummaryResponse(shareId: $shareId, shareSlug: $shareSlug, shareSid: $shareSid, canonicalSharePath: $canonicalSharePath, articleId: $articleId, title: $title, source: $source, createdAt: $createdAt, summary: $summary, keyPoints: $keyPoints, concepts: $concepts, contentType: $contentType, typeMetadata: $typeMetadata, sharer: $sharer, empathyCount: $empathyCount, viewerHasEmpathy: $viewerHasEmpathy, urlMode: $urlMode, thumbnailMode: $thumbnailMode, url: $url, markdownNote: $markdownNote, readingTimeMinutes: $readingTimeMinutes, language: $language, customUrl: $customUrl, thumbnailUrl: $thumbnailUrl)';
}


}

/// @nodoc
abstract mixin class $SharedArticleSummaryResponseCopyWith<$Res>  {
  factory $SharedArticleSummaryResponseCopyWith(SharedArticleSummaryResponse value, $Res Function(SharedArticleSummaryResponse) _then) = _$SharedArticleSummaryResponseCopyWithImpl;
@useResult
$Res call({
@JsonKey(name: 'share_id') String shareId,@JsonKey(name: 'share_slug') String shareSlug,@JsonKey(name: 'share_sid') String shareSid,@JsonKey(name: 'canonical_share_path') String canonicalSharePath,@JsonKey(name: 'article_id') String articleId, String title, String source,@JsonKey(name: 'created_at') DateTime createdAt, String summary,@JsonKey(name: 'key_points') List<String> keyPoints, List<String> concepts,@JsonKey(name: 'content_type') String contentType,@JsonKey(name: 'type_metadata') dynamic typeMetadata, SharedArticleSharerResponse sharer,@JsonKey(name: 'empathy_count') int empathyCount,@JsonKey(name: 'viewer_has_empathy') bool viewerHasEmpathy,@JsonKey(name: 'url_mode') String urlMode,@JsonKey(name: 'thumbnail_mode') String thumbnailMode, String? url,@JsonKey(name: 'markdown_note') String? markdownNote,@JsonKey(name: 'reading_time_minutes') int? readingTimeMinutes, String? language,@JsonKey(name: 'custom_url') String? customUrl,@JsonKey(name: 'thumbnail_url') String? thumbnailUrl
});


$SharedArticleSharerResponseCopyWith<$Res> get sharer;

}
/// @nodoc
class _$SharedArticleSummaryResponseCopyWithImpl<$Res>
    implements $SharedArticleSummaryResponseCopyWith<$Res> {
  _$SharedArticleSummaryResponseCopyWithImpl(this._self, this._then);

  final SharedArticleSummaryResponse _self;
  final $Res Function(SharedArticleSummaryResponse) _then;

/// Create a copy of SharedArticleSummaryResponse
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? shareId = null,Object? shareSlug = null,Object? shareSid = null,Object? canonicalSharePath = null,Object? articleId = null,Object? title = null,Object? source = null,Object? createdAt = null,Object? summary = null,Object? keyPoints = null,Object? concepts = null,Object? contentType = null,Object? typeMetadata = freezed,Object? sharer = null,Object? empathyCount = null,Object? viewerHasEmpathy = null,Object? urlMode = null,Object? thumbnailMode = null,Object? url = freezed,Object? markdownNote = freezed,Object? readingTimeMinutes = freezed,Object? language = freezed,Object? customUrl = freezed,Object? thumbnailUrl = freezed,}) {
  return _then(_self.copyWith(
shareId: null == shareId ? _self.shareId : shareId // ignore: cast_nullable_to_non_nullable
as String,shareSlug: null == shareSlug ? _self.shareSlug : shareSlug // ignore: cast_nullable_to_non_nullable
as String,shareSid: null == shareSid ? _self.shareSid : shareSid // ignore: cast_nullable_to_non_nullable
as String,canonicalSharePath: null == canonicalSharePath ? _self.canonicalSharePath : canonicalSharePath // ignore: cast_nullable_to_non_nullable
as String,articleId: null == articleId ? _self.articleId : articleId // ignore: cast_nullable_to_non_nullable
as String,title: null == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String,source: null == source ? _self.source : source // ignore: cast_nullable_to_non_nullable
as String,createdAt: null == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime,summary: null == summary ? _self.summary : summary // ignore: cast_nullable_to_non_nullable
as String,keyPoints: null == keyPoints ? _self.keyPoints : keyPoints // ignore: cast_nullable_to_non_nullable
as List<String>,concepts: null == concepts ? _self.concepts : concepts // ignore: cast_nullable_to_non_nullable
as List<String>,contentType: null == contentType ? _self.contentType : contentType // ignore: cast_nullable_to_non_nullable
as String,typeMetadata: freezed == typeMetadata ? _self.typeMetadata : typeMetadata // ignore: cast_nullable_to_non_nullable
as dynamic,sharer: null == sharer ? _self.sharer : sharer // ignore: cast_nullable_to_non_nullable
as SharedArticleSharerResponse,empathyCount: null == empathyCount ? _self.empathyCount : empathyCount // ignore: cast_nullable_to_non_nullable
as int,viewerHasEmpathy: null == viewerHasEmpathy ? _self.viewerHasEmpathy : viewerHasEmpathy // ignore: cast_nullable_to_non_nullable
as bool,urlMode: null == urlMode ? _self.urlMode : urlMode // ignore: cast_nullable_to_non_nullable
as String,thumbnailMode: null == thumbnailMode ? _self.thumbnailMode : thumbnailMode // ignore: cast_nullable_to_non_nullable
as String,url: freezed == url ? _self.url : url // ignore: cast_nullable_to_non_nullable
as String?,markdownNote: freezed == markdownNote ? _self.markdownNote : markdownNote // ignore: cast_nullable_to_non_nullable
as String?,readingTimeMinutes: freezed == readingTimeMinutes ? _self.readingTimeMinutes : readingTimeMinutes // ignore: cast_nullable_to_non_nullable
as int?,language: freezed == language ? _self.language : language // ignore: cast_nullable_to_non_nullable
as String?,customUrl: freezed == customUrl ? _self.customUrl : customUrl // ignore: cast_nullable_to_non_nullable
as String?,thumbnailUrl: freezed == thumbnailUrl ? _self.thumbnailUrl : thumbnailUrl // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}
/// Create a copy of SharedArticleSummaryResponse
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$SharedArticleSharerResponseCopyWith<$Res> get sharer {
  
  return $SharedArticleSharerResponseCopyWith<$Res>(_self.sharer, (value) {
    return _then(_self.copyWith(sharer: value));
  });
}
}


/// Adds pattern-matching-related methods to [SharedArticleSummaryResponse].
extension SharedArticleSummaryResponsePatterns on SharedArticleSummaryResponse {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _SharedArticleSummaryResponse value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _SharedArticleSummaryResponse() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _SharedArticleSummaryResponse value)  $default,){
final _that = this;
switch (_that) {
case _SharedArticleSummaryResponse():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _SharedArticleSummaryResponse value)?  $default,){
final _that = this;
switch (_that) {
case _SharedArticleSummaryResponse() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function(@JsonKey(name: 'share_id')  String shareId, @JsonKey(name: 'share_slug')  String shareSlug, @JsonKey(name: 'share_sid')  String shareSid, @JsonKey(name: 'canonical_share_path')  String canonicalSharePath, @JsonKey(name: 'article_id')  String articleId,  String title,  String source, @JsonKey(name: 'created_at')  DateTime createdAt,  String summary, @JsonKey(name: 'key_points')  List<String> keyPoints,  List<String> concepts, @JsonKey(name: 'content_type')  String contentType, @JsonKey(name: 'type_metadata')  dynamic typeMetadata,  SharedArticleSharerResponse sharer, @JsonKey(name: 'empathy_count')  int empathyCount, @JsonKey(name: 'viewer_has_empathy')  bool viewerHasEmpathy, @JsonKey(name: 'url_mode')  String urlMode, @JsonKey(name: 'thumbnail_mode')  String thumbnailMode,  String? url, @JsonKey(name: 'markdown_note')  String? markdownNote, @JsonKey(name: 'reading_time_minutes')  int? readingTimeMinutes,  String? language, @JsonKey(name: 'custom_url')  String? customUrl, @JsonKey(name: 'thumbnail_url')  String? thumbnailUrl)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _SharedArticleSummaryResponse() when $default != null:
return $default(_that.shareId,_that.shareSlug,_that.shareSid,_that.canonicalSharePath,_that.articleId,_that.title,_that.source,_that.createdAt,_that.summary,_that.keyPoints,_that.concepts,_that.contentType,_that.typeMetadata,_that.sharer,_that.empathyCount,_that.viewerHasEmpathy,_that.urlMode,_that.thumbnailMode,_that.url,_that.markdownNote,_that.readingTimeMinutes,_that.language,_that.customUrl,_that.thumbnailUrl);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function(@JsonKey(name: 'share_id')  String shareId, @JsonKey(name: 'share_slug')  String shareSlug, @JsonKey(name: 'share_sid')  String shareSid, @JsonKey(name: 'canonical_share_path')  String canonicalSharePath, @JsonKey(name: 'article_id')  String articleId,  String title,  String source, @JsonKey(name: 'created_at')  DateTime createdAt,  String summary, @JsonKey(name: 'key_points')  List<String> keyPoints,  List<String> concepts, @JsonKey(name: 'content_type')  String contentType, @JsonKey(name: 'type_metadata')  dynamic typeMetadata,  SharedArticleSharerResponse sharer, @JsonKey(name: 'empathy_count')  int empathyCount, @JsonKey(name: 'viewer_has_empathy')  bool viewerHasEmpathy, @JsonKey(name: 'url_mode')  String urlMode, @JsonKey(name: 'thumbnail_mode')  String thumbnailMode,  String? url, @JsonKey(name: 'markdown_note')  String? markdownNote, @JsonKey(name: 'reading_time_minutes')  int? readingTimeMinutes,  String? language, @JsonKey(name: 'custom_url')  String? customUrl, @JsonKey(name: 'thumbnail_url')  String? thumbnailUrl)  $default,) {final _that = this;
switch (_that) {
case _SharedArticleSummaryResponse():
return $default(_that.shareId,_that.shareSlug,_that.shareSid,_that.canonicalSharePath,_that.articleId,_that.title,_that.source,_that.createdAt,_that.summary,_that.keyPoints,_that.concepts,_that.contentType,_that.typeMetadata,_that.sharer,_that.empathyCount,_that.viewerHasEmpathy,_that.urlMode,_that.thumbnailMode,_that.url,_that.markdownNote,_that.readingTimeMinutes,_that.language,_that.customUrl,_that.thumbnailUrl);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function(@JsonKey(name: 'share_id')  String shareId, @JsonKey(name: 'share_slug')  String shareSlug, @JsonKey(name: 'share_sid')  String shareSid, @JsonKey(name: 'canonical_share_path')  String canonicalSharePath, @JsonKey(name: 'article_id')  String articleId,  String title,  String source, @JsonKey(name: 'created_at')  DateTime createdAt,  String summary, @JsonKey(name: 'key_points')  List<String> keyPoints,  List<String> concepts, @JsonKey(name: 'content_type')  String contentType, @JsonKey(name: 'type_metadata')  dynamic typeMetadata,  SharedArticleSharerResponse sharer, @JsonKey(name: 'empathy_count')  int empathyCount, @JsonKey(name: 'viewer_has_empathy')  bool viewerHasEmpathy, @JsonKey(name: 'url_mode')  String urlMode, @JsonKey(name: 'thumbnail_mode')  String thumbnailMode,  String? url, @JsonKey(name: 'markdown_note')  String? markdownNote, @JsonKey(name: 'reading_time_minutes')  int? readingTimeMinutes,  String? language, @JsonKey(name: 'custom_url')  String? customUrl, @JsonKey(name: 'thumbnail_url')  String? thumbnailUrl)?  $default,) {final _that = this;
switch (_that) {
case _SharedArticleSummaryResponse() when $default != null:
return $default(_that.shareId,_that.shareSlug,_that.shareSid,_that.canonicalSharePath,_that.articleId,_that.title,_that.source,_that.createdAt,_that.summary,_that.keyPoints,_that.concepts,_that.contentType,_that.typeMetadata,_that.sharer,_that.empathyCount,_that.viewerHasEmpathy,_that.urlMode,_that.thumbnailMode,_that.url,_that.markdownNote,_that.readingTimeMinutes,_that.language,_that.customUrl,_that.thumbnailUrl);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _SharedArticleSummaryResponse implements SharedArticleSummaryResponse {
  const _SharedArticleSummaryResponse({@JsonKey(name: 'share_id') required this.shareId, @JsonKey(name: 'share_slug') required this.shareSlug, @JsonKey(name: 'share_sid') required this.shareSid, @JsonKey(name: 'canonical_share_path') required this.canonicalSharePath, @JsonKey(name: 'article_id') required this.articleId, required this.title, required this.source, @JsonKey(name: 'created_at') required this.createdAt, required this.summary, @JsonKey(name: 'key_points') required final  List<String> keyPoints, required final  List<String> concepts, @JsonKey(name: 'content_type') required this.contentType, @JsonKey(name: 'type_metadata') required this.typeMetadata, required this.sharer, @JsonKey(name: 'empathy_count') this.empathyCount = 0, @JsonKey(name: 'viewer_has_empathy') this.viewerHasEmpathy = false, @JsonKey(name: 'url_mode') this.urlMode = 'default', @JsonKey(name: 'thumbnail_mode') this.thumbnailMode = 'default', this.url, @JsonKey(name: 'markdown_note') this.markdownNote, @JsonKey(name: 'reading_time_minutes') this.readingTimeMinutes, this.language, @JsonKey(name: 'custom_url') this.customUrl, @JsonKey(name: 'thumbnail_url') this.thumbnailUrl}): _keyPoints = keyPoints,_concepts = concepts;
  factory _SharedArticleSummaryResponse.fromJson(Map<String, dynamic> json) => _$SharedArticleSummaryResponseFromJson(json);

@override@JsonKey(name: 'share_id') final  String shareId;
@override@JsonKey(name: 'share_slug') final  String shareSlug;
@override@JsonKey(name: 'share_sid') final  String shareSid;
@override@JsonKey(name: 'canonical_share_path') final  String canonicalSharePath;
@override@JsonKey(name: 'article_id') final  String articleId;
@override final  String title;
@override final  String source;
@override@JsonKey(name: 'created_at') final  DateTime createdAt;
@override final  String summary;
 final  List<String> _keyPoints;
@override@JsonKey(name: 'key_points') List<String> get keyPoints {
  if (_keyPoints is EqualUnmodifiableListView) return _keyPoints;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_keyPoints);
}

 final  List<String> _concepts;
@override List<String> get concepts {
  if (_concepts is EqualUnmodifiableListView) return _concepts;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_concepts);
}

@override@JsonKey(name: 'content_type') final  String contentType;
@override@JsonKey(name: 'type_metadata') final  dynamic typeMetadata;
@override final  SharedArticleSharerResponse sharer;
@override@JsonKey(name: 'empathy_count') final  int empathyCount;
@override@JsonKey(name: 'viewer_has_empathy') final  bool viewerHasEmpathy;
@override@JsonKey(name: 'url_mode') final  String urlMode;
@override@JsonKey(name: 'thumbnail_mode') final  String thumbnailMode;
@override final  String? url;
@override@JsonKey(name: 'markdown_note') final  String? markdownNote;
@override@JsonKey(name: 'reading_time_minutes') final  int? readingTimeMinutes;
@override final  String? language;
@override@JsonKey(name: 'custom_url') final  String? customUrl;
@override@JsonKey(name: 'thumbnail_url') final  String? thumbnailUrl;

/// Create a copy of SharedArticleSummaryResponse
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$SharedArticleSummaryResponseCopyWith<_SharedArticleSummaryResponse> get copyWith => __$SharedArticleSummaryResponseCopyWithImpl<_SharedArticleSummaryResponse>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$SharedArticleSummaryResponseToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _SharedArticleSummaryResponse&&(identical(other.shareId, shareId) || other.shareId == shareId)&&(identical(other.shareSlug, shareSlug) || other.shareSlug == shareSlug)&&(identical(other.shareSid, shareSid) || other.shareSid == shareSid)&&(identical(other.canonicalSharePath, canonicalSharePath) || other.canonicalSharePath == canonicalSharePath)&&(identical(other.articleId, articleId) || other.articleId == articleId)&&(identical(other.title, title) || other.title == title)&&(identical(other.source, source) || other.source == source)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.summary, summary) || other.summary == summary)&&const DeepCollectionEquality().equals(other._keyPoints, _keyPoints)&&const DeepCollectionEquality().equals(other._concepts, _concepts)&&(identical(other.contentType, contentType) || other.contentType == contentType)&&const DeepCollectionEquality().equals(other.typeMetadata, typeMetadata)&&(identical(other.sharer, sharer) || other.sharer == sharer)&&(identical(other.empathyCount, empathyCount) || other.empathyCount == empathyCount)&&(identical(other.viewerHasEmpathy, viewerHasEmpathy) || other.viewerHasEmpathy == viewerHasEmpathy)&&(identical(other.urlMode, urlMode) || other.urlMode == urlMode)&&(identical(other.thumbnailMode, thumbnailMode) || other.thumbnailMode == thumbnailMode)&&(identical(other.url, url) || other.url == url)&&(identical(other.markdownNote, markdownNote) || other.markdownNote == markdownNote)&&(identical(other.readingTimeMinutes, readingTimeMinutes) || other.readingTimeMinutes == readingTimeMinutes)&&(identical(other.language, language) || other.language == language)&&(identical(other.customUrl, customUrl) || other.customUrl == customUrl)&&(identical(other.thumbnailUrl, thumbnailUrl) || other.thumbnailUrl == thumbnailUrl));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hashAll([runtimeType,shareId,shareSlug,shareSid,canonicalSharePath,articleId,title,source,createdAt,summary,const DeepCollectionEquality().hash(_keyPoints),const DeepCollectionEquality().hash(_concepts),contentType,const DeepCollectionEquality().hash(typeMetadata),sharer,empathyCount,viewerHasEmpathy,urlMode,thumbnailMode,url,markdownNote,readingTimeMinutes,language,customUrl,thumbnailUrl]);

@override
String toString() {
  return 'SharedArticleSummaryResponse(shareId: $shareId, shareSlug: $shareSlug, shareSid: $shareSid, canonicalSharePath: $canonicalSharePath, articleId: $articleId, title: $title, source: $source, createdAt: $createdAt, summary: $summary, keyPoints: $keyPoints, concepts: $concepts, contentType: $contentType, typeMetadata: $typeMetadata, sharer: $sharer, empathyCount: $empathyCount, viewerHasEmpathy: $viewerHasEmpathy, urlMode: $urlMode, thumbnailMode: $thumbnailMode, url: $url, markdownNote: $markdownNote, readingTimeMinutes: $readingTimeMinutes, language: $language, customUrl: $customUrl, thumbnailUrl: $thumbnailUrl)';
}


}

/// @nodoc
abstract mixin class _$SharedArticleSummaryResponseCopyWith<$Res> implements $SharedArticleSummaryResponseCopyWith<$Res> {
  factory _$SharedArticleSummaryResponseCopyWith(_SharedArticleSummaryResponse value, $Res Function(_SharedArticleSummaryResponse) _then) = __$SharedArticleSummaryResponseCopyWithImpl;
@override @useResult
$Res call({
@JsonKey(name: 'share_id') String shareId,@JsonKey(name: 'share_slug') String shareSlug,@JsonKey(name: 'share_sid') String shareSid,@JsonKey(name: 'canonical_share_path') String canonicalSharePath,@JsonKey(name: 'article_id') String articleId, String title, String source,@JsonKey(name: 'created_at') DateTime createdAt, String summary,@JsonKey(name: 'key_points') List<String> keyPoints, List<String> concepts,@JsonKey(name: 'content_type') String contentType,@JsonKey(name: 'type_metadata') dynamic typeMetadata, SharedArticleSharerResponse sharer,@JsonKey(name: 'empathy_count') int empathyCount,@JsonKey(name: 'viewer_has_empathy') bool viewerHasEmpathy,@JsonKey(name: 'url_mode') String urlMode,@JsonKey(name: 'thumbnail_mode') String thumbnailMode, String? url,@JsonKey(name: 'markdown_note') String? markdownNote,@JsonKey(name: 'reading_time_minutes') int? readingTimeMinutes, String? language,@JsonKey(name: 'custom_url') String? customUrl,@JsonKey(name: 'thumbnail_url') String? thumbnailUrl
});


@override $SharedArticleSharerResponseCopyWith<$Res> get sharer;

}
/// @nodoc
class __$SharedArticleSummaryResponseCopyWithImpl<$Res>
    implements _$SharedArticleSummaryResponseCopyWith<$Res> {
  __$SharedArticleSummaryResponseCopyWithImpl(this._self, this._then);

  final _SharedArticleSummaryResponse _self;
  final $Res Function(_SharedArticleSummaryResponse) _then;

/// Create a copy of SharedArticleSummaryResponse
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? shareId = null,Object? shareSlug = null,Object? shareSid = null,Object? canonicalSharePath = null,Object? articleId = null,Object? title = null,Object? source = null,Object? createdAt = null,Object? summary = null,Object? keyPoints = null,Object? concepts = null,Object? contentType = null,Object? typeMetadata = freezed,Object? sharer = null,Object? empathyCount = null,Object? viewerHasEmpathy = null,Object? urlMode = null,Object? thumbnailMode = null,Object? url = freezed,Object? markdownNote = freezed,Object? readingTimeMinutes = freezed,Object? language = freezed,Object? customUrl = freezed,Object? thumbnailUrl = freezed,}) {
  return _then(_SharedArticleSummaryResponse(
shareId: null == shareId ? _self.shareId : shareId // ignore: cast_nullable_to_non_nullable
as String,shareSlug: null == shareSlug ? _self.shareSlug : shareSlug // ignore: cast_nullable_to_non_nullable
as String,shareSid: null == shareSid ? _self.shareSid : shareSid // ignore: cast_nullable_to_non_nullable
as String,canonicalSharePath: null == canonicalSharePath ? _self.canonicalSharePath : canonicalSharePath // ignore: cast_nullable_to_non_nullable
as String,articleId: null == articleId ? _self.articleId : articleId // ignore: cast_nullable_to_non_nullable
as String,title: null == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String,source: null == source ? _self.source : source // ignore: cast_nullable_to_non_nullable
as String,createdAt: null == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime,summary: null == summary ? _self.summary : summary // ignore: cast_nullable_to_non_nullable
as String,keyPoints: null == keyPoints ? _self._keyPoints : keyPoints // ignore: cast_nullable_to_non_nullable
as List<String>,concepts: null == concepts ? _self._concepts : concepts // ignore: cast_nullable_to_non_nullable
as List<String>,contentType: null == contentType ? _self.contentType : contentType // ignore: cast_nullable_to_non_nullable
as String,typeMetadata: freezed == typeMetadata ? _self.typeMetadata : typeMetadata // ignore: cast_nullable_to_non_nullable
as dynamic,sharer: null == sharer ? _self.sharer : sharer // ignore: cast_nullable_to_non_nullable
as SharedArticleSharerResponse,empathyCount: null == empathyCount ? _self.empathyCount : empathyCount // ignore: cast_nullable_to_non_nullable
as int,viewerHasEmpathy: null == viewerHasEmpathy ? _self.viewerHasEmpathy : viewerHasEmpathy // ignore: cast_nullable_to_non_nullable
as bool,urlMode: null == urlMode ? _self.urlMode : urlMode // ignore: cast_nullable_to_non_nullable
as String,thumbnailMode: null == thumbnailMode ? _self.thumbnailMode : thumbnailMode // ignore: cast_nullable_to_non_nullable
as String,url: freezed == url ? _self.url : url // ignore: cast_nullable_to_non_nullable
as String?,markdownNote: freezed == markdownNote ? _self.markdownNote : markdownNote // ignore: cast_nullable_to_non_nullable
as String?,readingTimeMinutes: freezed == readingTimeMinutes ? _self.readingTimeMinutes : readingTimeMinutes // ignore: cast_nullable_to_non_nullable
as int?,language: freezed == language ? _self.language : language // ignore: cast_nullable_to_non_nullable
as String?,customUrl: freezed == customUrl ? _self.customUrl : customUrl // ignore: cast_nullable_to_non_nullable
as String?,thumbnailUrl: freezed == thumbnailUrl ? _self.thumbnailUrl : thumbnailUrl // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

/// Create a copy of SharedArticleSummaryResponse
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$SharedArticleSharerResponseCopyWith<$Res> get sharer {
  
  return $SharedArticleSharerResponseCopyWith<$Res>(_self.sharer, (value) {
    return _then(_self.copyWith(sharer: value));
  });
}
}

// dart format on
