# CBODY上门服务平台数据库设计文档

## 数据库架构概览

本文档详细说明了CBODY上门服务平台的数据库架构设计。系统从UniCloud迁移到Supabase平台，根据业务需求和性能考虑进行了全面优化。

### 主要优化方向

1. **统一多语言支持**：采用JSONB类型统一存储多语言内容
2. **关系模型规范化**：正确使用外键关系和中间表
3. **数据类型优化**：选择更合适的数据类型和约束
4. **高频更新数据分离**：将频繁更新的状态和位置信息分离
5. **命名规范统一**：采用一致、清晰的命名约定
6. **性能索引优化**：添加适当的索引支持高效查询
7. **地理空间支持**：利用PostGIS支持高效地理位置搜索

## 详细表结构设计

## cities（城市表）

| 字段名 | 数据类型 | 必填 | 默认值 | 描述 |
|--------|----------|------|--------|------|
| id | SERIAL | 是 | - | 主键，自增整数ID |
| code | VARCHAR(20) | 是 | - | 城市缩写代码，如 "BKK", "CNX", "HKT" |
| name | JSONB | 是 | '{"en":"","zh":"","th":""}' | 多语言城市名称 |
| country_code | VARCHAR(3) | 是 | - | 国家代码，ISO 3166-1 alpha-3，如 "THA" |
| lat | DOUBLE PRECISION | 是 | - | 纬度 |
| lng | DOUBLE PRECISION | 是 | - | 经度 |
| timezone | VARCHAR(50) | 否 | NULL | 时区，如 "Asia/Bangkok" |
| is_active | BOOLEAN | 否 | true | 是否激活，控制城市可见性 |
| sort_order | INTEGER | 否 | 999 | 排序优先级，数值越小越靠前 |
| created_at | TIMESTAMPTZ | 是 | NOW() | 创建时间 |
| updated_at | TIMESTAMPTZ | 是 | NOW() | 更新时间 |
| location_geom | GEOGRAPHY | 否 | NULL | 地理位置点，PostGIS地理查询支持 |

**索引**：
- PRIMARY KEY (id)
- UNIQUE INDEX idx_cities_code (code)
- INDEX idx_cities_country_code (country_code)
- INDEX idx_cities_active (is_active) WHERE is_active = true
- INDEX idx_cities_sort (sort_order, id)
- INDEX idx_cities_location ON cities USING GIST(location_geom)
- INDEX idx_cities_name_gin ON cities USING GIN(name)

## categories（分类表）

| 字段名 | 数据类型 | 必填 | 默认值 | 描述 |
|--------|----------|------|--------|------|
| id | SERIAL | 是 | - | 主键，自增整数ID |
| code | VARCHAR(20) | 是 | - | 分类代码，如 "wellness", "homeHub", "journey" |
| name | JSONB | 是 | '{"en":"","zh":"","th":""}' | 多语言分类名称 |
| is_active | BOOLEAN | 否 | true | 是否激活，控制分类可见性 |
| sort_order | INTEGER | 否 | 999 | 排序优先级，数值越小越靠前 |
| created_at | TIMESTAMPTZ | 是 | NOW() | 创建时间 |
| updated_at | TIMESTAMPTZ | 是 | NOW() | 更新时间 |

**索引**：
- PRIMARY KEY (id)
- UNIQUE INDEX idx_categories_code (code)
- INDEX idx_categories_active (is_active) WHERE is_active = true
- INDEX idx_categories_sort (sort_order, id)
- INDEX idx_categories_name_gin ON categories USING GIN(name)

## girls（女孩基本信息表）

