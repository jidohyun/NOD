// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'article_share_link_response.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$ArticleShareLinkResponse {

@JsonKey(name: 'share_id') String get shareId;@JsonKey(name: 'share_url') String get shareUrl;@JsonKey(name: 'share_slug') String get shareSlug;@JsonKey(name: 'canonical_share_url') String get canonicalShareUrl;@JsonKey(name: 'url_mode') String get urlMode;@JsonKey(name: 'thumbnail_mode') String get thumbnailMode;@JsonKey(name: 'expires_at') DateTime? get expiresAt;@JsonKey(name: 'custom_url') String? get customUrl;@JsonKey(name: 'thumbnail_url') String? get thumbnailUrl;
/// Create a copy of ArticleShareLinkResponse
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ArticleShareLinkResponseCopyWith<ArticleShareLinkResponse> get copyWith => _$ArticleShareLinkResponseCopyWithImpl<ArticleShareLinkResponse>(this as ArticleShareLinkResponse, _$identity);

  /// Serializes this ArticleShareLinkResponse to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ArticleShareLinkResponse&&(identical(other.shareId, shareId) || other.shareId == shareId)&&(identical(other.shareUrl, shareUrl) || other.shareUrl == shareUrl)&&(identical(other.shareSlug, shareSlug) || other.shareSlug == shareSlug)&&(identical(other.canonicalShareUrl, canonicalShareUrl) || other.canonicalShareUrl == canonicalShareUrl)&&(identical(other.urlMode, urlMode) || other.urlMode == urlMode)&&(identical(other.thumbnailMode, thumbnailMode) || other.thumbnailMode == thumbnailMode)&&(identical(other.expiresAt, expiresAt) || other.expiresAt == expiresAt)&&(identical(other.customUrl, customUrl) || other.customUrl == customUrl)&&(identical(other.thumbnailUrl, thumbnailUrl) || other.thumbnailUrl == thumbnailUrl));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,shareId,shareUrl,shareSlug,canonicalShareUrl,urlMode,thumbnailMode,expiresAt,customUrl,thumbnailUrl);

@override
String toString() {
  return 'ArticleShareLinkResponse(shareId: $shareId, shareUrl: $shareUrl, shareSlug: $shareSlug, canonicalShareUrl: $canonicalShareUrl, urlMode: $urlMode, thumbnailMode: $thumbnailMode, expiresAt: $expiresAt, customUrl: $customUrl, thumbnailUrl: $thumbnailUrl)';
}


}

