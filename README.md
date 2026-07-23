# Payload bilingual blog

一个可自托管的 Payload 3 + Next.js 双语博客，同时通过 Payload REST 和 GraphQL API
为其他站点提供 Headless CMS 内容。

## 架构

- 应用：Next.js 15 与 Payload 3.82.1，单个 Node.js 容器
- 数据库：Supabase Postgres
- 图片：Cloudflare R2，通过 S3 API 上传，通过公开自定义域名读取
- 语言：英文 `en` 和中文 `zh`，内容与发布状态彼此独立
- 入口：
  - `/admin`：写作和媒体管理
  - `/en`、`/zh`：公开博客
  - `/api`、`/api/graphql`：Headless CMS API
  - `/api/health`：容器与数据库健康检查

## 本地开发

要求 Node.js 24.15+、pnpm 11、Docker 与 Docker Compose。

```bash
cp .env.example .env
docker compose -f compose.dev.yaml up -d --wait
pnpm install
pnpm migrate
pnpm dev
```

打开 [http://localhost:3000/admin](http://localhost:3000/admin) 创建首个管理员。未配置 R2
时，开发环境把上传文件写入已被 Git 忽略的 `media/` 目录。

常用检查：

```bash
pnpm generate:types
pnpm generate:importmap
pnpm lint
pnpm test:int
pnpm test:e2e
pnpm build
```

## 内容模型

- Posts：本地化标题、slug、摘要、正文、发布时间和 SEO；共享封面、作者与分类
- Authors：公开作者资料，与管理员 Users 分开
- Categories：本地化名称与 slug
- Media：本地化 alt，生成 card 与 hero 两种图片尺寸
- Site Settings：本地化站名、简介和默认 SEO

编辑文章时，先在后台右上角选择语言。英文和中文各自保存草稿并各自发布。缺少目标语言
的已发布版本时，公开页面返回 404，不回退到另一种语言。

## Supabase

1. 创建空的 Supabase 项目。
2. 在 **Connect** 页面复制 Supavisor **Session pooler** 连接串。它使用端口 `5432`，
   适合长期运行的 Node.js 容器，也兼容仅 IPv4 的 VPS。
3. 把连接串写入生产环境的 `DATABASE_URL`。密码包含特殊字符时先进行 URL 编码。
4. 不要在生产环境运行 schema push。所有结构变更必须先提交 migration，再运行
   `pnpm migrate`。

应用会为 Supabase 连接启用 TLS，并限制单容器数据库连接池最多 10 个连接。

## Cloudflare R2

1. 创建一个空 R2 bucket。
2. 创建只允许该 bucket 读写的 R2 API token，记录 Access Key ID 和 Secret Access Key。
3. Endpoint 格式为：

   ```text
   https://ACCOUNT_ID.r2.cloudflarestorage.com
   ```

4. 为 bucket 绑定公开自定义域名，例如 `https://media.example.com`。
5. 将 bucket、凭据、endpoint 和公开域名写入生产环境变量。

上传使用 S3 endpoint，页面图片使用 `R2_PUBLIC_URL`。生产环境缺少任一 R2 参数时应用会
直接拒绝启动，避免意外写入容器文件系统。

## 生产环境变量

在服务器创建不会提交到 Git 的 `.env.production`：

```dotenv
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/postgres
PAYLOAD_SECRET=使用-openssl-rand-hex-32-生成
SITE_URL=https://blog.example.com
CORS_ORIGINS=https://other-site.example,https://another-site.example
PORT=3000

R2_BUCKET=blog-media
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_ENDPOINT=https://ACCOUNT_ID.r2.cloudflarestorage.com
R2_PUBLIC_URL=https://media.example.com
```

`SITE_URL` 也会加入 CORS/CSRF 白名单。`CORS_ORIGINS` 只需要列出会从浏览器直接调用
Payload API 的其他站点；服务端调用不受浏览器 CORS 限制。

## Docker 部署

首次发布：

```bash
docker compose --env-file .env.production build app
docker compose --env-file .env.production --profile tools run --rm migrate
docker compose --env-file .env.production up -d app
docker compose --env-file .env.production ps
curl --fail http://127.0.0.1:3000/api/health
```

确认健康检查返回 `{"status":"ok"}` 后，将 `deploy/nginx.conf` 合并到服务器现有 Nginx，
替换其中的域名，并使用 Certbot 或现有证书流程启用 HTTPS：

```bash
sudo nginx -t
sudo systemctl reload nginx
```

以后发布仍按以下顺序：

1. 确认 Supabase 备份可用。
2. 拉取代码并构建新镜像。
3. 运行一次性 migration 容器。
4. 启动应用并等待健康检查。
5. reload Nginx。

应用容器以非 root 用户运行，只将端口绑定到 `127.0.0.1`。Nginx 示例包含 25 MB
上传限制、原始 Host/IP/协议头和 120 秒代理超时。

回滚应用时重新标记并启动上一镜像。数据库 migration 默认只向前执行；若新版本包含破坏性
迁移，应先从 Supabase 备份恢复或在发布前验证对应 down migration。

## 给其他站点使用 CMS

匿名请求只能读取已发布内容。每次请求都应显式指定语言并关闭 fallback。

REST 示例：

```bash
curl 'https://blog.example.com/api/posts?locale=zh&fallback-locale=none&depth=2&limit=10&sort=-publishedAt'
```

按 slug 查询：

```bash
curl 'https://blog.example.com/api/posts?locale=en&fallback-locale=none&where[slug][equals]=hello'
```

GraphQL 示例：

```graphql
query PublishedPosts {
  Posts(locale: zh, fallbackLocale: none, limit: 10, sort: "-publishedAt") {
    docs {
      id
      title
      slug
      excerpt
      publishedAt
    }
  }
}
```

管理员 API、草稿和 Users 集合仍受 Payload 登录权限保护。

## 数据迁移与升级

当前 `src/migrations` 是从空 Postgres 数据库生成的初始 schema。修改集合后：

```bash
docker compose -f compose.dev.yaml up -d --wait
pnpm migrate:create
pnpm generate:types
pnpm generate:importmap
```

Payload 暂时固定为 `3.82.1`，因为独立语言发布使用 experimental localized status。
升级 Payload 前必须在独立数据库重新执行 migration、集成测试和中英文发布 E2E。
