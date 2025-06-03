const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Create downloads directory if it doesn't exist
const downloadsDir = path.join(__dirname, 'downloads');
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true });
}

// Function to create a sample WAV file using ffmpeg
function createSampleWav(name, duration, frequency, outputPath) {
  return new Promise((resolve, reject) => {
    // Command to generate a sine wave audio file
    const command = `ffmpeg -y -f lavfi -i "sine=frequency=${frequency}:duration=${duration}" -c:a pcm_s16le -ar 44100 -ac 2 "${outputPath}"`;
    
    console.log(`Creating sample file: ${outputPath}`);
    console.log(`Command: ${command}`);
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error creating sample file: ${error.message}`);
        reject(error);
        return;
      }
      console.log(`Sample file created: ${outputPath}`);
      resolve();
    });
  });
}

// Create multiple sample files with different frequencies
async function createSampleFiles() {
  try {
    // Sample 1: Low frequency (bass)
    await createSampleWav(
      'bass_sample',
      5, // 5 seconds
      220, // 220 Hz (low A note)
      path.join(downloadsDir, 'bass_sample.wav')
    );
    
    // Sample 2: Mid frequency
    await createSampleWav(
      'mid_sample',
      5, // 5 seconds
      440, // 440 Hz (A4 note)
      path.join(downloadsDir, 'mid_sample.wav')
    );
    
    // Sample 3: High frequency
    await createSampleWav(
      'high_sample',
      5, // 5 seconds
      880, // 880 Hz (high A note)
      path.join(downloadsDir, 'high_sample.wav')
    );
    
    // Sample 4: Sweep from low to high
    const sweepCommand = `ffmpeg -y -f lavfi -i "sine=frequency=55:beep=1:duration=10,aformat=channel_layouts=stereo" -filter_complex "aevalsrc=0.5*sin(2*PI*time*110):s=44100:c=2[a1];aevalsrc=0.5*sin(2*PI*time*220):s=44100:c=2[a2];aevalsrc=0.5*sin(2*PI*time*440):s=44100:c=2[a3];aevalsrc=0.5*sin(2*PI*time*880):s=44100:c=2[a4];[a1][a2][a3][a4]concat=n=4:v=0:a=1[out]" -map "[out]" -c:a pcm_s16le "${path.join(downloadsDir, 'sweep_sample.wav')}"`;
    
    console.log(`Creating sweep sample file`);
    console.log(`Command: ${sweepCommand}`);
    
    await new Promise((resolve, reject) => {
      exec(sweepCommand, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error creating sweep sample: ${error.message}`);
          reject(error);
          return;
        }
        console.log(`Sweep sample created`);
        resolve();
      });
    });
    
    console.log('All sample files created successfully!');
  } catch (error) {
    console.error('Error creating sample files:', error);
  }
}

// Run the function
createSampleFiles();
