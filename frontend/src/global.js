// Global variables and utility functions
let audioContext = null;
let audioSources = [];
let audioBuffers = [];
let isPlaying = false;
let currentTime = 0;
let startTime = 0;
let timerInterval = null;
let masterVolume = 0.5; // Default master volume (0-1)
let masterGainNode = null; // Master gain node for global volume control

// Initialize audio context
async function initAudioContext() {
    try {
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        audioContext = new AudioContext();
        
        // Create master gain node for global volume control
        masterGainNode = audioContext.createGain();
        masterGainNode.gain.value = masterVolume;
        masterGainNode.connect(audioContext.destination);
        
        return true;
    } catch (e) {
        console.error('Web Audio API is not supported in this browser', e);
        alert('您的瀏覽器不支援 Web Audio API，部分功能可能無法使用。\nYour browser does not support Web Audio API, some features may not work.');
        return false;
    }
}

// Format time in seconds to MM:SS format
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// Check backend server connection
async function checkServerConnection() {
    const serverStatus = document.getElementById('serverStatus');
    try {
        const response = await fetch('https://music-studio-znn4.onrender.com/health', { 
            method: 'GET'
        });
        
        if (response.ok) {
            const data = await response.json();
            serverStatus.textContent = '後端服務已連接｜Backend Service Connected';
            serverStatus.style.color = 'green';
            
            // Set up periodic status check
            setInterval(async () => {
                try {
                    const checkResponse = await fetch('https://music-studio-znn4.onrender.com/health', { 
                        method: 'GET'
                    });
                    
                    if (checkResponse.ok) {
                        serverStatus.textContent = '後端服務已連接｜Backend Service Connected';
                        serverStatus.style.color = 'green';
                    } else {
                        serverStatus.textContent = '後端服務出現錯誤｜Backend Service Error';
                        serverStatus.style.color = 'red';
                    }
                } catch (error) {
                    serverStatus.textContent = '後端服務未連接｜Backend Service Disconnected';
                    serverStatus.style.color = 'red';
                }
            }, 10000); // Check every 10 seconds
            
            return true;
        } else {
            serverStatus.textContent = '後端服務出現錯誤｜Backend Service Error';
            serverStatus.style.color = 'red';
            return false;
        }
    } catch (error) {
        serverStatus.textContent = '後端服務未連接｜Backend Service Disconnected';
        serverStatus.style.color = 'red';
        return false;
    }
}

// Load audio file from URL
async function loadAudioFile(url) {
    try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        
        // Directly decode audio data without using Web Worker
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        return audioBuffer;
    } catch (error) {
        console.error('Error loading audio file:', error);
        return null;
    }
}

// Draw waveform for audio buffer
function drawWaveform(audioBuffer, canvas) {
    // Store the duration in the canvas dataset for reference
    canvas.dataset.duration = audioBuffer.duration;
    
    // Find the maximum duration among all loaded audio buffers
    let maxDuration = audioBuffer.duration;
    for (let i = 0; i < audioBuffers.length; i++) {
        if (audioBuffers[i]) {
            maxDuration = Math.max(maxDuration, audioBuffers[i].duration);
        }
    }
    
    // Use a fixed width for all waveforms based on the duration (100px per second)
    const scaleFactor = 100; // pixels per second (changed from 50 to 100)
    const width = Math.ceil(audioBuffer.duration * scaleFactor);
    
    // Update canvas width
    canvas.width = width;
    
    const ctx = canvas.getContext('2d');
    const height = canvas.height;
    const data = audioBuffer.getChannelData(0);
    const step = Math.ceil(data.length / width);
    
    ctx.clearRect(0, 0, width, height);
    
    // Draw time markers at the top of the track
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    
   // Draw time markers every 0.1 seconds
   const timeInterval = 0.1; // seconds
   for (let time = 0; time <= audioBuffer.duration; time += timeInterval) {
       const x = time * scaleFactor;
       
       // Draw a tick mark
       ctx.beginPath();
       ctx.moveTo(x, 0);
       ctx.lineTo(x, 10);
       if(Math.floor(time * 10) % 5 === 0){ // Check for 0.5 second intervals
           ctx.strokeStyle = '#FFFFFF';
       }else{
           ctx.strokeStyle = '#464647';
       }
       ctx.lineWidth = 1;
       ctx.stroke();
       
       // Only show time text for whole seconds
       if (Math.floor(time * 10) % 10 === 0) {
           ctx.fillText(formatTime(time), x, 20);
       }
   }
    
    // Draw waveform
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    
    for (let i = 0; i < width; i++) {
        const index = Math.floor(i * step);
        const value = data[index] * height / 2;
        ctx.lineTo(i, (height / 2) + value);
    }
    
    ctx.strokeStyle = '#D87A33';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Create playhead if it doesn't exist
    const wavData = canvas.parentElement;
    let playhead = wavData.querySelector('.playhead');
    if (!playhead) {
        playhead = document.createElement('div');
        playhead.className = 'playhead';
        playhead.style.position = 'absolute';
        playhead.style.top = '0';
        playhead.style.left = '0';
        playhead.style.width = '2px';
        playhead.style.height = '100%';
        playhead.style.backgroundColor = 'white';
        playhead.style.display = 'none';
        playhead.style.zIndex = '10';
        // Ensure the playhead is a child of wavData, not canvas
        wavData.appendChild(playhead);
    }
    
    // Make the wavData container scrollable if the waveform is wider than the view
    wavData.style.overflowX = 'auto';
    wavData.style.overflowY = 'hidden';
}

