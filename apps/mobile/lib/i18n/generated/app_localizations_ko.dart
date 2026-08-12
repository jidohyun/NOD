// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Korean (`ko`).
class AppLocalizationsKo extends AppLocalizations {
  AppLocalizationsKo([String locale = 'ko']) : super(locale);

  @override
  String get appTitle => '풀스택 스타터';

  @override
  String get loading => '로딩 중...';

  @override
  String get error => '오류가 발생했습니다';

  @override
  String get retry => '재시도';

  @override
  String get save => '저장';

  @override
  String get cancel => '취소';

  @override
  String get confirm => '확인';

  @override
  String get delete => '삭제';

  @override
  String get extHeaderTitle => 'NOD';

  @override
  String get extHeaderSubtitle => '아티클 세이버';

  @override
  String get extLoginTitle => 'AI 분석으로 아티클을 저장하세요';

  @override
  String get extLoginSubtitle => 'NOD 계정에 로그인하여 시작하세요';

  @override
  String get extLoginFeature1 => '아티클에서 핵심 인사이트 추출';

  @override
  String get extLoginFeature2 => '나만의 지식 라이브러리 구축';

  @override
  String get extLoginFeature3 => '어디서든 접근 가능';

  @override
  String get extLoginButton => 'NOD 로그인';

  @override
  String get extLoadingAuth => '인증 확인 중...';

  @override
  String get extLoadingExtract => '아티클 분석 중...';

  @override
  String get extSaveButton => '저장 및 분석';

  @override
  String get extSaving => '저장 중...';

  @override
  String get extSaveSuccessTitle => '저장 완료!';

  @override
  String get extSaveSuccessSubtitle => 'AI 분석이 진행 중입니다';

  @override
  String get extViewDashboard => '대시보드에서 보기';

  @override
  String get extErrorTitle => '문제가 발생했습니다';

  @override
  String get extTryAgain => '다시 시도';

  @override
  String get extMinRead => '분 소요';
}
