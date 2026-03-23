// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'shared_article_comment_update.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$SharedArticleCommentUpdate {

 String get content;
/// Create a copy of SharedArticleCommentUpdate
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$SharedArticleCommentUpdateCopyWith<SharedArticleCommentUpdate> get copyWith => _$SharedArticleCommentUpdateCopyWithImpl<SharedArticleCommentUpdate>(this as SharedArticleCommentUpdate, _$identity);

  /// Serializes this SharedArticleCommentUpdate to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is SharedArticleCommentUpdate&&(identical(other.content, content) || other.content == content));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,content);

@override
String toString() {
  return 'SharedArticleCommentUpdate(content: $content)';
}


}

/// @nodoc
abstract mixin class $SharedArticleCommentUpdateCopyWith<$Res>  {
  factory $SharedArticleCommentUpdateCopyWith(SharedArticleCommentUpdate value, $Res Function(SharedArticleCommentUpdate) _then) = _$SharedArticleCommentUpdateCopyWithImpl;
@useResult
$Res call({
 String content
});




}
/// @nodoc
class _$SharedArticleCommentUpdateCopyWithImpl<$Res>
    implements $SharedArticleCommentUpdateCopyWith<$Res> {
  _$SharedArticleCommentUpdateCopyWithImpl(this._self, this._then);

  final SharedArticleCommentUpdate _self;
  final $Res Function(SharedArticleCommentUpdate) _then;

/// Create a copy of SharedArticleCommentUpdate
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? content = null,}) {
  return _then(_self.copyWith(
content: null == content ? _self.content : content // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

}


/// Adds pattern-matching-related methods to [SharedArticleCommentUpdate].
extension SharedArticleCommentUpdatePatterns on SharedArticleCommentUpdate {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _SharedArticleCommentUpdate value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _SharedArticleCommentUpdate() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _SharedArticleCommentUpdate value)  $default,){
final _that = this;
switch (_that) {
case _SharedArticleCommentUpdate():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _SharedArticleCommentUpdate value)?  $default,){
final _that = this;
switch (_that) {
case _SharedArticleCommentUpdate() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String content)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _SharedArticleCommentUpdate() when $default != null:
return $default(_that.content);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String content)  $default,) {final _that = this;
switch (_that) {
case _SharedArticleCommentUpdate():
return $default(_that.content);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String content)?  $default,) {final _that = this;
switch (_that) {
case _SharedArticleCommentUpdate() when $default != null:
return $default(_that.content);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _SharedArticleCommentUpdate implements SharedArticleCommentUpdate {
  const _SharedArticleCommentUpdate({required this.content});
  factory _SharedArticleCommentUpdate.fromJson(Map<String, dynamic> json) => _$SharedArticleCommentUpdateFromJson(json);

@override final  String content;

/// Create a copy of SharedArticleCommentUpdate
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$SharedArticleCommentUpdateCopyWith<_SharedArticleCommentUpdate> get copyWith => __$SharedArticleCommentUpdateCopyWithImpl<_SharedArticleCommentUpdate>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$SharedArticleCommentUpdateToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _SharedArticleCommentUpdate&&(identical(other.content, content) || other.content == content));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,content);

@override
String toString() {
  return 'SharedArticleCommentUpdate(content: $content)';
}


}

/// @nodoc
abstract mixin class _$SharedArticleCommentUpdateCopyWith<$Res> implements $SharedArticleCommentUpdateCopyWith<$Res> {
  factory _$SharedArticleCommentUpdateCopyWith(_SharedArticleCommentUpdate value, $Res Function(_SharedArticleCommentUpdate) _then) = __$SharedArticleCommentUpdateCopyWithImpl;
@override @useResult
$Res call({
 String content
});




}
/// @nodoc
class __$SharedArticleCommentUpdateCopyWithImpl<$Res>
    implements _$SharedArticleCommentUpdateCopyWith<$Res> {
  __$SharedArticleCommentUpdateCopyWithImpl(this._self, this._then);

  final _SharedArticleCommentUpdate _self;
  final $Res Function(_SharedArticleCommentUpdate) _then;

/// Create a copy of SharedArticleCommentUpdate
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? content = null,}) {
  return _then(_SharedArticleCommentUpdate(
content: null == content ? _self.content : content // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}

// dart format on
