import { getVideoInfo, initFavButton } from './content/video-page';
import { initFavlistBatchButton } from './content/favlist-page';
import { getCurrentPageType } from './content/utils';

export default defineContentScript({
  matches: ['*://*.bilibili.com/video/*', '*://*.bilibili.com/*/favlist*', '*://*.bilibili.com/medialist/play/*'],
  main() {
    const pageType = getCurrentPageType();
    
    switch (pageType) {
      case 'video':
        initFavButton();
        break;
      case 'favlist':
        initFavlistBatchButton();
        break;
    }
    
    initMessageListener();
  },
});

function initMessageListener() {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getVideoInfo') {
      const video = getVideoInfo();
      sendResponse({ video });
    }
  });
}