| 字段名 | 数据类型 | 必填 | 默认值 | 描述 |
|--------|----------|------|--------|------|
| id | UUID | 是 | uuid_generate_v4() | 主键 |
| user_id | UUID | 否 | NULL | Supabase 用户ID |
| city_id | INTEGER | 否 | NULL | 城市ID |
| telegram_id | BIGINT | 否 | NULL | Telegram 群组 ID |
| girl_number | SERIAL / INTEGER | 否 | 1001起 | 数据库触发器自增 |
| username | VARCHAR(50) | 是 | - | 唯一用户名，用于URL路径 |
| name | VARCHAR(50) | 是 | - | 显示昵称，可重复 |
| profile | JSONB | 是 | '{"en":"","zh":"","th":""}' | 多语言简介 |
| avatar_url | TEXT | 否 | NULL | 头像URL |
| birth_date | DATE | 否 | NULL | 出生日期 |
| height | SMALLINT | 否 | NULL | 身高（cm） |
| weight | SMALLINT | 否 | NULL | 体重（kg） |
| measurements | VARCHAR(15) | 否 | NULL | 三围 |
| gender | SMALLINT | 是 | 0 | 性别（0:女, 1:男） |
| languages | JSONB | 否 | '{}' | 会的语言及熟练度 |
| tags | JSONB | 是 | '{"en":"","zh":"","th":""}' | 多语言个人特征标签 |
| badge | TEXT | 否 | NULL | 奖章标识（new/hot/top_rated） |
| rating | DECIMAL(3,2) | 否 | 0 | 评分 |
| total_sales | INTEGER | 否 | 0 | 接单总量 |
| total_reviews | INTEGER | 否 | 0 | 评论总数 |
| max_travel_distance | INTEGER | 否 | 10 | 最大服务距离（km） |
| work_hours | JSONB | 否 | '{"start": "19:00", "end": "10:00"}' | 工作时间段 |
| is_verified | BOOLEAN | 否 | false | 是否已认证 |
| is_blocked | BOOLEAN | 否 | false | 是否被屏蔽 |
| is_visible_to_thai | BOOLEAN | 否 | true | 泰国用户是否可见 |
| sort_order | INTEGER | 否 | 999 | 排序优先级 |
| created_at | TIMESTAMPTZ | 是 | NOW() | 创建时间 |
| updated_at | TIMESTAMPTZ | 是 | NOW() | 更新时间 |

**索引**：
- PRIMARY KEY (id)
- UNIQUE INDEX idx_girls_username (username)
- UNIQUE INDEX idx_girls_girl_number (girl_number)
- INDEX idx_girls_city_id (city_id)
- INDEX idx_girls_category_array ON public.girls USING GIN (category_id);
- INDEX idx_girls_rating (rating DESC)
- INDEX idx_girls_badge (badge) WHERE badge IS NOT NULL
- INDEX idx_girls_total_sales (total_sales DESC)
- INDEX idx_girls_name_search ON girls USING GIN(to_tsvector('english', name))
- INDEX idx_girls_tags_gin ON girls USING GIN(tags)

**外键约束**：
- FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE SET NULL
- FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL

## girls_status（女孩状态和位置表）

| 字段名 | 数据类型 | 必填 | 默认值 | 描述 |
|--------|----------|------|--------|------|
| id | UUID | 是 | uuid_generate_v4() | 主键 |
| girl_id | UUID | 是 | - | 关联女孩ID |
| status | TEXT | 是 | 'offline' | 状态（available/busy/offline） |
| current_lat | DOUBLE PRECISION | 否 | NULL | 当前纬度 |
| current_lng | DOUBLE PRECISION | 否 | NULL | 当前经度 |
| standby_lat | DOUBLE PRECISION | 否 | NULL | 基地纬度 |
| standby_lng | DOUBLE PRECISION | 否 | NULL | 基地经度 |
| next_available_time | TIMESTAMPTZ | 否 | NULL | 下次可用时间（缓存值） |
| auto_status_update | BOOLEAN | 否 | false | 是否自动更新状态 |
| updated_at | TIMESTAMPTZ | 是 | NOW() | 更新时间 |
| location_geom | GEOGRAPHY | 否 | NULL | 地理位置点 |

**索引**：
- PRIMARY KEY (id)
- UNIQUE INDEX idx_girls_status_girl_id (girl_id)
- INDEX idx_girls_status_status (status)
- INDEX idx_girls_status_geom ON girls_status USING GIST(location_geom)
- INDEX idx_girls_status_next_time (next_available_time) WHERE next_available_time IS NOT NULL

**外键约束**：
- FOREIGN KEY (girl_id) REFERENCES girls(id) ON DELETE CASCADE


## girls_media（技师媒体表）

