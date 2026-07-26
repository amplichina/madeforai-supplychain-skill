# MadeForAI 本地验收指南

这份指南给非技术用户使用。你不需要理解代码，只需要确认页面和流程是否符合预期。

## 1. 打开服务

健康检查：

```text
http://localhost:3000/health
```

看到下面内容表示服务在线：

```json
{ "ok": true }
```

生产端控制台：

```text
http://localhost:3000/operator
```

页面会先要求登录。当前这台电脑的账号是 `operator`，密码由项目根目录中未发布的 `.env` 文件配置。登录状态最长保留 8 小时；点击右上角“退出登录”会立即失效。

`/demo`、`/user` 和 `/acceptance` 也使用同一个登录状态。直接打开这些页面时，登录成功后会自动返回原页面。

生产后台具有以下保护：

- 未登录不能读取或修改生产任务。
- 密码不写入数据库，也不会进入源代码发布包。
- 连续输错 5 次后，同一网络地址会暂停登录 15 分钟。
- 正式部署到公网时必须使用 HTTPS。

## 2. 你应该能看到什么

在 Operator Console 中应该能看到任务列表。点击任务后，可以看到：

- 任务标题、产品类别、状态
- 用户确认用的订单草稿
- 中文/英文询价请求
- 生产端反馈
- mock 支付信息
- 样品结果
- 生产进度
- 物流信息
- 历史事件

## 3. AI Agent 应该如何调用

语言规则：

- 面向全球用户的 AI 应用端默认使用英文。
- 如用户明确要求中文，可传 `language: "zh"` 或 `user_language: "zh"`。
- 面向工厂、义乌市场人员、Reality Operator 的生产端材料固定使用中文。
- `generate_order_draft` 默认返回英文用户确认文本，同时始终返回中文生产需求单预览。
- `generate_quote_request` 默认中文，因为它通常发给生产端；如需给海外用户展示，可传 `language: "en"`。

推荐顺序：

1. `generate_artwork_brief`
   让用户自己的 Codex、Claude、Gemini 或设计师准备符合生产要求的图库/图稿。

2. `create_supplychain_task`
   提交产品名称、数量、材质、尺寸、工艺、素材链接、目标市场、发货地址等任务信息。

3. `generate_order_draft`
   生成给用户确认的任务单/订单草稿。

4. `confirm_order_draft`
   用户确认后，任务进入生产端人工审核。

5. `submit_production_feedback`
   生产端填写是否可做、价格、打样费用、生产时间、物流时间、风险。

6. `create_payment_link`
   生成本地 mock 支付链接。它不处理真实付款。

7. `confirm_mock_payment`
   本地模拟支付已确认。

8. `update_production_status`
   生产端更新生产进度。

9. `submit_shipment_info`
   生产端填写物流信息。

10. `complete_task`
    任务交付完成。

## 4. 重要边界

- MadeForAI v0.1 不生成图片。
- MadeForAI v0.1 不运行 LLM 推理。
- MadeForAI v0.1 不处理真实支付。
- MadeForAI v0.1 不自动下单。
- 当前支付链接是 mock，用于验证流程。
- 真实价格、交期、工艺和质量必须由人工 Reality Operator 确认。

## 5. 验收标准

你可以认为当前骨架通过验收，如果：

- `http://localhost:3000/health` 显示 `{ "ok": true }`
- `http://localhost:3000/operator` 会先显示中文登录页，正确登录后能打开生产后台
- Operator Console 能看到任务
- 任务详情里能看到订单草稿、生产反馈、mock 支付、生产进度、物流和完成记录
- AI 客户端能看到 MadeForAI MCP tools
