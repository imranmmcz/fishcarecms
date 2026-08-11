-- Blog module schema (posts, images, comments)
CREATE TABLE IF NOT EXISTS blog_posts (
  id CHAR(36) NOT NULL DEFAULT (UUID()),
  user_id CHAR(36) NULL,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  content LONGTEXT NULL,
  category VARCHAR(64) NOT NULL DEFAULT 'general',
  tags JSON NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  is_pinned TINYINT(1) NOT NULL DEFAULT 0,
  is_comments_locked TINYINT(1) NOT NULL DEFAULT 0,
  view_count INT NOT NULL DEFAULT 0,
  comment_count INT NOT NULL DEFAULT 0,
  author_name VARCHAR(191) NULL,
  author_role VARCHAR(64) NOT NULL DEFAULT 'farmer',
  meta_title VARCHAR(255) NULL,
  meta_description TEXT NULL,
  og_image TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_blog_posts_slug (slug),
  KEY idx_blog_posts_status (status),
  KEY idx_blog_posts_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS blog_images (
  id CHAR(36) NOT NULL DEFAULT (UUID()),
  post_id CHAR(36) NOT NULL,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT NULL,
  alt_text VARCHAR(255) NULL,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_blog_images_post (post_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS blog_comments (
  id CHAR(36) NOT NULL DEFAULT (UUID()),
  post_id CHAR(36) NOT NULL,
  user_id CHAR(36) NULL,
  parent_id CHAR(36) NULL,
  author_name VARCHAR(191) NOT NULL,
  author_role VARCHAR(64) NOT NULL DEFAULT 'farmer',
  comment_text TEXT NOT NULL,
  image_url TEXT NULL,
  helpful_count INT NOT NULL DEFAULT 0,
  status VARCHAR(32) NOT NULL DEFAULT 'approved',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_blog_comments_post (post_id),
  KEY idx_blog_comments_parent (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