| 字段名 | 数据类型 | 必填 | 默认值 | 描述 |
|--------|----------|------|--------|------|
| id | UUID | 是 | gen_random_uuid() | 主键 |
| girl_id | UUID | 是 | - | 关联技师ID |
| kind | media_kind | 是 | - | 媒体类型（image/video/live_photo） |
| storage_key | TEXT | 是 | - | 主资源路径（如 image.jpg 或 video.mp4） |
| thumb_key | TEXT | 否 | NULL | 缩略图/封面路径 |
| meta | JSONB | 是 | '{}'::jsonb | 轻元数据（mime/size/width/height/duration/live_photo配对信息） |
| min_user_level | SMALLINT | 是 | 0 | 会员最低可见等级（0=公开） |
| status | media_status | 是 | 'pending' | 审核状态（pending/approved/rejected） |
| reviewed_by | UUID | 否 | NULL | 审核人ID |
| reviewed_at | TIMESTAMPTZ | 否 | NULL | 审核时间 |
| reject_reason | TEXT | 否 | NULL | 审核驳回原因 |
| sort_order | INTEGER | 是 | 0 | 技师可调整排序 |
| created_by | UUID | 是 | - | 创建者（技师对应的 auth.uid） |
| created_at | TIMESTAMPTZ | 是 | NOW() | 创建时间 |
| updated_at | TIMESTAMPTZ | 是 | NOW() | 更新时间 |

**索引**：
- PRIMARY KEY (id)
- INDEX idx_gm_girl_sort (girl_id, sort_order)
- INDEX idx_gm_status (status)
- INDEX idx_gm_level (min_user_level)

**外键约束**：
- FOREIGN KEY (girl_id) REFERENCES girls(id) ON DELETE CASCADE
- FOREIGN KEY (reviewed_by) REFERENCES auth.users(id) ON DELETE SET NULL

**枚举类型**：
- media_kind: 'image', 'video', 'live_photo'
- media_status: 'pending', 'approved', 'rejected'

**meta 字段结构示例**：
```json
{
  "mime": "image/jpeg",
  "size": 1024000,
  "width": 1920,
  "height": 1080,
  "duration": 15,
  "live": {
    "image_key": "path/to/image.jpg",
    "video_key": "path/to/video.mov"
  }
}

```

## girls_categories（技师分类关联表）

| 字段名 | 数据类型 | 必填 | 默认值 | 描述 |
|--------|----------|------|--------|------|
| girl_id | UUID | 是 | - | 技师ID，关联girls表 |
| category_id | INTEGER | 是 | - | 分类ID，关联categories表 |
| created_at | TIMESTAMPTZ | 是 | NOW() | 创建时间 |

**索引**：
- PRIMARY KEY (girl_id, category_id)
- INDEX idx_girls_categories_girl_id (girl_id)
- INDEX idx_girls_categories_category_id (category_id)

**外键约束**：
- FOREIGN KEY (girl_id) REFERENCES girls(id) ON DELETE CASCADE
- FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT


## services（服务项目表）

| 字段名 | 数据类型 | 必填 | 默认值 | 描述 |
|--------|----------|------|--------|------|
| id | SERIAL | 是 | - | 主键，自增整数ID |
| category_id | INTEGER | 是 | - | 分类ID，关联categories表 |
| code | VARCHAR(50) | 是 | - | 服务代码，如 "thai_massage", "deep_tissue" |
| title | JSONB | 是 | '{"en":"","zh":"","th":""}' | 多语言服务标题 |
| description | JSONB | 是 | '{"en":"","zh":"","th":""}' | 多语言简介 |
| badge | VARCHAR(20) | 否 | NULL | 徽章标识，如 'TOP_PICK', 'HOT', 'NEW' 等 |
| is_active | BOOLEAN | 否 | true | 是否上架 |
| is_visible_to_thai | BOOLEAN | 否 | true | 泰文用户是否可见 |
| is_visible_to_english | BOOLEAN | 否 | true | 英文用户是否可见 |
| min_user_level | SMALLINT | 否 | 0 | 最小可见用户等级 |
| total_sales | INTEGER | 否 | 0 | 销量展示 |
| sort_order | INTEGER | 否 | 999 | 排序权重 |
| created_at | TIMESTAMPTZ | 是 | NOW() | 创建时间 |
| updated_at | TIMESTAMPTZ | 是 | NOW() | 更新时间 |

