import 'package:flutter/material.dart';

/// {@template app_theme}
/// The theme configuration for the application.
/// {@endtemplate}
class AppTheme {
  AppTheme._();

  /// The light theme.
  static ThemeData get light => ThemeData(
    colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
  );

  /// The dark theme.
  static ThemeData get dark => ThemeData(
    colorScheme: ColorScheme.fromSeed(
      seedColor: Colors.blue,
      brightness: Brightness.dark,
    ),
  );
}
