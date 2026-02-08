import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface HeroSlide {
  id: string;
  title: string;
  subtitle: string | null;
  tagline: string | null;
  tagline_icon: string | null;
  button_text: string | null;
  button_link: string | null;
  button_variant: string | null;
  background_type: string;
  background_value: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useHeroSlides() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchSlides();
  }, []);

  const fetchSlides = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("hero_slides")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      setSlides((data || []) as HeroSlide[]);
    } catch (err) {
      console.error("Error fetching hero slides:", err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllSlides = async () => {
    try {
      setLoading(true);
      // For admin - fetch all slides including inactive ones
      const { data, error } = await supabase
        .from("hero_slides")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      return (data || []) as HeroSlide[];
    } catch (err) {
      console.error("Error fetching all hero slides:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createSlide = async (slide: Omit<HeroSlide, "id" | "created_at" | "updated_at">) => {
    const { data, error } = await supabase
      .from("hero_slides")
      .insert(slide)
      .select()
      .single();

    if (error) throw error;
    await fetchSlides();
    return data as HeroSlide;
  };

  const updateSlide = async (id: string, updates: Partial<HeroSlide>) => {
    const { data, error } = await supabase
      .from("hero_slides")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    await fetchSlides();
    return data as HeroSlide;
  };

  const deleteSlide = async (id: string) => {
    const { error } = await supabase
      .from("hero_slides")
      .delete()
      .eq("id", id);

    if (error) throw error;
    await fetchSlides();
  };

  return {
    slides,
    loading,
    error,
    fetchSlides,
    fetchAllSlides,
    createSlide,
    updateSlide,
    deleteSlide,
    refetch: fetchSlides
  };
}
