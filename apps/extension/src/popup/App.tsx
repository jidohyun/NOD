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
import { UsageIndicator } from "./components/UsageIndicator";
import { SuccessMessage, ErrorMessage } from "./components/StatusMessage";
import { PopupLayout } from "./components/PopupLayout";
import { t } from "../lib/i18n";

export function App() {
  const auth = useAuth();
  const article = useArticle();
  const save = useSaveArticle();
  const { usage } = useUsage();
  const { locale, setLocale } = useLocale();

  if (auth.isLoading) {
    return (
      <PopupLayout>
        <Loading message={t("extLoadingAuth")} />
      </PopupLayout>
    );
  }

  if (!auth.isAuthenticated) {
    return (
      <PopupLayout>
        <LoginPrompt />
      </PopupLayout>
    );
  }

  if (article.isLoading) {
    return (
      <PopupLayout user={auth.user} onLogout={auth.logout} locale={locale} onLocaleChange={setLocale}>
        <Loading message={t("extLoadingExtract")} />
      </PopupLayout>
    );
  }

  if (save.state === "success" && save.articleId) {
    return (
      <PopupLayout user={auth.user} onLogout={auth.logout} locale={locale} onLocaleChange={setLocale}>
        <SuccessMessage articleId={save.articleId} />
      </PopupLayout>
    );
  }

  if (save.state === "error" && save.error) {
    return (
      <PopupLayout user={auth.user} onLogout={auth.logout} locale={locale} onLocaleChange={setLocale}>
        <ErrorMessage
          code={save.error.code}
          message={save.error.message}
          onRetry={() => {
            save.reset();
            article.refresh();
          }}
        />
      </PopupLayout>
    );
  }

  if (article.error) {
    return (
      <PopupLayout user={auth.user} onLogout={auth.logout} locale={locale} onLocaleChange={setLocale}>
        <ErrorMessage
          code="EXTRACT_FAILED"
          message={article.error}
          onRetry={article.refresh}
        />
      </PopupLayout>
    );
  }

  if (article.article) {
    const saveDisabled = save.state === "saving" || (usage !== null && !usage.can_summarize);
    return (
      <PopupLayout user={auth.user} onLogout={auth.logout} locale={locale} onLocaleChange={setLocale}>
        <ArticlePreview article={article.article} />
        {usage && <UsageIndicator usage={usage} />}
        <SaveButton
          onClick={() => save.save(article.article!)}
          loading={save.state === "saving"}
          disabled={saveDisabled}
        />
      </PopupLayout>
    );
  }

  return (
    <PopupLayout user={auth.user} onLogout={auth.logout} locale={locale} onLocaleChange={setLocale}>
      <Loading />
    </PopupLayout>
  );
}
