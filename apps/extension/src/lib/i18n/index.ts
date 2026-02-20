// Auto-generated translations with manual locale override support.

const translations = {
  "ko": {
    "extHeaderTitle": "NOD",
    "extHeaderSubtitle": "콘텐츠 세이버",
    "extLoginTitle": "AI 분석으로 콘텐츠를 저장하세요",
    "extLoginSubtitle": "NOD 계정에 로그인하여 시작하세요",
    "extLoginFeature1": "콘텐츠에서 핵심 인사이트 추출",
    "extLoginFeature2": "나만의 지식 라이브러리 구축",
    "extLoginFeature3": "어디서든 접근 가능",
    "extLoginButton": "NOD 로그인",
    "extLoadingAuth": "인증 확인 중...",
    "extLoadingExtract": "콘텐츠 분석 중...",
    "extSaveButton": "저장 및 분석",
    "extSaving": "저장 중...",
    "extSaveRequestSentTitle": "요약 요청 전송됨",
    "extSaveRequestSentSubtitle": "대시보드에서 진행 상황을 확인하세요",
    "extCheckDashboard": "대시보드에서 확인",
    "extAlreadySavedTitle": "이미 저장된 콘텐츠입니다",
    "extAlreadySavedSubtitle": "기존에 저장한 콘텐츠를 열어볼 수 있습니다",
    "extViewSavedArticle": "저장된 콘텐츠 보기",
    "extSaveSuccessTitle": "저장 완료!",
    "extSaveSuccessSubtitle": "AI 분석이 진행 중입니다",
    "extViewDashboard": "대시보드에서 보기",
    "extErrorTitle": "문제가 발생했습니다",
    "extRefreshHint": "문제가 계속되면 페이지를 새로고침한 뒤 다시 시도해 주세요.",
    "extTryAgain": "다시 시도",
    "extMinRead": "분 소요",
    "extLogout": "로그아웃",
    "extUsageInfo": "분석 {used}/{limit}건 사용",
    "extLimitReached": "이번 달 사용량 초과",
    "extUpgradePrompt": "Pro로 업그레이드",
    "extUsageUnlimited": "무제한 분석 (Pro)",
    "extLanguage": "언어",
    "extSummaryLanguage": "요약 언어"
  },
  "ja": {
    "extHeaderTitle": "NOD",
    "extHeaderSubtitle": "コンテンツセーバー",
    "extLoginTitle": "AI分析でコンテンツを保存",
    "extLoginSubtitle": "NODアカウントにサインインして開始",
    "extLoginFeature1": "コンテンツから主要なインサイトを抽出",
    "extLoginFeature2": "ナレッジライブラリを構築",
    "extLoginFeature3": "どこからでもアクセス可能",
    "extLoginButton": "NODにサインイン",
    "extLoadingAuth": "認証を確認中...",
    "extLoadingExtract": "コンテンツを分析中...",
    "extSaveButton": "保存して分析",
    "extSaving": "保存中...",
    "extSaveRequestSentTitle": "要約リクエスト送信済み",
    "extSaveRequestSentSubtitle": "ダッシュボードで進捗を確認してください",
    "extCheckDashboard": "ダッシュボードで確認",
    "extAlreadySavedTitle": "すでに保存済みのコンテンツです",
    "extAlreadySavedSubtitle": "保存済みのコンテンツを開いて確認できます",
    "extViewSavedArticle": "保存済みのコンテンツを見る",
    "extSaveSuccessTitle": "保存完了！",
    "extSaveSuccessSubtitle": "AI分析が進行中です",
    "extViewDashboard": "ダッシュボードで表示",
    "extErrorTitle": "問題が発生しました",
    "extRefreshHint": "問題が続く場合は、ページを再読み込みしてからもう一度お試しください。",
    "extTryAgain": "再試行",
    "extMinRead": "分",
    "extLogout": "ログアウト",
    "extUsageInfo": "分析 {used}/{limit}件使用",
    "extLimitReached": "月間上限に達しました",
    "extUpgradePrompt": "Proにアップグレード",
    "extUsageUnlimited": "無制限分析 (Pro)",
    "extLanguage": "言語",
    "extSummaryLanguage": "要約言語"
  },
  "en": {
    "extHeaderTitle": "NOD",
    "extHeaderSubtitle": "Content Saver",
    "extLoginTitle": "Save content with AI analysis",
    "extLoginSubtitle": "Sign in to your NOD account to get started",
    "extLoginFeature1": "Extract key insights from content",
    "extLoginFeature2": "Build your knowledge library",
    "extLoginFeature3": "Access from any device",
    "extLoginButton": "Sign In to NOD",
    "extLoadingAuth": "Checking authentication...",
    "extLoadingExtract": "Analyzing content...",
    "extSaveButton": "Save & Analyze",
    "extSaving": "Saving...",
    "extSaveRequestSentTitle": "Request Sent",
    "extSaveRequestSentSubtitle": "Check progress in your dashboard",
    "extCheckDashboard": "Check Dashboard",
    "extAlreadySavedTitle": "This content is already saved",
    "extAlreadySavedSubtitle": "Open the existing saved content",
    "extViewSavedArticle": "View Saved Content",
    "extSaveSuccessTitle": "Saved!",
    "extSaveSuccessSubtitle": "AI analysis in progress",
    "extViewDashboard": "View in Dashboard",
    "extErrorTitle": "Something went wrong",
    "extRefreshHint": "If this keeps happening, refresh the page and try again.",
    "extTryAgain": "Try Again",
    "extMinRead": "min read",
    "extLogout": "Logout",
    "extUsageInfo": "{used}/{limit} analyses used",
    "extLimitReached": "Monthly limit reached",
    "extUpgradePrompt": "Upgrade to Pro for more",
    "extUsageUnlimited": "Unlimited analyses (Pro)",
    "extLanguage": "Language",
    "extSummaryLanguage": "Summary Language"
  }
} as const;

export const SUPPORTED_LOCALES = ["en", "ko", "ja"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];
type TranslationKey = keyof typeof translations.en;

let _overrideLocale: Locale | null = null;

function detectLocale(): Locale {
  try {
    const lang = chrome?.i18n?.getUILanguage?.() ?? navigator.language;
    if (lang.startsWith("ko")) return "ko";
    if (lang.startsWith("ja")) return "ja";
    return "en";
  } catch {
    return "en";
  }
}

export function getCurrentLocale(): Locale {
  return _overrideLocale ?? detectLocale();
}

export function setLocale(locale: Locale): void {
  _overrideLocale = locale;
}

export function t(key: TranslationKey): string {
  const locale = getCurrentLocale();
  return translations[locale]?.[key] ?? translations.en[key];
}

export type { TranslationKey };
