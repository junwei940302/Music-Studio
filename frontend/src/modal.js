// Modal functionality
document.addEventListener('DOMContentLoaded', function() {
    // Get modal elements
    const aboutModal = document.getElementById('aboutModal');
    const keyboardShortcutsModal = document.getElementById('keyboardShortcutsModal');
    
    // Get buttons that open the modals
    const aboutBtn = document.querySelector('[data-about]');
    const keyboardShortcutsBtn = document.querySelector('[data-keyboardShortcuts]');
    
    // Get close buttons
    const closeButtons = document.querySelectorAll('.close');
    
    // Open about modal
    if (aboutBtn) {
        aboutBtn.addEventListener('click', function() {
            aboutModal.style.display = 'block';
        });
    }
    
    // Open keyboard shortcuts modal
    if (keyboardShortcutsBtn) {
        keyboardShortcutsBtn.addEventListener('click', function() {
            keyboardShortcutsModal.style.display = 'block';
        });
    }
    
    // Close modals when clicking on close button
    closeButtons.forEach(function(btn) {
        btn.addEventListener('click', function() {
            aboutModal.style.display = 'none';
            keyboardShortcutsModal.style.display = 'none';
        });
    });
    
    // Close modals when clicking outside of modal content
    window.addEventListener('click', function(event) {
        if (event.target === aboutModal) {
            aboutModal.style.display = 'none';
        }
        if (event.target === keyboardShortcutsModal) {
            keyboardShortcutsModal.style.display = 'none';
        }
    });
    
    // Close modals with Escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            aboutModal.style.display = 'none';
            keyboardShortcutsModal.style.display = 'none';
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(event) {
        // Space - Play/Pause
        if (event.code === 'Space' && !isInputFocused()) {
            event.preventDefault(); // Prevent scrolling
            const playButton = document.querySelector('.control.panel button:nth-child(2)');
            const pauseButton = document.querySelector('.control.panel button:nth-child(3)');
            
            if (playButton && pauseButton) {
                if (playButton.hidden) {
                    pauseButton.click(); // Pause
                } else {
                    playButton.click(); // Play
                }
            }
        }
        
        // Ctrl+S - Save Project
        if (event.ctrlKey && event.key === 's') {
            event.preventDefault(); // Prevent browser save dialog
            const saveButton = document.querySelector('[data-saveFile]');
            if (saveButton) {
                saveButton.click();
            }
        }
    });
    
    // Helper function to check if an input element is focused
    function isInputFocused() {
        const activeElement = document.activeElement;
        return activeElement.tagName === 'INPUT' || 
               activeElement.tagName === 'TEXTAREA' || 
               activeElement.isContentEditable;
    }
});
