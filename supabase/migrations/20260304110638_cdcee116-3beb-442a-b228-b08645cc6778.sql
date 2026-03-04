
-- Blog posts table
CREATE TABLE public.blog_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  tags TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  is_pinned BOOLEAN DEFAULT false,
  is_comments_locked BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  author_name TEXT,
  author_role TEXT DEFAULT 'guest',
  meta_title TEXT,
  meta_description TEXT,
  og_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Blog images table
CREATE TABLE public.blog_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.blog_posts(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  alt_text TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Blog comments table
CREATE TABLE public.blog_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.blog_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  parent_id UUID REFERENCES public.blog_comments(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_role TEXT DEFAULT 'guest',
  comment_text TEXT NOT NULL,
  image_url TEXT,
  helpful_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'approved',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Blog comment helpful votes
CREATE TABLE public.blog_comment_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID REFERENCES public.blog_comments(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

-- Enable RLS
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_comment_votes ENABLE ROW LEVEL SECURITY;

-- Blog posts policies
CREATE POLICY "Anyone can view approved posts" ON public.blog_posts FOR SELECT USING (status = 'approved');
CREATE POLICY "Admins can manage all posts" ON public.blog_posts FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated users can create posts" ON public.blog_posts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());
CREATE POLICY "Users can update own posts" ON public.blog_posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON public.blog_posts FOR DELETE USING (auth.uid() = user_id);

-- Blog images policies
CREATE POLICY "Anyone can view blog images" ON public.blog_images FOR SELECT USING (true);
CREATE POLICY "Admins can manage blog images" ON public.blog_images FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Auth users can insert blog images" ON public.blog_images FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Blog comments policies
CREATE POLICY "Anyone can view approved comments" ON public.blog_comments FOR SELECT USING (status = 'approved');
CREATE POLICY "Admins can manage all comments" ON public.blog_comments FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Auth users can create comments" ON public.blog_comments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own comments" ON public.blog_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.blog_comments FOR DELETE USING (auth.uid() = user_id);

-- Blog comment votes policies
CREATE POLICY "Anyone can view votes" ON public.blog_comment_votes FOR SELECT USING (true);
CREATE POLICY "Auth users can vote" ON public.blog_comment_votes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());
CREATE POLICY "Users can remove own votes" ON public.blog_comment_votes FOR DELETE USING (auth.uid() = user_id);

-- Trigger to update helpful_count
CREATE OR REPLACE FUNCTION public.update_blog_comment_helpful_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.blog_comments SET helpful_count = helpful_count + 1 WHERE id = NEW.comment_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.blog_comments SET helpful_count = helpful_count - 1 WHERE id = OLD.comment_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER blog_comment_vote_trigger
  AFTER INSERT OR DELETE ON public.blog_comment_votes
  FOR EACH ROW EXECUTE FUNCTION public.update_blog_comment_helpful_count();

-- Trigger to update comment_count on blog_posts
CREATE OR REPLACE FUNCTION public.update_blog_post_comment_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.blog_posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.blog_posts SET comment_count = comment_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER blog_comment_count_trigger
  AFTER INSERT OR DELETE ON public.blog_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_blog_post_comment_count();

-- Storage bucket for blog images
INSERT INTO storage.buckets (id, name, public) VALUES ('blog-images', 'blog-images', true);

-- Storage policies for blog-images bucket
CREATE POLICY "Anyone can view blog images" ON storage.objects FOR SELECT USING (bucket_id = 'blog-images');
CREATE POLICY "Auth users can upload blog images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'blog-images' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete own blog images" ON storage.objects FOR DELETE USING (bucket_id = 'blog-images' AND auth.uid() IS NOT NULL);

-- Enable realtime for blog comments
ALTER PUBLICATION supabase_realtime ADD TABLE public.blog_comments;
