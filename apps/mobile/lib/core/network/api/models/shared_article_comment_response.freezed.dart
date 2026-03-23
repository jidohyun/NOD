// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'shared_article_comment_response.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$SharedArticleCommentResponse {

 String get id;@JsonKey(name: 'author_name') String get authorName; String get content;@JsonKey(name: 'created_at') DateTime get createdAt;@JsonKey(name: 'empathy_count') int get empathyCount;@JsonKey(name: 'viewer_has_empathy') bool get viewerHasEmpathy;@JsonKey(name: 'author_image') String? get authorImage;@JsonKey(name: 'author_user_id') String? get authorUserId;@JsonKey(name: 'parent_comment_id') String? get parentCommentId; List<SharedArticleCommentResponse>? get replies;
/// Create a copy of SharedArticleCommentResponse
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$SharedArticleCommentResponseCopyWith<SharedArticleCommentResponse> get copyWith => _$SharedArticleCommentResponseCopyWithImpl<SharedArticleCommentResponse>(this as SharedArticleCommentResponse, _$identity);

  /// Serializes this SharedArticleCommentResponse to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is SharedArticleCommentResponse&&(identical(other.id, id) || other.id == id)&&(identical(other.authorName, authorName) || other.authorName == authorName)&&(identical(other.content, content) || other.content == content)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.empathyCount, empathyCount) || other.empathyCount == empathyCount)&&(identical(other.viewerHasEmpathy, viewerHasEmpathy) || other.viewerHasEmpathy == viewerHasEmpathy)&&(identical(other.authorImage, authorImage) || other.authorImage == authorImage)&&(identical(other.authorUserId, authorUserId) || other.authorUserId == authorUserId)&&(identical(other.parentCommentId, parentCommentId) || other.parentCommentId == parentCommentId)&&const DeepCollectionEquality().equals(other.replies, replies));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,authorName,content,createdAt,empathyCount,viewerHasEmpathy,authorImage,authorUserId,parentCommentId,const DeepCollectionEquality().hash(replies));

@override
String toString() {
  return 'SharedArticleCommentResponse(id: $id, authorName: $authorName, content: $content, createdAt: $createdAt, empathyCount: $empathyCount, viewerHasEmpathy: $viewerHasEmpathy, authorImage: $authorImage, authorUserId: $authorUserId, parentCommentId: $parentCommentId, replies: $replies)';
}


}

/// @nodoc
abstract mixin class $SharedArticleCommentResponseCopyWith<$Res>  {
  factory $SharedArticleCommentResponseCopyWith(SharedArticleCommentResponse value, $Res Function(SharedArticleCommentResponse) _then) = _$SharedArticleCommentResponseCopyWithImpl;
@useResult
$Res call({
 String id,@JsonKey(name: 'author_name') String authorName, String content,@JsonKey(name: 'created_at') DateTime createdAt,@JsonKey(name: 'empathy_count') int empathyCount,@JsonKey(name: 'viewer_has_empathy') bool viewerHasEmpathy,@JsonKey(name: 'author_image') String? authorImage,@JsonKey(name: 'author_user_id') String? authorUserId,@JsonKey(name: 'parent_comment_id') String? parentCommentId, List<SharedArticleCommentResponse>? replies
});




}
/// @nodoc
class _$SharedArticleCommentResponseCopyWithImpl<$Res>
    implements $SharedArticleCommentResponseCopyWith<$Res> {
  _$SharedArticleCommentResponseCopyWithImpl(this._self, this._then);

  final SharedArticleCommentResponse _self;
  final $Res Function(SharedArticleCommentResponse) _then;

/// Create a copy of SharedArticleCommentResponse
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? authorName = null,Object? content = null,Object? createdAt = null,Object? empathyCount = null,Object? viewerHasEmpathy = null,Object? authorImage = freezed,Object? authorUserId = freezed,Object? parentCommentId = freezed,Object? replies = freezed,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,authorName: null == authorName ? _self.authorName : authorName // ignore: cast_nullable_to_non_nullable
as String,content: null == content ? _self.content : content // ignore: cast_nullable_to_non_nullable
as String,createdAt: null == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime,empathyCount: null == empathyCount ? _self.empathyCount : empathyCount // ignore: cast_nullable_to_non_nullable
as int,viewerHasEmpathy: null == viewerHasEmpathy ? _self.viewerHasEmpathy : viewerHasEmpathy // ignore: cast_nullable_to_non_nullable
as bool,authorImage: freezed == authorImage ? _self.authorImage : authorImage // ignore: cast_nullable_to_non_nullable
as String?,authorUserId: freezed == authorUserId ? _self.authorUserId : authorUserId // ignore: cast_nullable_to_non_nullable
as String?,parentCommentId: freezed == parentCommentId ? _self.parentCommentId : parentCommentId // ignore: cast_nullable_to_non_nullable
as String?,replies: freezed == replies ? _self.replies : replies // ignore: cast_nullable_to_non_nullable
as List<SharedArticleCommentResponse>?,
  ));
}

}


