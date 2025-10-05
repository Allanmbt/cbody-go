-- 1. 创建枚举类型
CREATE TYPE media_kind AS ENUM ('image', 'video', 'live_photo');
CREATE TYPE media_status AS ENUM ('pending', 'approved', 'rejected');

-- 2. 创建 girls_media 表（如果不存在）
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

-- 3. 创建索引
CREATE INDEX IF NOT EXISTS idx_gm_girl_sort ON girls_media(girl_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_gm_status ON girls_media(status);
CREATE INDEX IF NOT EXISTS idx_gm_level ON girls_media(min_user_level);

-- 4. 启用 RLS
ALTER TABLE girls_media ENABLE ROW LEVEL SECURITY;

-- 5. 删除旧策略（如果存在）
DROP POLICY IF EXISTS "Girls media are viewable by everyone" ON girls_media;
DROP POLICY IF EXISTS "Girls can view their own media" ON girls_media;
DROP POLICY IF EXISTS "Girls can insert their own media" ON girls_media;
DROP POLICY IF EXISTS "Girls can update their own media" ON girls_media;
DROP POLICY IF EXISTS "Girls can delete their pending media" ON girls_media;
DROP POLICY IF EXISTS "Girls media are manageable by admins" ON girls_media;

-- 6. 创建新策略
-- 所有人可查看已审核通过的媒体
CREATE POLICY "Girls media are viewable by everyone" 
  ON girls_media FOR SELECT 
  USING (status = 'approved');

-- 技师可查看自己的所有媒体
CREATE POLICY "Girls can view their own media" 
  ON girls_media FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM girls g 
      WHERE g.id = girl_id AND g.user_id = auth.uid()
    )
  );

-- 技师可插入媒体（修复：确保girl存在且属于当前用户）
CREATE POLICY "Girls can insert their own media" 
  ON girls_media FOR INSERT 
  WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM girls g 
      WHERE g.id = girl_id 
        AND g.user_id = auth.uid()
        AND g.is_blocked = false
    )
  );

-- 技师可更新自己的pending/rejected媒体
CREATE POLICY "Girls can update their own media" 
  ON girls_media FOR UPDATE 
  USING (
    created_by = auth.uid() AND
    status IN ('pending', 'rejected') AND
    EXISTS (
      SELECT 1 FROM girls g 
      WHERE g.id = girl_id AND g.user_id = auth.uid()
    )
  )
  WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM girls g 
      WHERE g.id = girl_id AND g.user_id = auth.uid()
    )
  );

-- 技师可删除待审核或驳回的媒体
CREATE POLICY "Girls can delete their pending media" 
  ON girls_media FOR DELETE 
  USING (
    status IN ('pending', 'rejected') AND 
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM girls g 
      WHERE g.id = girl_id AND g.user_id = auth.uid()
    )
  );

-- 管理员全权限
CREATE POLICY "Girls media are manageable by admins" 
  ON girls_media FOR ALL 
  USING (public.is_admin());

-- 7. 授予表权限
GRANT SELECT, INSERT, UPDATE, DELETE ON girls_media TO authenticated;

-- 8. 自动更新 updated_at 触发器
CREATE OR REPLACE FUNCTION update_girls_media_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_girls_media_updated_at_trigger ON girls_media;
CREATE TRIGGER update_girls_media_updated_at_trigger
  BEFORE UPDATE ON girls_media
  FOR EACH ROW
  EXECUTE FUNCTION update_girls_media_updated_at();
