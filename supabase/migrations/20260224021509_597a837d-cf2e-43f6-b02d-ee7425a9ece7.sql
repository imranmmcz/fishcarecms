
-- Calculator parameters table for admin-editable formula constants
CREATE TABLE public.calculator_parameters (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id text NOT NULL,
  param_key text NOT NULL,
  param_value text NOT NULL DEFAULT '0',
  param_label text NOT NULL,
  param_label_bn text NOT NULL,
  param_group text NOT NULL DEFAULT 'general',
  param_unit text DEFAULT '',
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(module_id, param_key)
);

-- Enable RLS
ALTER TABLE public.calculator_parameters ENABLE ROW LEVEL SECURITY;

-- Anyone can read parameters
CREATE POLICY "Anyone can view calculator parameters"
ON public.calculator_parameters FOR SELECT USING (true);

-- Admins can manage
CREATE POLICY "Admins can manage calculator parameters"
ON public.calculator_parameters FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_calculator_parameters_updated_at
BEFORE UPDATE ON public.calculator_parameters
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default parameters

-- Pond Calculator
INSERT INTO calculator_parameters (module_id, param_key, param_value, param_label, param_label_bn, param_group, param_unit, display_order) VALUES
('pond', 'shotak_sqm', '40.47', 'Shotak to Sq Meters', '১ শতক = বর্গমিটার', 'unit_conversion', 'বর্গমিটার', 1),
('pond', 'katha_sqm', '66.89', 'Katha to Sq Meters', '১ কাঠা = বর্গমিটার', 'unit_conversion', 'বর্গমিটার', 2),
('pond', 'bigha_sqm', '1338.84', 'Bigha to Sq Meters', '১ বিঘা = বর্গমিটার', 'unit_conversion', 'বর্গমিটার', 3),
('pond', 'acre_sqm', '4046.86', 'Acre to Sq Meters', '১ একর = বর্গমিটার', 'unit_conversion', 'বর্গমিটার', 4),
('pond', 'hectare_sqm', '10000', 'Hectare to Sq Meters', '১ হেক্টর = বর্গমিটার', 'unit_conversion', 'বর্গমিটার', 5),
('pond', 'feet_to_meter', '0.3048', 'Feet to Meter', '১ ফুট = মিটার', 'unit_conversion', 'মিটার', 6);

-- Feed Management
INSERT INTO calculator_parameters (module_id, param_key, param_value, param_label, param_label_bn, param_group, param_unit, display_order) VALUES
('feed', 'starter_rate', '8', 'Starter Feed Rate', 'স্টার্টার ফিড হার', 'feed_rate', '% বায়োমাস', 1),
('feed', 'grower_rate', '5', 'Grower Feed Rate', 'গ্রোয়ার ফিড হার', 'feed_rate', '% বায়োমাস', 2),
('feed', 'finisher_rate', '3', 'Finisher Feed Rate', 'ফিনিশার ফিড হার', 'feed_rate', '% বায়োমাস', 3),
('feed', 'starter_fcr', '1.2', 'Starter FCR', 'স্টার্টার FCR', 'fcr', '', 4),
('feed', 'grower_fcr', '1.5', 'Grower FCR', 'গ্রোয়ার FCR', 'fcr', '', 5),
('feed', 'finisher_fcr', '1.8', 'Finisher FCR', 'ফিনিশার FCR', 'fcr', '', 6),
('feed', 'meals_per_day', '3', 'Meals Per Day', 'দৈনিক খাওয়ানোর সংখ্যা', 'general', 'বার', 7);

-- Fertilizer Calculator
INSERT INTO calculator_parameters (module_id, param_key, param_value, param_label, param_label_bn, param_group, param_unit, display_order) VALUES
('fertilizer', 'new_urea', '0.1', 'New Pond Urea', 'নতুন পুকুর ইউরিয়া', 'new_pond', 'কেজি/শতক', 1),
('fertilizer', 'new_tsp', '0.15', 'New Pond TSP', 'নতুন পুকুর TSP', 'new_pond', 'কেজি/শতক', 2),
('fertilizer', 'new_lime', '0.5', 'New Pond Lime', 'নতুন পুকুর চুন', 'new_pond', 'কেজি/শতক', 3),
('fertilizer', 'new_oilcake', '2', 'New Pond Oil Cake', 'নতুন পুকুর খৈল', 'new_pond', 'কেজি/শতক', 4),
('fertilizer', 'new_mop', '0.05', 'New Pond MOP', 'নতুন পুকুর MOP', 'new_pond', 'কেজি/শতক', 5),
('fertilizer', 'regular_urea', '0.05', 'Regular Pond Urea', 'পুরাতন পুকুর ইউরিয়া', 'regular_pond', 'কেজি/শতক', 6),
('fertilizer', 'regular_tsp', '0.08', 'Regular Pond TSP', 'পুরাতন পুকুর TSP', 'regular_pond', 'কেজি/শতক', 7),
('fertilizer', 'regular_lime', '0.3', 'Regular Pond Lime', 'পুরাতন পুকুর চুন', 'regular_pond', 'কেজি/শতক', 8),
('fertilizer', 'regular_oilcake', '1', 'Regular Pond Oil Cake', 'পুরাতন পুকুর খৈল', 'regular_pond', 'কেজি/শতক', 9),
('fertilizer', 'regular_mop', '0.03', 'Regular Pond MOP', 'পুরাতন পুকুর MOP', 'regular_pond', 'কেজি/শতক', 10);

-- Biomass Calculator
INSERT INTO calculator_parameters (module_id, param_key, param_value, param_label, param_label_bn, param_group, param_unit, display_order) VALUES
('biomass', 'decimal_divisor', '100', 'Biomass Per Decimal Divisor', 'প্রতি শতক বায়োমাস ভাগক', 'general', '', 1);

