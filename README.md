# Music Studio

Music Studio 是一個簡單的網頁音樂製作工具，可以從YouTube匯入音訊並進行編輯。

## 功能特點

- 從YouTube匯入音訊
- 多軌道音訊編輯
- 音量控制（主音量和單軌音量）
- 波形視覺化
- 專案儲存和載入
- 鍵盤快捷鍵支援

## 技術架構

### 前端

- 純HTML/CSS/JavaScript實現
- Web Audio API用於音訊處理
- Canvas用於波形視覺化

### 後端

- Node.js + Express
- ytdl-core用於YouTube下載
- fluent-ffmpeg用於音訊轉換

## 安裝與執行

### 安裝相依套件

```bash
# 安裝後端相依套件
cd backend
npm install express ytdl-core fluent-ffmpeg cors
```

### 執行後端服務

```bash
# 在backend目錄下執行
node app.js
```

後端服務將在 http://localhost:3000 啟動。

### 開啟前端頁面

直接在瀏覽器中開啟 `frontend/index.html` 檔案即可使用。

## 使用說明

1. **匯入音訊**：點擊音軌旁的匯入按鈕，輸入YouTube URL
2. **播放控制**：使用播放、暫停、停止按鈕控制音訊播放
3. **音量調整**：使用主音量滑桿或各軌音量滑桿調整音量
4. **儲存專案**：點擊「檔案」>「儲存檔案」將專案儲存為.msproj檔案
5. **載入專案**：點擊「檔案」>「匯入檔案」載入已儲存的專案

## 鍵盤快捷鍵

- **Space**：播放/暫停
- **Ctrl+S**：儲存專案
- **Ctrl+Z**：復原（尚未實作）
- **Ctrl+Y**：重做（尚未實作）

## 版本資訊

- 前端版本：1.4.0
- 後端版本：1.1.0

## 未來計劃

- 音訊效果處理（均衡器、壓縮器等）
- 音軌剪輯和拼接
- 多語言支援
- 使用者帳號系統
- 雲端儲存專案

## 作者

Junwei