/// Adds pattern-matching-related methods to [SharedArticleCommentResponse].
extension SharedArticleCommentResponsePatterns on SharedArticleCommentResponse {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _SharedArticleCommentResponse value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _SharedArticleCommentResponse() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _SharedArticleCommentResponse value)  $default,){
final _that = this;
switch (_that) {
case _SharedArticleCommentResponse():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _SharedArticleCommentResponse value)?  $default,){
final _that = this;
switch (_that) {
case _SharedArticleCommentResponse() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id, @JsonKey(name: 'author_name')  String authorName,  String content, @JsonKey(name: 'created_at')  DateTime createdAt, @JsonKey(name: 'empathy_count')  int empathyCount, @JsonKey(name: 'viewer_has_empathy')  bool viewerHasEmpathy, @JsonKey(name: 'author_image')  String? authorImage, @JsonKey(name: 'author_user_id')  String? authorUserId, @JsonKey(name: 'parent_comment_id')  String? parentCommentId,  List<SharedArticleCommentResponse>? replies)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _SharedArticleCommentResponse() when $default != null:
return $default(_that.id,_that.authorName,_that.content,_that.createdAt,_that.empathyCount,_that.viewerHasEmpathy,_that.authorImage,_that.authorUserId,_that.parentCommentId,_that.replies);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id, @JsonKey(name: 'author_name')  String authorName,  String content, @JsonKey(name: 'created_at')  DateTime createdAt, @JsonKey(name: 'empathy_count')  int empathyCount, @JsonKey(name: 'viewer_has_empathy')  bool viewerHasEmpathy, @JsonKey(name: 'author_image')  String? authorImage, @JsonKey(name: 'author_user_id')  String? authorUserId, @JsonKey(name: 'parent_comment_id')  String? parentCommentId,  List<SharedArticleCommentResponse>? replies)  $default,) {final _that = this;
switch (_that) {
case _SharedArticleCommentResponse():
return $default(_that.id,_that.authorName,_that.content,_that.createdAt,_that.empathyCount,_that.viewerHasEmpathy,_that.authorImage,_that.authorUserId,_that.parentCommentId,_that.replies);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id, @JsonKey(name: 'author_name')  String authorName,  String content, @JsonKey(name: 'created_at')  DateTime createdAt, @JsonKey(name: 'empathy_count')  int empathyCount, @JsonKey(name: 'viewer_has_empathy')  bool viewerHasEmpathy, @JsonKey(name: 'author_image')  String? authorImage, @JsonKey(name: 'author_user_id')  String? authorUserId, @JsonKey(name: 'parent_comment_id')  String? parentCommentId,  List<SharedArticleCommentResponse>? replies)?  $default,) {final _that = this;
switch (_that) {
case _SharedArticleCommentResponse() when $default != null:
return $default(_that.id,_that.authorName,_that.content,_that.createdAt,_that.empathyCount,_that.viewerHasEmpathy,_that.authorImage,_that.authorUserId,_that.parentCommentId,_that.replies);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _SharedArticleCommentResponse implements SharedArticleCommentResponse {
  const _SharedArticleCommentResponse({required this.id, @JsonKey(name: 'author_name') required this.authorName, required this.content, @JsonKey(name: 'created_at') required this.createdAt, @JsonKey(name: 'empathy_count') this.empathyCount = 0, @JsonKey(name: 'viewer_has_empathy') this.viewerHasEmpathy = false, @JsonKey(name: 'author_image') this.authorImage, @JsonKey(name: 'author_user_id') this.authorUserId, @JsonKey(name: 'parent_comment_id') this.parentCommentId, final  List<SharedArticleCommentResponse>? replies}): _replies = replies;
  factory _SharedArticleCommentResponse.fromJson(Map<String, dynamic> json) => _$SharedArticleCommentResponseFromJson(json);

@override final  String id;
@override@JsonKey(name: 'author_name') final  String authorName;
@override final  String content;
@override@JsonKey(name: 'created_at') final  DateTime createdAt;
@override@JsonKey(name: 'empathy_count') final  int empathyCount;
@override@JsonKey(name: 'viewer_has_empathy') final  bool viewerHasEmpathy;
@override@JsonKey(name: 'author_image') final  String? authorImage;
@override@JsonKey(name: 'author_user_id') final  String? authorUserId;
@override@JsonKey(name: 'parent_comment_id') final  String? parentCommentId;
 final  List<SharedArticleCommentResponse>? _replies;
@override List<SharedArticleCommentResponse>? get replies {
  final value = _replies;
  if (value == null) return null;
  if (_replies is EqualUnmodifiableListView) return _replies;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(value);
}


/// Create a copy of SharedArticleCommentResponse
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$SharedArticleCommentResponseCopyWith<_SharedArticleCommentResponse> get copyWith => __$SharedArticleCommentResponseCopyWithImpl<_SharedArticleCommentResponse>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$SharedArticleCommentResponseToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _SharedArticleCommentResponse&&(identical(other.id, id) || other.id == id)&&(identical(other.authorName, authorName) || other.authorName == authorName)&&(identical(other.content, content) || other.content == content)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.empathyCount, empathyCount) || other.empathyCount == empathyCount)&&(identical(other.viewerHasEmpathy, viewerHasEmpathy) || other.viewerHasEmpathy == viewerHasEmpathy)&&(identical(other.authorImage, authorImage) || other.authorImage == authorImage)&&(identical(other.authorUserId, authorUserId) || other.authorUserId == authorUserId)&&(identical(other.parentCommentId, parentCommentId) || other.parentCommentId == parentCommentId)&&const DeepCollectionEquality().equals(other._replies, _replies));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,authorName,content,createdAt,empathyCount,viewerHasEmpathy,authorImage,authorUserId,parentCommentId,const DeepCollectionEquality().hash(_replies));

