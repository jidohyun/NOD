// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Japanese (`ja`).
class AppLocalizationsJa extends AppLocalizations {
  AppLocalizationsJa([String locale = 'ja']) : super(locale);

  @override
  String get appTitle => 'フルスタックスターター';

  @override
  String get loading => '読み込み中...';

  @override
  String get error => 'エラーが発生しました';

  @override
  String get retry => '再試行';

  @override
  String get save => '保存';

  @override
  String get cancel => 'キャンセル';

  @override
  String get confirm => '確認';

  @override
  String get delete => '削除';

  @override
  String get extHeaderTitle => 'NOD';

  @override
  String get extHeaderSubtitle => '記事セーバー';

  @override
  String get extLoginTitle => 'AI分析で記事を保存';

  @override
  String get extLoginSubtitle => 'NODアカウントにサインインして開始';

  @override
  String get extLoginFeature1 => '記事から主要なインサイトを抽出';

  @override
  String get extLoginFeature2 => 'ナレッジライブラリを構築';

  @override
  String get extLoginFeature3 => 'どこからでもアクセス可能';

  @override
  String get extLoginButton => 'NODにサインイン';

  @override
  String get extLoadingAuth => '認証を確認中...';

  @override
  String get extLoadingExtract => '記事を分析中...';

  @override
  String get extSaveButton => '保存して分析';

  @override
  String get extSaving => '保存中...';

  @override
  String get extSaveSuccessTitle => '保存完了！';

  @override
  String get extSaveSuccessSubtitle => 'AI分析が進行中です';

  @override
  String get extViewDashboard => 'ダッシュボードで表示';

  @override
  String get extErrorTitle => '問題が発生しました';

  @override
  String get extTryAgain => '再試行';

  @override
  String get extMinRead => '分';
}