/// @nodoc
abstract mixin class $ArticleShareLinkResponseCopyWith<$Res>  {
  factory $ArticleShareLinkResponseCopyWith(ArticleShareLinkResponse value, $Res Function(ArticleShareLinkResponse) _then) = _$ArticleShareLinkResponseCopyWithImpl;
@useResult
$Res call({
@JsonKey(name: 'share_id') String shareId,@JsonKey(name: 'share_url') String shareUrl,@JsonKey(name: 'share_slug') String shareSlug,@JsonKey(name: 'canonical_share_url') String canonicalShareUrl,@JsonKey(name: 'url_mode') String urlMode,@JsonKey(name: 'thumbnail_mode') String thumbnailMode,@JsonKey(name: 'expires_at') DateTime? expiresAt,@JsonKey(name: 'custom_url') String? customUrl,@JsonKey(name: 'thumbnail_url') String? thumbnailUrl
});




}
/// @nodoc
class _$ArticleShareLinkResponseCopyWithImpl<$Res>
    implements $ArticleShareLinkResponseCopyWith<$Res> {
  _$ArticleShareLinkResponseCopyWithImpl(this._self, this._then);

  final ArticleShareLinkResponse _self;
  final $Res Function(ArticleShareLinkResponse) _then;

/// Create a copy of ArticleShareLinkResponse
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? shareId = null,Object? shareUrl = null,Object? shareSlug = null,Object? canonicalShareUrl = null,Object? urlMode = null,Object? thumbnailMode = null,Object? expiresAt = freezed,Object? customUrl = freezed,Object? thumbnailUrl = freezed,}) {
  return _then(_self.copyWith(
shareId: null == shareId ? _self.shareId : shareId // ignore: cast_nullable_to_non_nullable
as String,shareUrl: null == shareUrl ? _self.shareUrl : shareUrl // ignore: cast_nullable_to_non_nullable
as String,shareSlug: null == shareSlug ? _self.shareSlug : shareSlug // ignore: cast_nullable_to_non_nullable
as String,canonicalShareUrl: null == canonicalShareUrl ? _self.canonicalShareUrl : canonicalShareUrl // ignore: cast_nullable_to_non_nullable
as String,urlMode: null == urlMode ? _self.urlMode : urlMode // ignore: cast_nullable_to_non_nullable
as String,thumbnailMode: null == thumbnailMode ? _self.thumbnailMode : thumbnailMode // ignore: cast_nullable_to_non_nullable
as String,expiresAt: freezed == expiresAt ? _self.expiresAt : expiresAt // ignore: cast_nullable_to_non_nullable
as DateTime?,customUrl: freezed == customUrl ? _self.customUrl : customUrl // ignore: cast_nullable_to_non_nullable
as String?,thumbnailUrl: freezed == thumbnailUrl ? _self.thumbnailUrl : thumbnailUrl // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

}


/// Adds pattern-matching-related methods to [ArticleShareLinkResponse].
extension ArticleShareLinkResponsePatterns on ArticleShareLinkResponse {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ArticleShareLinkResponse value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ArticleShareLinkResponse() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ArticleShareLinkResponse value)  $default,){
final _that = this;
switch (_that) {
case _ArticleShareLinkResponse():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ArticleShareLinkResponse value)?  $default,){
final _that = this;
switch (_that) {
case _ArticleShareLinkResponse() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function(@JsonKey(name: 'share_id')  String shareId, @JsonKey(name: 'share_url')  String shareUrl, @JsonKey(name: 'share_slug')  String shareSlug, @JsonKey(name: 'canonical_share_url')  String canonicalShareUrl, @JsonKey(name: 'url_mode')  String urlMode, @JsonKey(name: 'thumbnail_mode')  String thumbnailMode, @JsonKey(name: 'expires_at')  DateTime? expiresAt, @JsonKey(name: 'custom_url')  String? customUrl, @JsonKey(name: 'thumbnail_url')  String? thumbnailUrl)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ArticleShareLinkResponse() when $default != null:
return $default(_that.shareId,_that.shareUrl,_that.shareSlug,_that.canonicalShareUrl,_that.urlMode,_that.thumbnailMode,_that.expiresAt,_that.customUrl,_that.thumbnailUrl);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function(@JsonKey(name: 'share_id')  String shareId, @JsonKey(name: 'share_url')  String shareUrl, @JsonKey(name: 'share_slug')  String shareSlug, @JsonKey(name: 'canonical_share_url')  String canonicalShareUrl, @JsonKey(name: 'url_mode')  String urlMode, @JsonKey(name: 'thumbnail_mode')  String thumbnailMode, @JsonKey(name: 'expires_at')  DateTime? expiresAt, @JsonKey(name: 'custom_url')  String? customUrl, @JsonKey(name: 'thumbnail_url')  String? thumbnailUrl)  $default,) {final _that = this;
switch (_that) {
case _ArticleShareLinkResponse():
return $default(_that.shareId,_that.shareUrl,_that.shareSlug,_that.canonicalShareUrl,_that.urlMode,_that.thumbnailMode,_that.expiresAt,_that.customUrl,_that.thumbnailUrl);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function(@JsonKey(name: 'share_id')  String shareId, @JsonKey(name: 'share_url')  String shareUrl, @JsonKey(name: 'share_slug')  String shareSlug, @JsonKey(name: 'canonical_share_url')  String canonicalShareUrl, @JsonKey(name: 'url_mode')  String urlMode, @JsonKey(name: 'thumbnail_mode')  String thumbnailMode, @JsonKey(name: 'expires_at')  DateTime? expiresAt, @JsonKey(name: 'custom_url')  String? customUrl, @JsonKey(name: 'thumbnail_url')  String? thumbnailUrl)?  $default,) {final _that = this;
switch (_that) {
case _ArticleShareLinkResponse() when $default != null:
return $default(_that.shareId,_that.shareUrl,_that.shareSlug,_that.canonicalShareUrl,_that.urlMode,_that.thumbnailMode,_that.expiresAt,_that.customUrl,_that.thumbnailUrl);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _ArticleShareLinkResponse implements ArticleShareLinkResponse {
  const _ArticleShareLinkResponse({@JsonKey(name: 'share_id') required this.shareId, @JsonKey(name: 'share_url') required this.shareUrl, @JsonKey(name: 'share_slug') required this.shareSlug, @JsonKey(name: 'canonical_share_url') required this.canonicalShareUrl, @JsonKey(name: 'url_mode') this.urlMode = 'default', @JsonKey(name: 'thumbnail_mode') this.thumbnailMode = 'default', @JsonKey(name: 'expires_at') this.expiresAt, @JsonKey(name: 'custom_url') this.customUrl, @JsonKey(name: 'thumbnail_url') this.thumbnailUrl});
  factory _ArticleShareLinkResponse.fromJson(Map<String, dynamic> json) => _$ArticleShareLinkResponseFromJson(json);

@override@JsonKey(name: 'share_id') final  String shareId;
@override@JsonKey(name: 'share_url') final  String shareUrl;
@override@JsonKey(name: 'share_slug') final  String shareSlug;
@override@JsonKey(name: 'canonical_share_url') final  String canonicalShareUrl;
@override@JsonKey(name: 'url_mode') final  String urlMode;
@override@JsonKey(name: 'thumbnail_mode') final  String thumbnailMode;
@override@JsonKey(name: 'expires_at') final  DateTime? expiresAt;
@override@JsonKey(name: 'custom_url') final  String? customUrl;
@override@JsonKey(name: 'thumbnail_url') final  String? thumbnailUrl;

/// Create a copy of ArticleShareLinkResponse
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ArticleShareLinkResponseCopyWith<_ArticleShareLinkResponse> get copyWith => __$ArticleShareLinkResponseCopyWithImpl<_ArticleShareLinkResponse>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ArticleShareLinkResponseToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _ArticleShareLinkResponse&&(identical(other.shareId, shareId) || other.shareId == shareId)&&(identical(other.shareUrl, shareUrl) || other.shareUrl == shareUrl)&&(identical(other.shareSlug, shareSlug) || other.shareSlug == shareSlug)&&(identical(other.canonicalShareUrl, canonicalShareUrl) || other.canonicalShareUrl == canonicalShareUrl)&&(identical(other.urlMode, urlMode) || other.urlMode == urlMode)&&(identical(other.thumbnailMode, thumbnailMode) || other.thumbnailMode == thumbnailMode)&&(identical(other.expiresAt, expiresAt) || other.expiresAt == expiresAt)&&(identical(other.customUrl, customUrl) || other.customUrl == customUrl)&&(identical(other.thumbnailUrl, thumbnailUrl) || other.thumbnailUrl == thumbnailUrl));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,shareId,shareUrl,shareSlug,canonicalShareUrl,urlMode,thumbnailMode,expiresAt,customUrl,thumbnailUrl);

@override
String toString() {
  return 'ArticleShareLinkResponse(shareId: $shareId, shareUrl: $shareUrl, shareSlug: $shareSlug, canonicalShareUrl: $canonicalShareUrl, urlMode: $urlMode, thumbnailMode: $thumbnailMode, expiresAt: $expiresAt, customUrl: $customUrl, thumbnailUrl: $thumbnailUrl)';
}


}

/// @nodoc
abstract mixin class _$ArticleShareLinkResponseCopyWith<$Res> implements $ArticleShareLinkResponseCopyWith<$Res> {
  factory _$ArticleShareLinkResponseCopyWith(_ArticleShareLinkResponse value, $Res Function(_ArticleShareLinkResponse) _then) = __$ArticleShareLinkResponseCopyWithImpl;
@override @useResult
$Res call({
@JsonKey(name: 'share_id') String shareId,@JsonKey(name: 'share_url') String shareUrl,@JsonKey(name: 'share_slug') String shareSlug,@JsonKey(name: 'canonical_share_url') String canonicalShareUrl,@JsonKey(name: 'url_mode') String urlMode,@JsonKey(name: 'thumbnail_mode') String thumbnailMode,@JsonKey(name: 'expires_at') DateTime? expiresAt,@JsonKey(name: 'custom_url') String? customUrl,@JsonKey(name: 'thumbnail_url') String? thumbnailUrl
});




}
/// @nodoc
class __$ArticleShareLinkResponseCopyWithImpl<$Res>
    implements _$ArticleShareLinkResponseCopyWith<$Res> {
  __$ArticleShareLinkResponseCopyWithImpl(this._self, this._then);

  final _ArticleShareLinkResponse _self;
  final $Res Function(_ArticleShareLinkResponse) _then;

/// Create a copy of ArticleShareLinkResponse
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? shareId = null,Object? shareUrl = null,Object? shareSlug = null,Object? canonicalShareUrl = null,Object? urlMode = null,Object? thumbnailMode = null,Object? expiresAt = freezed,Object? customUrl = freezed,Object? thumbnailUrl = freezed,}) {
  return _then(_ArticleShareLinkResponse(
shareId: null == shareId ? _self.shareId : shareId // ignore: cast_nullable_to_non_nullable
as String,shareUrl: null == shareUrl ? _self.shareUrl : shareUrl // ignore: cast_nullable_to_non_nullable
as String,shareSlug: null == shareSlug ? _self.shareSlug : shareSlug // ignore: cast_nullable_to_non_nullable
as String,canonicalShareUrl: null == canonicalShareUrl ? _self.canonicalShareUrl : canonicalShareUrl // ignore: cast_nullable_to_non_nullable
as String,urlMode: null == urlMode ? _self.urlMode : urlMode // ignore: cast_nullable_to_non_nullable
as String,thumbnailMode: null == thumbnailMode ? _self.thumbnailMode : thumbnailMode // ignore: cast_nullable_to_non_nullable
as String,expiresAt: freezed == expiresAt ? _self.expiresAt : expiresAt // ignore: cast_nullable_to_non_nullable
as DateTime?,customUrl: freezed == customUrl ? _self.customUrl : customUrl // ignore: cast_nullable_to_non_nullable
as String?,thumbnailUrl: freezed == thumbnailUrl ? _self.thumbnailUrl : thumbnailUrl // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}


}

// dart format on
