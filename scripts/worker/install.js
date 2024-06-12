import { LocalStorage } from '../localstorage.js';

// install, update, or chrome update
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason !== 'install' && details.reason !== 'update') {
    return;
  }

  // insert expected scripts on all pages matching the patterns in the manifest
  const contentScripts = chrome.runtime.getManifest().content_scripts;
  contentScripts.forEach(async (contentScript) => {
    const matchingTabs = await chrome.tabs.query({ url: contentScript.matches });
    matchingTabs.forEach((tab) => {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: contentScript.js,
      });
    });
  });

  // update local storage if needed
  const LOCSTO = new LocalStorage();
  await LOCSTO.loadOptions();
  await LOCSTO.updateModel();
});
