// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'article_share_link_create.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$ArticleShareLinkCreate {

@JsonKey(name: 'custom_url') String? get customUrl;@JsonKey(name: 'thumbnail_url') String? get thumbnailUrl;@JsonKey(name: 'url_mode') String get urlMode;@JsonKey(name: 'thumbnail_mode') String get thumbnailMode;
/// Create a copy of ArticleShareLinkCreate
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ArticleShareLinkCreateCopyWith<ArticleShareLinkCreate> get copyWith => _$ArticleShareLinkCreateCopyWithImpl<ArticleShareLinkCreate>(this as ArticleShareLinkCreate, _$identity);

  /// Serializes this ArticleShareLinkCreate to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ArticleShareLinkCreate&&(identical(other.customUrl, customUrl) || other.customUrl == customUrl)&&(identical(other.thumbnailUrl, thumbnailUrl) || other.thumbnailUrl == thumbnailUrl)&&(identical(other.urlMode, urlMode) || other.urlMode == urlMode)&&(identical(other.thumbnailMode, thumbnailMode) || other.thumbnailMode == thumbnailMode));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,customUrl,thumbnailUrl,urlMode,thumbnailMode);

@override
String toString() {
  return 'ArticleShareLinkCreate(customUrl: $customUrl, thumbnailUrl: $thumbnailUrl, urlMode: $urlMode, thumbnailMode: $thumbnailMode)';
}


}