**索引**：
- PRIMARY KEY (id)
- UNIQUE INDEX idx_services_code (code)
- INDEX idx_services_category_id (category_id)
- INDEX idx_services_active (is_active) WHERE is_active = true
- INDEX idx_services_sort (sort_order, id)
- INDEX idx_services_title_gin ON services USING GIN(title)
- INDEX idx_services_total_sales (total_sales DESC)
- INDEX idx_services_badge (badge) WHERE badge IS NOT NULL

**外键约束**：
- FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT

## service_durations（服务时长定价表）

| 字段名 | 数据类型 | 必填 | 默认值 | 描述 |
|--------|----------|------|--------|------|
| id | SERIAL | 是 | - | 主键 |
| service_id | INTEGER | 是 | - | 服务ID |
| duration_minutes | INTEGER | 是 | - | 时长（60/90/120...） |
| default_price | INTEGER | 是 | - | 管理员设置默认价（100泰铢整数倍） |
| min_price | INTEGER | 是 | - | 最低可调价（可选，若不设则不能低于默认价） |
| max_price | INTEGER | 是 | - | 最高可调价（可选） |
| is_active | BOOLEAN | 否 | true | 是否启用该时长 |
| created_at | TIMESTAMPTZ | 是 | NOW() | 创建时间 |
| updated_at | TIMESTAMPTZ | 是 | NOW() | 更新时间 |

**索引**：
- PRIMARY KEY (id)
- INDEX idx_service_durations_service_id (service_id)
- INDEX idx_service_durations_duration (duration_minutes)
- INDEX idx_service_durations_active (is_active) WHERE is_active = true
- UNIQUE INDEX idx_service_durations_unique (service_id, duration_minutes)

**外键约束**：
- FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE

## admin_girl_services（管理员为技师绑定服务表）

| 字段名 | 数据类型 | 必填 | 默认值 | 描述 |
|--------|----------|------|--------|------|
| id | UUID | 是 | uuid_generate_v4() | 主键 |
| girl_id | UUID | 是 | - | 技师ID |
| service_id | INTEGER | 是 | - | 服务ID |
| is_qualified | BOOLEAN | 是 | true | 是否合格提供此服务 |
| admin_id | UUID | 是 | - | 操作管理员ID |
| notes | TEXT | 否 | NULL | 管理员备注 |
| created_at | TIMESTAMPTZ | 是 | NOW() | 绑定时间 |
| updated_at | TIMESTAMPTZ | 是 | NOW() | 更新时间 |

**索引**：
- PRIMARY KEY (id)
- INDEX idx_admin_girl_services_girl_id (girl_id)
- INDEX idx_admin_girl_services_service_id (service_id)
- INDEX idx_admin_girl_services_admin_id (admin_id)
- INDEX idx_admin_girl_services_qualified (is_qualified) WHERE is_qualified = true
- UNIQUE INDEX idx_admin_girl_services_unique (girl_id, service_id)

**外键约束**：
- FOREIGN KEY (girl_id) REFERENCES girls(id) ON DELETE CASCADE
- FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
- FOREIGN KEY (admin_id) REFERENCES auth.users(id) ON DELETE SET NULL

## girl_service_durations（技师服务时长配置表）

| 字段名 | 数据类型 | 必填 | 默认值 | 描述 |
|--------|----------|------|--------|------|
| id | UUID | 是 | uuid_generate_v4() | 主键 |
| admin_girl_service_id | UUID | 是 | - | 关联admin_girl_services表 |
| service_duration_id | INTEGER | 是 | - | 关联service_durations表 |
| custom_price | INTEGER | 否 | NULL | 技师自定义价格（NULL则使用默认价格） |
| is_active | BOOLEAN | 否 | true | 技师是否提供该时长 |
| created_at | TIMESTAMPTZ | 是 | NOW() | 创建时间 |
| updated_at | TIMESTAMPTZ | 是 | NOW() | 更新时间 |

**索引**：
- PRIMARY KEY (id)
- INDEX idx_girl_service_durations_admin_girl_service_id (admin_girl_service_id)
- INDEX idx_girl_service_durations_service_duration_id (service_duration_id)
- INDEX idx_girl_service_durations_active (is_active) WHERE is_active = true
- UNIQUE INDEX idx_girl_service_durations_unique (admin_girl_service_id, service_duration_id)

