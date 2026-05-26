import { useLocation } from "react-router-dom";
import SeoHead from "@/components/SeoHead";

interface RouteMeta {
  title: string;
  description: string;
  type?: "website" | "article" | "product";
}

// Per-route SEO metadata. Keep titles <60 chars and descriptions 50–160 chars.
// Routes with their own SeoHead (Index, Shop product pages, blog posts, etc.) override these via mount order.
const ROUTE_META: Record<string, RouteMeta> = {
  "/": {
    title: "FishCare BD — মাছ চাষের ক্যালকুলেটর ও শপ",
    description: "বাংলাদেশের ফিশ ফার্মারদের জন্য বৈজ্ঞানিক ক্যালকুলেটর, ওষুধ-খাদ্য শপ, রোগ পরামর্শ ও বাজারদর — সব এক প্ল্যাটফর্মে।",
  },
  "/shop": {
    title: "অনলাইন শপ — মাছের ওষুধ, খাদ্য ও সরঞ্জাম",
    description: "মাছের ওষুধ, খাদ্য, প্রোবায়োটিক ও ফার্মিং সরঞ্জাম অনলাইনে অর্ডার করুন। ক্যাশ অন ডেলিভারি, সারা দেশে শিপিং।",
  },
  "/modules": {
    title: "ফার্মিং মডিউল ও ক্যালকুলেটর",
    description: "পুকুর, স্টকিং, ফিড, ওষুধ, সার, পানির গুণাগুণ ও খরচ — মাছ চাষের সকল মডিউল ও ক্যালকুলেটর এক জায়গায়।",
  },
  "/pond-calculator": {
    title: "পুকুর ক্যালকুলেটর — আয়তন ও গভীরতা",
    description: "পুকুরের আকার (আয়তাকার, বৃত্ত, ট্র্যাপিজয়েড) অনুযায়ী পানির আয়তন, পৃষ্ঠতল ও গভীরতা সঠিকভাবে নির্ণয় করুন।",
  },
  "/fish-stocking": {
    title: "ফিশ স্টকিং প্ল্যানার",
    description: "পুকুর অনুযায়ী মাছের প্রজাতি ও পোনার পরিমাণ পরিকল্পনা করুন — মিশ্র ও মনোকালচার উভয়ের জন্য।",
  },
  "/stocking-density": {
    title: "স্টকিং ডেনসিটি — প্রতি শতকে মাছ",
    description: "প্রজাতি ও পদ্ধতি (পরিচালিত / আধাপরিচালিত / নিবিড়) অনুযায়ী সঠিক স্টকিং ঘনত্ব জানুন।",
  },
  "/biomass-calculator": {
    title: "বায়োমাস ক্যালকুলেটর",
    description: "নমুনা ওজন থেকে মোট মাছের বায়োমাস (kg) এবং প্রতি শতকে বায়োমাস হিসাব করুন।",
  },
  "/feed-management": {
    title: "ফিড ম্যানেজমেন্ট — দৈনিক খাদ্য পরিকল্পনা",
    description: "বায়োমাস ও বৃদ্ধির পর্যায় অনুযায়ী দৈনিক ফিড পরিমাণ ও সময়সূচি নির্ধারণ করুন।",
  },
  "/feed-formula": {
    title: "ফিড ফর্মুলা ক্যালকুলেটর",
    description: "স্থানীয় উপাদান দিয়ে কাস্টম ফিড মিক্স তৈরি করুন — প্রোটিন, ফ্যাট ও খরচ সহ।",
  },
  "/smart-feed-calculator": {
    title: "স্মার্ট ফিড ক্যালকুলেটর (AI)",
    description: "AI-সহায়তায় মাছের বয়স ও আবহাওয়া অনুযায়ী ফিডিং রেট অপটিমাইজ করুন।",
  },
  "/medicine-application": {
    title: "মেডিসিন অ্যাপ্লিকেশন গাইড",
    description: "অ্যাকোয়াকালচার ওষুধের সঠিক ডোজ, প্রয়োগ পদ্ধতি ও সতর্কতা — পুকুরের আয়তন অনুযায়ী।",
  },
  "/medicine-recommendation": {
    title: "মেডিসিন রিকমেন্ডেশন",
    description: "রোগ, লক্ষণ ও মাছের প্রজাতি অনুযায়ী উপযুক্ত ওষুধের সুপারিশ পান।",
  },
  "/fertilizer-calculator": {
    title: "সার ক্যালকুলেটর — ইউরিয়া, TSP, চুন",
    description: "পুকুরের আয়তন অনুযায়ী ইউরিয়া, TSP, চুন ও কম্পোস্টের সঠিক মাত্রা হিসাব করুন।",
  },
  "/water-quality": {
    title: "পানির গুণাগুণ বিশ্লেষণ",
    description: "pH, অ্যামোনিয়া, DO, ক্ষারীয়তার মান বিশ্লেষণ করে পুকুরের সমস্যা চিহ্নিত করুন।",
  },
  "/cost-calculator": {
    title: "খরচ ক্যালকুলেটর — উৎপাদন ব্যয় ও লাভ",
    description: "এক চক্রের মোট ব্যয়, প্রতি কেজি উৎপাদন খরচ ও ব্রেক-ইভেন মূল্য নির্ণয় করুন।",
  },
  "/reports": {
    title: "ফার্ম রিপোর্ট ও প্রিন্ট লেআউট",
    description: "ফার্মিং ডেটার সারাংশ ও প্রিন্ট-রেডি রিপোর্ট তৈরি করুন।",
  },
  "/fish-advice": {
    title: "AI মৎস্য পরামর্শ চ্যাট",
    description: "ফিশ ফার্মিং নিয়ে যে কোনো প্রশ্ন করুন AI সহায়কের কাছে — তাৎক্ষণিক উত্তর পান।",
  },
  "/disease-advice": {
    title: "মাছের রোগ ও চিকিৎসা পরামর্শ",
    description: "সাধারণ মাছের রোগ, লক্ষণ এবং বৈজ্ঞানিক চিকিৎসা পদ্ধতির বিস্তারিত নির্দেশিকা।",
  },
  "/fish-species": {
    title: "মাছের প্রজাতি — চাষযোগ্য মাছ পরিচিতি",
    description: "বাংলাদেশে চাষযোগ্য জনপ্রিয় মাছের প্রজাতি, বৈশিষ্ট্য, খাদ্যাভ্যাস ও বৃদ্ধির হার।",
  },
  "/market-price": {
    title: "মাছের বাজারদর — দৈনিক আপডেট",
    description: "জেলা ও বাজার অনুযায়ী মাছের দৈনিক বাজারদর — কৃষকদের পাঠানো আপডেট সহ।",
  },
  "/fisheries-contact": {
    title: "মৎস্য অফিস যোগাযোগ ডিরেক্টরি",
    description: "বাংলাদেশের সব জেলার মৎস্য অফিসের ঠিকানা, ফোন ও ইমেইল ডিরেক্টরি।",
  },
  "/track-order": {
    title: "অর্ডার ট্র্যাক করুন",
    description: "অর্ডার নম্বর ও ফোন দিয়ে আপনার অর্ডারের বর্তমান অবস্থা জানুন।",
  },
  "/blog": {
    title: "ব্লগ — মাছ চাষের টিপস ও আর্টিকেল",
    description: "ফিশ ফার্মিং কমিউনিটির অভিজ্ঞতা, টিপস, কেস স্টাডি ও নিবন্ধ পড়ুন।",
  },
  "/wishlist": {
    title: "আমার উইশলিস্ট",
    description: "পছন্দের পণ্যগুলো সংরক্ষণ করুন এবং পরে অর্ডার করুন।",
  },
  "/auth": {
    title: "সাইন ইন — আপনার অ্যাকাউন্টে প্রবেশ",
    description: "ইমেইল বা ফোন নম্বর দিয়ে আপনার FishCare BD অ্যাকাউন্টে সাইন ইন করুন।",
  },
  "/register": {
    title: "নতুন অ্যাকাউন্ট রেজিস্ট্রেশন",
    description: "ফ্রি অ্যাকাউন্ট খুলুন এবং ফার্ম পরিচালনা, অর্ডার ও কমিউনিটি অ্যাক্সেস উপভোগ করুন।",
  },
  "/forgot-password": {
    title: "পাসওয়ার্ড পুনরুদ্ধার",
    description: "ইমেইলের মাধ্যমে পাসওয়ার্ড রিসেট লিংক পান।",
  },
  "/checkout": {
    title: "চেকআউট — অর্ডার সম্পন্ন করুন",
    description: "কার্টের পণ্যগুলোর জন্য ডেলিভারি ঠিকানা ও পেমেন্ট সম্পন্ন করুন।",
  },
};

/**
 * Mount once inside <BrowserRouter>. Sets per-route title/description/og tags
 * for any public route in ROUTE_META. Pages that mount their own <SeoHead />
 * (Index, ProductDetails, BlogPost, FishSpecies, etc.) override these later.
 */
export const RouteSeoHead = () => {
  const location = useLocation();
  const meta = ROUTE_META[location.pathname];

  if (!meta) return null;

  return (
    <SeoHead
      title={meta.title}
      description={meta.description}
      url={location.pathname}
      type={meta.type || "website"}
    />
  );
};

export default RouteSeoHead;