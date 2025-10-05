-- Debug script: 检查并修复媒体上传所需的所有配置

-- 1. 检查枚举类型是否存在
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'media_kind') THEN
        CREATE TYPE media_kind AS ENUM ('image', 'video', 'live_photo');
        RAISE NOTICE 'Created media_kind enum';
    ELSE
        RAISE NOTICE 'media_kind enum already exists';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'media_status') THEN
        CREATE TYPE media_status AS ENUM ('pending', 'approved', 'rejected');
        RAISE NOTICE 'Created media_status enum';
    ELSE
        RAISE NOTICE 'media_status enum already exists';
    END IF;
END $$;

-- 2. 确保 girls_media 表存在
CREATE TABLE IF NOT EXISTS girls_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  girl_id UUID NOT NULL REFERENCES girls(id) ON DELETE CASCADE,
  kind media_kind NOT NULL,
  storage_key TEXT NOT NULL,
  thumb_key TEXT,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  min_user_level SMALLINT NOT NULL DEFAULT 0,
  status media_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  reject_reason TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. 确保索引存在
CREATE INDEX IF NOT EXISTS idx_gm_girl_sort ON girls_media(girl_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_gm_status ON girls_media(status);
CREATE INDEX IF NOT EXISTS idx_gm_level ON girls_media(min_user_level);
CREATE INDEX IF NOT EXISTS idx_gm_created_by ON girls_media(created_by);

-- 4. 启用 RLS
ALTER TABLE girls_media ENABLE ROW LEVEL SECURITY;

-- 5. 授予表权限
GRANT SELECT, INSERT, UPDATE, DELETE ON girls_media TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- 6. 显示诊断信息
DO $$
DECLARE
    girl_count INTEGER;
    media_count INTEGER;
    bucket_count INTEGER;
BEGIN
    -- 检查 girls 表
    SELECT COUNT(*) INTO girl_count FROM girls;
    RAISE NOTICE 'Total girls in database: %', girl_count;

    -- 检查 girls_media 表
    SELECT COUNT(*) INTO media_count FROM girls_media;
    RAISE NOTICE 'Total media in database: %', media_count;

    -- 检查存储桶
    SELECT COUNT(*) INTO bucket_count FROM storage.buckets WHERE id IN ('tmp-uploads', 'girls-media');
    RAISE NOTICE 'Storage buckets created: %', bucket_count;

    IF bucket_count < 2 THEN
        RAISE WARNING 'Missing storage buckets! Please create them manually.';
    END IF;
END $$;
