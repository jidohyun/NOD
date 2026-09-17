(() => {
  "use strict";

  const app = document.querySelector("#app");
  const state = {
    user: null,
    articles: [],
    nextCursor: null,
    query: "",
    loading: false,
    searchController: null,
  };

  function element(tag, options = {}, children = []) {
    const node = document.createElement(tag);
    if (options.className) node.className = options.className;
    if (options.text !== undefined) node.textContent = options.text;
    if (options.type) node.type = options.type;
    if (options.href) node.href = options.href;
    if (options.target) node.target = options.target;
    if (options.rel) node.rel = options.rel;
    if (options.id) node.id = options.id;
    if (options.role) node.setAttribute("role", options.role);
    if (options.ariaLabel) node.setAttribute("aria-label", options.ariaLabel);
    if (options.ariaLive) node.setAttribute("aria-live", options.ariaLive);
    if (options.disabled) node.disabled = true;
    if (options.value !== undefined) node.value = options.value;
    if (options.name) node.name = options.name;
    if (options.autocomplete) node.autocomplete = options.autocomplete;
    if (options.attributes) {
      for (const [name, value] of Object.entries(options.attributes)) {
        node.setAttribute(name, value);
      }
    }
    for (const child of children) node.append(child);
    return node;
  }

  function safeUrl(value) {
    try {
      const parsed = new URL(value);
      return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.href : null;
    } catch {
      return null;
    }
  }

  function request(path, options = {}) {
    const headers = new Headers(options.headers || {});
    headers.set("Accept", "application/json");
    return fetch(path, { credentials: "same-origin", ...options, headers });
  }

  async function readJson(response) {
    const contentType = response.headers.get("content-type") || "";
    return contentType.includes("application/json") ? response.json() : null;
  }

  function initial(name) {
    return (name || "N").trim().slice(0, 1).toUpperCase() || "N";
  }

  function header(user) {
    const brand = element("a", { className: "brand", href: "/", ariaLabel: "NOD 홈" }, [
      element("span", { className: "brand-mark", text: "N" }),
      element("span", { text: "NOD" }),
    ]);
    const siteHeader = element("header", { className: "site-header" }, [brand]);

    if (!user) return siteHeader;

    const avatar = element("span", { className: "account-avatar", text: initial(user.name), attributes: { "aria-hidden": "true" } });
    const details = element("span", { className: "account-details" }, [
      element("span", { className: "account-name", text: user.name || user.email || "NOD 사용자" }),
      element("span", { className: "account-email", text: user.email || "" }),
    ]);
    const logout = element("button", { className: "icon-button", type: "button", ariaLabel: "로그아웃", text: "↗" });
    logout.addEventListener("click", logoutUser);
    siteHeader.append(element("div", { className: "account" }, [avatar, details, logout]));
    return siteHeader;
  }

  function renderLanding(message = "") {
    app.replaceChildren(header(null));
    const title = element("h1", { className: "hero-title", text: "읽고 싶은 순간을\n놓치지 마세요." });
    const login = element("a", { className: "button", href: "/auth/google" }, [
      element("span", { className: "google-mark", text: "G", attributes: { "aria-hidden": "true" } }),
      element("span", { text: "Google로 시작하기" }),
    ]);
    const intro = element("section", { attributes: { "aria-labelledby": "landing-title" } }, [
      element("p", { className: "eyebrow", text: "나만의 링크 보관함" }),
      title,
      element("p", { className: "hero-copy", text: "NOD는 나중에 다시 볼 웹페이지를 조용히 모아두는 개인 링크 라이브러리입니다." }),
      login,
      element("p", { className: "landing-note", text: message || "Google 계정으로 안전하게 로그인합니다." }),
    ]);
    title.id = "landing-title";

    const card = element("aside", { className: "capture-card", attributes: { "aria-label": "Chrome 확장 프로그램으로 저장하는 방법" } }, [
      element("div", { className: "capture-icon", text: "⌁", attributes: { "aria-hidden": "true" } }),
      element("h2", { text: "탭에서 바로 저장" }),
      element("p", { text: "읽고 있는 페이지를 떠나지 않고 Chrome 툴바에서 한 번에 보관하세요." }),
      element("ol", { className: "steps" }, [
        step("1", "Chrome에 NOD 확장 프로그램을 추가합니다."),
        step("2", "툴바의 NOD 아이콘에서 Google 로그인으로 연결합니다."),
        step("3", "저장할 탭에서 아이콘을 누르면 링크가 바로 추가됩니다."),
      ]),
    ]);
    app.append(element("main", { className: "landing" }, [intro, card]));
  }

  function step(number, text) {
    return element("li", {}, [
      element("span", { className: "step-number", text: number, attributes: { "aria-hidden": "true" } }),
      element("span", { text }),
    ]);
  }

  function renderLibraryShell() {
    app.replaceChildren(header(state.user));

    const heading = element("h1", { className: "library-title", text: "저장한 링크" });
    const subtitle = element("p", { className: "library-subtitle", id: "library-count", text: "링크를 불러오는 중입니다." });
    const searchInput = element("input", {
      className: "search-input",
      type: "search",
      name: "q",
      value: state.query,
      autocomplete: "off",
      ariaLabel: "저장한 링크 검색",
      attributes: { "aria-describedby": "library-count", spellcheck: "false" },
    });
    const searchButton = element("button", { className: "icon-button search-submit", type: "submit", ariaLabel: "검색", text: "⌕" });
    const searchForm = element("form", { className: "search-form", role: "search" }, [searchInput, searchButton]);
    searchForm.addEventListener("submit", (event) => {
      event.preventDefault();
      beginSearch(searchInput.value);
    });
    searchInput.addEventListener("input", () => debounceSearch(searchInput.value));

    const listRegion = element("section", { attributes: { "aria-labelledby": "library-title" } }, [
      element("div", { className: "library-header" }, [element("div", {}, [heading, subtitle])]),
      searchForm,
      element("p", { className: "status", id: "library-status", ariaLive: "polite" }),
      element("ul", { className: "article-list", id: "article-list", ariaLive: "polite" }),
      element("div", { id: "pagination" }),
    ]);
    heading.id = "library-title";

    const extensionPanel = element("aside", { className: "extension-panel", attributes: { "aria-labelledby": "extension-title" } }, [
      element("h2", { id: "extension-title", text: "Chrome에서 바로 저장" }),
      element("p", { text: "NOD 확장 프로그램을 연결하면, 보고 있는 탭을 툴바 아이콘 한 번으로 저장할 수 있습니다." }),
      element("ol", { className: "steps" }, [
        step("1", "읽고 있는 아티클에서 Chrome 툴바의 NOD 아이콘을 누릅니다."),
        step("2", "처음에는 Google 로그인과 확장 프로그램 연결을 완료합니다."),
        step("3", "연결 후 원래 아티클이 저장됩니다. 다음부터는 한 번만 누르면 됩니다."),
      ]),
      element("div", { className: "panel-divider", attributes: { "aria-hidden": "true" } }),
      element("p", { className: "revoke-copy", text: "다른 기기에서의 확장 프로그램 연결을 모두 끊을 수 있습니다." }),
      element("button", { className: "text-button", type: "button", id: "revoke-extension", text: "모든 확장 프로그램 연결 해제" }),
      element("p", { className: "revoke-status", id: "revoke-status", ariaLive: "polite" }),
    ]);
    extensionPanel.querySelector("#revoke-extension").addEventListener("click", revokeExtensionTokens);

    app.append(element("main", { className: "library" }, [listRegion, extensionPanel]));
    renderArticleState();
  }

  function setStatus(text, error = false) {
    const status = document.querySelector("#library-status");
    if (!status) return;
    status.textContent = text;
    status.classList.toggle("error", error);
  }

  function renderArticleState(errorMessage = "") {
    const list = document.querySelector("#article-list");
    const pagination = document.querySelector("#pagination");
    const count = document.querySelector("#library-count");
    if (!list || !pagination || !count) return;

    pagination.replaceChildren();
    list.replaceChildren();
    if (state.loading && state.articles.length === 0) {
      setStatus("저장한 링크를 불러오는 중입니다.");
      count.textContent = "링크를 불러오는 중입니다.";
      list.append(...[1, 2, 3].map(() => element("li", { className: "loading-line", attributes: { "aria-hidden": "true" } })));
      return;
    }

    if (errorMessage) {
      setStatus(errorMessage, true);
      count.textContent = "링크를 불러오지 못했습니다.";
      const retry = element("button", { className: "button secondary-button", type: "button", text: "다시 시도" });
      retry.addEventListener("click", () => loadArticles({ reset: true }));
      list.append(element("li", { className: "empty" }, [
        element("div", { className: "empty-symbol", text: "!", attributes: { "aria-hidden": "true" } }),
        element("h2", { text: "링크를 불러오지 못했어요" }),
        element("p", { text: "잠시 후 다시 시도해 주세요." }),
        retry,
      ]));
      return;
    }

    const label = state.query ? `“${state.query}” 검색 결과 ${state.articles.length}개` : `저장한 링크 ${state.articles.length}개`;
    count.textContent = label;
    setStatus("");

    if (state.articles.length === 0) {
      const searchEmpty = Boolean(state.query);
      list.append(element("li", { className: "empty" }, [
        element("div", { className: "empty-symbol", text: searchEmpty ? "⌕" : "＋", attributes: { "aria-hidden": "true" } }),
        element("h2", { text: searchEmpty ? "찾는 링크가 없어요" : "아직 저장한 링크가 없어요" }),
        element("p", { text: searchEmpty ? "다른 검색어로 다시 찾아보세요." : "Chrome 툴바에서 NOD 아이콘을 눌러 첫 링크를 저장해 보세요." }),
      ]));
      return;
    }

    for (const article of state.articles) list.append(renderArticle(article));
    if (state.nextCursor) {
      const more = element("button", { className: "button secondary-button load-more", type: "button", text: "더 보기", disabled: state.loading });
      more.addEventListener("click", () => loadArticles());
      pagination.append(more);
    }
  }

  function renderArticle(article) {
    const item = element("li", { className: "article" });
    const url = safeUrl(article.url);
    const title = article.title || article.hostname || article.url || "제목 없는 링크";
    const titleNode = url
      ? element("a", { className: "article-link", href: url, target: "_blank", rel: "noopener noreferrer", text: title })
      : element("span", { className: "article-link", text: title });
    if (!url) titleNode.setAttribute("aria-label", "안전하지 않은 주소로 열 수 없는 링크");

    const metadata = element("p", { className: "article-meta" });
    metadata.append(element("span", { text: article.hostname || hostnameFrom(url) || "알 수 없는 출처" }));
    metadata.append(element("span", { text: formatDate(article.createdAt) }));
    if (url) metadata.append(element("span", { className: "article-url", text: url }));

    const deleteButton = element("button", { className: "delete-button", type: "button", ariaLabel: `“${title}” 삭제`, text: "×" });
    deleteButton.addEventListener("click", () => deleteArticle(article, deleteButton));
    item.append(titleNode, metadata, deleteButton);
    return item;
  }

  function hostnameFrom(url) {
    try { return url ? new URL(url).hostname : ""; } catch { return ""; }
  }

  function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "저장한 날짜 없음";
    return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long", day: "numeric" }).format(date);
  }

  async function deleteArticle(article, button) {
    const title = article.title || article.hostname || "이 링크";
    if (!window.confirm(`“${title}” 링크를 삭제할까요?`)) return;
    button.disabled = true;
    setStatus("");
    try {
      const response = await request(`/api/articles/${encodeURIComponent(article.id)}`, { method: "DELETE" });
      if (response.status === 401) return showUnauthenticated();
      if (!response.ok) throw new Error("delete_failed");
      state.articles = state.articles.filter((item) => item.id !== article.id);
      renderArticleState();
      setStatus("링크를 삭제했습니다.");
    } catch {
      button.disabled = false;
      setStatus("링크를 삭제하지 못했습니다. 다시 시도해 주세요.", true);
    }
  }

  let searchTimer = null;
  function debounceSearch(query) {
    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(() => beginSearch(query), 260);
  }

  function beginSearch(query) {
    const normalized = query.trim();
    if (normalized === state.query && state.articles.length > 0) return;
    state.query = normalized;
    loadArticles({ reset: true });
  }

  async function loadArticles({ reset = false } = {}) {
    if (state.loading) {
      state.searchController?.abort();
    }
    if (reset) {
      state.articles = [];
      state.nextCursor = null;
    }
    state.loading = true;
    renderArticleState();
    const params = new URLSearchParams();
    if (state.query) params.set("q", state.query);
    if (!reset && state.nextCursor) params.set("cursor", state.nextCursor);
    const controller = new AbortController();
    state.searchController = controller;

    try {
      const response = await request(`/api/articles${params.size ? `?${params}` : ""}`, { signal: controller.signal });
      if (response.status === 401) return showUnauthenticated();
      const payload = await readJson(response);
      if (!response.ok || !payload || !Array.isArray(payload.articles)) throw new Error("articles_failed");
      if (controller.signal.aborted) return;
      state.articles = reset ? payload.articles : [...state.articles, ...payload.articles];
      state.nextCursor = typeof payload.nextCursor === "string" && payload.nextCursor ? payload.nextCursor : null;
      state.loading = false;
      renderArticleState();
    } catch (error) {
      if (error.name === "AbortError") return;
      state.loading = false;
      renderArticleState("링크를 불러오지 못했습니다. 네트워크 상태를 확인해 주세요.");
    } finally {
      if (state.searchController === controller) state.searchController = null;
    }
  }

  async function revokeExtensionTokens() {
    const button = document.querySelector("#revoke-extension");
    const status = document.querySelector("#revoke-status");
    if (!button || !status) return;
    if (!window.confirm("연결된 모든 Chrome 확장 프로그램을 해제할까요? 해당 확장 프로그램에서는 다시 로그인해야 합니다.")) return;
    button.disabled = true;
    status.textContent = "연결을 해제하는 중입니다.";
    status.classList.remove("error");
    try {
      const response = await request("/api/extension-tokens/revoke", { method: "POST" });
      if (response.status === 401) return showUnauthenticated();
      if (!response.ok) throw new Error("revoke_failed");
      status.textContent = "모든 확장 프로그램 연결을 해제했습니다.";
    } catch {
      status.textContent = "연결을 해제하지 못했습니다. 다시 시도해 주세요.";
      status.classList.add("error");
    } finally {
      button.disabled = false;
    }
  }

  async function logoutUser() {
    try {
      const response = await request("/api/logout", { method: "POST" });
      if (!response.ok && response.status !== 401) throw new Error("logout_failed");
    } catch {
      setStatus("로그아웃하지 못했습니다. 연결 상태를 확인하고 다시 시도해 주세요.", true);
      return;
    }
    showUnauthenticated();
  }

  function showUnauthenticated() {
    state.user = null;
    state.articles = [];
    state.nextCursor = null;
    state.loading = false;
    state.searchController?.abort();
    renderLanding("로그인이 필요합니다. Google 계정으로 다시 시작해 주세요.");
  }

  async function boot() {
    renderLanding("로그인 상태를 확인하는 중입니다.");
    try {
      const response = await request("/api/me", { cache: "no-store" });
      if (response.status === 401) return renderLanding();
      const payload = await readJson(response);
      if (!response.ok || !payload || !payload.user) throw new Error("me_failed");
      state.user = payload.user;
      renderLibraryShell();
      await loadArticles({ reset: true });
    } catch {
      renderLanding("로그인 상태를 확인하지 못했습니다. 네트워크 상태를 확인해 주세요.");
    }
  }

  boot();
})();
