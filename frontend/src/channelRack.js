document.addEventListener("DOMContentLoaded", () =>{

    const rackToggle = document.querySelector('.channelRackToggle');
    const rack = document.querySelector('.channelRackPanel');
    const toggleIcon = document.querySelector('.channelRackToggle i');
    

    //toggle rack
    let isToggled = true;
    rackToggle.addEventListener('click', ()=>{
        if(isToggled){
            rack.style.transform = 'translateX(0)';
            toggleIcon.className = 'fa-solid fa-chevron-right'
            isToggled = false;
        }else{
            rack.style.transform = 'translateX(-100vw)';
            toggleIcon.className = 'fa-solid fa-chevron-left'
            isToggled = true;
        }
        
    });
    
    //pad audio func
    const pads = document.querySelectorAll('.punchPadZone button');
    audioArr = {
        "snare":"./assets/drumPack/snares/808-Snare02.wav",
        "clap":"./assets/drumPack/snares/808-Clap02.wav",
        "kick":"./assets/drumPack/kicks/808-Kicks06.wav",
        "hihat":"./assets/drumPack/hihats/808-HiHats04.wav",
        "tom":"./assets/drumPack/percussion/808-Tom5.wav",
        "stick":"./assets/drumPack/percussion/808-Stick1.wav",
        "maracas":"./assets/drumPack/percussion/808-Maracas1.wav",
        "cowbell":"./assets/drumPack/percussion/808-Cowbell5.wav"
    }
    pads.forEach(pad =>{
        pad.addEventListener('click', ()=>{
            pad.style.boxShadow = 'inset 0 0 20px 0 #D87A33';
            const type = pad.dataset.punchpad;
            const audio = document.createElement("audio");
            audio.src = audioArr[type];
            audio.play();
            setTimeout(() => {
                pad.style.boxShadow = 'inset 0 0 40px 0 #D87A33';
            }, 100);
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
        bpm.value = parseFloat(bpm.value) - 10;
    });

    bpmPlus1.addEventListener('click', ()=>{
        bpm.value = parseFloat(bpm.value) + 1;
    });

    bpmMinus1.addEventListener('click', ()=>{
        bpm.value = parseFloat(bpm.value) - 1;
    });
});