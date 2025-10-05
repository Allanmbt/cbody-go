-- 1. 创建存储桶（如果不存在）
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('tmp-uploads', 'tmp-uploads', false, 125829120, ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime']),
  ('girls-media', 'girls-media', false, 125829120, ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'])
ON CONFLICT (id) DO NOTHING;

-- 2. 删除旧的存储策略
DROP POLICY IF EXISTS "技师可上传到自己目录" ON storage.objects;
DROP POLICY IF EXISTS "技师可读取自己目录" ON storage.objects;
DROP POLICY IF EXISTS "技师可删除自己目录" ON storage.objects;
DROP POLICY IF EXISTS "tmp_uploads_insert" ON storage.objects;
DROP POLICY IF EXISTS "tmp_uploads_select" ON storage.objects;
DROP POLICY IF EXISTS "tmp_uploads_delete" ON storage.objects;

-- 3. tmp-uploads 桶策略（技师只能访问自己的目录）
CREATE POLICY "tmp_uploads_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'tmp-uploads' 
  AND (string_to_array(name, '/'))[1] = auth.uid()::text
);

CREATE POLICY "tmp_uploads_select"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'tmp-uploads' 
  AND (string_to_array(name, '/'))[1] = auth.uid()::text
);

CREATE POLICY "tmp_uploads_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'tmp-uploads' 
  AND (string_to_array(name, '/'))[1] = auth.uid()::text
);

CREATE POLICY "tmp_uploads_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'tmp-uploads' 
  AND (string_to_array(name, '/'))[1] = auth.uid()::text
);

-- 4. girls-media 桶策略（所有人可读approved，管理员可写）
CREATE POLICY "girls_media_select"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'girls-media');

CREATE POLICY "girls_media_admin_all"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'girls-media' 
  AND public.is_admin()
);
