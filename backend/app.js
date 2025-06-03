const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3000;
const jobs = {}; // 儲存進度資訊

// Create downloads directory if it doesn't exist
const downloadsDir = path.join(__dirname, 'downloads');
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true });
}

// Middleware
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'DELETE'], // Allow specific methods
  allowedHeaders: ['Content-Type', 'Authorization'] // Allow specific headers
}));
app.use(express.json());
app.use(express.static('public'));

// Serve downloaded files
app.use('/downloads', express.static(path.join(__dirname, 'downloads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: '後端服務正常運作中' });
});

const { exec } = require('child_process');

// 取代 ytdl-core 為 yt-dlp + ffmpeg
app.post('/convert', async (req, res) => {
    const { url } = req.body;
    const jobId = uuidv4();
    const tempFile = path.join(downloadsDir, `${jobId}.%(ext)s`);
    const outputFile = path.join(downloadsDir, `${jobId}.wav`);

    if (!url || !/^https?:\/\/(www\.)?youtube\.com|youtu\.be/.test(url)) {
        return res.status(400).json({ success: false, error: 'Invalid YouTube URL' });
    }

    jobs[jobId] = { progress: 0, status: 'downloading' };

    // 1. 先取得 YouTube 標題
    const getTitleCmd = `./yt-dlp --get-title "${url}"`;
    console.log("[yt-dlp] Processing URL: "+url);
    exec(getTitleCmd, (titleErr, titleStdout, titleStderr) => {
        if (titleErr) {
            console.error(`yt-dlp get-title error:`, titleStderr);
            jobs[jobId].status = 'error';
            jobs[jobId].error = 'Failed to get video title';
            return;
        }
        let videoTitle = titleStdout.trim();
        // 處理非法字元
        videoTitle = videoTitle.replace(/[\\/:*?"<>|]/g, '_');
        if (!videoTitle) videoTitle = jobId;
        const renamedFile = `${videoTitle}.wav`;
        const renamedPath = path.join(downloadsDir, renamedFile);

        // 2. 下載音訊
        console.log("[yt-dlp] Downloading Audio");
        const command = `./yt-dlp -f bestaudio -o "${tempFile}" --extract-audio --audio-format wav --audio-quality 0 --no-playlist "${url}" --paths "${downloadsDir}" --restrict-filenames`;
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`yt-dlp error:`, stderr);
                jobs[jobId].status = 'error';
                jobs[jobId].error = 'Failed to download or convert audio';
                return;
            }

            // 3. 找到轉檔後的檔案並重新命名
            console.log("[yt-dlp] Extracting");
            const convertedFile = fs.readdirSync(downloadsDir).find(f => f.startsWith(jobId) && f.endsWith('.wav'));
            if (!convertedFile) {
                jobs[jobId].status = 'error';
                jobs[jobId].error = 'No converted file found';
                return;
            }
            const convertedPath = path.join(downloadsDir, convertedFile);
            try {
                fs.renameSync(convertedPath, renamedPath);
            } catch (e) {
                console.error('Rename error:', e);
                jobs[jobId].status = 'error';
                jobs[jobId].error = 'Failed to rename file';
                return;
            }
            console.log("[yt-dlp] Compeleted!");
            jobs[jobId].status = 'done';
            jobs[jobId].progress = 100;
            jobs[jobId].file = `/downloads/${renamedFile}`;
            jobs[jobId].success = true;
            console.log("=================================================================================");
        });
    });

    res.json({ success: true, jobId });
});

app.get('/progress/:jobId', (req, res) => {
  const job = jobs[req.params.jobId];
  if (!job) return res.status(404).json({ success: false, error: 'Job not found' });
  
  // If the job is done, make sure it includes the success field
  if (job.status === 'done' && job.file && !job.success) {
    job.success = true;
  }
  
  res.json(job);
});

// List all available audio files
app.get('/audio-files', (req, res) => {
  try {
    const files = fs.readdirSync(downloadsDir)
      .filter(file => file.endsWith('.wav'))
      .map(file => ({
        name: file,
        url: `/downloads/${file}`,
        path: path.join(downloadsDir, file)
      }));
    
    res.json({ success: true, files });
  } catch (err) {
    console.error('讀取檔案列表錯誤：', err);
    res.status(500).json({ error: '無法讀取檔案列表' });
  }
});

// Delete audio file
app.delete('/audio-file/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(downloadsDir, filename);
  
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ success: true, message: '檔案已刪除' });
    } else {
      res.status(404).json({ error: '找不到檔案' });
    }
  } catch (err) {
    console.error('刪除檔案錯誤：', err);
    res.status(500).json({ error: '刪除檔案時發生錯誤' });
  }
});

// Provide access to downloaded files with proper headers for range requests
app.use('/downloads', (req, res, next) => {
  // Set headers to allow range requests
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Range');
  
  // Check if the file exists before proceeding
  const filePath = path.join(__dirname, 'downloads', path.basename(req.path));
  if (fs.existsSync(filePath)) {
    const stat = fs.statSync(filePath);
    if (stat.size === 0) {
      // If file is empty, return a simple response instead of trying to serve it
      return res.status(200).send('Empty audio file');
    }
    
    // Set content type for audio files
    if (filePath.endsWith('.wav')) {
      res.setHeader('Content-Type', 'audio/wav');
    } else if (filePath.endsWith('.mp3')) {
      res.setHeader('Content-Type', 'audio/mpeg');
    }
  }
  
  next();
}, express.static(path.join(__dirname, 'downloads')));

// Start server
app.listen(PORT, () => {
  console.log(`伺服器已啟動 http://localhost:${PORT}`);
  console.log(`下載目錄: ${downloadsDir}`);
});
