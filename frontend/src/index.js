document.addEventListener('DOMContentLoaded', function() {
    // Create loading overlay
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'loadingOverlay';
    loadingOverlay.innerHTML = '正在連接後端伺服器及初始化介面...<br>Connecting to backend server and initializing interface...';
    document.body.appendChild(loadingOverlay);

    // Initialize audio context
    initAudioContext();
    
    // Check server connection with timeout
    const checkServer = async () => {
        try {
            const response = await fetch('http://127.0.0.1:3000/health', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                console.log('Server connection successful');
                const serverStatus = document.getElementById('serverStatus');
                if (serverStatus) {
                    serverStatus.textContent = '後端服務已連接｜Backend Service Connected';
                    serverStatus.style.color = '#4CAF50';
                }
                loadingOverlay.remove();
            } else {
                console.error('Server connection failed');
                const serverStatus = document.getElementById('serverStatus');
                if (serverStatus) {
                    serverStatus.textContent = '後端服務未連接｜Backend Service Disconnected';
                    serverStatus.style.color = '#f44336';
                }
                loadingOverlay.innerHTML = '無法連接到後端伺服器，請確認伺服器是否正在運行。<br>Unable to connect to backend server, please check if the server is running.';
            }
        } catch (error) {
            console.error('Server connection error:', error);
            const serverStatus = document.getElementById('serverStatus');
            if (serverStatus) {
                serverStatus.textContent = '後端服務未連接｜Backend Service Disconnected';
                serverStatus.style.color = '#f44336';
            }
            loadingOverlay.innerHTML = '無法連接到後端伺服器，請確認伺服器是否正在運行。<br>Unable to connect to backend server, please check if the server is running.';
        }
    };

    // Set a timeout for the server check
    const serverCheckTimeout = setTimeout(() => {
        const serverStatus = document.getElementById('serverStatus');
        if (serverStatus) {
            serverStatus.textContent = '後端服務未連接｜Backend Service Disconnected';
            serverStatus.style.color = '#f44336';
        }
        loadingOverlay.innerHTML = '連接後端伺服器超時，請確認伺服器是否正在運行。<br>Server connection timeout, please check if the server is running.';
    }, 5000); // 5 seconds timeout

    // Start server check
    checkServer().then(() => {
        clearTimeout(serverCheckTimeout);
    });
    
    // Set up timer display
    const timerDisplay = document.querySelector('.timer input');
    
    // Set up menu interactions
    const optionItems = document.querySelectorAll('.optionBar > ul > li');
    const dropdowns = document.querySelectorAll('.dropdown');
    let activeIdx = null;
    let hideTimeout = null;

    // Menu hover effects
    optionItems.forEach((item, idx) => {
        item.addEventListener('mouseenter', () => {
            clearTimeout(hideTimeout);
            showSubmenu(idx);
        });
        item.addEventListener('mouseleave', () => {
            hideTimeout = setTimeout(hideAllSubmenus, 200);
        });
    });

    dropdowns.forEach((dropdown, idx) => {
        dropdown.addEventListener('mouseenter', () => {
            clearTimeout(hideTimeout);
        });
        dropdown.addEventListener('mouseleave', () => {
            hideTimeout = setTimeout(hideAllSubmenus, 200);
        });
    });

    // Set up menu item click handlers
    document.querySelector('[data-newFile]').addEventListener('click', () => {
        if (confirm('確定要建立新檔案嗎？未儲存的變更將會遺失。\nCreate a new file? Unsaved changes will be lost.')) {
            window.location.reload();
        }
    });

    document.querySelector('[data-saveFile]').addEventListener('click', saveProject);

    document.querySelector('[data-importFile]').addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = e => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = async event => {
                    const success = await loadProject(event.target.result);
                    if (success) {
                        alert('專案已成功載入。\nProject loaded successfully.');
                    } else {
                        alert('載入專案時發生錯誤。\nError loading project.');
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    });

    document.querySelector('[data-exportFile]').addEventListener('click', () => {
        saveProject();
    });

    document.querySelector('[data-newTrack]').addEventListener('click', () => {
        const trackZone = document.querySelector('.trackZone');
        const newTrack = createTrackElement(false);
        trackZone.appendChild(newTrack);
        setupTrackEvents(newTrack);
    });
    
    document.querySelector('[data-newCycleTrack]').addEventListener('click', () => {
        const trackZone = document.querySelector('.trackZone');
        const newTrack = createTrackElement(true);
        trackZone.appendChild(newTrack);
        setupTrackEvents(newTrack);
    });
    
    document.querySelector('[data-cutTrack]').addEventListener('click', () => {
        const activeTrack = document.querySelector('.track.active');
        if (activeTrack) {
            if (confirm('確定要刪除此音軌嗎？此操作無法復原。\nAre you sure you want to delete this track? This action cannot be undone.')) {
                // Store the track data in case we need to paste it later
                const trackData = {
                    name: activeTrack.querySelector('input').value,
                    audioUrl: activeTrack.dataset.audioUrl,
                    volume: activeTrack.dataset.volume || 0.8,
                    isCycleTrack: activeTrack.dataset.isCycleTrack === 'true'
                };
                
                // Store in global clipboard
                window.trackClipboard = trackData;
                
                // Remove the track
                const trackIndex = Array.from(document.querySelectorAll('.track')).indexOf(activeTrack);
                if (audioSources[trackIndex]) {
                    if (audioSources[trackIndex].source) {
                        audioSources[trackIndex].source.stop();
                    }
                    audioSources[trackIndex] = null;
                }
                audioBuffers[trackIndex] = null;
                
                activeTrack.remove();
            }
        } else {
            alert('請先選擇一個音軌。\nPlease select a track first.');
        }
    });
    
    document.querySelector('[data-copyTrack]').addEventListener('click', () => {
        const activeTrack = document.querySelector('.track.active');
        if (activeTrack) {
            // Store the track data
            const trackData = {
                name: activeTrack.querySelector('input').value,
                audioUrl: activeTrack.dataset.audioUrl,
                volume: activeTrack.dataset.volume || 0.8,
                isCycleTrack: activeTrack.dataset.isCycleTrack === 'true'
            };
            
            // Store in global clipboard
            window.trackClipboard = trackData;
            
            alert('音軌已複製到剪貼簿。\nTrack copied to clipboard.');
        } else {
            alert('請先選擇一個音軌。\nPlease select a track first.');
        }
    });
    
    document.querySelector('[data-pasteTrack]').addEventListener('click', () => {
        if (window.trackClipboard) {
            const trackZone = document.querySelector('.trackZone');
            const newTrack = createTrackElement(window.trackClipboard.name, window.trackClipboard.isCycleTrack);
            newTrack.dataset.audioUrl = window.trackClipboard.audioUrl;
            newTrack.dataset.volume = window.trackClipboard.volume;
            
            // Set volume slider value
            const volumeSlider = newTrack.querySelector('.volume-slider');
            if (volumeSlider) {
                volumeSlider.value = window.trackClipboard.volume * 100;
            }
            
            trackZone.appendChild(newTrack);
            setupTrackEvents(newTrack);
            
            // If there's audio data, load it and create waveform
            if (window.trackClipboard.audioUrl && audioContext) {
                loadAudioFile(`http://127.0.0.1:3000${window.trackClipboard.audioUrl}`).then(audioBuffer => {
                    if (audioBuffer) {
                        const wavData = newTrack.querySelector('.wavData');
                        wavData.innerHTML = '';
                        
                        const canvas = document.createElement('canvas');
                        wavData.appendChild(canvas);
                        
                        // Store the buffer for playback
                        const trackIndex = Array.from(document.querySelectorAll('.track')).indexOf(newTrack);
                        audioBuffers[trackIndex] = audioBuffer;
                        
                        // Draw the waveform
                        drawWaveform(audioBuffer, canvas);
                        
                        // Make the wavData container scrollable
                        wavData.style.overflowX = 'auto';
                        wavData.style.overflowY = 'hidden';
                        
                        // Redraw all waveforms to ensure they have the same width
                        redrawAllWaveforms();
                    }
                });
            }
            
            alert('音軌已貼上。\nTrack pasted.');
        } else {
            alert('剪貼簿中沒有音軌資料。\nNo track data in clipboard.');
        }
    });
    
    document.querySelector('[data-importYouTubeAudio]').addEventListener('click', () => {
        const input = prompt("輸入有效的YouTube來源URL｜Enter valid YouTube URL");
        if (input && input.includes('https://www.youtube.com/')) {
            alert('來源已驗證，正在轉換中，請稍候。Valid source, Converting, Please wait.');
            
            // Call the convert function from the parent scope
            window.convertAudio(input);
        } else {
            alert('錯誤的來源。Invalid URL.');
        }
    });
    
    // Set up master volume control
    const masterVolumeSlider = document.querySelector('.master-volume');
    if (masterVolumeSlider) {
        masterVolumeSlider.value = masterVolume * 100;
        masterVolumeSlider.addEventListener('input', () => {
            masterVolume = masterVolumeSlider.value / 100;
            if (masterGainNode) {
                masterGainNode.gain.value = masterVolume;
            }
        });
    }
    
    // Set up playback controls
    const backToStartButton = document.querySelector('.control.panel button:nth-child(1)');
    const playButton = document.querySelector('.control.panel button:nth-child(2)');
    const pauseButton = document.querySelector('.control.panel button:nth-child(3)');
    const stopButton = document.querySelector('.control.panel button:nth-child(4)');
    const forwardToEndButton = document.querySelector('.control.panel button:nth-child(5)');

    backToStartButton.addEventListener('click', ()=>{
        backToStart();
        pauseButton.hidden = true;
        playButton.hidden = false;
    });

    playButton.addEventListener('click', () => {
        if (!isPlaying) {
            startPlayback();
            playButton.hidden = true;
            pauseButton.hidden = false;
        }
    });

    pauseButton.addEventListener('click', () => {
        if (isPlaying) {
            pausePlayback();
            pauseButton.hidden = true;
            playButton.hidden = false;
        }
    });

    stopButton.addEventListener('click', () => {
        stopPlayback();
        pauseButton.hidden = true;
        playButton.hidden = false;
    });

    forwardToEndButton.addEventListener('click', ()=>{
        forwardToEnd();
        pauseButton.hidden = true;
        playButton.hidden = false;
    });

    // Set up toolBox tool switching functionality
    const toolBoxButtons = document.querySelectorAll('.toolBox.panel button');
    toolBoxButtons.forEach(button => {
        button.addEventListener('click', () => {
            toolBoxButtons.forEach(btn => btn.classList.remove('focus'));
            button.classList.add('focus');
        });
    });
    
    // Set up track selection and delete buttons
    const tracks = document.querySelectorAll('.track');
    tracks.forEach(track => {
        setupTrackEvents(track);
    });
    
    // Set up delete buttons
    const deleteButtons = document.querySelectorAll('.deleteBtn');
    deleteButtons.forEach(deleteBtn => {
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent track selection when clicking delete
            const track = deleteBtn.closest('.track');
            
            if (confirm('確定要刪除此音軌嗎？此操作無法復原。\nAre you sure you want to delete this track? This action cannot be undone.')) {
                // Remove the track from audio sources if it's playing
                const trackIndex = Array.from(document.querySelectorAll('.track')).indexOf(track);
                if (audioSources[trackIndex]) {
                    if (audioSources[trackIndex].source) {
                        audioSources[trackIndex].source.stop();
                    }
                    audioSources[trackIndex] = null;
                }
                audioBuffers[trackIndex] = null;
                
                // Remove the track element
                track.remove();
            }
        });
    });

    // Helper functions
    function showSubmenu(idx) {
        dropdowns.forEach((dropdown, dropdownIdx) => {
            if (dropdownIdx === idx) {
                dropdown.style.display = 'block';
            } else {
                dropdown.style.display = 'none';
            }
        });
        activeIdx = idx;
    }

    function hideAllSubmenus() {
        dropdowns.forEach(dropdown => dropdown.style.display = 'none');
        activeIdx = null;
    }

    function setupTrackEvents(track) {
        // Make track selectable
        track.addEventListener('click', () => {
            document.querySelectorAll('.track').forEach(t => t.classList.remove('active'));
            track.classList.add('active');
        });

        // Set up volume slider if it exists
        const volumeSlider = track.querySelector('.volume-slider');
        if (volumeSlider) {
            volumeSlider.addEventListener('input', () => {
                const volume = volumeSlider.value / 100;
                track.dataset.volume = volume;
                
                // If track is playing, update its volume
                const trackIndex = Array.from(document.querySelectorAll('.track')).indexOf(track);
                if (audioSources[trackIndex]) {
                    audioSources[trackIndex].gainNode.gain.value = volume;
                }
            });
        }
    }

    // Make the convert function globally available
    window.convertAudio = async function(youtubeUrl, originalHTML='下載佇列目前為空｜Queue is empty') {
        const url = youtubeUrl;
        try {
            // Create progress bar
            //const track = uploadBtn.closest('.track');
            //const wavData = track.querySelector('.wavData');
            //wavData.innerHTML = '';
            const progressText = document.querySelector('.progress-text');
            const progressBar = document.querySelector('.progress-bar');
        
            progressText.textContent = '準備下載中... Preparing download...';
            
            
            // Start progress simulation
            let progress = 0;
            const progressInterval = setInterval(() => {
                if (progress < 90) {
                    progress += Math.random() * 5;
                    progressBar.style.width = `${Math.min(progress, 90)}%`;
                    progressText.textContent = `下載中... Downloading... ${Math.floor(Math.min(progress, 90))}%`;
                }
            }, 500);
            
            // Make the API call
            const res = await fetch('http://127.0.0.1:3000/convert', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ url })
            });
      
            const data = await res.json();
      
            if (data.success) {
                // Complete progress bar
                clearInterval(progressInterval);
                progressBar.style.width = '100%';
                progressText.textContent = '下載完成! Download complete!';
                
                // Store audio URL
                //track.dataset.audioUrl = data.file;
                
                // Wait a moment to show completion
                await new Promise(resolve => setTimeout(resolve, 1000));      
                setTimeout(() => {
                    document.querySelector('.progress-text').textContent = originalHTML;
                }, 2000);
            } else {
                // Show error in progress bar
                clearInterval(progressInterval);
                progressBar.style.width = '100%';
                progressBar.style.backgroundColor = 'red';
                progressText.textContent = '錯誤：' + data.error;
                
                alert('錯誤：' + data.error);
                document.querySelector('.progress-text').textContent = originalHTML;
            }
        } catch (error) {
            console.error('Error converting YouTube URL:', error);
            alert('轉換過程中發生錯誤，請確認後端服務是否正常運作。\nError during conversion, please check if the backend service is running.');
            document.querySelector('.progress-text').textContent = originalHTML;
            document.querySelector('.progress').innerHTML = '';
        }
    }

    function startPlayback() {
        if (!audioContext) {
            initAudioContext();
        }
        
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        
        // Stop any existing playback
        stopPlayback(false);
        
        // Start new playback
        isPlaying = true;
        startTime = audioContext.currentTime - currentTime;
        
        // Create sources for each track
        const tracks = document.querySelectorAll('.track');
        tracks.forEach((track, index) => {
            if (audioBuffers[index]) {
                const source = audioContext.createBufferSource();
                source.buffer = audioBuffers[index];
                
                // Create gain node for volume control
                const gainNode = audioContext.createGain();
                gainNode.gain.value = track.dataset.volume || 0.8;
                
                // Connect nodes to the master gain node instead of directly to destination
                source.connect(gainNode);
                gainNode.connect(masterGainNode);
                
                // Set loop property for cycle tracks
                if (track.dataset.isCycleTrack === 'true') {
                    source.loop = true;
                }
                
                // Start playback
                source.start(0, currentTime);
                
                // Add ended event to detect when audio ends (for non-cycle tracks)
                if (track.dataset.isCycleTrack !== 'true') {
                    source.onended = function() {
                        // Check if all non-cycle sources have ended
                        const allNonCycleEnded = audioSources.every((sourceObj, idx) => {
                            const trackElement = document.querySelectorAll('.track')[idx];
                            // Skip cycle tracks in the check
                            if (trackElement && trackElement.dataset.isCycleTrack === 'true') {
                                return true;
                            }
                            return !sourceObj || !sourceObj.source || sourceObj.source.onended === null;
                        });
                        
                        if (allNonCycleEnded && isPlaying) {
                            // Don't pause if there are active cycle tracks
                            const hasCycleTracks = Array.from(document.querySelectorAll('.track')).some((t, idx) => 
                                track.dataset.isCycleTrack === 'true' && audioSources[idx] && audioSources[idx].source
                            );
                            
                            if (!hasCycleTracks) {
                                pausePlayback();
                                const playButton = document.querySelector('.control.panel button:nth-child(2)');
                                const pauseButton = document.querySelector('.control.panel button:nth-child(3)');
                                pauseButton.hidden = true;
                                playButton.hidden = false;
                            }
                        }
                    };
                }
                
                // Store source for later control
                audioSources[index] = {
                    source: source,
                    gainNode: gainNode
                };
                
                // Show playhead
                const wavData = track.querySelector('.wavData');
                const playhead = wavData.querySelector('.playhead');
                if (playhead) {
                    playhead.style.display = 'block';
                    playhead.style.left = '0px';
                }
            }
        });
        
        // Update timer display and playhead position
        updateTimer();
    }

    function pausePlayback() {
        if (isPlaying) {
            // Update current time
            currentTime = audioContext.currentTime - startTime;
            
            // Stop all sources
            audioSources.forEach(sourceObj => {
                if (sourceObj && sourceObj.source) {
                    sourceObj.source.stop();
                }
            });
            
            // Clear sources array
            audioSources = [];
            
            isPlaying = false;
            clearInterval(timerInterval);
            
            // Keep playheads visible but stop updating them
            document.querySelectorAll('.playhead').forEach(playhead => {
                playhead.style.display = 'block';
            });
        }
    }

    function stopPlayback(resetTime = true) {
        // Stop all sources
        audioSources.forEach(sourceObj => {
            if (sourceObj && sourceObj.source) {
                sourceObj.source.stop();
            }
        });
        
        // Clear sources array
        audioSources = [];
        
        isPlaying = false;
        
        if (resetTime) {
            currentTime = 0;
            timerDisplay.value = '0:00.000';
            
            // Hide all playheads and reset their positions
            document.querySelectorAll('.playhead').forEach(playhead => {
                playhead.style.display = 'none';
                playhead.style.left = '0px';
            });
        }
        
        clearInterval(timerInterval);
    }

    function backToStart() {
        stopPlayback();
        document.querySelectorAll('.wavData').forEach(wavData => {
            wavData.scrollLeft = 0;
        });
    }

    function forwardToEnd() {
        stopPlayback();
        document.querySelectorAll('.wavData').forEach(wavData => {
            wavData.scrollLeft += 1000000;
        });
    }

    // Function to redraw all waveforms to ensure they have the same width
    // Make it globally available for other scripts
    window.redrawAllWaveforms = function() {
        document.querySelectorAll('.track').forEach((track, index) => {
            if (audioBuffers[index]) {
                const wavData = track.querySelector('.wavData');
                const canvas = wavData.querySelector('canvas');
                
                if (canvas) {
                    // Clear the canvas
                    const ctx = canvas.getContext('2d');
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    
                    // Redraw the waveform
                    drawWaveform(audioBuffers[index], canvas);
                }
            }
        });
    }
    
    function updateTimer() {
        clearInterval(timerInterval);
        
        timerInterval = setInterval(() => {
            if (isPlaying) {
                const elapsed = audioContext.currentTime - startTime;
                // Calculate minutes, seconds, and milliseconds
                const minutes = Math.floor(elapsed / 60);
                const seconds = Math.floor(elapsed % 60);
                const milliseconds = Math.floor((elapsed % 1) * 1000);
                
                // Format the time as m:ss:fff
                timerDisplay.value = `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
                
                // Find the longest track duration for consistent playhead positioning
                let maxDuration = 0;
                document.querySelectorAll('.track').forEach((track, index) => {
                    if (audioBuffers[index]) {
                        maxDuration = Math.max(maxDuration, audioBuffers[index].duration);
                    }
                });
                
                // Check if we've reached the end of the longest track
                if (elapsed >= maxDuration && isPlaying) {
                    // Check if there are any cycle tracks playing
                    const hasCycleTracks = Array.from(document.querySelectorAll('.track')).some(track => 
                        track.dataset.isCycleTrack === 'true' && track.dataset.audioUrl
                    );
                    
                    // Only pause if there are no cycle tracks
                    if (!hasCycleTracks) {
                        pausePlayback();
                        const playButton = document.querySelector('.control.panel button:nth-child(2)');
                        const pauseButton = document.querySelector('.control.panel button:nth-child(3)');
                        pauseButton.hidden = true;
                        playButton.hidden = false;
                        return;
                    }
                }
                
                // Update playhead positions - all using the same time scale
                document.querySelectorAll('.track').forEach((track, index) => {
                    if (audioBuffers[index]) {
                        const wavData = track.querySelector('.wavData');
                        const playhead = wavData.querySelector('.playhead');
                        const canvas = wavData.querySelector('canvas');
                        
                        if (playhead && canvas) {
                            // Calculate position based on absolute time rather than relative time
                            // This ensures all playheads are at the same horizontal position
                            const scaleFactor = 135; // pixels per second (same as in drawWaveform)
                            
                            // For cycle tracks, wrap the time around the duration
                            let effectiveTime = elapsed;
                            if (track.dataset.isCycleTrack === 'true' && audioBuffers[index].duration > 0) {
                                effectiveTime = elapsed % audioBuffers[index].duration;
                            }
                            
                            const absolutePosition = Math.min(effectiveTime, audioBuffers[index].duration) * scaleFactor;
                            playhead.style.left = `${absolutePosition}px`;
                            
                            // Scroll the waveform container to keep the playhead visible
                            if (canvas.width > wavData.clientWidth) {
                                const scrollPosition = absolutePosition - (wavData.clientWidth / 2);
                                wavData.scrollLeft = Math.max(0, scrollPosition);
                            }
                        }
                    }
                });
            }
        }, 30); // Update more frequently for smoother playhead movement
    }
});
