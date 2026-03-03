interface BlogPostingJsonLdProps {
  title: string;
  description: string;
  datePublished: string;
  dateModified?: string;
  slug: string;
  locale?: string;
}

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQPageJsonLdProps {
  faqs: FAQItem[];
}

export function WebSiteJsonLd() {
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data requires dangerouslySetInnerHTML
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "NOD",
          alternateName: "NOD — AI-Powered Second Brain",
          url: "https://nod-archive.com",
          description:
            "AI-powered article saving and knowledge management. Save articles, get AI summaries, and search your knowledge library with semantic search.",
          inLanguage: ["ko-KR", "en-US", "ja-JP", "es-ES", "pt-BR", "zh-CN", "de-DE", "fr-FR"],
          publisher: {
            "@type": "Organization",
            name: "NOD",
            url: "https://nod-archive.com",
          },
        }),
      }}
    />
  );
}

export function SoftwareApplicationJsonLd() {
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data requires dangerouslySetInnerHTML
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "NOD",
          applicationCategory: "ProductivityApplication",
          operatingSystem: "Chrome",
          description:
            "AI-powered article saving and knowledge management. Save articles, get AI summaries, and search your knowledge library with semantic search.",
          offers: [
            {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
              name: "Free Plan",
              description: "20 AI summaries per month, 50 saved articles",
            },
            {
              "@type": "Offer",
              price: "5.00",
              priceCurrency: "USD",
              name: "Pro Plan",
              description: "Unlimited AI summaries and unlimited saved articles",
            },
          ],
          url: "https://nod-archive.com",
        }),
      }}
    />
  );
}

export function BlogPostingJsonLd({
  title,
  description,
  datePublished,
  dateModified,
  slug,
  locale = "en",
}: BlogPostingJsonLdProps) {
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data requires dangerouslySetInnerHTML
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: title,
          description,
          datePublished,
          dateModified: dateModified || datePublished,
          author: {
            "@type": "Organization",
            name: "NOD Team",
            url: "https://nod-archive.com",
          },
          publisher: {
            "@type": "Organization",
            name: "NOD",
            url: "https://nod-archive.com",
          },
          mainEntityOfPage: {
            "@type": "WebPage",
            "@id": `https://nod-archive.com/${locale}/blog/${slug}`,
          },
          inLanguage:
            {
              ko: "ko-KR",
              en: "en-US",
              ja: "ja-JP",
              es: "es-ES",
              "pt-BR": "pt-BR",
              "zh-CN": "zh-CN",
              de: "de-DE",
              fr: "fr-FR",
            }[locale] ?? "en-US",
        }),
      }}
    />
  );
}

export function FAQPageJsonLd({ faqs }: FAQPageJsonLdProps) {
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data requires dangerouslySetInnerHTML
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: faq.answer,
            },
          })),
        }),
      }}
    />
  );
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbJsonLdProps {
  items: BreadcrumbItem[];
}

export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data requires dangerouslySetInnerHTML
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: items.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: item.name,
            item: item.url,
          })),
        }),
      }}
    />
  );
}

export function OrganizationJsonLd() {
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data requires dangerouslySetInnerHTML
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "NOD",
          url: "https://nod-archive.com",
          logo: "https://nod-archive.com/brand/nod-apple-touch-icon.png",
          description:
            "AI-powered article saving and knowledge management platform. Save articles, get AI summaries, and search your knowledge library with semantic search.",
          foundingDate: "2025",
          sameAs: [
            "https://github.com/jidohyun/NOD",
            "https://chromewebstore.google.com/detail/nod-article-analyzer/lifmaapjkbpfbdppiaeidcnicidpfknp",
          ],
        }),
      }}
    />
  );
}
