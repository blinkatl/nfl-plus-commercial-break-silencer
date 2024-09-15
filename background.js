chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "captureTabAudio") {
      chrome.tabCapture.capture({ audio: true }, function (stream) {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError.message);
          sendResponse({ success: false });
          return;
        }
        chrome.tabs.sendMessage(sender.tab.id, { success: true, stream: stream });
      });
  
      return true;
    }
  });