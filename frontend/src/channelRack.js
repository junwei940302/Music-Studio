document.addEventListener("DOMContentLoaded", () =>{

    // Add master gain node for channel rack
    let channelRackMasterGain = null;
    if (audioContext) {
        channelRackMasterGain = audioContext.createGain();
        channelRackMasterGain.gain.value = 1.0;
        channelRackMasterGain.connect(audioContext.destination);
    }

    const rackToggle = document.querySelector('.channelRackToggle');
    const rack = document.querySelector('.channelRackPanel');
    const toggleIcon = document.querySelector('.channelRackToggle i');
    
    //toggle rack
    let isToggled = true;
    rackToggle.addEventListener('click', ()=>{
        if(isToggled){
            rack.style.transform = 'translateX(0)';
            rack.style.filter = 'blur(0px)';
            toggleIcon.className = 'fa-solid fa-chevron-right'
            isToggled = false;
        }else{
            rack.style.transform = 'translateX(-100vw)';
            rack.style.filter = 'blur(5px)';
            toggleIcon.className = 'fa-solid fa-chevron-left'
            isToggled = true;
        }
    });
    
    //pad audio func
    const pads = document.querySelectorAll('.punchPadZone div button');
    audioArr = {
        "snares":"./assets/drumPack/snares",
        "claps":"./assets/drumPack/claps",
        "kicks":"./assets/drumPack/kicks",
        "hihats":"./assets/drumPack/hihats",
        "toms":"./assets/drumPack/toms",
        "sticks":"./assets/drumPack/sticks",
        "maracas":"./assets/drumPack/maracas",
        "rims":"./assets/drumPack/rims",
        "openhihats":"./assets/drumPack/openhihats",
        "claves":"./assets/drumPack/claves",
        "congas":"./assets/drumPack/congas",
        "cowbells":"./assets/drumPack/cowbells",
        "rides":"./assets/drumPack/rides"
    }
    audioRealArr = {
        "1": "./assets/drumPack/kicks/808-Kicks01.wav",
        "2": "./assets/drumPack/snares/808-Snares01.wav",
        "3": "./assets/drumPack/hihats/808-HiHats01.wav",
        "4": "./assets/drumPack/claps/808-Claps01.wav",
        "5": "./assets/drumPack/toms/808-Toms01.wav",
        "6": "./assets/drumPack/rides/808-Rides01.wav",
        "7": "./assets/drumPack/cowbells/808-Cowbells01.wav",
        "8": "./assets/drumPack/congas/808-Congas01.wav"
    }

    // First, let's create a function to update the pad text
    function updatePadText(pad, audioPath) {
        const fileName = audioPath.split('/').pop().replace('.wav', '');
        pad.textContent = fileName;
        pad.style.color = 'white';
    }

    // Then modify the initial pad setup
    pads.forEach(pad => {
        updatePadText(pad, audioRealArr[pad.dataset.punchpad]);

        pad.addEventListener('click', async ()=>{
            pad.style.boxShadow = 'inset 0 0 20px 0 #D87A33';
            const type = pad.dataset.punchpad;
            
            const audio = new Audio();
            audio.src = audioRealArr[type];

            const source = audioContext.createMediaElementSource(audio);
            const gainNode = audioContext.createGain();
            gainNode.gain.value = 20.0; // Increased preview volume
            
            // Only connect through the gain node
            source.connect(gainNode);
            gainNode.connect(channelRackMasterGain); // Connect to master gain node instead of destination
            
            audio.play();
            
            setTimeout(() => {
                pad.style.boxShadow = 'inset 0 0 40px 0 #D87A33';
            }, 100);
        });

        const menu = document.querySelector('.customMenu');
        pad.addEventListener('contextmenu', (e)=>{
            e.preventDefault();
            menu.dataset.currentPad = pad.dataset.punchpad;
            menu.style.display = 'block';
            menu.style.left = `${e.clientX - 50}px`;
            menu.style.top = `calc(${e.clientY}px - 71vh)`;
            menu.scrollTop = 0;
        });

        window.addEventListener('click', ()=>{
            menu.style.display = 'none';
        });

        window.addEventListener('resize', ()=>{
            menu.style.display = 'none';
        });

        const menuOptions = document.querySelectorAll('.menuOption');
        const customMenuSecond = document.querySelector('.customMenuSecond');
        menuOptions.forEach(menuOption =>{
            menuOption.addEventListener('click', (e)=>{
                customMenuSecond.style.display = 'block';
                customMenuSecond.style.left = `${e.clientX - 50}px`;
                customMenuSecond.style.top = `calc(${e.clientY}px - 60vh)`;
                customMenuSecond.scrollTop = 0;
                const instrument = menuOption.dataset.instruments;
                
                const menuSecondContent = document.querySelector('.customMenuSecond');
                menuSecondContent.innerHTML = '';
                
                const instrumentPath = audioArr[instrument];
                if (instrumentPath) {
                    for (let i = 1; i <= 39; i++) {
                        const p = document.createElement('p');
                        p.className = 'menuSecondOption';
                        const num = i.toString().padStart(2, '0');
                        const instrumentName = instrument.charAt(0).toUpperCase() + instrument.slice(1);
                        p.textContent = `808-${instrumentName}${num}`;
                        p.dataset.audioPath = `${instrumentPath}/808-${instrumentName}${num}.wav`;
                        p.addEventListener('click', () => {
                            const padNumber = menu.dataset.currentPad;
                            audioRealArr[padNumber] = p.dataset.audioPath;
                            
                            const currentPad = document.querySelector(`button[data-punchpad="${padNumber}"]`);
                            updatePadText(currentPad, p.dataset.audioPath);
                            
                            const audio = new Audio(p.dataset.audioPath);
                            const source = audioContext.createMediaElementSource(audio);
                            const gainNode = audioContext.createGain();
                            gainNode.gain.value = 15.0; // Increased preview volume
                            source.connect(gainNode);
                            source.connect(channelRackMasterGain);
                            audio.play();
                            customMenuSecond.style.display = 'none';
                        });
                        menuSecondContent.appendChild(p);
                    }
                }
            });
        });
    });

    //rhythmMaker
    let bpm = document.querySelector('#bpm');
    const bpmPlus10 = document.querySelector('#bpmPlus10');
    const bpmMinus10 = document.querySelector('#bpmMinus10');
    const bpmPlus1 = document.querySelector('#bpmPlus1');
    const bpmMinus1 = document.querySelector('#bpmMinus1');

    bpmPlus10.addEventListener('click', ()=>{
        bpm.value = parseFloat(bpm.value) + 10;
    });

    bpmMinus10.addEventListener('click', ()=>{
        if(parseFloat(bpm.value) - 10 > 0.1){
            bpm.value = parseFloat(bpm.value) - 10;
        }else{
            bpm.value = 1;
        }
    });

    bpmPlus1.addEventListener('click', ()=>{
        bpm.value = parseFloat(bpm.value) + 1;
    });

    bpmMinus1.addEventListener('click', ()=>{
        if(parseFloat(bpm.value) - 1 > 0.1){
            bpm.value = parseFloat(bpm.value) - 1;
        }else{
            bpm.value = 1;
        }
    });
});
