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

生产环境推荐使用“GitHub Actions 构建镜像，VPS 只负责拉取和运行”的方式。不要在低内存
VPS 上执行 `docker build`。默认镜像地址为：

```text
ghcr.io/q275343119/payloadcms:latest
```

仓库的 `.github/workflows/docker-image.yml` 会在代码推送到 `main` 时构建
`linux/amd64` 镜像，并发布两个标签：

- `latest`：当前 `main` 的最新版
- `sha-xxxxxxx`：对应具体 Git commit，可用于固定版本和回滚

构建过程不需要数据库、Payload 或 R2 的生产配置。包括 `R2_PUBLIC_URL` 在内的全部实际
配置都在容器启动时从 `.env.production` 读取，因此同一个镜像可以使用不同的数据库、
站点域名和 R2 bucket。

### 准备 GHCR 镜像

公开镜像可以直接拉取。如果 GHCR package 保持私有，需要在 GitHub 创建仅具有
`read:packages` 权限的 Personal Access Token，然后在 VPS 登录一次：

```bash
read -rsp 'GHCR token: ' GHCR_TOKEN
echo
printf '%s' "$GHCR_TOKEN" | docker login ghcr.io \
  --username YOUR_GITHUB_USERNAME \
  --password-stdin
unset GHCR_TOKEN
```

不要把 Token 写入仓库、Compose 文件或 `.env.production`。登录成功后，Docker 会使用
本机凭据拉取私有镜像。

### 准备 VPS

VPS 只需要以下文件：

- `compose.yaml`
- `.env.production`
- 可选的 `deploy/nginx.conf`

安装 Docker Engine 和 Docker Compose v2，并确认服务器架构为 AMD64：

```bash
docker version
docker compose version
uname -m
```

`uname -m` 应返回 `x86_64`。然后在部署目录中创建 `.env.production`。除前文列出的
生产配置外，还可以指定要部署的镜像：

```dotenv
PAYLOAD_IMAGE=ghcr.io/q275343119/payloadcms:latest

DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/postgres
PAYLOAD_SECRET=使用-openssl-rand-hex-32-生成
SITE_URL=https://blog.example.com
CORS_ORIGINS=
PORT=3000

R2_BUCKET=blog-media
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_ENDPOINT=https://ACCOUNT_ID.r2.cloudflarestorage.com
R2_PUBLIC_URL=https://media.example.com
```

`.env.production` 包含生产密钥，文件权限建议限制为当前部署用户：

```bash
chmod 600 .env.production
```

### 首次部署

进入包含 `compose.yaml` 和 `.env.production` 的目录，依次执行：

```bash
docker compose --env-file .env.production pull
docker compose --env-file .env.production --profile tools run --rm migrate
docker compose --env-file .env.production up -d --wait app
docker compose --env-file .env.production ps
curl --fail http://127.0.0.1:3000/api/health
```

执行顺序不能颠倒：先拉取同一版本的应用和 migration 镜像，再运行数据库 migration，
最后启动应用。接口返回以下内容表示应用和数据库均可访问：

```json
{ "status": "ok" }
```

首次打开 `https://你的域名/admin`，按照 Payload 页面创建管理员账号。

### 配置 Nginx 和 HTTPS

确认健康检查返回 `{"status":"ok"}` 后，将 `deploy/nginx.conf` 合并到服务器现有 Nginx，
替换其中的域名，并使用 Certbot 或现有证书流程启用 HTTPS：

```bash
sudo nginx -t
sudo systemctl reload nginx
```

应用端口默认只绑定到 `127.0.0.1`，不直接暴露到公网。Nginx 示例包含 25 MB 上传限制、
原始 Host/IP/协议头和 120 秒代理超时。

### 发布新版本

代码推送到 `main` 后，先在 GitHub Actions 页面等待 **Build and publish Docker image**
成功。然后在 VPS 执行：

```bash
docker compose --env-file .env.production pull
docker compose --env-file .env.production --profile tools run --rm migrate
docker compose --env-file .env.production up -d --wait app
docker compose --env-file .env.production ps
curl --fail http://127.0.0.1:3000/api/health
```

每次执行 migration 前都应确认 Supabase 备份可用。只更新应用镜像时不需要 reload
Nginx。

### 固定版本与回滚

生产环境建议在确认版本稳定后，把 `.env.production` 中的 `PAYLOAD_IMAGE` 从 `latest`
改成 Actions 生成的 SHA 标签：

```dotenv
PAYLOAD_IMAGE=ghcr.io/q275343119/payloadcms:sha-1a2b3c4
```

切换镜像版本：

```bash
docker compose --env-file .env.production pull
docker compose --env-file .env.production up -d --wait app
```

镜像回滚不会自动回滚数据库。Payload migration 默认只向前执行；如果新版本包含破坏性
迁移，应先确认旧应用是否兼容新 schema，必要时从 Supabase 备份恢复。

确认新版本稳定后可以清理未使用的旧镜像：

```bash
docker image prune
```

### 常用排查

查看容器和健康状态：

```bash
docker compose --env-file .env.production ps
docker compose --env-file .env.production logs --tail=200 app
```

确认 Compose 最终使用的镜像：

```bash
docker compose --env-file .env.production config --images
```

常见问题：

- `unauthorized` 或 `denied`：GHCR package 是私有的，或者 VPS 登录凭据缺少
  `read:packages`。
- `no matching manifest for linux/amd64`：工作流没有成功发布 AMD64 镜像。
- `Missing required production environment variables`：`.env.production` 缺少日志中列出的
  配置。
- R2 图片无法访问：检查 `R2_PUBLIC_URL` 是否能从公网直接打开，以及 bucket 自定义域名
  和 CORS 配置是否正确。
- migration 失败：不要继续重启应用，先检查数据库连接、备份和 migration 日志。

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