**外键约束**：
- FOREIGN KEY (admin_girl_service_id) REFERENCES admin_girl_services(id) ON DELETE CASCADE
- FOREIGN KEY (service_duration_id) REFERENCES service_durations(id) ON DELETE CASCADE

## user_profiles（用户资料表）

| 字段名 | 数据类型 | 必填 | 默认值 | 描述 |
|--------|----------|------|--------|------|
| id | UUID | 是 | - | 主键，关联auth.users(id) |
| username | TEXT | 否 | NULL | 公开用户名，可重复可改 |
| display_name | TEXT | 否 | NULL | 显示名称，个人中心抬头用 |
| avatar_url | TEXT | 否 | NULL | 头像URL |
| country_code | VARCHAR(2) | 否 | NULL | ISO 3166-1 alpha-2，如TH/CN |
| language_code | VARCHAR(10) | 否 | 'en' | 语言偏好：en/zh/th |
| timezone | VARCHAR(50) | 否 | NULL | IANA时区，如Asia/Bangkok |
| gender | SMALLINT | 否 | 2 | 性别：0=男,1=女,2=不愿透露 |
| level | SMALLINT | 是 | 1 | 用户等级 |
| experience | INTEGER | 是 | 0 | 经验/积分累计 |
| credit_score | INTEGER | 是 | 100 | 信用分(技师评价影响) |
| notification_settings | JSONB | 否 | '{"email":true,"push":true,"sms":false}' | 通知偏好 |
| preferences | JSONB | 否 | '{}' | 其他前端偏好设置 |
| last_device_id | VARCHAR(100) | 否 | NULL | 最后登录设备ID |
| last_ip_address | INET | 否 | NULL | 最后登录IP |
| last_login_at | TIMESTAMPTZ | 否 | NULL | 最后登录时间 |
| is_banned | BOOLEAN | 是 | false | 是否被封禁 |
| created_at | TIMESTAMPTZ | 是 | NOW() | 创建时间 |
| updated_at | TIMESTAMPTZ | 是 | NOW() | 更新时间 |

**索引**：
- PRIMARY KEY (id)
- INDEX idx_user_profiles_username (username) WHERE username IS NOT NULL
- INDEX idx_user_profiles_country (country_code)
- INDEX idx_user_profiles_level (level)
- INDEX idx_user_profiles_banned (id) WHERE is_banned = true
- INDEX idx_user_profiles_last_login (last_login_at DESC)
- INDEX idx_user_profiles_last_ip (last_ip_address)

**外键约束**：
- FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE

**CHECK约束**：
- CHECK (gender IN (0, 1, 2))
- CHECK (level >= 1 AND level <= 10)
- CHECK (experience >= 0)
- CHECK (credit_score >= 0 AND credit_score <= 1000)


## user_connected_accounts（第三方账户绑定表）

| 字段名 | 数据类型 | 必填 | 默认值 | 描述 |
|--------|----------|------|--------|------|
| id | UUID | 是 | gen_random_uuid() | 主键 |
| user_id | UUID | 是 | - | 关联用户ID |
| provider | VARCHAR(20) | 是 | - | 提供商：google/apple/facebook/line/kakao/wechat |
| provider_user_id | TEXT | 是 | - | 第三方用户ID |
| provider_email | VARCHAR(255) | 否 | NULL | 第三方邮箱 |
| is_primary | BOOLEAN | 否 | false | 是否为主登录方式 |
| linked_at | TIMESTAMPTZ | 是 | NOW() | 绑定时间 |
| last_used_at | TIMESTAMPTZ | 否 | NULL | 最后使用时间 |

**索引**：
- PRIMARY KEY (id)
- INDEX idx_user_connected_accounts_user_id (user_id)
- UNIQUE INDEX idx_user_connected_accounts_provider (provider, provider_user_id)
- INDEX idx_user_connected_accounts_primary (user_id) WHERE is_primary = true

**外键约束**：
- FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE

**CHECK约束**：
- CHECK (provider IN ('google', 'apple', 'facebook', 'line', 'kakao', 'wechat'))

**触发器**：
- 确保每个用户只有一个主登录方式的触发器ensure_single_primary_account()

## user_addresses（用户地址簿）

