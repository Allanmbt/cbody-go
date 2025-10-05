## 公共函数

### 1) 角色判断函数：只读、可被策略安全调用
```sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_profiles ap
    WHERE ap.id = auth.uid()
      AND ap.is_active = true
      AND ap.role IN ('admin','superadmin')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_profiles ap
    WHERE ap.id = auth.uid()
      AND ap.is_active = true
      AND ap.role = 'superadmin'
  );
$$;

-- 2) 基础 GRANT（表级权限 + 函数可执行）
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_superadmin() TO authenticated;

-- user_profiles / user_connected_accounts 表权限
GRANT SELECT, INSERT, UPDATE ON public.user_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_connected_accounts TO authenticated;

```

## admin_profiles 策略

### 1. 超级管理员可以查看所有管理员
```sql

CREATE POLICY "admin.self.select"
  ON public.admin_profiles
  FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "admin.self.update"
  ON public.admin_profiles
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "admin.super.select"
  ON public.admin_profiles
  FOR SELECT
  USING (public.is_superadmin());

CREATE POLICY "admin.super.update"
  ON public.admin_profiles
  FOR UPDATE
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());

CREATE POLICY "admin.super.insert"
  ON public.admin_profiles
  FOR INSERT
  WITH CHECK (public.is_superadmin());

```

## 操作日志访问策略
```sql
CREATE POLICY "superadmin_can_view_operation_logs" ON admin_operation_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_profiles 
            WHERE id = auth.uid() AND role = 'superadmin' AND is_active = true
        )
    );

CREATE POLICY "superadmin_can_insert_operation_logs" ON admin_operation_logs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM admin_profiles 
            WHERE id = auth.uid() AND role = 'superadmin' AND is_active = true
        )
    );

```
## cities城市表策略

### 读取权限（所有人可读）
```sql
CREATE POLICY "Cities are viewable by everyone" 
    ON cities FOR SELECT 
    USING (is_active = true);

```
### 管理员写入权限
```sql
CREATE POLICY "Cities are manageable by admins" 
    ON cities FOR ALL 
    USING (auth.jwt() ->> 'role' = 'admin');

```

## categories分类表策略

### 读取权限（所有人可读）
```sql
CREATE POLICY "Categories are viewable by everyone" 
    ON categories FOR SELECT 
    USING (is_active = true);

```
### 管理员写入权限
```sql
CREATE POLICY "Categories are manageable by admins" 
    ON categories FOR ALL 
    USING (auth.jwt() ->> 'role' = 'admin');
    
```


## girls表策略

### 读取权限
```sql
CREATE POLICY "Girls are viewable by everyone" 
    ON girls FOR SELECT 
    USING (NOT is_blocked);

```
### 女孩自己可以更新
```sql
CREATE POLICY "Girls can update their own profile" 
    ON girls FOR UPDATE 
    USING (auth.uid() = user_id);

```
### 管理员全权限
```sql
CREATE POLICY "Girls are manageable by admins" 
    ON girls FOR ALL 
    USING (auth.jwt() ->> 'role' = 'admin');

```

## girls_status表策略

### 读取权限
```sql
CREATE POLICY "Girls status are viewable by everyone" 
    ON girls_status FOR SELECT 
    USING (true);

```
### 女孩自己可以更新
```sql
CREATE POLICY "Girls can update their own status" 
    ON girls_status FOR ALL 
    USING (EXISTS (
        SELECT 1 FROM girls g 
        WHERE g.id = girl_id AND g.user_id = auth.uid()
    ));

```

### 管理员全权限
```sql
CREATE POLICY "Girls status are manageable by admins" 
    ON girls_status FOR ALL 
    USING (auth.jwt() ->> 'role' = 'admin');

```

## girls_media表策略

```sql
-- 所有人可查看已审核通过的媒体
CREATE POLICY "Girls media are viewable by everyone" 
  ON girls_media FOR SELECT 
  USING (status = 'approved');

-- 技师可查看自己的所有媒体
CREATE POLICY "Girls can view their own media" 
  ON girls_media FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM girls g 
    WHERE g.id = girl_id AND g.user_id = auth.uid()
  ));

  -- 技师可插入媒体
CREATE POLICY "Girls can insert their own media" 
  ON girls_media FOR INSERT 
  WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM girls g 
      WHERE g.id = girl_id AND g.user_id = auth.uid()
    )
  );

-- 技师可更新自己的媒体
CREATE POLICY "Girls can update their own media" 
  ON girls_media FOR UPDATE 
  USING (
    created_by = auth.uid() AND
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

-- 技师可删除待审核的媒体
CREATE POLICY "Girls can delete their pending media" 
  ON girls_media FOR DELETE 
  USING (
    status = 'pending' AND 
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


```


