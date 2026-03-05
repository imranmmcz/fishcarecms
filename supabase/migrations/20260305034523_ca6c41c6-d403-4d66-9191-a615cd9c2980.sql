ALTER TABLE public.hero_slides 
ADD COLUMN IF NOT EXISTS bg_size text DEFAULT 'cover',
ADD COLUMN IF NOT EXISTS bg_position text DEFAULT 'center',
ADD COLUMN IF NOT EXISTS bg_opacity numeric DEFAULT 1;