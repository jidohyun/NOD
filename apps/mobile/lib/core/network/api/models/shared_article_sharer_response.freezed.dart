// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'shared_article_sharer_response.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$SharedArticleSharerResponse {

 String? get name; String? get image;
/// Create a copy of SharedArticleSharerResponse
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$SharedArticleSharerResponseCopyWith<SharedArticleSharerResponse> get copyWith => _$SharedArticleSharerResponseCopyWithImpl<SharedArticleSharerResponse>(this as SharedArticleSharerResponse, _$identity);

  /// Serializes this SharedArticleSharerResponse to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is SharedArticleSharerResponse&&(identical(other.name, name) || other.name == name)&&(identical(other.image, image) || other.image == image));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,name,image);

@override
String toString() {
  return 'SharedArticleSharerResponse(name: $name, image: $image)';
}


}

/// @nodoc
abstract mixin class $SharedArticleSharerResponseCopyWith<$Res>  {
  factory $SharedArticleSharerResponseCopyWith(SharedArticleSharerResponse value, $Res Function(SharedArticleSharerResponse) _then) = _$SharedArticleSharerResponseCopyWithImpl;
@useResult
$Res call({
 String? name, String? image
});




}
/// @nodoc
class _$SharedArticleSharerResponseCopyWithImpl<$Res>
    implements $SharedArticleSharerResponseCopyWith<$Res> {
  _$SharedArticleSharerResponseCopyWithImpl(this._self, this._then);

  final SharedArticleSharerResponse _self;
  final $Res Function(SharedArticleSharerResponse) _then;

/// Create a copy of SharedArticleSharerResponse
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? name = freezed,Object? image = freezed,}) {
  return _then(_self.copyWith(
name: freezed == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String?,image: freezed == image ? _self.image : image // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

}


/// Adds pattern-matching-related methods to [SharedArticleSharerResponse].
extension SharedArticleSharerResponsePatterns on SharedArticleSharerResponse {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _SharedArticleSharerResponse value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _SharedArticleSharerResponse() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _SharedArticleSharerResponse value)  $default,){
final _that = this;
switch (_that) {
case _SharedArticleSharerResponse():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _SharedArticleSharerResponse value)?  $default,){
final _that = this;
switch (_that) {
case _SharedArticleSharerResponse() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String? name,  String? image)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _SharedArticleSharerResponse() when $default != null:
return $default(_that.name,_that.image);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String? name,  String? image)  $default,) {final _that = this;
switch (_that) {
case _SharedArticleSharerResponse():
return $default(_that.name,_that.image);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String? name,  String? image)?  $default,) {final _that = this;
switch (_that) {
case _SharedArticleSharerResponse() when $default != null:
return $default(_that.name,_that.image);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _SharedArticleSharerResponse implements SharedArticleSharerResponse {
  const _SharedArticleSharerResponse({this.name, this.image});
  factory _SharedArticleSharerResponse.fromJson(Map<String, dynamic> json) => _$SharedArticleSharerResponseFromJson(json);

@override final  String? name;
@override final  String? image;

/// Create a copy of SharedArticleSharerResponse
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$SharedArticleSharerResponseCopyWith<_SharedArticleSharerResponse> get copyWith => __$SharedArticleSharerResponseCopyWithImpl<_SharedArticleSharerResponse>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$SharedArticleSharerResponseToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _SharedArticleSharerResponse&&(identical(other.name, name) || other.name == name)&&(identical(other.image, image) || other.image == image));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,name,image);

@override
String toString() {
  return 'SharedArticleSharerResponse(name: $name, image: $image)';
}


}

/// @nodoc
abstract mixin class _$SharedArticleSharerResponseCopyWith<$Res> implements $SharedArticleSharerResponseCopyWith<$Res> {
  factory _$SharedArticleSharerResponseCopyWith(_SharedArticleSharerResponse value, $Res Function(_SharedArticleSharerResponse) _then) = __$SharedArticleSharerResponseCopyWithImpl;
@override @useResult
$Res call({
 String? name, String? image
});




}
/// @nodoc
class __$SharedArticleSharerResponseCopyWithImpl<$Res>
    implements _$SharedArticleSharerResponseCopyWith<$Res> {
  __$SharedArticleSharerResponseCopyWithImpl(this._self, this._then);

  final _SharedArticleSharerResponse _self;
  final $Res Function(_SharedArticleSharerResponse) _then;

/// Create a copy of SharedArticleSharerResponse
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? name = freezed,Object? image = freezed,}) {
  return _then(_SharedArticleSharerResponse(
name: freezed == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String?,image: freezed == image ? _self.image : image // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}


}

// dart format on
