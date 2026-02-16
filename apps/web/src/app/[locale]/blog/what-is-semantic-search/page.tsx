import type { Metadata } from "next";
import Link from "next/link";
import type { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";

// SEO Metadata
export const metadata: Metadata = {
  title: "What Is Semantic Search? How AI Understands Meaning (2026 Guide)",
  description:
    "Learn what semantic search is, how it works, and why it's replacing keyword search. Understand vector embeddings, NLP, and real-world applications.",
  alternates: {
    canonical: "/blog/what-is-semantic-search",
    languages: {
      en: "/en/blog/what-is-semantic-search",
      ko: "/ko/blog/what-is-semantic-search",
    },
  },
  openGraph: {
    title: "What Is Semantic Search? How AI Understands Meaning (2026 Guide)",
    description:
      "Learn what semantic search is, how it works, and why it's replacing keyword search. Understand vector embeddings, NLP, and real-world applications.",
    type: "article",
    publishedTime: "2026-02-16T00:00:00Z",
  },
  robots: {
    index: true,
    follow: true,
  },
};

interface BlogPostProps {
  params: Promise<{ locale: string }>;
}

export default async function SemanticSearchPost({ params }: BlogPostProps) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  const i18n = {
    home: locale === "ko" ? "홈" : locale === "ja" ? "ホーム" : "Home",
    blog: locale === "ko" ? "블로그" : locale === "ja" ? "ブログ" : "Blog",
    breadcrumb:
      locale === "ko"
        ? "시맨틱 검색이란"
        : locale === "ja"
          ? "セマンティック検索とは"
          : "What Is Semantic Search",
    date:
      locale === "ko" ? "2026년 2월 16일" : locale === "ja" ? "2026年2月16日" : "February 16, 2026",
    readTime: locale === "ko" ? "12분 분량" : locale === "ja" ? "12分で読める" : "12 min read",
  };

  return (
    <article className="prose-invert" itemScope itemType="https://schema.org/Article">
      <meta
        itemProp="headline"
        content="What Is Semantic Search? A Complete Guide to How AI Understands Meaning"
      />
      <meta itemProp="datePublished" content="2026-02-16" />
      <meta itemProp="author" content="NOD Team" />

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-8 text-sm text-neutral-500">
        <ol
          className="flex items-center gap-1.5"
          itemScope
          itemType="https://schema.org/BreadcrumbList"
        >
          <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
            <Link
              href={`/${locale}`}
              itemProp="item"
              className="hover:text-white transition-colors"
            >
              <span itemProp="name">{i18n.home}</span>
            </Link>
            <meta itemProp="position" content="1" />
          </li>
          <li className="text-neutral-600">/</li>
          <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
            <Link
              href={`/${locale}/blog`}
              itemProp="item"
              className="hover:text-white transition-colors"
            >
              <span itemProp="name">{i18n.blog}</span>
            </Link>
            <meta itemProp="position" content="2" />
          </li>
          <li className="text-neutral-600">/</li>
          <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
            <span itemProp="name" className="text-neutral-400">
              {i18n.breadcrumb}
            </span>
            <meta itemProp="position" content="3" />
          </li>
        </ol>
      </nav>

      {/* Article Header */}
      <header className="mb-12">
        <div className="mb-4 flex items-center gap-3 text-sm text-neutral-500">
          <time dateTime="2026-02-16">{i18n.date}</time>
          <span className="text-neutral-700">·</span>
          <span>{i18n.readTime}</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl lg:text-[2.75rem] leading-tight">
          What Is Semantic Search? A Complete Guide to How AI Understands Meaning
        </h1>
        <p className="mt-4 text-lg text-neutral-400 leading-relaxed">
          Traditional keyword search is broken. Learn how semantic search uses AI to understand
          intent and meaning — transforming how we find information in 2026 and beyond.
        </p>
      </header>

      {/* Article Body */}
      <div className="space-y-8 text-[15px] leading-relaxed text-neutral-300">
        {/* Introduction */}
        <section>
          <p>
            Imagine searching for &ldquo;best way to save articles&rdquo; and getting results about
            newspaper delivery services. Or typing &ldquo;how to remember what I read&rdquo; and
            landing on pages about memory loss treatment. This is the reality of traditional keyword
            search — it matches words, not meaning.
          </p>
          <p className="mt-4">
            <strong className="text-white">Semantic search</strong> changes everything. Instead of
            matching exact strings, it understands what you mean. It knows that &ldquo;save
            articles&rdquo; relates to bookmarking tools and read-later apps, and &ldquo;remember
            what I read&rdquo; connects to note-taking and knowledge management — even when those
            exact phrases don&apos;t appear on the page.
          </p>
          <p className="mt-4">
            In this guide, you&apos;ll learn exactly how semantic search works, why it&apos;s
            replacing traditional keyword search, and how it&apos;s being used in everything from
            Google to personal knowledge bases. By the end, you&apos;ll understand why semantic
            search is the most important advancement in information retrieval since the search
            engine itself.
          </p>
        </section>

        {/* Section 1 */}
        <section>
          <h2 className="mb-4 text-2xl font-bold text-white">Semantic Search vs Keyword Search</h2>
          <p>
            To understand semantic search, you first need to understand what it&apos;s replacing.
            Traditional <strong className="text-white">keyword search</strong> uses exact string
            matching and Boolean operators (AND, OR, NOT) to find results. If you search for
            &ldquo;machine learning performance&rdquo;, the search engine looks for pages containing
            those exact words.
          </p>
          <p className="mt-4">
            <strong className="text-white">Semantic search</strong>, by contrast, understands{" "}
            <em>meaning</em>, <em>intent</em>, and <em>context</em>. It knows that &ldquo;ML
            optimization&rdquo; and &ldquo;neural network speed&rdquo; are related concepts — even
            though they share no common words with your query.
          </p>

          <h3 className="mb-2 mt-6 text-lg font-semibold text-white">
            Key Differences in Practice
          </h3>
          <div className="mt-4 overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.03]">
                  <th className="px-4 py-3 text-left font-semibold text-white">Query</th>
                  <th className="px-4 py-3 text-left font-semibold text-white">
                    Keyword Search Results
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-white">
                    Semantic Search Results
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <tr className="hover:bg-white/[0.02]">
                  <td className="px-4 py-2.5 text-white">
                    &ldquo;how to remember what I read&rdquo;
                  </td>
                  <td className="px-4 py-2.5">Pages with those exact words</td>
                  <td className="px-4 py-2.5">
                    Articles about note-taking, spaced repetition, knowledge management
                  </td>
                </tr>
                <tr className="hover:bg-white/[0.02]">
                  <td className="px-4 py-2.5 text-white">&ldquo;save articles for later&rdquo;</td>
                  <td className="px-4 py-2.5">
                    Pages mentioning &ldquo;save&rdquo; and &ldquo;articles&rdquo;
                  </td>
                  <td className="px-4 py-2.5">
                    Read-it-later apps, web clippers, bookmark managers
                  </td>
                </tr>
                <tr className="hover:bg-white/[0.02]">
                  <td className="px-4 py-2.5 text-white">
                    &ldquo;machine learning performance tips&rdquo;
                  </td>
                  <td className="px-4 py-2.5">Exact phrase matches</td>
                  <td className="px-4 py-2.5">
                    Articles titled &ldquo;Optimizing Neural Network Training&rdquo;, &ldquo;GPU
                    Acceleration for Deep Learning&rdquo;
                  </td>
                </tr>
                <tr className="hover:bg-white/[0.02]">
                  <td className="px-4 py-2.5 text-white">
                    &ldquo;best way to organize research&rdquo;
                  </td>
                  <td className="px-4 py-2.5">Generic organization tips</td>
                  <td className="px-4 py-2.5">
                    Personal knowledge management systems, Zettelkasten, digital gardens
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="mt-4">
            The difference is dramatic. Keyword search finds{" "}
            <strong className="text-white">matching text</strong>. Semantic search finds{" "}
            <strong className="text-white">matching concepts</strong>.
          </p>
        </section>

        {/* Section 2 */}
        <section>
          <h2 className="mb-4 text-2xl font-bold text-white">How Semantic Search Works</h2>
          <p>
            Behind every semantic search system is a process that converts text into mathematical
            representations called <strong className="text-white">vector embeddings</strong>.
            Here&apos;s how it works, step by step:
          </p>

          <h3 className="mb-2 mt-6 text-lg font-semibold text-white">
            1. Text to Vector Embeddings
          </h3>
          <p>
            When you save an article or enter a search query, an AI model (typically a{" "}
            <strong className="text-white">transformer</strong> like BERT or GPT) reads the text and
            converts it into a vector — a list of hundreds or thousands of numbers. Words with
            similar meanings produce similar vectors.
          </p>
          <p className="mt-3">
            For example, &ldquo;dog&rdquo; and &ldquo;puppy&rdquo; would have vectors that point in
            nearly the same direction in high-dimensional space. &ldquo;Dog&rdquo; and
            &ldquo;car&rdquo; would be far apart.
          </p>

          <h3 className="mb-2 mt-6 text-lg font-semibold text-white">2. Similarity Calculation</h3>
          <p>
            When you search, your query is also converted into a vector. The system then calculates
            the <strong className="text-white">cosine similarity</strong> between your query vector
            and every document vector in the database. Documents with the highest similarity scores
            are returned as results.
          </p>
          <p className="mt-3">
            This is why semantic search can find &ldquo;neural network optimization&rdquo; when you
            search for &ldquo;machine learning performance&rdquo; — the underlying concepts are
            mathematically similar, even if the words differ.
          </p>

          <h3 className="mb-2 mt-6 text-lg font-semibold text-white">
            3. Contextual Understanding
          </h3>
          <p>
            Modern transformer models don&apos;t just encode individual words — they encode{" "}
            <em>context</em>. The word &ldquo;bank&rdquo; has a different embedding in &ldquo;river
            bank&rdquo; versus &ldquo;savings bank&rdquo;. This contextual awareness is what makes
            semantic search genuinely intelligent.
          </p>

          <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.02] p-5">
            <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[#E8B931]">
              Simplified Workflow
            </h4>
            <ol className="mt-3 space-y-2 text-sm">
              <li>
                <strong className="text-white">Step 1:</strong> User enters query → Query is
                converted to vector embedding
              </li>
              <li>
                <strong className="text-white">Step 2:</strong> System retrieves similar vectors
                from database (using nearest neighbor search)
              </li>
              <li>
                <strong className="text-white">Step 3:</strong> Results are ranked by similarity
                score
              </li>
              <li>
                <strong className="text-white">Step 4:</strong> Top results are returned to user
              </li>
            </ol>
          </div>
        </section>

        {/* Section 3 */}
        <section>
          <h2 className="mb-4 text-2xl font-bold text-white">Real-World Applications</h2>
          <p>
            Semantic search isn&apos;t just a research concept — it&apos;s powering the tools you
            use every day. Here are the most important applications:
          </p>

          <h3 className="mb-2 mt-6 text-lg font-semibold text-white">
            Google Search (BERT and MUM)
          </h3>
          <p>
            In 2019, Google introduced{" "}
            <a
              href="https://blog.google/products/search/search-language-understanding-bert/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#E8B931] underline decoration-[#E8B931]/30 hover:decoration-[#E8B931] transition-colors"
            >
              BERT (Bidirectional Encoder Representations from Transformers)
            </a>{" "}
            to better understand natural language queries. By 2026, Google&apos;s MUM (Multitask
            Unified Model) uses semantic search to answer complex, multi-step questions across 75
            languages.
          </p>

          <h3 className="mb-2 mt-6 text-lg font-semibold text-white">E-Commerce Product Search</h3>
          <p>
            Amazon, Shopify, and other platforms use semantic search to match products with user
            intent. Search for &ldquo;comfortable work-from-home chair&rdquo; and you&apos;ll see
            ergonomic office chairs — even if the product title says &ldquo;executive desk
            seating&rdquo;.
          </p>

          <h3 className="mb-2 mt-6 text-lg font-semibold text-white">
            Customer Support and Chatbots
          </h3>
          <p>
            Modern support systems use semantic search to surface relevant help articles. Instead of
            exact keyword matching, they understand that &ldquo;I can&apos;t log in&rdquo; and
            &ldquo;forgot my password&rdquo; both relate to authentication issues.
          </p>

          <h3 className="mb-2 mt-6 text-lg font-semibold text-white">
            Personal Knowledge Management
          </h3>
          <p>
            Tools like Obsidian, Notion, and{" "}
            <Link
              href={`/${locale}`}
              className="text-[#E8B931] underline decoration-[#E8B931]/30 hover:decoration-[#E8B931] transition-colors"
            >
              NOD
            </Link>{" "}
            use semantic search to make your saved notes and articles searchable by concept, not
            just keywords. This is especially powerful when you have hundreds of saved items.
          </p>

          <h3 className="mb-2 mt-6 text-lg font-semibold text-white">Enterprise Document Search</h3>
          <p>
            Companies use semantic search to index internal documentation, wikis, and Slack
            messages. Employees can ask natural questions like &ldquo;How do I request PTO?&rdquo;
            and get relevant results, even if the official policy document uses different
            terminology.
          </p>
        </section>

        {/* Section 4 */}
        <section>
          <h2 className="mb-4 text-2xl font-bold text-white">
            Semantic Search in Personal Knowledge Management
          </h2>
          <p>
            If you&apos;re someone who saves articles, bookmarks, and research materials, semantic
            search solves a critical problem: <em>you can&apos;t find what you&apos;ve saved</em>.
          </p>

          <h3 className="mb-2 mt-6 text-lg font-semibold text-white">The Problem</h3>
          <p>
            Let&apos;s say you saved 100+ articles over the past year. You vaguely remember reading
            something about &ldquo;improving focus&rdquo;, but you don&apos;t remember the exact
            title or keywords. With traditional search, you&apos;re stuck. You try searching for
            &ldquo;focus&rdquo;, &ldquo;productivity&rdquo;, &ldquo;concentration&rdquo; — but
            nothing feels right.
          </p>

          <h3 className="mb-2 mt-6 text-lg font-semibold text-white">The Solution</h3>
          <p>
            With semantic search, you can search by <em>concept</em>. Search for &ldquo;how to avoid
            distractions while working&rdquo; and you&apos;ll find articles titled &ldquo;Deep Work
            Strategies&rdquo;, &ldquo;The Pomodoro Technique&rdquo;, or &ldquo;Building a
            Focus-Friendly Environment&rdquo; — even though none of those titles mention
            &ldquo;distractions&rdquo;.
          </p>

          <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.02] p-5">
            <h4 className="mb-2 text-sm font-semibold text-white">Real Example</h4>
            <p className="mt-2 text-sm">
              You search for:{" "}
              <span className="text-[#E8B931]">
                &ldquo;machine learning performance tips&rdquo;
              </span>
            </p>
            <p className="mt-2 text-sm">
              Keyword search returns: Articles with those exact words (limited results)
            </p>
            <p className="mt-2 text-sm">
              Semantic search returns: Articles titled &ldquo;Optimizing Neural Network
              Training&rdquo;, &ldquo;GPU Acceleration for Deep Learning&rdquo;, &ldquo;Reducing
              Model Inference Latency&rdquo; — because the concepts are related.
            </p>
          </div>

          <p className="mt-6">
            Tools like NOD use vector embeddings to make your saved articles semantically
            searchable. Instead of relying on tags or folder structures, you can ask natural
            questions and get relevant results — even if you saved the article months ago and forgot
            the exact title.
          </p>
        </section>

        {/* Section 5 */}
        <section>
          <h2 className="mb-4 text-2xl font-bold text-white">The Future of Search</h2>
          <p>
            Semantic search is just the beginning. Here&apos;s where the technology is heading in
            2026 and beyond:
          </p>

          <h3 className="mb-2 mt-6 text-lg font-semibold text-white">
            Multimodal Search (Text + Images + Video)
          </h3>
          <p>
            The next generation of semantic search understands multiple formats. You&apos;ll be able
            to search for &ldquo;sunset over mountains&rdquo; and get images, videos, and articles —
            all ranked by semantic relevance. Google Lens and OpenAI&apos;s CLIP model are early
            examples of this.
          </p>

          <h3 className="mb-2 mt-6 text-lg font-semibold text-white">
            Personalized Search That Learns Your Context
          </h3>
          <p>
            Future semantic search systems will learn from your behavior. If you frequently save
            articles about frontend development, a search for &ldquo;performance&rdquo; will
            prioritize React optimization guides over backend database tuning — without you having
            to specify.
          </p>

          <h3 className="mb-2 mt-6 text-lg font-semibold text-white">
            RAG (Retrieval-Augmented Generation)
          </h3>
          <p>
            <strong className="text-white">Retrieval-Augmented Generation</strong> combines semantic
            search with large language models (LLMs). Instead of just returning search results, the
            system retrieves relevant documents, reads them, and generates a synthesized answer.
            This is how tools like Perplexity AI and ChatGPT&apos;s web browsing work.
          </p>

          <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.02] p-5">
            <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[#E8B931]">
              RAG Workflow
            </h4>
            <ol className="mt-3 space-y-2 text-sm">
              <li>
                <strong className="text-white">Step 1:</strong> User asks a question
              </li>
              <li>
                <strong className="text-white">Step 2:</strong> System uses semantic search to find
                relevant documents
              </li>
              <li>
                <strong className="text-white">Step 3:</strong> LLM reads the documents and
                generates a custom answer
              </li>
              <li>
                <strong className="text-white">Step 4:</strong> Answer is returned with source
                citations
              </li>
            </ol>
          </div>

          <p className="mt-6">
            This combination of semantic retrieval and AI generation is becoming the standard for
            enterprise search, customer support, and personal knowledge tools.
          </p>
        </section>

        {/* FAQ Section */}
        <section>
          <h2 className="mb-6 text-2xl font-bold text-white">Frequently Asked Questions</h2>

          <div className="space-y-6" itemScope itemType="https://schema.org/FAQPage">
            <div
              itemProp="mainEntity"
              itemScope
              itemType="https://schema.org/Question"
              className="rounded-xl border border-white/5 bg-white/[0.02] p-5"
            >
              <h3 className="text-base font-semibold text-white" itemProp="name">
                What is the difference between semantic search and keyword search?
              </h3>
              <div itemProp="acceptedAnswer" itemScope itemType="https://schema.org/Answer">
                <p className="mt-2 text-sm text-neutral-400" itemProp="text">
                  Keyword search matches exact words or phrases. Semantic search understands meaning
                  and intent, so it can find relevant results even when the exact words don&apos;t
                  match. For example, a keyword search for &ldquo;ML optimization&rdquo; won&apos;t
                  find &ldquo;improving neural network speed&rdquo;, but semantic search will —
                  because the concepts are related.
                </p>
              </div>
            </div>

            <div
              itemProp="mainEntity"
              itemScope
              itemType="https://schema.org/Question"
              className="rounded-xl border border-white/5 bg-white/[0.02] p-5"
            >
              <h3 className="text-base font-semibold text-white" itemProp="name">
                Does semantic search require AI?
              </h3>
              <div itemProp="acceptedAnswer" itemScope itemType="https://schema.org/Answer">
                <p className="mt-2 text-sm text-neutral-400" itemProp="text">
                  Yes. Semantic search relies on AI models (typically transformers like BERT, GPT,
                  or specialized embedding models) to convert text into vector representations.
                  These models are trained on massive datasets to understand language context and
                  meaning. Without AI, you&apos;re limited to traditional keyword-based search.
                </p>
              </div>
            </div>

            <div
              itemProp="mainEntity"
              itemScope
              itemType="https://schema.org/Question"
              className="rounded-xl border border-white/5 bg-white/[0.02] p-5"
            >
              <h3 className="text-base font-semibold text-white" itemProp="name">
                Can semantic search work in multiple languages?
              </h3>
              <div itemProp="acceptedAnswer" itemScope itemType="https://schema.org/Answer">
                <p className="mt-2 text-sm text-neutral-400" itemProp="text">
                  Yes. Modern multilingual models like mBERT and XLM-RoBERTa can handle 100+
                  languages. You can even search in English and get results in Spanish, Korean, or
                  Japanese — because the vector embeddings capture meaning across languages, not
                  just words.
                </p>
              </div>
            </div>

            <div
              itemProp="mainEntity"
              itemScope
              itemType="https://schema.org/Question"
              className="rounded-xl border border-white/5 bg-white/[0.02] p-5"
            >
              <h3 className="text-base font-semibold text-white" itemProp="name">
                How accurate is semantic search?
              </h3>
              <div itemProp="acceptedAnswer" itemScope itemType="https://schema.org/Answer">
                <p className="mt-2 text-sm text-neutral-400" itemProp="text">
                  Accuracy depends on the underlying AI model and training data. Modern semantic
                  search systems achieve 70-90% relevance accuracy — significantly better than
                  keyword search for natural language queries. However, they can sometimes return
                  tangentially related results, so hybrid systems (combining semantic + keyword
                  search) often perform best.
                </p>
              </div>
            </div>

            <div
              itemProp="mainEntity"
              itemScope
              itemType="https://schema.org/Question"
              className="rounded-xl border border-white/5 bg-white/[0.02] p-5"
            >
              <h3 className="text-base font-semibold text-white" itemProp="name">
                What are vector embeddings?
              </h3>
              <div itemProp="acceptedAnswer" itemScope itemType="https://schema.org/Answer">
                <p className="mt-2 text-sm text-neutral-400" itemProp="text">
                  Vector embeddings are numerical representations of text. An AI model reads a
                  sentence or document and converts it into a list of numbers (typically 384 to 1536
                  dimensions). Words or sentences with similar meanings have similar vectors. These
                  vectors are stored in a vector database and compared using cosine similarity to
                  find semantically related content.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Conclusion */}
        <section className="rounded-xl border border-[#E8B931]/20 bg-[#E8B931]/5 p-6">
          <h2 className="mb-3 text-xl font-bold text-white">The Future of Search Is Semantic</h2>
          <p>
            Semantic search isn&apos;t just an incremental improvement over keyword search —
            it&apos;s a fundamentally different way of finding information. By understanding meaning
            instead of matching strings, it makes the entire internet (and your personal knowledge
            library) genuinely searchable.
          </p>
          <p className="mt-3">
            Whether you&apos;re using Google, shopping on Amazon, or organizing your own research,
            semantic search is already working behind the scenes. If you want to experience it in
            your personal knowledge workflow,{" "}
            <Link
              href={`/${locale}`}
              className="text-[#E8B931] font-medium underline decoration-[#E8B931]/30 hover:decoration-[#E8B931] transition-colors"
            >
              try NOD&apos;s semantic search for saved articles — it&apos;s free to start
            </Link>
            .
          </p>
          <p className="mt-3 text-sm text-neutral-400 italic">
            The question isn&apos;t whether semantic search will replace keyword search — it already
            has. The question is: are you using tools that take advantage of it?
          </p>
        </section>
      </div>
    </article>
  );
}
