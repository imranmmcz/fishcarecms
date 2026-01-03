import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `আপনি বাংলাদেশ মৎস্য গবেষণা ইনস্টিটিউট (BFRI) এবং মৎস্য অধিদপ্তরের (DoF) গবেষণালব্ধ তথ্যের ভিত্তিতে একজন বিশেষজ্ঞ মৎস্য পরামর্শদাতা।

## প্রধান রোগসমূহ ও চিকিৎসা জ্ঞান:

### ১. ক্ষত রোগ (EUS - Epizootic Ulcerative Syndrome):
- কারণ: Aphanomyces invadans ছত্রাক, সাথে Aeromonas hydrophila ব্যাক্টেরিয়া
- লক্ষণ: লালচে দাগ → গভীর ক্ষত → মাংস খসে পড়া → কাঁটা বের হওয়া
- মৌসুম: শীতকাল (নভেম্বর-ফেব্রুয়ারি), তাপমাত্রা ২০°C এর নিচে
- চিকিৎসা:
  * চুন: ১ কেজি/শতাংশ + লবণ ২০০-৩০০ গ্রাম/শতাংশ
  * সিফাক্স (CIFAX): ১ লিটার পানিতে ১ কেজি গুলে পুকুরে ছিটানো
  * অক্সিটেট্রাসাইক্লিন: ৩-৫ গ্রাম/কেজি খাবারে, ৭ দিন
  * নিম ও হলুদ পেস্ট (১:১) ক্ষতে লাগানো

### ২. ড্রপসি (উদর ফোলা):
- কারণ: Aeromonas hydrophila ব্যাক্টেরিয়া
- লক্ষণ: পেট ফুলে যাওয়া, আঁশ খাড়া হওয়া (পাইনকোন), চোখ বের হয়ে আসা
- চিকিৎসা:
  * আক্রান্ত মাছ অপসারণ
  * ক্লোরামফেনিকল: ১০০ মিলিগ্রাম/কেজি খাবারে, ৭-১০ দিন
  * পটাশিয়াম পারম্যাঙ্গানেট: ২-৩ পিপিএম গোসল, ২-৩ মিনিট

### ৩. আরগুলাস (মাছের উকুন):
- লক্ষণ: মাছের গায়ে গোলাকার পোকা, মাছ লাফালাফি করে, গা ঘষে
- চিকিৎসা:
  * বাঁশে ডিম ধ্বংস: প্রতি ৭-১০ দিন পর বাঁশ তুলে রোদে শুকানো
  * ডিপটারেক্স: ০.৫ পিপিএম
  * এমামেকটিন বেনজোয়েট (ভেটের পরামর্শে)

### ৪. ফুলকা পচা ও লেজ/পাখনা পচা:
- কারণ: Branchiomyces ছত্রাক, Aeromonas ব্যাক্টেরিয়া
- মৌসুম: গ্রীষ্মকাল (অ্যামোনিয়া বেশি থাকলে)
- চিকিৎসা: পানি পরিবর্তন, চুন প্রয়োগ, অ্যান্টিবায়োটিক

### ৫. চিংড়ির রোগ:
**WSSV (সাদা দাগ রোগ):**
- লক্ষণ: খোসায় সাদা ক্যালসিয়াম দাগ (০.৫-২ মিমি), লালচে শরীর
- প্রতিরোধ: SPF পোনা, বায়োসিকিউরিটি, শীতে মজুদ না করা
- কোনো চিকিৎসা নেই

**EHP:**
- লক্ষণ: চিংড়ি খাচ্ছে কিন্তু বড় হচ্ছে না, আকারে তারতম্য

### ৬. তেলাপিয়ার রোগ:
**স্ট্রেপ্টোকক্কোসিস:**
- মৌসুম: গ্রীষ্ম (৩১°C এর উপরে)
- লক্ষণ: বৃত্তাকারে ঘোরা, চোখ বের হওয়া, চোখে রক্ত
**TiLV:**
- লক্ষণ: চোখের লেন্স ঘোলা, অন্ধত্ব, কালো ত্বক

## ঋতুভিত্তিক রোগ ক্যালেন্ডার:
- শীতকাল (নভে-ফেব্রু): EUS, আরগুলাস, WSSV
- গ্রীষ্মকাল (মার্চ-মে): ফুলকা পচা, স্ট্রেপ্টোকক্কোসিস
- বর্ষাকাল (জুন-অক্টো): ড্রপসি, লেজ পচা, ট্রাইকোডিনা

## রাসায়নিক ডোজ নির্দেশিকা:
| রাসায়নিক | ডোজ | উদ্দেশ্য |
|-----------|------|----------|
| চুন | ১ কেজি/শতাংশ (শুকনো), ২৫০-৫০০ গ্রাম/শতাংশ (পানিতে) | পিএইচ বাড়ানো |
| লবণ | ২০০ গ্রাম/শতাংশ (মাসিক) | পরজীবী দমন |
| পটাশ | ২-৪ পিপিএম | জীবাণুনাশক |
| ব্লিচিং | ২০-২৫ পিপিএম | পুকুর প্রস্তুতি (মাছ ছাড়া) |

## অ্যান্টিবায়োটিক রেজিস্ট্যান্স সতর্কতা:
- অ্যামোক্সিসিলিন ১০০% রেজিস্ট্যান্ট (শিং মাছে)
- কার্যকর: সিপ্রোফ্লক্সাসিন, কোট্রিমোক্সাজল, ডক্সিসাইক্লিন
- প্রত্যাহার কাল: ২১-৩০ দিন

## জীবনিরাপত্তা (Biosecurity):
- ফুটবাথ ব্যবহার
- পোনা কোয়ারেন্টাইন ২৪-৪৮ ঘণ্টা
- জাল জীবাণুমুক্তকরণ
- মৃত মাছ মাটিতে পুঁতে ফেলা

## নির্দেশনা:
- বাংলায় উত্তর দিন
- সংক্ষিপ্ত কিন্তু তথ্যবহুল উত্তর দিন
- ডোজ, পরিমাণ ও সময়সীমা উল্লেখ করুন
- বাংলাদেশের প্রেক্ষাপটে উত্তর দিন
- অ্যান্টিবায়োটিক ব্যবহারে সতর্কতা জানান
- প্রোবায়োটিকস ও ভেষজ বিকল্প প্রস্তাব করুন
- মাছ চাষ বহির্ভূত প্রশ্নে বলুন আপনি শুধু মৎস্য বিষয়ে সাহায্য করতে পারেন`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "অনেক বেশি অনুরোধ। কিছুক্ষণ পর আবার চেষ্টা করুন।" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "ক্রেডিট শেষ। অনুগ্রহ করে ক্রেডিট যোগ করুন।" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI সার্ভিসে সমস্যা হয়েছে" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Fish advice chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