@override
String toString() {
  return 'SharedArticleCommentResponse(id: $id, authorName: $authorName, content: $content, createdAt: $createdAt, empathyCount: $empathyCount, viewerHasEmpathy: $viewerHasEmpathy, authorImage: $authorImage, authorUserId: $authorUserId, parentCommentId: $parentCommentId, replies: $replies)';
}


}

/// @nodoc
abstract mixin class _$SharedArticleCommentResponseCopyWith<$Res> implements $SharedArticleCommentResponseCopyWith<$Res> {
  factory _$SharedArticleCommentResponseCopyWith(_SharedArticleCommentResponse value, $Res Function(_SharedArticleCommentResponse) _then) = __$SharedArticleCommentResponseCopyWithImpl;
@override @useResult
$Res call({
 String id,@JsonKey(name: 'author_name') String authorName, String content,@JsonKey(name: 'created_at') DateTime createdAt,@JsonKey(name: 'empathy_count') int empathyCount,@JsonKey(name: 'viewer_has_empathy') bool viewerHasEmpathy,@JsonKey(name: 'author_image') String? authorImage,@JsonKey(name: 'author_user_id') String? authorUserId,@JsonKey(name: 'parent_comment_id') String? parentCommentId, List<SharedArticleCommentResponse>? replies
});




}
/// @nodoc
class __$SharedArticleCommentResponseCopyWithImpl<$Res>
    implements _$SharedArticleCommentResponseCopyWith<$Res> {
  __$SharedArticleCommentResponseCopyWithImpl(this._self, this._then);

  final _SharedArticleCommentResponse _self;
  final $Res Function(_SharedArticleCommentResponse) _then;

/// Create a copy of SharedArticleCommentResponse
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? authorName = null,Object? content = null,Object? createdAt = null,Object? empathyCount = null,Object? viewerHasEmpathy = null,Object? authorImage = freezed,Object? authorUserId = freezed,Object? parentCommentId = freezed,Object? replies = freezed,}) {
  return _then(_SharedArticleCommentResponse(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,authorName: null == authorName ? _self.authorName : authorName // ignore: cast_nullable_to_non_nullable
as String,content: null == content ? _self.content : content // ignore: cast_nullable_to_non_nullable
as String,createdAt: null == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime,empathyCount: null == empathyCount ? _self.empathyCount : empathyCount // ignore: cast_nullable_to_non_nullable
as int,viewerHasEmpathy: null == viewerHasEmpathy ? _self.viewerHasEmpathy : viewerHasEmpathy // ignore: cast_nullable_to_non_nullable
as bool,authorImage: freezed == authorImage ? _self.authorImage : authorImage // ignore: cast_nullable_to_non_nullable
as String?,authorUserId: freezed == authorUserId ? _self.authorUserId : authorUserId // ignore: cast_nullable_to_non_nullable
as String?,parentCommentId: freezed == parentCommentId ? _self.parentCommentId : parentCommentId // ignore: cast_nullable_to_non_nullable
as String?,replies: freezed == replies ? _self._replies : replies // ignore: cast_nullable_to_non_nullable
as List<SharedArticleCommentResponse>?,
  ));
}


}

// dart format on
