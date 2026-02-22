
-- Table to store Google Drive OAuth tokens per user
CREATE TABLE public.google_drive_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  access_token text,
  refresh_token text NOT NULL,
  token_expires_at timestamp with time zone,
  drive_email text,
  connected_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.google_drive_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own drive token"
ON public.google_drive_tokens FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own drive token"
ON public.google_drive_tokens FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own drive token"
ON public.google_drive_tokens FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own drive token"
ON public.google_drive_tokens FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all drive tokens"
ON public.google_drive_tokens FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add user_id column to backup_logs if not already referencing a user
-- Also add backup_scope for admin vs user backups
ALTER TABLE public.backup_logs 
ADD COLUMN IF NOT EXISTS user_id uuid,
ADD COLUMN IF NOT EXISTS backup_scope text NOT NULL DEFAULT 'system',
ADD COLUMN IF NOT EXISTS restore_status text DEFAULT 'none',
ADD COLUMN IF NOT EXISTS restored_at timestamp with time zone;

-- Trigger for updated_at on google_drive_tokens
CREATE TRIGGER update_google_drive_tokens_updated_at
BEFORE UPDATE ON public.google_drive_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Allow users to view their own backup logs
CREATE POLICY "Users can view their own backup logs"
ON public.backup_logs FOR SELECT
USING (auth.uid() = user_id);

-- Allow system inserts to backup_logs (edge functions use service role)
CREATE POLICY "Allow system insert backup logs"
ON public.backup_logs FOR INSERT
WITH CHECK (true);
