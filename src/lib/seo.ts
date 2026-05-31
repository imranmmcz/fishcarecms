/**
 * Fish Care – Centralized SEO templates & JSON-LD schema generators.
 * Domain: https://fishcare.com.bd
 *
 * Use with <SeoHead /> for meta tags and <JsonLd /> for structured data.
 */

export const SITE = {
  name: "Fish Care",
  tagline: "Solution of Fish Farming",
  url: "https://fishcare.com.bd",
  logo: "https://fishcare.com.bd/icons/icon-512x512.png",
  twitter: "@fishcarebd",
  locale: "en_US",
  altLocale: "bn_BD",
  country: "BD",
} as const;

const abs = (path = "/") => `${SITE.url}${path.startsWith("/") ? path : `/${path}`}`;

/* ---------- Dynamic metadata templates ---------- */

export const seoTemplates = {
  home: () => ({
    title: "Fish Care | Fish Medicine, Pond Calculator & Aquaculture Solutions",
    description:
      "Fish Care provides fish medicine information, disease management, pond calculators, feed formulation, fish farming dashboard and aquaculture solutions in Bangladesh.",
    url: "/",
    keywords:
      "fish medicine, aquaculture medicine, fish disease treatment, fish probiotic, pond calculator, fish farming Bangladesh",
  }),

  blogPost: (p: { title: string; excerpt: string; slug: string; image?: string }) => ({
    title: `${p.title}`,
    description: p.excerpt.slice(0, 158),
    url: `/blog/${p.slug}`,
    image: p.image,
    type: "article" as const,
  }),

  medicine: (p: { name: string; description?: string; slug: string; image?: string }) => ({
    title: `${p.name} – Fish Medicine & Dosage`,
    description:
      p.description?.slice(0, 158) ||
      `Buy ${p.name} for fish farming. Usage, dosage, benefits and application guidance for Bangladeshi aquaculture.`,
    url: `/product/${p.slug}`,
    image: p.image,
    type: "product" as const,
    keywords: `${p.name}, fish medicine, aquaculture medicine, fish health products, ${p.name} Bangladesh`,
  }),

  disease: (p: { name: string; slug: string; summary?: string }) => ({
    title: `${p.name} – Fish Disease Symptoms & Treatment`,
    description:
      p.summary?.slice(0, 158) ||
      `Identify and treat ${p.name} in fish. Symptoms, causes, prevention and recommended medicines for ponds in Bangladesh.`,
    url: `/disease-advice/${p.slug}`,
    keywords: `${p.name}, fish disease, fish disease treatment, aquaculture disease control`,
  }),

  species: (p: { name: string; slug: string; summary?: string }) => ({
    title: `${p.name} Farming Guide – Care, Feed & Stocking`,
    description:
      p.summary?.slice(0, 158) ||
      `Complete farming guide for ${p.name}: stocking density, feed, water quality, common diseases and harvesting tips.`,
    url: `/fish-species/${p.slug}`,
    keywords: `${p.name}, fish species, fish farming, aquaculture Bangladesh`,
  }),

  calculator: (p: { name: string; path: string; description?: string }) => ({
    title: `${p.name} – Free Online Tool for Fish Farmers`,
    description:
      p.description?.slice(0, 158) ||
      `Free ${p.name} for fish farmers in Bangladesh. Quick, accurate aquaculture calculations.`,
    url: p.path,
    keywords: `${p.name}, pond calculator, fish farming calculator, aquaculture tool`,
  }),

  dashboard: (p: { name: string; path: string }) => ({
    title: `${p.name} – Fish Farming Dashboard`,
    description: `${p.name} module for fish farmers: track stock, income, expenses and pond data in one place.`,
    url: p.path,
    // noindex: dashboards are private
  }),
};

/* ---------- JSON-LD schema generators ---------- */

export const schemas = {
  organization: () => ({
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    url: SITE.url,
    logo: SITE.logo,
    slogan: SITE.tagline,
    description:
      "Complete aquaculture and fish farming platform: fish medicine, disease management, pond calculators, feed formulation and farming dashboard.",
    address: { "@type": "PostalAddress", addressCountry: SITE.country },
    sameAs: [
      "https://www.facebook.com/fishcarebd",
      "https://www.youtube.com/@fishcarebd",
    ],
  }),

  website: () => ({
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: SITE.url,
    inLanguage: ["en", "bn-BD"],
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${SITE.url}/shop?search={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  }),

  breadcrumb: (items: { name: string; path: string }[]) => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: abs(it.path),
    })),
  }),

  article: (p: {
    title: string;
    description: string;
    slug: string;
    image?: string;
    author?: string;
    datePublished: string;
    dateModified?: string;
  }) => ({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: p.title,
    description: p.description,
    image: p.image || SITE.logo,
    author: { "@type": "Person", name: p.author || SITE.name },
    publisher: {
      "@type": "Organization",
      name: SITE.name,
      logo: { "@type": "ImageObject", url: SITE.logo },
    },
    datePublished: p.datePublished,
    dateModified: p.dateModified || p.datePublished,
    mainEntityOfPage: { "@type": "WebPage", "@id": abs(`/blog/${p.slug}`) },
  }),

  blog: () => ({
    "@context": "https://schema.org",
    "@type": "Blog",
    name: `${SITE.name} Blog`,
    url: abs("/blog"),
    description: "Fish farming, aquaculture and pond management articles for Bangladeshi farmers.",
    publisher: { "@type": "Organization", name: SITE.name, logo: { "@type": "ImageObject", url: SITE.logo } },
  }),

  product: (p: {
    name: string;
    description: string;
    slug: string;
    image?: string;
    sku?: string;
    brand?: string;
    price?: number;
    currency?: string;
    availability?: "InStock" | "OutOfStock" | "PreOrder";
    ratingValue?: number;
    reviewCount?: number;
  }) => ({
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.description,
    image: p.image || SITE.logo,
    sku: p.sku,
    brand: { "@type": "Brand", name: p.brand || SITE.name },
    offers: p.price
      ? {
          "@type": "Offer",
          url: abs(`/product/${p.slug}`),
          priceCurrency: p.currency || "BDT",
          price: p.price,
          availability: `https://schema.org/${p.availability || "InStock"}`,
        }
      : undefined,
    aggregateRating:
      p.ratingValue && p.reviewCount
        ? { "@type": "AggregateRating", ratingValue: p.ratingValue, reviewCount: p.reviewCount }
        : undefined,
  }),

  faq: (items: { q: string; a: string }[]) => ({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.q,
      acceptedAnswer: { "@type": "Answer", text: it.a },
    })),
  }),
};

/* ---------- Image SEO helpers ---------- */

/** Generate a descriptive alt text for a product/medicine image. */
export const generateAltText = (name: string, context = "fish farming"): string =>
  `${name} - ${context} product from ${SITE.name}, Bangladesh`;

/** Convert a product name into an SEO-friendly filename slug. */
export const seoFilename = (name: string, ext = "jpg"): string =>
  `${name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")}.${ext}`;