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
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: "4.8",
            ratingCount: "50",
          },
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
            url: "https://nod.ing",
          },
          publisher: {
            "@type": "Organization",
            name: "NOD",
            url: "https://nod.ing",
          },
          mainEntityOfPage: {
            "@type": "WebPage",
            "@id": `https://nod.ing/${locale}/blog/${slug}`,
          },
          inLanguage: locale === "ko" ? "ko-KR" : locale === "ja" ? "ja-JP" : "en-US",
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
