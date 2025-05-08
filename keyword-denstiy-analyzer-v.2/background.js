chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.density) {
        chrome.storage.local.set({ keywordDensity: message.density });
    }
});
