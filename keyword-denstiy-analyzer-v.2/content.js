(function() {
    function getTextContent(selector) {
        return [...document.querySelectorAll(selector)].map(el => el.innerText.toLowerCase()).join(" ");
    }

    function getMainContentText() {
        let bodyText = document.body.innerText;
        let headerText = document.querySelector("header")?.innerText || "";
        let footerText = document.querySelector("footer")?.innerText || "";
        return bodyText.replace(headerText, "").replace(footerText, "").trim();
    }

    // Anlamsız kelimeler (Stop Words)
    const stopWords = new Set([
        "ve", "ama", "çünkü", "fakat", "ancak", "gibi", "veya", "ile", "ya", "daha", "çok",
        "az", "ise", "sonra", "önce", "bu", "şu", "o", "bir", "bazı", "tüm", "her", "hangi",
        "neden", "nasıl", "ne", "kim", "hangi", "zaten", "öyle", "şöyle", "diğer"
    ]);

    function getKeywordDensity(text, n) {
        let words = text.toLowerCase().match(/\b[a-zçğıöşü0-9]+\b/gi);
        if (!words) return {};

        let phrases = {};
        for (let i = 0; i <= words.length - n; i++) {
            let phrase = words.slice(i, i + n).join(" ");
            if (!stopWords.has(phrase)) {
                phrases[phrase] = (phrases[phrase] || 0) + 1;
            }
        }

        let totalWords = words.length;
        let keywordDensity = {};
        for (let phrase in phrases) {
            let percentage = ((phrases[phrase] / totalWords) * 100).toFixed(2);
            keywordDensity[phrase] = { density: percentage + "%", positions: [] };
        }

        return keywordDensity;
    }

    let pageText = getMainContentText();
    let density = {
        "1-word": getKeywordDensity(pageText, 1),
        "2-word": getKeywordDensity(pageText, 2),
        "3-word": getKeywordDensity(pageText, 3),
    };

    ["h1", "h2", "h3", "title", "meta[name='description']"].forEach(selector => {
        let content = getTextContent(selector);
        for (let key in density["1-word"]) {
            if (content.includes(key)) {
                density["1-word"][key].positions.push(selector.toUpperCase());
            }
        }
        for (let key in density["2-word"]) {
            if (content.includes(key)) {
                density["2-word"][key].positions.push(selector.toUpperCase());
            }
        }
        for (let key in density["3-word"]) {
            if (content.includes(key)) {
                density["3-word"][key].positions.push(selector.toUpperCase());
            }
        }
    });

    chrome.runtime.sendMessage({ density });
})();
