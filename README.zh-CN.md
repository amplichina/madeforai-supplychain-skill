# MadeForAI 现实供应链 Skill

[English README](./README.md)

MadeForAI 是连接 AI Agent 与中国现实供应链执行的开源接口层。支持 MCP 的 Codex、Claude、Cursor 等 AI 客户端可以把用户的小批量制造需求转成结构化任务，再交给人类 Reality Operator 核实工艺、询价、跟进生产并回传结果。

**让 AI 拥有进入现实世界的手，但所有不可逆动作仍由人确认。**

## 产品边界

- 不生成图片，也不承担 LLM 或 GPU 推理。
- 不自动向工厂下单。
- 不编造价格；报价必须来自人工操作员或供应商。
- 当前版本不处理真实支付，也不保存银行卡信息。
- 用户确认、付款确认、生产执行是三个独立门槛。
- 不执行 Shell、不读写任意文件、不调用外部网络。

## 本地启动

无需数据库的 60 秒体验：

```powershell
npm install
npm run build
npm run demo
```

启动器会生成临时生产端密码，并显示用户端、生产端、MCP 地址和本地 AI 客户端配置。

安装依赖并构建：

```powershell
npm install
npm run build
npm test
```

使用内存模式启动 HTTP 服务：

```powershell
$env:MCP_DEV_MEMORY_STORE="true"
$env:OPERATOR_PASSWORD="请替换成至少12位的密码"
$env:OPERATOR_SESSION_SECRET="请替换成至少32位的随机字符串"
npm run start:http
```

打开以下地址：

- 英文用户工作区：`http://localhost:3000/user`
- 中文生产执行台：`http://localhost:3000/operator`
- 中文自动验收：`http://localhost:3000/acceptance`
- 健康检查：`http://localhost:3000/health`

## AI 端体验

用户端按照以下步骤推进：

1. AI 把自然语言需求转成可生产规格。
2. 用户逐项确认订单草稿。
3. 人工操作员回传可行性、真实报价、交期和风险。
4. 用户明确接受当前报价编号和风险后，系统保存报价快照。
5. 模拟支付金额只能从该快照读取，AI 调用方不能填写或修改金额。
6. 人工确认付款后才允许进入生产。
7. 生产、质检、物流和交付证据持续返回 AI 界面。

每个 MCP 工具响应都包含 `guidance`，告诉 AI 当前在等待谁、是否需要用户明确确认、建议调用哪个工具，以及应该如何用用户语言解释下一步。

`generate_order_draft` 支持由用户自己的 AI 客户端同时提交 `production_title_zh`、`production_description_zh` 和 `production_spec_zh`。用户侧继续使用用户语言，中文生产端展示面向生产人员的中文标题、需求说明和生产规格；MadeForAI 服务端本身不调用外部翻译模型。

`quick_start_prototype_pipeline` 可以在一次调用中创建任务和订单草稿，但会强制停在用户确认之前。品类常识守卫只会提出澄清问题，绝不会自动拒单或替代人工判断。

当前一期知识库覆盖 9 类企业 VI 应用物与高频定制品：宣传印刷品、展会与门店物料、服装与工服、徽章、亚克力制品、卡片、包装卡、贴纸和小批量周边。每类都包含工艺路线、主要风险、AI 应追问的问题、双语图稿要求和非阻断式数量常识。

## 生产端体验

生产执行台为中文界面，任务按职责分成：

- `待我处理`：需要操作员立即审核、询价或反馈。
- `等待对方`：等待用户确认、补充信息或付款。
- `生产中`：已付款并进入生产、质检或物流。
- `已结束`：已完成或已取消。

详情页只展示当前工作阶段相关的操作，并明确提示下一步。样品照片、生产照片和交付凭证仅保存 URL，不允许任意文件上传或本机路径访问。

## Docker

```powershell
docker compose up --build
```

生产部署必须配置强密码、会话密钥、MCP API Key、HTTPS 和 PostgreSQL。完整说明见 [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)。

## 测试

当前版本提供 16 个 MCP 工具、16 步人审优先标准流程、9 个一期制造品类和 48 项自动化测试，并包含网页路由级端到端验证。支付链接与用户接受的报价版本绑定；金额必须同时提供明确币种；有业务证据含义的状态只能由专用工具写入；发货前必须完成质检，完成任务前必须已有物流记录。

```powershell
npm run build
npm test
npm run lint
npm run smoke:http
```

项目使用 MIT License。
