# 內容資料庫

網站只讀取 GitHub `main` 分支中的已發布資料。公開資訊或表單匯入先形成分支／Pull Request，經過格式、重複 ID、日期與來源網址檢查後才可合併。

## 檔案

- `events.json`：發射、部署、時程、異常、合約與里程碑。
- `constellations.json`：星系公開檢查點與歷史版本快照。
- `programs.json`：Starship、Neutron、New Glenn 的計畫狀態。
- `weekly/`：每週摘要。
- `meta.json`：網站名稱、最後核對日期與資料政策。

每筆事件都必須有穩定 ID、日期、公司、狀態、摘要，以及至少一個可開啟的來源網址。不要在沒有留下更正紀錄的情況下覆蓋歷史事件。