// Save project data
function saveProject() {
    const projectData = {
        title: document.getElementById('fileTitle').value,
        tracks: []
    };
    
    const tracks = document.querySelectorAll('.track');
    tracks.forEach((track, index) => {
        const trackName = track.querySelector('input') ? 
                         track.querySelector('input').value : 
                         track.querySelector('p').textContent;
        
        projectData.tracks.push({
            name: trackName,
            audioUrl: track.dataset.audioUrl || null,
            volume: track.dataset.volume || 1.0,
            isCycleTrack: track.dataset.isCycleTrack === 'true'
        });
    });
    
    const jsonData = JSON.stringify(projectData);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectData.title.replace(/[^\w\s]/gi, '')}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
}

// Load project data
async function loadProject(jsonData) {
    try {
        const projectData = JSON.parse(jsonData);
        document.getElementById('fileTitle').value = projectData.title;
        
        // Clear existing tracks
        const trackZone = document.querySelector('.trackZone');
        trackZone.innerHTML = '';
        
        // Create new tracks from project data
        for (const trackData of projectData.tracks) {
            const trackElement = createTrackElement(trackData.name, trackData.isCycleTrack);
            trackElement.dataset.audioUrl = trackData.audioUrl;
            trackElement.dataset.volume = trackData.volume;
            
            if (trackData.audioUrl) {
                // Load audio and create waveform
                const audioBuffer = await loadAudioFile(trackData.audioUrl);
                if (audioBuffer) {
                    const wavData = trackElement.querySelector('.wavData');
                    const canvas = document.createElement('canvas');
                    canvas.height = 100;
                    wavData.appendChild(canvas);
                    drawWaveform(audioBuffer, canvas);
                    
                    // Make the wavData container scrollable
                    wavData.style.overflowX = 'auto';
                    wavData.style.overflowY = 'hidden';
                }
            }
            
            trackZone.appendChild(trackElement);
        }
        
        return true;
    } catch (error) {
        console.error('Error loading project:', error);
        return false;
    }
}

// Create a new track element
function createTrackElement(isCycleTrack) {
    const track = document.createElement('div');
    track.className = 'track';
    
    const icon = document.createElement('div');
    icon.className = 'icon';
    
    const input = document.createElement('input');
    input.type = 'text';
    input.value = name || `Track ${document.querySelectorAll('.track').length + 1}`;
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'deleteBtn';
    deleteBtn.title = '刪除音軌 Delete Track';
    deleteBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
    
    // Add event listener to the delete button
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent track selection when clicking delete
        const trackElement = deleteBtn.closest('.track');
        
        if (confirm('確定要刪除此音軌嗎？此操作無法復原。\nAre you sure you want to delete this track? This action cannot be undone.')) {
            // Remove the track from audio sources if it's playing
            const trackIndex = Array.from(document.querySelectorAll('.track')).indexOf(trackElement);
            if (audioSources[trackIndex]) {
                if (audioSources[trackIndex].source) {
                    audioSources[trackIndex].source.stop();
                }
                audioSources[trackIndex] = null;
            }
            audioBuffers[trackIndex] = null;
            
            // Remove the track element
            trackElement.remove();
        }
    });
    
    const wavData = document.createElement('div');
    wavData.className = 'wavData';
    // Set cycle flag if this is a cycle track
    if (isCycleTrack) {
        wavData.classList.add('cycle');
        track.dataset.isCycleTrack = 'true';
    }else{
        wavData.classList.add('non-cycle');
        track.dataset.isCycleTrack = 'false';
    }
    
    
    // Volume control
    const volumeControl = document.createElement('div');
    volumeControl.className = 'volume-control';
    volumeControl.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
    
    const volumeSlider = document.createElement('input');
    volumeSlider.type = 'range';
    volumeSlider.min = '0';
    volumeSlider.max = '100';
    volumeSlider.value = '80';
    volumeSlider.className = 'volume-slider';
    volumeSlider.title = '調整音軌音量 Adjust Track Volume';
    
    volumeControl.appendChild(volumeSlider);
    icon.appendChild(input);
    icon.appendChild(deleteBtn);
    icon.appendChild(volumeControl);
    
    track.appendChild(icon);
    track.appendChild(wavData);
    
    return track;
}