| 字段名 | 数据类型 | 必填 | 默认值 | 描述 |
|--------|----------|------|--------|------|
| id | UUID | 是 | gen_random_uuid() | 主键 |
| user_id | UUID | 是 | - | 所属用户ID，关联auth.users |
| place_id | TEXT | 否 | NULL | Google Place ID |
| place_name | TEXT | 是 | NULL | 地点名称（如酒店/公寓名） |
| formatted_address | TEXT | 否 | - | 统一展示用详细地址 |
| lat | DOUBLE PRECISION | 是 | - | 纬度 |
| lng | DOUBLE PRECISION | 是 | - | 经度 |
| location_type | TEXT | 否 | 'hotel' | 地址类型：hotel/condo_apartment/house/office/other |
| contact_name | TEXT | 否 | NULL | 联系人姓名（不填则沿用用户资料） |
| contact_phone | TEXT | 否 | NULL | 联系电话（不填则沿用用户资料） |
| note | TEXT | 否 | NULL | 备注（房号/门禁/车位/如何到达） |
| requires_lobby_pickup | BOOLEAN | 否 | NULL | 是否需大厅接送/带卡上楼 |
| entrance_photo_url | TEXT | 否 | NULL | 入口/门牌照片 |
| is_default | BOOLEAN | 是 | false | 是否默认地址（每用户唯一） |
| created_at | TIMESTAMPTZ | 是 | NOW() | 创建时间 |
| updated_at | TIMESTAMPTZ | 是 | NOW() | 更新时间 |

**索引**：
- PRIMARY KEY (id)
- INDEX idx_user_addresses_user_id (user_id)
- INDEX idx_user_addresses_place_id (place_id) WHERE place_id IS NOT NULL
- UNIQUE INDEX idx_user_addresses_default (user_id) WHERE is_default = true
- INDEX idx_user_addresses_location (lat, lng) WHERE lat IS NOT NULL

**外键约束**：
- FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE

## admin_role（管理员角色枚举类型）

**枚举值**：
- `superadmin` - 超级管理员
- `admin` - 管理员  
- `finance` - 财务
- `support` - 客服

## admin_profiles（管理员资料表）

| 字段名 | 数据类型 | 必填 | 默认值 | 描述 |
|--------|----------|------|--------|------|
| id | UUID | 是 | - | 主键，关联auth.users表 |
| display_name | TEXT | 是 | - | 显示名称 |
| role | admin_role | 是 | 'support' | 管理员角色 |
| is_active | BOOLEAN | 否 | true | 是否激活 |
| created_at | TIMESTAMPTZ | 否 | NOW() | 创建时间 |
| updated_at | TIMESTAMPTZ | 否 | NOW() | 更新时间 |
| created_by | UUID | 否 | NULL | 创建者ID |
| updated_by | UUID | 否 | NULL | 更新者ID |

**索引**：
- PRIMARY KEY (id)
- INDEX idx_admin_profiles_role (role)
- INDEX idx_admin_profiles_active (is_active) WHERE is_active = true
- INDEX idx_admin_profiles_created_by (created_by)

**外键约束**：
- FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
- FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL
- FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL

## admin_operation_logs（管理员操作日志表）

| 字段名 | 数据类型 | 必填 | 默认值 | 描述 |
|--------|----------|------|--------|------|
| id | UUID | 是 | gen_random_uuid() | 主键 |
| operator_id | UUID | 是 | - | 操作者ID |
| target_admin_id | UUID | 是 | - | 目标管理员ID |
| operation_type | TEXT | 是 | - | 操作类型（如 update_profile, reset_password, toggle_status） |
| operation_details | JSONB | 否 | NULL | 操作详情JSON数据 |
| created_at | TIMESTAMPTZ | 否 | NOW() | 操作时间 |

**索引**：
- PRIMARY KEY (id)
- INDEX idx_admin_operation_logs_operator_id (operator_id)
- INDEX idx_admin_operation_logs_target_admin_id (target_admin_id)
- INDEX idx_admin_operation_logs_operation_type (operation_type)
- INDEX idx_admin_operation_logs_created_at (created_at DESC)

**外键约束**：
- FOREIGN KEY (operator_id) REFERENCES auth.users(id) ON DELETE CASCADE
- FOREIGN KEY (target_admin_id) REFERENCES auth.users(id) ON DELETE CASCADE