## girls_categories表策略

```sql
CREATE POLICY "Girls categories are viewable by everyone" 
    ON girls_categories FOR SELECT 
    USING (true);

CREATE POLICY "Girls categories are manageable by admins" 
    ON girls_categories FOR ALL 
    USING (public.is_admin());

```


## services表策略

### 服务项目（所有人可读活跃服务）
```sql
CREATE POLICY "Services are viewable by everyone" 
    ON services FOR SELECT 
    USING (is_active = true);

```
### 管理员全权限
```sql
CREATE POLICY "Services are manageable by admins" 
    ON services FOR ALL 
    using ((auth.jwt()->>'role') in ('admin','superadmin'))
with check ((auth.jwt()->>'role') in ('admin','superadmin'));

```

## service_durations表策略

### 服务时长（所有人可读活跃时长）
```sql
CREATE POLICY "Service durations are viewable by everyone" 
    ON service_durations FOR SELECT 
    USING (is_active = true);


```
### 管理员全权限
```sql
CREATE POLICY "Service durations are manageable by admins" 
    ON service_durations FOR ALL 
   using ((auth.jwt()->>'role') in ('admin','superadmin'))
with check ((auth.jwt()->>'role') in ('admin','superadmin'));

```

## admin_girl_services表策略

### 管理员技师服务绑定
```sql
CREATE POLICY "Admin girl services are viewable by everyone" 
    ON admin_girl_services FOR SELECT 
    USING (is_qualified = true);

```
### 管理员全权限
```sql
CREATE POLICY "Admin girl services are manageable by admins" 
    ON admin_girl_services FOR ALL 
    USING (auth.jwt() ->> 'role' = 'admin');

```

## girl_service_durations表策略

### 技师服务时长配置
```sql
CREATE POLICY "Girl service durations are viewable by everyone" 
    ON girl_service_durations FOR SELECT 
    USING (is_active = true);

CREATE POLICY "Girls can manage their own service durations" 
    ON girl_service_durations FOR ALL 
    USING (EXISTS (
        SELECT 1 FROM admin_girl_services ags 
        JOIN girls g ON g.id = ags.girl_id 
        WHERE ags.id = admin_girl_service_id AND g.user_id = auth.uid()
    ));

```
### 管理员全权限
```sql
CREATE POLICY "Girl service durations are manageable by admins" 
    ON girl_service_durations FOR ALL 
    USING (auth.jwt() ->> 'role' = 'admin');

```

## user_profiles 表策略
```sql
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_profiles.self.select"
  ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "user_profiles.self.update"
  ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "user_profiles.self.insert"
  ON public.user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "user_profiles.admin.select"
  ON public.user_profiles
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY "user_profiles.admin.update"
  ON public.user_profiles
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

```

## user_connected_accounts  表策略

```sql
-- 每人仅一个 is_primary（建议用部分唯一索引替代触发器）
CREATE UNIQUE INDEX IF NOT EXISTS uniq_primary_account_per_user
  ON public.user_connected_accounts (user_id)
  WHERE is_primary = true;

CREATE POLICY "uconn.self.select"
  ON public.user_connected_accounts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "uconn.self.mutate"
  ON public.user_connected_accounts
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "uconn.admin.select"
  ON public.user_connected_accounts
  FOR SELECT
  USING (public.is_admin());

```

## user_addresses 表策略
```sql
-- 5. 用户可以查看自己的地址
CREATE POLICY "user_addresses.self.select"
  ON user_addresses
  FOR SELECT
  USING (user_id = auth.uid());

-- 6. 用户可以插入自己的地址
CREATE POLICY "user_addresses.self.insert"
  ON user_addresses
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- 7. 用户可以更新自己的地址
CREATE POLICY "user_addresses.self.update"
  ON user_addresses
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 8. 用户可以删除自己的地址
CREATE POLICY "user_addresses.self.delete"
  ON user_addresses
  FOR DELETE
  USING (user_id = auth.uid());

-- 9. 管理员可以查看所有地址
CREATE POLICY "user_addresses.admin.select"
  ON user_addresses
  FOR SELECT
  USING (public.is_admin());

-- 10. 管理员可以删除任何地址
CREATE POLICY "user_addresses.admin.delete"
  ON user_addresses
  FOR DELETE
  USING (public.is_admin());

```
## 触发器

