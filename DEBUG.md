# 媒体上传调试指南

## 步骤 1：检查控制台日志

运行应用后，打开控制台查看以下日志：

```
[MediaManager] Girl data: { girl: {...}, girlId: "xxx-xxx-xxx" }
```

**如果 `girl: null` 或 `girlId: ""`，说明当前用户没有关联的 girl 记录。**

### 解决方案：创建 girl 记录

在 Supabase Dashboard → SQL Editor 执行：

```sql
-- 查看当前用户 ID
SELECT auth.uid();

-- 为当前用户创建 girl 记录
INSERT INTO girls (
  user_id,
  username,
  name,
  profile,
  tags,
  gender
) VALUES (
  auth.uid(),  -- 替换为你的用户 ID
  'test_girl_' || substr(md5(random()::text), 1, 6),  -- 随机用户名
  'Test Girl',
  '{"en":"Test profile","zh":"测试资料","th":"Test profile"}'::jsonb,
  '{"en":"test","zh":"测试","th":"test"}'::jsonb,
  0
) RETURNING *;
```

---

## 步骤 2：检查 Edge Functions 是否部署

### 测试 Edge Function：

在 Supabase Dashboard → Edge Functions，检查以下函数是否存在：
- `get-upload-url`
- `remove-tmp`
- `reorder`

### 如果不存在，部署它们：

```bash
cd /Users/allanmbt/Documents/GitHub/cbody-go

# 登录
supabase login

# 链接项目（替换 YOUR_PROJECT_REF）
supabase link --project-ref YOUR_PROJECT_REF

# 部署
supabase functions deploy get-upload-url
supabase functions deploy remove-tmp
supabase functions deploy reorder
```

---

## 步骤 3：检查存储桶

在 Supabase Dashboard → Storage，确保存在以下桶：

1. **`tmp-uploads`** (Private)
2. **`girls-media`** (Private)

### 如果不存在，手动创建或执行 SQL：

```sql
-- 创建存储桶
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('tmp-uploads', 'tmp-uploads', false, 125829120, 
   ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime']),
  ('girls-media', 'girls-media', false, 125829120, 
   ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'])
ON CONFLICT (id) DO NOTHING;
```

---

## 步骤 4：检查数据库表和策略

执行诊断脚本：

```bash
supabase db push
```

或在 SQL Editor 执行 `004_debug_setup.sql` 的内容。

---

## 步骤 5：检查上传日志

再次尝试上传图片，查看控制台日志：

```
[useUploadMedia] Requesting upload URL: {...}
[getUploadUrl] Request: {...}
[getUploadUrl] Response: {...}
```

**常见错误：**

1. **"Forbidden: Not your girl profile"**
   - 当前用户没有对应的 girl 记录
   - 解决：执行步骤 1 创建记录

2. **"Edge Function returned a non-2xx status"**
   - Edge Function 未部署或有错误
   - 解决：执行步骤 2 部署函数

3. **"Failed to create main upload URL"**
   - 存储桶不存在或策略错误
   - 解决：执行步骤 3 创建存储桶

4. **"Maximum 30 media items allowed"**
   - 已达到配额上限
   - 解决：删除一些 pending 或 rejected 的媒体

---

## 步骤 6：验证 RLS 策略

在 SQL Editor 执行：

```sql
-- 测试查询（用你的 girl_id 替换）
SELECT * FROM girls_media WHERE girl_id = 'YOUR_GIRL_ID';

-- 测试插入
INSERT INTO girls_media (
  girl_id, 
  kind, 
  storage_key, 
  created_by,
  status
) VALUES (
  'YOUR_GIRL_ID',
  'image',
  'test/test.jpg',
  auth.uid(),
  'pending'
) RETURNING *;

-- 清理测试数据
DELETE FROM girls_media WHERE storage_key = 'test/test.jpg';
```

如果插入失败，检查 RLS 策略是否正确配置。

---

## 完整检查清单

- [ ] 当前用户有对应的 girl 记录
- [ ] Edge Functions 已部署 (get-upload-url, remove-tmp, reorder)
- [ ] 存储桶已创建 (tmp-uploads, girls-media)
- [ ] girls_media 表存在且 RLS 已启用
- [ ] 表策略正确配置
- [ ] 控制台日志显示详细错误信息
