document.addEventListener('DOMContentLoaded', () => {
    // Subtitle Typewriter Logic
    const subtitleElement = document.getElementById('subtitle-element');
    const subtitleTexts = [
        "by marswalk",
        "_hecking_ with love since 2021",
        "born from the national cipher challenge"
    ];
    let subtitleIndex = 0;
    
    // Footer Typewriter Logic
    const footerElement = document.getElementById('footer-text');
    const footerTexts = [
        "HARRY, I AM BORED, AND I AM REALLY NOT SURE WHY I HAVE BEEN EXILED TO THE ARCHAE...",
        "SDJFSKDFJ SDJKFHSKJDFH SDFSDF...",
        "HARRY, I AM BORED, AND I AM REALLY NOT SURE WHY I HAVE BEEN EXILED TO THE ARCHAE...",
        "QWEOIU QWEOIU OIQWEU OQIWEU..."
    ];
    let footerIndex = 0;

    function typeWriter(text, element, speed, callback) {
        let i = 0;
        element.innerHTML = '';
        
        function type() {
            if (i < text.length) {
                element.innerHTML = text.substring(0, i + 1) + '<span class="cursor">_</span>';
                i++;
                setTimeout(type, speed);
            } else {
                element.innerHTML = text + '<span class="cursor">_</span>';
                setTimeout(callback, 2000); // Wait 2 seconds before calling back (e.g. erasing)
            }
        }
        type();
    }

    function eraseText(element, speed, callback) {
        let text = element.innerText.replace('_', '');
        let i = text.length;

        function erase() {
            if (i > 0) {
                element.innerHTML = text.substring(0, i - 1) + '<span class="cursor">_</span>';
                i--;
                setTimeout(erase, speed);
            } else {
                element.innerHTML = '<span class="cursor">_</span>';
                setTimeout(callback, 500); // Wait half a second before typing next
            }
        }
        erase();
    }

    function startSubtitleLoop() {
        typeWriter(subtitleTexts[subtitleIndex], subtitleElement, 50, () => {
            eraseText(subtitleElement, 30, () => {
                subtitleIndex = (subtitleIndex + 1) % subtitleTexts.length;
                startSubtitleLoop();
            });
        });
    }

    function startFooterLoop() {
        typeWriter(footerTexts[footerIndex], footerElement, 40, () => {
            eraseText(footerElement, 20, () => {
                footerIndex = (footerIndex + 1) % footerTexts.length;
                startFooterLoop();
            });
        });
    }

    // Initialize animations
    startSubtitleLoop();
    startFooterLoop();
});