### 价格范围验证
```sql
CREATE OR REPLACE FUNCTION validate_girl_service_price()
RETURNS TRIGGER AS $$
DECLARE
    duration_record service_durations%ROWTYPE;
BEGIN
    IF NEW.custom_price IS NOT NULL THEN
        SELECT * INTO duration_record 
        FROM service_durations sd
        JOIN admin_girl_services ags ON ags.service_id = sd.service_id
        WHERE ags.id = NEW.admin_girl_service_id 
        AND sd.id = NEW.service_duration_id;
        
        IF NEW.custom_price < duration_record.min_price OR NEW.custom_price > duration_record.max_price THEN
            RAISE EXCEPTION 'Custom price % is not within allowed range % - %', 
                NEW.custom_price, duration_record.min_price, duration_record.max_price;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER validate_girl_service_price_trigger
    BEFORE INSERT OR UPDATE ON girl_service_durations
    FOR EACH ROW
    EXECUTE FUNCTION validate_girl_service_price();

```

### 自动更新女孩位置的
```sql
CREATE OR REPLACE FUNCTION update_girls_status_location()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    IF NEW.current_lat IS NOT NULL AND NEW.current_lng IS NOT NULL THEN
        NEW.location_geom = ST_SetSRID(ST_MakePoint(NEW.current_lng, NEW.current_lat), 4326);
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_girls_status_location_trigger
    BEFORE INSERT OR UPDATE ON girls_status
    FOR EACH ROW
    EXECUTE FUNCTION update_girls_status_location();

```


### 创建确保每个客户端users用户只有一个主登录方式的触发器函数
```sql
CREATE OR REPLACE FUNCTION ensure_single_primary_account()
RETURNS TRIGGER AS $$
BEGIN
    -- 如果新记录设为主要登录方式，则将该用户的其他记录设为非主要
    IF NEW.is_primary = true THEN
        UPDATE user_connected_accounts 
        SET is_primary = false 
        WHERE user_id = NEW.user_id AND id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 创建触发器
CREATE TRIGGER ensure_single_primary_account_trigger
    BEFORE INSERT OR UPDATE ON user_connected_accounts
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_primary_account();

 ```

### 当有新用户插入 auth.users 时触发
```sql
-- 函数：当 auth.users 插入新用户时，自动在 user_profiles 建档
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  -- 避免重复插入
  if exists (select 1 from public.user_profiles where id = new.id) then
    return new;
  end if;

  insert into public.user_profiles (
    id,
    username,
    display_name,
    avatar_url,
    language_code,
    level,
    experience,
    credit_score,
    notification_settings,
    preferences,
    is_banned,
    created_at,
    updated_at
  )
  values (
    new.id,
    null,
    coalesce(new.raw_user_meta_data->>'full_name', 'Guest'),
    coalesce(new.raw_user_meta_data->>'avatar_url', ''),
    coalesce(new.raw_user_meta_data->>'language', 'en'),
    1, 0, 100,
    '{"email":true,"push":true,"sms":false}'::jsonb,
    '{}'::jsonb,
    false, now(), now()
  );

  return new;
end;
$$;

-- 触发器：监听 auth.users 新增
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();
 ```


### 地址数量限制（新增）

```sql
-- 限制每个用户最多 5 条地址
create or replace function enforce_max_5_addresses()
returns trigger as $$
begin
  if (select count(*) from user_addresses where user_id = new.user_id) >= 5 then
    raise exception 'You can only save up to 5 addresses.';
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_enforce_max_5_addresses on user_addresses;

create trigger trg_enforce_max_5_addresses
before insert on user_addresses
for each row
execute procedure enforce_max_5_addresses();

 ```

### 女孩自动生成工号

```sql
 -- 创建函数：在插入前自动生成工号
CREATE OR REPLACE FUNCTION assign_girl_number()
RETURNS TRIGGER AS $$
DECLARE
  max_number INTEGER;
BEGIN
  -- 若已有手动指定值，则直接使用
  IF NEW.girl_number IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- 查找当前最大工号
  SELECT MAX(girl_number) INTO max_number FROM public.girls;

  -- 若无记录，从1001开始
  IF max_number IS NULL THEN
    NEW.girl_number := 1001;
  ELSE
    NEW.girl_number := max_number + 1;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建新触发器
CREATE TRIGGER trg_assign_girl_number
BEFORE INSERT ON public.girls
FOR EACH ROW
EXECUTE FUNCTION assign_girl_number();

 ```