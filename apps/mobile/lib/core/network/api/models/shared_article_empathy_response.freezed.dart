// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'shared_article_empathy_response.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$SharedArticleEmpathyResponse {

@JsonKey(name: 'empathy_count') int get empathyCount;@JsonKey(name: 'viewer_has_empathy') bool get viewerHasEmpathy;
/// Create a copy of SharedArticleEmpathyResponse
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$SharedArticleEmpathyResponseCopyWith<SharedArticleEmpathyResponse> get copyWith => _$SharedArticleEmpathyResponseCopyWithImpl<SharedArticleEmpathyResponse>(this as SharedArticleEmpathyResponse, _$identity);

  /// Serializes this SharedArticleEmpathyResponse to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is SharedArticleEmpathyResponse&&(identical(other.empathyCount, empathyCount) || other.empathyCount == empathyCount)&&(identical(other.viewerHasEmpathy, viewerHasEmpathy) || other.viewerHasEmpathy == viewerHasEmpathy));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,empathyCount,viewerHasEmpathy);

@override
String toString() {
  return 'SharedArticleEmpathyResponse(empathyCount: $empathyCount, viewerHasEmpathy: $viewerHasEmpathy)';
}


}

/// @nodoc
abstract mixin class $SharedArticleEmpathyResponseCopyWith<$Res>  {
  factory $SharedArticleEmpathyResponseCopyWith(SharedArticleEmpathyResponse value, $Res Function(SharedArticleEmpathyResponse) _then) = _$SharedArticleEmpathyResponseCopyWithImpl;
@useResult
$Res call({
@JsonKey(name: 'empathy_count') int empathyCount,@JsonKey(name: 'viewer_has_empathy') bool viewerHasEmpathy
});




}
/// @nodoc
class _$SharedArticleEmpathyResponseCopyWithImpl<$Res>
    implements $SharedArticleEmpathyResponseCopyWith<$Res> {
  _$SharedArticleEmpathyResponseCopyWithImpl(this._self, this._then);

  final SharedArticleEmpathyResponse _self;
  final $Res Function(SharedArticleEmpathyResponse) _then;

/// Create a copy of SharedArticleEmpathyResponse
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? empathyCount = null,Object? viewerHasEmpathy = null,}) {
  return _then(_self.copyWith(
empathyCount: null == empathyCount ? _self.empathyCount : empathyCount // ignore: cast_nullable_to_non_nullable
as int,viewerHasEmpathy: null == viewerHasEmpathy ? _self.viewerHasEmpathy : viewerHasEmpathy // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}

}


/// Adds pattern-matching-related methods to [SharedArticleEmpathyResponse].
extension SharedArticleEmpathyResponsePatterns on SharedArticleEmpathyResponse {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _SharedArticleEmpathyResponse value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _SharedArticleEmpathyResponse() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _SharedArticleEmpathyResponse value)  $default,){
final _that = this;
switch (_that) {
case _SharedArticleEmpathyResponse():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _SharedArticleEmpathyResponse value)?  $default,){
final _that = this;
switch (_that) {
case _SharedArticleEmpathyResponse() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function(@JsonKey(name: 'empathy_count')  int empathyCount, @JsonKey(name: 'viewer_has_empathy')  bool viewerHasEmpathy)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _SharedArticleEmpathyResponse() when $default != null:
return $default(_that.empathyCount,_that.viewerHasEmpathy);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function(@JsonKey(name: 'empathy_count')  int empathyCount, @JsonKey(name: 'viewer_has_empathy')  bool viewerHasEmpathy)  $default,) {final _that = this;
switch (_that) {
case _SharedArticleEmpathyResponse():
return $default(_that.empathyCount,_that.viewerHasEmpathy);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function(@JsonKey(name: 'empathy_count')  int empathyCount, @JsonKey(name: 'viewer_has_empathy')  bool viewerHasEmpathy)?  $default,) {final _that = this;
switch (_that) {
case _SharedArticleEmpathyResponse() when $default != null:
return $default(_that.empathyCount,_that.viewerHasEmpathy);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _SharedArticleEmpathyResponse implements SharedArticleEmpathyResponse {
  const _SharedArticleEmpathyResponse({@JsonKey(name: 'empathy_count') required this.empathyCount, @JsonKey(name: 'viewer_has_empathy') required this.viewerHasEmpathy});
  factory _SharedArticleEmpathyResponse.fromJson(Map<String, dynamic> json) => _$SharedArticleEmpathyResponseFromJson(json);

@override@JsonKey(name: 'empathy_count') final  int empathyCount;
@override@JsonKey(name: 'viewer_has_empathy') final  bool viewerHasEmpathy;

/// Create a copy of SharedArticleEmpathyResponse
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$SharedArticleEmpathyResponseCopyWith<_SharedArticleEmpathyResponse> get copyWith => __$SharedArticleEmpathyResponseCopyWithImpl<_SharedArticleEmpathyResponse>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$SharedArticleEmpathyResponseToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _SharedArticleEmpathyResponse&&(identical(other.empathyCount, empathyCount) || other.empathyCount == empathyCount)&&(identical(other.viewerHasEmpathy, viewerHasEmpathy) || other.viewerHasEmpathy == viewerHasEmpathy));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,empathyCount,viewerHasEmpathy);

@override
String toString() {
  return 'SharedArticleEmpathyResponse(empathyCount: $empathyCount, viewerHasEmpathy: $viewerHasEmpathy)';
}


}

/// @nodoc
abstract mixin class _$SharedArticleEmpathyResponseCopyWith<$Res> implements $SharedArticleEmpathyResponseCopyWith<$Res> {
  factory _$SharedArticleEmpathyResponseCopyWith(_SharedArticleEmpathyResponse value, $Res Function(_SharedArticleEmpathyResponse) _then) = __$SharedArticleEmpathyResponseCopyWithImpl;
@override @useResult
$Res call({
@JsonKey(name: 'empathy_count') int empathyCount,@JsonKey(name: 'viewer_has_empathy') bool viewerHasEmpathy
});




}
/// @nodoc
class __$SharedArticleEmpathyResponseCopyWithImpl<$Res>
    implements _$SharedArticleEmpathyResponseCopyWith<$Res> {
  __$SharedArticleEmpathyResponseCopyWithImpl(this._self, this._then);

  final _SharedArticleEmpathyResponse _self;
  final $Res Function(_SharedArticleEmpathyResponse) _then;

/// Create a copy of SharedArticleEmpathyResponse
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? empathyCount = null,Object? viewerHasEmpathy = null,}) {
  return _then(_SharedArticleEmpathyResponse(
empathyCount: null == empathyCount ? _self.empathyCount : empathyCount // ignore: cast_nullable_to_non_nullable
as int,viewerHasEmpathy: null == viewerHasEmpathy ? _self.viewerHasEmpathy : viewerHasEmpathy // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}


}

// dart format on
