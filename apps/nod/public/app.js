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

  function icon(name, size = 24) {
    const node = element("span", { className: "material-symbols-outlined", text: name, attributes: { "aria-hidden": "true" } });
    node.style.fontSize = `${size}px`;
    return node;
  }

  function header(user) {
    const logo = element("img", { attributes: { src: "/assets/nod-logo.png", alt: "NOD" } });
    const brand = element("a", { className: "brand", href: "/", ariaLabel: "NOD home" }, [logo]);
    const siteHeader = element("header", { className: "site-header" }, [brand]);

    if (!user) return siteHeader;

    const avatar = element("span", { className: "account-avatar", text: initial(user.name), attributes: { "aria-hidden": "true" } });
    const details = element("span", { className: "account-details" }, [
      element("span", { className: "account-name", text: user.name || user.email || "NOD user" }),
      element("span", { className: "account-email", text: user.email || "" }),
    ]);
    const logout = element("button", { className: "icon-button", type: "button", ariaLabel: "Sign out" }, [icon("logout", 20)]);
    logout.addEventListener("click", logoutUser);
    siteHeader.append(element("div", { className: "account" }, [avatar, details, logout]));
    return siteHeader;
  }

  function renderLanding(message = "") {
    window.NodLanding.mount(app, message);
  }

  function step(number, text) {
    return element("li", {}, [
      element("span", { className: "step-number", text: number, attributes: { "aria-hidden": "true" } }),
      element("span", { text }),
    ]);
  }

  function renderLibraryShell() {
    window.NodLanding.unmount();
    if (!document.getElementById("app-fonts")) {
      const link = document.createElement("link");
      link.id = "app-fonts";
      link.rel = "stylesheet";
      link.href = "/tokens/fonts-app.css";
      document.head.append(link);
    }
    app.replaceChildren(header(state.user));

    const heading = element("h1", { className: "library-title", text: "Your links" });
    const subtitle = element("p", { className: "library-subtitle", id: "library-count", text: "Loading your links…" });
    const searchInput = element("input", {
      className: "search-input",
      type: "search",
      name: "q",
      value: state.query,
      autocomplete: "off",
      ariaLabel: "Search your links",
      attributes: { "aria-describedby": "library-count", spellcheck: "false" },
    });
    const searchButton = element("button", { className: "icon-button search-submit", type: "submit", ariaLabel: "Search" }, [icon("search", 20)]);
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
      element("h2", { id: "extension-title", text: "Save from Chrome" }),
      element("p", { text: "Connect the NOD extension to save the tab you’re on with one click." }),
      element("ol", { className: "steps" }, [
        step("1", "On any page, click the NOD icon in the Chrome toolbar."),
        step("2", "The first time, sign in with Google and connect the extension."),
        step("3", "The page is saved. From then on, it’s one click."),
      ]),
      element("div", { className: "panel-divider", attributes: { "aria-hidden": "true" } }),
      element("p", { className: "revoke-copy", text: "You can disconnect the extension on every device at once." }),
      element("button", { className: "text-button", type: "button", id: "revoke-extension", text: "Disconnect all extensions" }),
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
      setStatus("Loading your links…");
      count.textContent = "Loading your links…";
      list.append(...[1, 2, 3].map(() => element("li", { className: "loading-line", attributes: { "aria-hidden": "true" } })));
      return;
    }

    if (errorMessage) {
      setStatus(errorMessage, true);
      count.textContent = "Couldn’t load your links.";
      const retry = element("button", { className: "button secondary-button", type: "button", text: "Try again" });
      retry.addEventListener("click", () => loadArticles({ reset: true }));
      list.append(element("li", { className: "empty" }, [
        element("div", { className: "empty-symbol", attributes: { "aria-hidden": "true" } }, [icon("error")]),
        element("h2", { text: "Couldn’t load your links" }),
        element("p", { text: "Please try again in a moment." }),
        retry,
      ]));
      return;
    }

    const label = state.query ? `${state.articles.length} ${state.articles.length === 1 ? "result" : "results"} for “${state.query}”` : `${state.articles.length} ${state.articles.length === 1 ? "link" : "links"}`;
    count.textContent = label;
    setStatus("");

    if (state.articles.length === 0) {
      const searchEmpty = Boolean(state.query);
      list.append(element("li", { className: "empty" }, [
        element("div", { className: "empty-symbol", attributes: { "aria-hidden": "true" } }, [icon(searchEmpty ? "search_off" : "add")]),
        element("h2", { text: searchEmpty ? "No links match" : "No links yet" }),
        element("p", { text: searchEmpty ? "Try a different word." : "Click the NOD icon in the Chrome toolbar to save your first link." }),
      ]));
      return;
    }

    for (const article of state.articles) list.append(renderArticle(article));
    if (state.nextCursor) {
      const more = element("button", { className: "button secondary-button load-more", type: "button", text: "Load more", disabled: state.loading });
      more.addEventListener("click", () => loadArticles());
      pagination.append(more);
    }
  }

  function renderArticle(article) {
    const item = element("li", { className: "article" });
    const url = safeUrl(article.url);
    const title = article.title || article.hostname || article.url || "Untitled link";
    const titleNode = url
      ? element("a", { className: "article-link", href: url, target: "_blank", rel: "noopener noreferrer", text: title })
      : element("span", { className: "article-link", text: title });
    if (!url) titleNode.setAttribute("aria-label", "This link can’t be opened because its address is unsafe");

    const metadata = element("p", { className: "article-meta" });
    metadata.append(element("span", { text: article.hostname || hostnameFrom(url) || "Unknown source" }));
    metadata.append(element("span", { text: formatDate(article.createdAt) }));
    if (url) metadata.append(element("span", { className: "article-url", text: url }));

    const deleteButton = element("button", { className: "delete-button", type: "button", ariaLabel: `Delete “${title}”` }, [icon("delete", 20)]);
    deleteButton.addEventListener("click", () => deleteArticle(article, deleteButton));
    item.append(titleNode, metadata, deleteButton);
    return item;
  }

  function hostnameFrom(url) {
    try { return url ? new URL(url).hostname : ""; } catch { return ""; }
  }

  function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "No saved date";
    return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" }).format(date);
  }

  async function deleteArticle(article, button) {
    const title = article.title || article.hostname || "this link";
    if (!window.confirm(`Delete “${title}”?`)) return;
    button.disabled = true;
    setStatus("");
    try {
      const response = await request(`/api/articles/${encodeURIComponent(article.id)}`, { method: "DELETE" });
      if (response.status === 401) return showUnauthenticated();
      if (!response.ok) throw new Error("delete_failed");
      state.articles = state.articles.filter((item) => item.id !== article.id);
      renderArticleState();
      setStatus("Link deleted.");
    } catch {
      button.disabled = false;
      setStatus("Couldn’t delete the link. Please try again.", true);
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
      renderArticleState("Couldn’t load your links. Check your connection.");
    } finally {
      if (state.searchController === controller) state.searchController = null;
    }
  }

  async function revokeExtensionTokens() {
    const button = document.querySelector("#revoke-extension");
    const status = document.querySelector("#revoke-status");
    if (!button || !status) return;
    if (!window.confirm("Disconnect every connected Chrome extension? Each one will need to sign in again.")) return;
    button.disabled = true;
    status.textContent = "Disconnecting…";
    status.classList.remove("error");
    try {
      const response = await request("/api/extension-tokens/revoke", { method: "POST" });
      if (response.status === 401) return showUnauthenticated();
      if (!response.ok) throw new Error("revoke_failed");
      status.textContent = "All extensions are disconnected.";
    } catch {
      status.textContent = "Couldn’t disconnect. Please try again.";
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
      setStatus("Couldn’t sign out. Check your connection and try again.", true);
      return;
    }
    showUnauthenticated();
  }

  function showUnauthenticated() {
    state.user = null;
    window.NodLanding.unmount();
    state.articles = [];
    state.nextCursor = null;
    state.loading = false;
    state.searchController?.abort();
    renderLanding("Please sign in with Google to continue.");
  }

  async function boot() {
    renderLanding("Checking your sign-in…");
    try {
      const response = await request("/api/me", { cache: "no-store" });
      if (response.status === 401) return renderLanding();
      const payload = await readJson(response);
      if (!response.ok || !payload || !payload.user) throw new Error("me_failed");
      state.user = payload.user;
      renderLibraryShell();
      await loadArticles({ reset: true });
    } catch {
      renderLanding("Couldn’t check your sign-in. Check your connection.");
    }
  }

  boot();
})();
