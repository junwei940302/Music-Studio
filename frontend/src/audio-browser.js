// Audio Browser functionality
document.addEventListener('DOMContentLoaded', function() {
    // Create the audio browser modal
    createAudioBrowserModal();
    
    // Add event listeners to browse buttons
    setupBrowseButtons();
});

// Create the audio browser modal
function createAudioBrowserModal() {
    // Create modal element if it doesn't exist
    if (!document.getElementById('audioBrowserModal')) {
        const modal = document.createElement('div');
        modal.id = 'audioBrowserModal';
        modal.className = 'modal';
        modal.style.display = 'none';
        
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        modalContent.style.width = '80%';
        modalContent.style.maxWidth = '800px';
        
        const closeBtn = document.createElement('span');
        closeBtn.className = 'close';
        closeBtn.innerHTML = '&times;';
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        const title = document.createElement('h2');
        title.textContent = '瀏覽音訊檔案 Browse Audio Files';
        
        const fileList = document.createElement('div');
        fileList.id = 'audioBrowserFileList';
        fileList.style.maxHeight = '400px';
        fileList.style.overflowY = 'scroll';
        fileList.style.marginTop = '20px';
        
        const refreshBtn = document.createElement('button');
        refreshBtn.textContent = '重新整理 Refresh';
        refreshBtn.style.backgroundColor = '#D87A33';
        refreshBtn.style.color = 'white';
        refreshBtn.style.border = 'none';
        refreshBtn.style.padding = '8px 16px';
        refreshBtn.style.borderRadius = '4px';
        refreshBtn.style.cursor = 'pointer';
        refreshBtn.style.marginTop = '15px';
        refreshBtn.addEventListener('click', () => {
            loadAudioFiles();
        });
        
        modalContent.appendChild(closeBtn);
        modalContent.appendChild(title);
        modalContent.appendChild(fileList);
        modalContent.appendChild(refreshBtn);
        modal.appendChild(modalContent);
        
        document.body.appendChild(modal);
        
        // Close modal when clicking outside
        window.addEventListener('click', function(event) {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
}

// Setup browse buttons for each track
function setupBrowseButtons() {
    // Add browse buttons to existing tracks
    document.querySelectorAll('.track').forEach(track => {
        addBrowseButtonToTrack(track);
    });
    
    // Override createTrackElement to add browse button to new tracks
    const originalCreateTrackElement = window.createTrackElement;
    window.createTrackElement = function(name) {
        const track = originalCreateTrackElement(name);
        addBrowseButtonToTrack(track);
        return track;
    };
}

// Add browse button to a track
function addBrowseButtonToTrack(track) {
    // Check if the track already has a browse button
    if (track.querySelector('.browseBtn')) {
        return;
    }
    
    const icon = track.querySelector('.icon');
    const deleteBtn = track.querySelector('.deleteBtn');
    
    // Create browse button
    const browseBtn = document.createElement('button');
    browseBtn.className = 'browseBtn';
    browseBtn.title = '瀏覽音訊檔案 Browse Audio Files';
    browseBtn.innerHTML = '<i class="fa-solid fa-music"></i>';
    browseBtn.style.backgroundColor = '#2A5A8B';
    
    // Add event listener to browse button
    browseBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent track selection when clicking browse
        
        // Store the current track for later use
        window.currentBrowseTrack = track;
        
        // Show the audio browser modal
        const modal = document.getElementById('audioBrowserModal');
        if (modal) {
            modal.style.display = 'block';
            loadAudioFiles();
        }
    });
    
    // Insert browse button before delete button
    if (deleteBtn) {
        icon.insertBefore(browseBtn, deleteBtn);
    } else {
        icon.appendChild(browseBtn);
    }
}

// Load audio files from the backend
async function loadAudioFiles() {
    const fileList = document.getElementById('audioBrowserFileList');
    if (!fileList) return;
    
    // Show loading indicator
    fileList.innerHTML = '<p style="text-align: center;">載入中... Loading...</p>';
    
    try {
        const response = await fetch('http://localhost:3000/audio-files');
        const data = await response.json();
        
        if (data.success && data.files && data.files.length > 0) {
            // Clear file list
            fileList.innerHTML = '';
            
            // Create table for files
            const table = document.createElement('table');
            table.style.width = '100%';
            table.style.borderCollapse = 'collapse';
            
            // Create table header
            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');
            
            const nameHeader = document.createElement('th');
            nameHeader.textContent = '檔案名稱 Filename';
            nameHeader.style.textAlign = 'left';
            nameHeader.style.padding = '8px';
            nameHeader.style.borderBottom = '1px solid #444';
            
            const actionHeader = document.createElement('th');
            actionHeader.textContent = '動作 Action';
            actionHeader.style.textAlign = 'right';
            actionHeader.style.padding = '8px';
            actionHeader.style.borderBottom = '1px solid #444';
            
            headerRow.appendChild(nameHeader);
            headerRow.appendChild(actionHeader);
            thead.appendChild(headerRow);
            table.appendChild(thead);
            
            // Create table body
            const tbody = document.createElement('tbody');
            
            data.files.forEach(file => {
                const row = document.createElement('tr');
                row.style.borderBottom = '1px solid #333';
                
                const nameCell = document.createElement('td');
                nameCell.textContent = file.name;
                nameCell.style.padding = '8px';
                
                const actionCell = document.createElement('td');
                actionCell.style.padding = '8px';
                actionCell.style.textAlign = 'right';
                
                const selectBtn = document.createElement('button');
                selectBtn.textContent = '選擇 Select';
                selectBtn.style.backgroundColor = '#D87A33';
                selectBtn.style.color = 'white';
                selectBtn.style.border = 'none';
                selectBtn.style.padding = '5px 10px';
                selectBtn.style.borderRadius = '4px';
                selectBtn.style.cursor = 'pointer';
                
                selectBtn.addEventListener('click', () => {
                    selectAudioFile(file);
                });
                
                const previewBtn = document.createElement('button');
                previewBtn.textContent = '預覽 Preview';
                previewBtn.style.backgroundColor = '#4A4A4B';
                previewBtn.style.color = 'white';
                previewBtn.style.border = 'none';
                previewBtn.style.padding = '5px 10px';
                previewBtn.style.borderRadius = '4px';
                previewBtn.style.cursor = 'pointer';
                previewBtn.style.marginRight = '5px';
                
                previewBtn.addEventListener('click', () => {
                    previewAudioFile(file);
                });
                
                actionCell.appendChild(previewBtn);
                actionCell.appendChild(selectBtn);
                
                row.appendChild(nameCell);
                row.appendChild(actionCell);
                
                tbody.appendChild(row);
            });
            
            table.appendChild(tbody);
            fileList.appendChild(table);
        } else {
            fileList.innerHTML = '<p style="text-align: center;">沒有可用的音訊檔案。No audio files available.</p>';
        }
    } catch (error) {
        console.error('Error loading audio files:', error);
        fileList.innerHTML = '<p style="text-align: center; color: red;">載入檔案時發生錯誤。Error loading files.</p>';
    }
}

// Preview audio file
let previewAudio = null;

function previewAudioFile(file) {
    // Stop any existing preview
    if (previewAudio) {
        previewAudio.pause();
        previewAudio.currentTime = 0;
    }
    
    // Create new audio element
    previewAudio = new Audio(`http://localhost:3000${file.url}`);
    previewAudio.play();
}

// Select audio file and load it into the current track
async function selectAudioFile(file) {
    // Get the current track
    const track = window.currentBrowseTrack;
    if (!track) return;
    
    // Close the modal
    const modal = document.getElementById('audioBrowserModal');
    if (modal) {
        modal.style.display = 'none';
    }
    
    // Stop any preview
    if (previewAudio) {
        previewAudio.pause();
        previewAudio.currentTime = 0;
    }
    
    // Show loading indicator in the track
    const wavData = track.querySelector('.wavData');
    track.querySelector('input').value = file.name;
    wavData.innerHTML = '<div style="display: flex; justify-content: center; align-items: center; height: 100%;"><p>載入中... Loading...</p></div>';
    
    try {
        // Store audio URL
        track.dataset.audioUrl = file.url;
        
        // Load audio and create waveform
        if (audioContext) {
            const audioBuffer = await loadAudioFile(`http://localhost:3000${file.url}`);
            if (audioBuffer) {
                wavData.innerHTML = '';
                
                const canvas = document.createElement('canvas');
                canvas.height = 100;
                wavData.appendChild(canvas);
                
                // Store the buffer for playback
                const trackIndex = Array.from(document.querySelectorAll('.track')).indexOf(track);
                audioBuffers[trackIndex] = audioBuffer;
                
                // Draw the waveform
                drawWaveform(audioBuffer, canvas);
                
                // Make the wavData container scrollable
                wavData.style.overflowX = 'auto';
                wavData.style.overflowY = 'hidden';
                
                // Redraw all waveforms to ensure they have the same width
                if (window.redrawAllWaveforms) {
                    window.redrawAllWaveforms();
                }
            }
        }
    } catch (error) {
        console.error('Error loading audio file:', error);
        wavData.innerHTML = '<div style="display: flex; justify-content: center; align-items: center; height: 100%;"><p style="color: red;">載入檔案時發生錯誤。Error loading file.</p></div>';
    }
}
