
-- Create backup_logs table
CREATE TABLE public.backup_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  backup_type text NOT NULL DEFAULT 'manual',
  status text NOT NULL DEFAULT 'pending',
  file_name text,
  file_size bigint,
  google_drive_file_id text,
  google_drive_url text,
  tables_included text[],
  error_message text,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.backup_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can manage backup logs
CREATE POLICY "Admins can manage backup logs"
  ON public.backup_logs FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view backup logs"
  ON public.backup_logs FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));
