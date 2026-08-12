// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get appTitle => 'Fullstack Starter';

  @override
  String get loading => 'Loading...';

  @override
  String get error => 'An error occurred';

  @override
  String get retry => 'Retry';

  @override
  String get save => 'Save';

  @override
  String get cancel => 'Cancel';

  @override
  String get confirm => 'Confirm';

  @override
  String get delete => 'Delete';

  @override
  String get extHeaderTitle => 'NOD';

  @override
  String get extHeaderSubtitle => 'Article Saver';

  @override
  String get extLoginTitle => 'Save articles with AI analysis';

  @override
  String get extLoginSubtitle => 'Sign in to your NOD account to get started';

  @override
  String get extLoginFeature1 => 'Extract key insights from articles';

  @override
  String get extLoginFeature2 => 'Build your knowledge library';

  @override
  String get extLoginFeature3 => 'Access from any device';

  @override
  String get extLoginButton => 'Sign In to NOD';

  @override
  String get extLoadingAuth => 'Checking authentication...';

  @override
  String get extLoadingExtract => 'Analyzing article...';

  @override
  String get extSaveButton => 'Save & Analyze';

  @override
  String get extSaving => 'Saving...';

  @override
  String get extSaveSuccessTitle => 'Saved!';

  @override
  String get extSaveSuccessSubtitle => 'AI analysis in progress';

  @override
  String get extViewDashboard => 'View in Dashboard';

  @override
  String get extErrorTitle => 'Something went wrong';

  @override
  String get extTryAgain => 'Try Again';

  @override
  String get extMinRead => 'min read';
}
