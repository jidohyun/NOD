// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'shared_article_comment_create.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$SharedArticleCommentCreate {

 String get content;@JsonKey(name: 'parent_comment_id') String? get parentCommentId;
/// Create a copy of SharedArticleCommentCreate
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$SharedArticleCommentCreateCopyWith<SharedArticleCommentCreate> get copyWith => _$SharedArticleCommentCreateCopyWithImpl<SharedArticleCommentCreate>(this as SharedArticleCommentCreate, _$identity);

  /// Serializes this SharedArticleCommentCreate to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is SharedArticleCommentCreate&&(identical(other.content, content) || other.content == content)&&(identical(other.parentCommentId, parentCommentId) || other.parentCommentId == parentCommentId));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,content,parentCommentId);

@override
String toString() {
  return 'SharedArticleCommentCreate(content: $content, parentCommentId: $parentCommentId)';
}


}

/// @nodoc
abstract mixin class $SharedArticleCommentCreateCopyWith<$Res>  {
  factory $SharedArticleCommentCreateCopyWith(SharedArticleCommentCreate value, $Res Function(SharedArticleCommentCreate) _then) = _$SharedArticleCommentCreateCopyWithImpl;
@useResult
$Res call({
 String content,@JsonKey(name: 'parent_comment_id') String? parentCommentId
});




}
/// @nodoc
class _$SharedArticleCommentCreateCopyWithImpl<$Res>
    implements $SharedArticleCommentCreateCopyWith<$Res> {
  _$SharedArticleCommentCreateCopyWithImpl(this._self, this._then);

  final SharedArticleCommentCreate _self;
  final $Res Function(SharedArticleCommentCreate) _then;

/// Create a copy of SharedArticleCommentCreate
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? content = null,Object? parentCommentId = freezed,}) {
  return _then(_self.copyWith(
content: null == content ? _self.content : content // ignore: cast_nullable_to_non_nullable
as String,parentCommentId: freezed == parentCommentId ? _self.parentCommentId : parentCommentId // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

}


/// Adds pattern-matching-related methods to [SharedArticleCommentCreate].
extension SharedArticleCommentCreatePatterns on SharedArticleCommentCreate {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _SharedArticleCommentCreate value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _SharedArticleCommentCreate() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _SharedArticleCommentCreate value)  $default,){
final _that = this;
switch (_that) {
case _SharedArticleCommentCreate():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _SharedArticleCommentCreate value)?  $default,){
final _that = this;
switch (_that) {
case _SharedArticleCommentCreate() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String content, @JsonKey(name: 'parent_comment_id')  String? parentCommentId)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _SharedArticleCommentCreate() when $default != null:
return $default(_that.content,_that.parentCommentId);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String content, @JsonKey(name: 'parent_comment_id')  String? parentCommentId)  $default,) {final _that = this;
switch (_that) {
case _SharedArticleCommentCreate():
return $default(_that.content,_that.parentCommentId);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String content, @JsonKey(name: 'parent_comment_id')  String? parentCommentId)?  $default,) {final _that = this;
switch (_that) {
case _SharedArticleCommentCreate() when $default != null:
return $default(_that.content,_that.parentCommentId);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _SharedArticleCommentCreate implements SharedArticleCommentCreate {
  const _SharedArticleCommentCreate({required this.content, @JsonKey(name: 'parent_comment_id') this.parentCommentId});
  factory _SharedArticleCommentCreate.fromJson(Map<String, dynamic> json) => _$SharedArticleCommentCreateFromJson(json);

@override final  String content;
@override@JsonKey(name: 'parent_comment_id') final  String? parentCommentId;

/// Create a copy of SharedArticleCommentCreate
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$SharedArticleCommentCreateCopyWith<_SharedArticleCommentCreate> get copyWith => __$SharedArticleCommentCreateCopyWithImpl<_SharedArticleCommentCreate>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$SharedArticleCommentCreateToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _SharedArticleCommentCreate&&(identical(other.content, content) || other.content == content)&&(identical(other.parentCommentId, parentCommentId) || other.parentCommentId == parentCommentId));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,content,parentCommentId);

@override
String toString() {
  return 'SharedArticleCommentCreate(content: $content, parentCommentId: $parentCommentId)';
}


}

/// @nodoc
abstract mixin class _$SharedArticleCommentCreateCopyWith<$Res> implements $SharedArticleCommentCreateCopyWith<$Res> {
  factory _$SharedArticleCommentCreateCopyWith(_SharedArticleCommentCreate value, $Res Function(_SharedArticleCommentCreate) _then) = __$SharedArticleCommentCreateCopyWithImpl;
@override @useResult
$Res call({
 String content,@JsonKey(name: 'parent_comment_id') String? parentCommentId
});




}
/// @nodoc
class __$SharedArticleCommentCreateCopyWithImpl<$Res>
    implements _$SharedArticleCommentCreateCopyWith<$Res> {
  __$SharedArticleCommentCreateCopyWithImpl(this._self, this._then);

  final _SharedArticleCommentCreate _self;
  final $Res Function(_SharedArticleCommentCreate) _then;

/// Create a copy of SharedArticleCommentCreate
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? content = null,Object? parentCommentId = freezed,}) {
  return _then(_SharedArticleCommentCreate(
content: null == content ? _self.content : content // ignore: cast_nullable_to_non_nullable
as String,parentCommentId: freezed == parentCommentId ? _self.parentCommentId : parentCommentId // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}


}

// dart format on
