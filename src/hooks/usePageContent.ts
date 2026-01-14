import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PageSection {
  id: string;
  section_key: string;
  section_name: string;
  content: Record<string, any>;
  is_active: boolean;
  display_order: number;
}

export function usePageContent() {
  const [sections, setSections] = useState<PageSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      const { data, error } = await supabase
        .from("page_content")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) throw error;
      
      // Type assertion for the data
      const typedData = (data || []) as unknown as PageSection[];
      setSections(typedData);
    } catch (err) {
      console.error("Error fetching page content:", err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const getSection = (key: string): PageSection | undefined => {
    return sections.find(s => s.section_key === key);
  };

  const getSectionContent = <T = Record<string, any>>(key: string): T | null => {
    const section = getSection(key);
    return section ? (section.content as T) : null;
  };

  const isSectionActive = (key: string): boolean => {
    const section = getSection(key);
    return section?.is_active ?? false;
  };

  return {
    sections,
    loading,
    error,
    getSection,
    getSectionContent,
    isSectionActive,
    refetch: fetchSections
  };
}
