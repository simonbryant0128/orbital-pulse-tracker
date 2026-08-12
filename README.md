# 軌道脈動 · Orbital Pulse

以繁體中文呈現的火箭與低軌衛星產業追蹤網站。內容涵蓋 SpaceX、Rocket Lab、Blue Origin、Amazon Leo 與 AST SpaceMobile 的發射、部署、異常、時程與里程碑。

## 資料原則

GitHub `main` 分支是正式發布資料的唯一來源。每次更新都必須經過 Pull Request，並通過事件 ID、日期、欄位及來源網址檢查。既有表單和公開資訊只負責提供候選更新，不直接覆蓋網站內容。

主要資料位於 [`content/`](content/)：

- `events.json`：近期事件流
- `constellations.json`：星系公開檢查點與歷史版本快照
- `programs.json`：主要火箭計畫狀態
- `weekly/`：週報摘要
- `meta.json`：網站與驗證日期資訊

## 本機使用

```bash
npm install
npm run content:validate
npm run dev
```

發布前驗證：

```bash
npm run test
```

## 更新內容

1. 建立新分支。
2. 更新 `content/` 中的資料。
3. 執行 `npm run content:validate`。
4. 建立 Pull Request，附上資料來源與統計口徑。
5. 合併後發布網站。

資料僅供研究與產業追蹤；發射排程與在軌數會隨官方資訊變動。
