import Version from './Version.js';

const version = new Version('2.0.15');
console.log('service worker loaded', version);

// if no popup is set, it means that we should open a new tab with default player
chrome.action.onClicked.addListener(function () {
  chrome.tabs.create({ url: '/options.html' });
});