/// @nodoc
abstract mixin class $ArticleShareLinkCreateCopyWith<$Res>  {
  factory $ArticleShareLinkCreateCopyWith(ArticleShareLinkCreate value, $Res Function(ArticleShareLinkCreate) _then) = _$ArticleShareLinkCreateCopyWithImpl;
@useResult
$Res call({
@JsonKey(name: 'custom_url') String? customUrl,@JsonKey(name: 'thumbnail_url') String? thumbnailUrl,@JsonKey(name: 'url_mode') String urlMode,@JsonKey(name: 'thumbnail_mode') String thumbnailMode
});




}
/// @nodoc
class _$ArticleShareLinkCreateCopyWithImpl<$Res>
    implements $ArticleShareLinkCreateCopyWith<$Res> {
  _$ArticleShareLinkCreateCopyWithImpl(this._self, this._then);

  final ArticleShareLinkCreate _self;
  final $Res Function(ArticleShareLinkCreate) _then;

/// Create a copy of ArticleShareLinkCreate
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? customUrl = freezed,Object? thumbnailUrl = freezed,Object? urlMode = null,Object? thumbnailMode = null,}) {
  return _then(_self.copyWith(
customUrl: freezed == customUrl ? _self.customUrl : customUrl // ignore: cast_nullable_to_non_nullable
as String?,thumbnailUrl: freezed == thumbnailUrl ? _self.thumbnailUrl : thumbnailUrl // ignore: cast_nullable_to_non_nullable
as String?,urlMode: null == urlMode ? _self.urlMode : urlMode // ignore: cast_nullable_to_non_nullable
as String,thumbnailMode: null == thumbnailMode ? _self.thumbnailMode : thumbnailMode // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

}


/// Adds pattern-matching-related methods to [ArticleShareLinkCreate].
extension ArticleShareLinkCreatePatterns on ArticleShareLinkCreate {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ArticleShareLinkCreate value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ArticleShareLinkCreate() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ArticleShareLinkCreate value)  $default,){
final _that = this;
switch (_that) {
case _ArticleShareLinkCreate():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ArticleShareLinkCreate value)?  $default,){
final _that = this;
switch (_that) {
case _ArticleShareLinkCreate() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function(@JsonKey(name: 'custom_url')  String? customUrl, @JsonKey(name: 'thumbnail_url')  String? thumbnailUrl, @JsonKey(name: 'url_mode')  String urlMode, @JsonKey(name: 'thumbnail_mode')  String thumbnailMode)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ArticleShareLinkCreate() when $default != null:
return $default(_that.customUrl,_that.thumbnailUrl,_that.urlMode,_that.thumbnailMode);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function(@JsonKey(name: 'custom_url')  String? customUrl, @JsonKey(name: 'thumbnail_url')  String? thumbnailUrl, @JsonKey(name: 'url_mode')  String urlMode, @JsonKey(name: 'thumbnail_mode')  String thumbnailMode)  $default,) {final _that = this;
switch (_that) {
case _ArticleShareLinkCreate():
return $default(_that.customUrl,_that.thumbnailUrl,_that.urlMode,_that.thumbnailMode);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function(@JsonKey(name: 'custom_url')  String? customUrl, @JsonKey(name: 'thumbnail_url')  String? thumbnailUrl, @JsonKey(name: 'url_mode')  String urlMode, @JsonKey(name: 'thumbnail_mode')  String thumbnailMode)?  $default,) {final _that = this;
switch (_that) {
case _ArticleShareLinkCreate() when $default != null:
return $default(_that.customUrl,_that.thumbnailUrl,_that.urlMode,_that.thumbnailMode);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _ArticleShareLinkCreate implements ArticleShareLinkCreate {
  const _ArticleShareLinkCreate({@JsonKey(name: 'custom_url') this.customUrl, @JsonKey(name: 'thumbnail_url') this.thumbnailUrl, @JsonKey(name: 'url_mode') this.urlMode = 'default', @JsonKey(name: 'thumbnail_mode') this.thumbnailMode = 'default'});
  factory _ArticleShareLinkCreate.fromJson(Map<String, dynamic> json) => _$ArticleShareLinkCreateFromJson(json);

@override@JsonKey(name: 'custom_url') final  String? customUrl;
@override@JsonKey(name: 'thumbnail_url') final  String? thumbnailUrl;
@override@JsonKey(name: 'url_mode') final  String urlMode;
@override@JsonKey(name: 'thumbnail_mode') final  String thumbnailMode;

/// Create a copy of ArticleShareLinkCreate
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ArticleShareLinkCreateCopyWith<_ArticleShareLinkCreate> get copyWith => __$ArticleShareLinkCreateCopyWithImpl<_ArticleShareLinkCreate>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ArticleShareLinkCreateToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _ArticleShareLinkCreate&&(identical(other.customUrl, customUrl) || other.customUrl == customUrl)&&(identical(other.thumbnailUrl, thumbnailUrl) || other.thumbnailUrl == thumbnailUrl)&&(identical(other.urlMode, urlMode) || other.urlMode == urlMode)&&(identical(other.thumbnailMode, thumbnailMode) || other.thumbnailMode == thumbnailMode));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,customUrl,thumbnailUrl,urlMode,thumbnailMode);

@override
String toString() {
  return 'ArticleShareLinkCreate(customUrl: $customUrl, thumbnailUrl: $thumbnailUrl, urlMode: $urlMode, thumbnailMode: $thumbnailMode)';
}


}

/// @nodoc
abstract mixin class _$ArticleShareLinkCreateCopyWith<$Res> implements $ArticleShareLinkCreateCopyWith<$Res> {
  factory _$ArticleShareLinkCreateCopyWith(_ArticleShareLinkCreate value, $Res Function(_ArticleShareLinkCreate) _then) = __$ArticleShareLinkCreateCopyWithImpl;
@override @useResult
$Res call({
@JsonKey(name: 'custom_url') String? customUrl,@JsonKey(name: 'thumbnail_url') String? thumbnailUrl,@JsonKey(name: 'url_mode') String urlMode,@JsonKey(name: 'thumbnail_mode') String thumbnailMode
});




}
/// @nodoc
class __$ArticleShareLinkCreateCopyWithImpl<$Res>
    implements _$ArticleShareLinkCreateCopyWith<$Res> {
  __$ArticleShareLinkCreateCopyWithImpl(this._self, this._then);

  final _ArticleShareLinkCreate _self;
  final $Res Function(_ArticleShareLinkCreate) _then;

/// Create a copy of ArticleShareLinkCreate
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? customUrl = freezed,Object? thumbnailUrl = freezed,Object? urlMode = null,Object? thumbnailMode = null,}) {
  return _then(_ArticleShareLinkCreate(
customUrl: freezed == customUrl ? _self.customUrl : customUrl // ignore: cast_nullable_to_non_nullable
as String?,thumbnailUrl: freezed == thumbnailUrl ? _self.thumbnailUrl : thumbnailUrl // ignore: cast_nullable_to_non_nullable
as String?,urlMode: null == urlMode ? _self.urlMode : urlMode // ignore: cast_nullable_to_non_nullable
as String,thumbnailMode: null == thumbnailMode ? _self.thumbnailMode : thumbnailMode // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}

// dart format on
