const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Create downloads directory if it doesn't exist
const downloadsDir = path.join(__dirname, 'downloads');
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true });
}

// Function to create a WAV file with proper headers
function createWavFile(filePath, duration, frequency) {
  return new Promise((resolve, reject) => {
    // Create a valid WAV file with proper headers
    const command = `ffmpeg -y -f lavfi -i "sine=frequency=${frequency}:duration=${duration}" -c:a pcm_s16le -ar 44100 -ac 2 "${filePath}"`;
    
    console.log(`Creating WAV file: ${filePath}`);
    console.log(`Command: ${command}`);
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error creating WAV file: ${error.message}`);
        reject(error);
      } else {
        console.log(`WAV file created: ${filePath}`);
        resolve();
      }
    });
  });
}

// Function to create a simple WAV header for empty files
function createEmptyWavWithHeader(filePath, duration = 10) {
  // WAV header for a 10-second silent stereo file at 44.1kHz
  const sampleRate = 44100;
  const channels = 2;
  const bitsPerSample = 16;
  const byteRate = sampleRate * channels * (bitsPerSample / 8);
  const blockAlign = channels * (bitsPerSample / 8);
  const dataSize = Math.floor(duration * sampleRate * channels * (bitsPerSample / 8));
  const fileSize = 36 + dataSize;
  
  const buffer = Buffer.alloc(44 + dataSize);
  
  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(fileSize, 4);
  buffer.write('WAVE', 8);
  
  // fmt chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // fmt chunk size
  buffer.writeUInt16LE(1, 20); // PCM format
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  
  // data chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  
  // Fill data with silence (zeros)
  for (let i = 44; i < buffer.length; i++) {
    buffer[i] = 0;
  }
  
  fs.writeFileSync(filePath, buffer);
  console.log(`Created empty WAV file with valid header: ${filePath}`);
}

// Main function to create sample files
async function createSampleFiles() {
  try {
    // Create main sample file
    const samplePath = path.join(downloadsDir, 'sample.wav');
    try {
      await createWavFile(samplePath, 10, 440);
    } catch (error) {
      // If ffmpeg fails, create an empty WAV file with a valid header
      createEmptyWavWithHeader(samplePath);
    }
    
    // Create test samples
    const testSamples = [
      { name: 'drum_loop.wav', freq: 220, duration: 5 },
      { name: 'bass_line.wav', freq: 110, duration: 8 },
      { name: 'melody.wav', freq: 880, duration: 12 },
      { name: 'test1.wav', freq: 330, duration: 3 },
      { name: 'test2.wav', freq: 660, duration: 6 },
      { name: 'test3.wav', freq: 550, duration: 9 }
    ];
    
    // Create each test sample
    for (const sample of testSamples) {
      const testPath = path.join(downloadsDir, sample.name);
      try {
        await createWavFile(testPath, sample.duration, sample.freq);
      } catch (error) {
        // If ffmpeg fails, create an empty WAV file with a valid header
        createEmptyWavWithHeader(testPath, sample.duration);
      }
    }
    
    console.log('All sample files created successfully!');
  } catch (error) {
    console.error('Error creating sample files:', error);
  }
}

// Run the function
createSampleFiles();
