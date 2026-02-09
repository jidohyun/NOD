import "./styles/globals.css";
import { useAuth } from "./hooks/useAuth";
import { useArticle } from "./hooks/useArticle";
import { useSaveArticle } from "./hooks/useSaveArticle";
import { useUsage } from "./hooks/useUsage";
import { useLocale } from "./hooks/useLocale";
import { Loading } from "./components/Loading";
import { LoginPrompt } from "./components/LoginPrompt";
import { ArticlePreview } from "./components/ArticlePreview";
import { SaveButton } from "./components/SaveButton";
import { UserMenu } from "./components/UserMenu";
import { UsageIndicator } from "./components/UsageIndicator";
import { SuccessMessage, ErrorMessage } from "./components/StatusMessage";
import { t, type Locale } from "../lib/i18n";
import type { UserInfo } from "../lib/auth";

export function App() {
  const auth = useAuth();
  const article = useArticle();
  const save = useSaveArticle();
  const { usage } = useUsage();
  const { locale, setLocale } = useLocale();

  if (auth.isLoading) {
    return (
      <Layout>
        <Loading message={t("extLoadingAuth")} />
      </Layout>
    );
  }

  if (!auth.isAuthenticated) {
    return (
      <Layout>
        <LoginPrompt />
      </Layout>
    );
  }

  if (article.isLoading) {
    return (
      <Layout user={auth.user} onLogout={auth.logout} locale={locale} onLocaleChange={setLocale}>
        <Loading message={t("extLoadingExtract")} />
      </Layout>
    );
  }

  if (save.state === "success" && save.articleId) {
    return (
      <Layout user={auth.user} onLogout={auth.logout} locale={locale} onLocaleChange={setLocale}>
        <SuccessMessage articleId={save.articleId} />
      </Layout>
    );
  }

  if (save.state === "error" && save.error) {
    return (
      <Layout user={auth.user} onLogout={auth.logout} locale={locale} onLocaleChange={setLocale}>
        <ErrorMessage
          code={save.error.code}
          message={save.error.message}
          onRetry={() => {
            save.reset();
            article.refresh();
          }}
        />
      </Layout>
    );
  }

  if (article.error) {
    return (
      <Layout user={auth.user} onLogout={auth.logout} locale={locale} onLocaleChange={setLocale}>
        <ErrorMessage
          code="EXTRACT_FAILED"
          message={article.error}
          onRetry={article.refresh}
        />
      </Layout>
    );
  }

  if (article.article) {
    const saveDisabled = save.state === "saving" || (usage !== null && !usage.can_summarize);
    return (
      <Layout user={auth.user} onLogout={auth.logout} locale={locale} onLocaleChange={setLocale}>
        <ArticlePreview article={article.article} />
        {usage && <UsageIndicator usage={usage} />}
        <SaveButton
          onClick={() => save.save(article.article!)}
          loading={save.state === "saving"}
          disabled={saveDisabled}
        />
      </Layout>
    );
  }

  return (
    <Layout user={auth.user} onLogout={auth.logout} locale={locale} onLocaleChange={setLocale}>
      <Loading />
    </Layout>
  );
}

interface LayoutProps {
  children: React.ReactNode;
  user?: UserInfo | null;
  onLogout?: () => void;
  locale?: Locale;
  onLocaleChange?: (locale: Locale) => void;
}

function Layout({ children, user, onLogout, locale, onLocaleChange }: LayoutProps) {
  return (
    <div className="flex flex-col">
      <header className="flex items-center gap-2.5 bg-black px-4 py-3">
        <div className="flex h-7 w-7 items-center justify-center rounded bg-[#E8B931] text-sm font-bold text-black">
          N
        </div>
        <span className="text-sm font-semibold tracking-wide text-white">{t("extHeaderTitle")}</span>
        <span className="text-xs text-gray-500">{t("extHeaderSubtitle")}</span>

        {user && onLogout && locale && onLocaleChange && (
          <UserMenu user={user} onLogout={onLogout} locale={locale} onLocaleChange={onLocaleChange} />
        )}
      </header>
      <main className="p-4">
        {children}
      </main>
    </div>
  );
}
