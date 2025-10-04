# 目录结构参考
 cbody-go/
├─ app/                         # 仅做页面编排与导航（无业务逻辑）
│  ├─ (auth)/sign-in.tsx
│  ├─ (tabs)/                   # 底部 Tab 容器
│  │  ├─ index.tsx              # 今日任务/接单中
│  │  ├─ orders.tsx             # 订单列表
│  │  ├─ messages.tsx           # 聊天列表
│  │  ├─ availability.tsx       # 上下线/排班
│  │  ├─ me.tsx                 # 我的
│  ├─ _layout.tsx               # expo-router 根布局（包裹 Providers）
│  └─ +not-found.tsx
│
├─ features/                    # 按业务域拆分（数据+UI组合件）
│  ├─ auth/
│  │  ├─ api.ts                 # 登录/登出/handle_login RPC
│  │  ├─ hooks.ts               # useSignIn, useSession
│  │  └─ components/SignInForm.tsx
│  ├─ orders/
│  │  ├─ api.ts                 # 列表/明细/状态变更
│  │  ├─ hooks.ts               # useOrders, useOrderDetail, mutations
│  │  └─ components/OrderCard.tsx
│  ├─ availability/
│  │  ├─ api.ts                 # online/offline、打卡、定位上报
│  │  ├─ hooks.ts               # useAvailability, useLocationSync
│  │  └─ components/StatusToggle.tsx
│  ├─ profile/
│  │  ├─ api.ts                 # 技师资料读写
│  │  └─ hooks.ts
│  └─ notifications/
│     ├─ api.ts                 # token 上报 / 订阅主题
│     └─ hooks.ts
│
├─ components/                  # 跨业务的纯 UI
│  ├─ ui/                       # 基础控件（Button, Card, Empty, Skeleton...）
│  └─ common/                   # 复用块（HeaderBar, ErrorView...）
│
├─ providers/                   # 全局 Provider
│  ├─ AppProviders.tsx          # GluestackProvider + QueryClient + SessionProvider
│  ├─ LinkingListener.tsx       # 深链/回调（AuthSession 等）
│  └─ ToastProvider.tsx
│
├─ lib/                         # 基础设施（仅纯函数/实例）
│  ├─ supabase.ts               # createClient（仅此处创建）
│  ├─ queryClient.ts            # React Query 单例 & 默认 staleTime
│  ├─ env.ts                    # 环境变量读取
│  ├─ realtime.ts               # 订单/状态订阅封装（可选）
│  └─ geo.ts                    # 距离/ETA 纯函数
│
├─ store/                       # 仅 UI 级别的轻状态（Zustand）
│  └─ useUIStore.ts             # 例如筛选、弹窗开关
│
├─ theme/                       # Gluestack 主题定制
│  └─ index.ts
├─ hooks/                       # 通用 Hooks（如 useSafeAreaHeader, useRefreshByUser）
├─ utils/                       # 纯工具函数（format, guard, ts helpers）
├─ assets/                      # 字体/图片
└─ scripts/                     # 一次性脚本
