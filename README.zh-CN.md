# MadeForAI 托管供应链连接器

这是 MadeForAI 的开源 MCP 连接器，用于把 Codex、Claude、Gemini、Cursor 等 AI 客户端提交的制造任务转发到 MadeForAI 托管订单入口。

## 公开与私有边界

公开包只包含 stdio 接入、九个用户侧工具名称，以及固定云端地址 `https://api.madeforai.net/mcp`。

它不包含订单数据库、中文生产后台、生产端账号、供应商资料、付款确认权限、质检物流权限或履约管理逻辑。第三方可以按 MIT 协议修改连接器，但不会因此获得 MadeForAI 托管任务或私有生产系统的访问权。

## 安装 Release 安装包

从对应的 GitHub Release 下载 `madeforai-supplychain-connector-0.5.1.tgz`，然后执行：

```bash
npm install --global ./madeforai-supplychain-connector-0.5.1.tgz
madeforai-supplychain
```

未设置 `MADEFORAI_ACCESS_TOKEN` 时命令会明确报错。访问令牌不得少于 32 个字符。

## 从源码构建

```bash
git clone https://github.com/amplichina/madeforai-supplychain-skill.git
cd madeforai-supplychain-skill
npm ci
npm run build
npm test
```

## MCP 客户端配置

取得 MadeForAI 客户端访问令牌后，可在 Codex、Claude Desktop 或 Cursor 中配置：

```json
{
  "mcpServers": {
    "madeforai": {
      "command": "madeforai-supplychain",
      "env": {
        "MADEFORAI_ACCESS_TOKEN": "替换为长度不少于32字符的客户端令牌"
      }
    }
  }
}
```

支持远程 MCP 的客户端也可以直接连接：

```json
{
  "url": "https://api.madeforai.net/mcp",
  "headers": {
    "Authorization": "Bearer 替换为你的客户端令牌"
  }
}
```

不要把令牌写进源码、截图、Issue 或公开示例。

## 九个公开工具

- `create_supplychain_task`
- `generate_artwork_brief`
- `generate_quote_request`
- `generate_order_draft`
- `confirm_order_draft`
- `confirm_production_feedback`
- `create_payment_link`
- `quick_start_prototype_pipeline`
- `get_task`

生产反馈、付款确认、生产进度、质检、物流和完成交付权限不通过公开连接器开放。

## 安全边界

当前版本不生成图片、不运行大模型、不处理真实付款，也不会自动向工厂下单。任务提交后只会进入人工审核队列，不代表审核已经开始，也不承诺回复时间。价格和交期必须等人工反馈后才能确认。
