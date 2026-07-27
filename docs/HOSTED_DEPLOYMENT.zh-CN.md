# MadeForAI 托管订单入口部署手册

本手册用于部署 MadeForAI v0.4.0 封闭测试服务。目标是让受邀的 Codex、Claude、Gemini 或其他 MCP 客户端把任务提交到同一个中央 PostgreSQL 数据库，并由中文生产后台承接。

## 推荐结构

- Google Cloud Run：运行 Node.js MCP/HTTP 服务。
- Neon PostgreSQL：保存任务、报价、事件、样品和履约记录。
- `api.madeforai.net`：远程 MCP 与生产后台入口。
- Google Secret Manager：保存数据库连接、MCP 密钥和操作员密码。

## 线上地址

- 服务状态：`https://api.madeforai.net/`
- 存活检查：`https://api.madeforai.net/health`
- 数据库就绪：`https://api.madeforai.net/ready`
- MCP：`https://api.madeforai.net/mcp`
- 中文生产后台：`https://api.madeforai.net/operator`

## 必需密钥

- `DATABASE_URL`：Neon PostgreSQL 连接字符串。
- `MCP_HTTP_API_KEY`：至少 32 个字符，只发给受邀测试客户端。
- `OPERATOR_PASSWORD`：至少 12 个字符，只给生产人员。
- `OPERATOR_SESSION_SECRET`：至少 32 个随机字符，用于签名登录会话。

不要把真实值提交到 Git、压缩包、截图或公开文档。

## Cloud Run 运行配置

```text
NODE_ENV=production
MCP_TRANSPORT=http
MCP_DEV_MEMORY_STORE=false
MCP_HTTP_AUTH_REQUIRED=true
ENABLE_DEMO_ROUTES=false
OPERATOR_USERNAME=operator
OPERATOR_COOKIE_SECURE=true
TRUST_PROXY=true
CORS_ORIGIN=
```

容器使用 Cloud Run 自动提供的 `PORT`。建议初期设置最小实例数为 0、最大实例数为 1，以控制费用和避免封闭测试阶段的意外并发扩容。

## 数据库迁移

部署服务前，用 Neon 的直接连接字符串运行：

```bash
npm run prisma:migrate:deploy
```

运行中的 Cloud Run 服务使用 Neon 的 pooled 连接字符串。

## 验收

配置远程地址和测试凭据后运行：

```bash
MCP_ENDPOINT=https://api.madeforai.net/mcp \
MCP_HTTP_API_KEY=replace-me \
OPERATOR_USERNAME=operator \
OPERATOR_PASSWORD=replace-me \
npm run smoke:remote
```

验收脚本会通过真实远程 MCP 创建任务、完成审批门槛和模拟履约，并确认该任务出现在中文生产后台 API 中。它不会处理真实支付，也不会向供应商自动下单。

## 当前限制

- v0.4.0 是邀请制单租户封闭测试，不提供公开注册。
- MCP 密钥不得公开；泄露后必须立即轮换。
- 支付链接仍为 mock，不收集银行卡信息。
- 素材使用 URL，尚未提供托管文件上传。
- 没有供应商 API 和自动下单。
- 正式公开服务前需要增加每客户独立凭据、任务归属隔离、通知、对象存储、备份和运营审计。