-- Stocking Density / Cost Parameters
INSERT INTO calculator_parameters (module_id, param_key, param_value, param_label, param_label_bn, param_group, param_unit, display_order) VALUES
('stocking', 'liming_rate', '1', 'Liming Rate', 'চুনের হার', 'pond_preparation', 'কেজি/শতক', 1),
('stocking', 'liming_price', '15', 'Liming Price', 'চুনের দাম', 'pond_preparation', 'টাকা/কেজি', 2),
('stocking', 'fertilizer_rate', '5', 'Fertilizer Rate', 'সারের হার', 'pond_preparation', 'কেজি/শতক', 3),
('stocking', 'fertilizer_price', '20', 'Fertilizer Price', 'সারের দাম', 'pond_preparation', 'টাকা/কেজি', 4),
('stocking', 'rotenone_rate', '30', 'Rotenone Rate', 'রোটেননের হার', 'pond_preparation', 'গ্রাম/শতক/ফুট', 5),
('stocking', 'rotenone_price', '800', 'Rotenone Price', 'রোটেননের দাম', 'pond_preparation', 'টাকা/কেজি', 6),
('stocking', 'pond_repair', '200', 'Pond Repair Cost', 'পাড় মেরামত খরচ', 'pond_preparation', 'টাকা/শতক', 7),
('stocking', 'daily_wage', '500', 'Daily Wage', 'দৈনিক মজুরি', 'labor', 'টাকা', 8),
('stocking', 'feeding_days', '30', 'Feeding Days/Month', 'মাসিক খাদ্য প্রদান দিন', 'labor', 'দিন', 9),
('stocking', 'maintenance_days', '8', 'Maintenance Days/Month', 'রক্ষণাবেক্ষণ দিন', 'labor', 'দিন', 10),
('stocking', 'harvest_labor', '100', 'Harvest Labor Cost', 'আহরণ শ্রমিক খরচ', 'labor', 'টাকা/শতক', 11),
('stocking', 'floating_feed_price', '55', 'Floating Feed Price', 'ভাসমান খাদ্যের দাম', 'feed', 'টাকা/কেজি', 12),
('stocking', 'sinking_feed_price', '48', 'Sinking Feed Price', 'ডুবন্ত খাদ্যের দাম', 'feed', 'টাকা/কেজি', 13),
('stocking', 'medicine_monthly', '50', 'Monthly Medicine Cost', 'মাসিক ঔষধ খরচ', 'medicine', 'টাকা/শতক', 14),
('stocking', 'water_treatment', '30', 'Water Treatment Cost', 'পানি শোধন খরচ', 'medicine', 'টাকা/শতক/মাস', 15),
('stocking', 'net_hauling', '50', 'Net Hauling Cost', 'জাল টানার খরচ', 'equipment', 'টাকা/শতক', 16),
('stocking', 'net_purchase', '12000', 'Net Purchase Cost', 'জাল কেনার খরচ', 'equipment', 'টাকা/১০০ শতক', 17),
('stocking', 'transport_cost', '5', 'Transport Cost', 'পরিবহন খরচ', 'miscellaneous', 'টাকা/কেজি', 18),
('stocking', 'marketing_pct', '2', 'Marketing Percentage', 'বাজারজাতকরণ হার', 'miscellaneous', '%', 19);

-- Water Quality
INSERT INTO calculator_parameters (module_id, param_key, param_value, param_label, param_label_bn, param_group, param_unit, display_order) VALUES
('water', 'ph_min', '6.5', 'Minimum pH', 'সর্বনিম্ন pH', 'ideal_range', '', 1),
('water', 'ph_max', '8.5', 'Maximum pH', 'সর্বোচ্চ pH', 'ideal_range', '', 2),
('water', 'do_min', '5', 'Minimum Dissolved Oxygen', 'সর্বনিম্ন দ্রবীভূত অক্সিজেন', 'ideal_range', 'mg/L', 3),
('water', 'ammonia_max', '0.02', 'Maximum Ammonia', 'সর্বোচ্চ অ্যামোনিয়া', 'ideal_range', 'mg/L', 4),
('water', 'temp_min', '25', 'Minimum Temperature', 'সর্বনিম্ন তাপমাত্রা', 'ideal_range', '°C', 5),
('water', 'temp_max', '32', 'Maximum Temperature', 'সর্বোচ্চ তাপমাত্রা', 'ideal_range', '°C', 6);

-- Cost Calculator
INSERT INTO calculator_parameters (module_id, param_key, param_value, param_label, param_label_bn, param_group, param_unit, display_order) VALUES
('cost', 'electricity_rate', '8', 'Electricity Rate', 'বিদ্যুৎ খরচ', 'utility', 'টাকা/ইউনিট', 1),
('cost', 'land_lease_rate', '5000', 'Land Lease Rate', 'জমি ভাড়া', 'fixed_cost', 'টাকা/শতক/বছর', 2);

-- Medicine
INSERT INTO calculator_parameters (module_id, param_key, param_value, param_label, param_label_bn, param_group, param_unit, display_order) VALUES
('medicine', 'potash_rate', '0.5', 'Potash Rate', 'পটাশ হার', 'dosage', 'কেজি/শতক', 1),
('medicine', 'salt_rate', '1', 'Salt Rate', 'লবণ হার', 'dosage', 'কেজি/শতক', 2),
('medicine', 'lime_treatment', '0.5', 'Lime Treatment', 'চুন প্রয়োগ', 'dosage', 'কেজি/শতক', 3);
