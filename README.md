# GPT Web Chat

一个纯静态的 GPT 风格网页聊天前端，支持 OpenAI 兼容接口、模型获取、思维强度、多会话 IndexedDB 本地存储，以及 JSON 备份导入/导出。

## 使用方式

直接打开 `index.html`，或者部署到 Vercel / GitHub Pages。

页面里填写：

- API Base URL：你的 OpenAI 兼容接口根地址，例如 `https://api.example.com`
- API Key：你的接口密钥
- Model：点击“获取模型”后选择，或手动输入
- 思维强度：按你的接口支持情况选择

聊天请求会发送到：

```text
{API Base URL}/v1/chat/completions
```

模型列表会请求：

```text
{API Base URL}/v1/models
```

## Vercel 部署

1. 新建 GitHub 仓库。
2. 上传本目录全部文件到仓库根目录。
3. 在 Vercel 导入该仓库。
4. Framework Preset 选择 `Other`。
5. Build Command 留空。
6. Output Directory 留空或填 `.`。
7. 点击 Deploy。

## GitHub Pages 部署

1. 新建 GitHub 仓库。
2. 上传本目录全部文件到仓库根目录。
3. 进入仓库 Settings → Pages。
4. Source 选择 `Deploy from a branch`。
5. Branch 选择 `main`，目录选择 `/root`。
6. 保存后等待 GitHub Pages 生成访问链接。

## 注意事项

- 上传图片和文本类文件
- PDF/Word/Excel 等文件可通过 Vercel API 后端调用 GPT 尝试解析
- API Key 保存在访问者自己的浏览器 localStorage；上传 PDF/Word/Excel 等需要后端解析的文件时，会随请求发送到本站 Vercel API 用于调用你配置的 GPT 接口。
- 聊天记录保存在访问者自己的浏览器 IndexedDB。
- 如果请求失败并提示 CORS，需要你的 API 服务允许浏览器跨域访问。
- 静态托管平台只负责打开网页，不负责代理 API 请求。
