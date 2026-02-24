import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CalculatorParam {
  id: string;
  module_id: string;
  param_key: string;
  param_value: string;
  param_label: string;
  param_label_bn: string;
  param_group: string;
  param_unit: string;
  display_order: number;
}

export function useCalculatorParams(moduleId?: string) {
  const [params, setParams] = useState<CalculatorParam[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchParams = async () => {
    setLoading(true);
    let query = supabase
      .from("calculator_parameters")
      .select("*")
      .order("display_order", { ascending: true });

    if (moduleId) {
      query = query.eq("module_id", moduleId);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Error fetching calculator params:", error);
    } else {
      setParams((data || []) as CalculatorParam[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchParams();
  }, [moduleId]);

  const getParam = (key: string, defaultValue: number = 0): number => {
    const param = params.find((p) => p.param_key === key);
    return param ? parseFloat(param.param_value) || defaultValue : defaultValue;
  };

  const updateParam = async (id: string, value: string) => {
    const { error } = await supabase
      .from("calculator_parameters")
      .update({ param_value: value })
      .eq("id", id);

    if (error) throw error;
    setParams((prev) =>
      prev.map((p) => (p.id === id ? { ...p, param_value: value } : p))
    );
  };

  return { params, loading, getParam, updateParam, refetch: fetchParams };
}
