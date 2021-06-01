let captchaTabId = null;
chrome.runtime.onMessage.addListener((mess, sender, sendResponse) => {
  var xhr = new XMLHttpRequest();
  xhr.open('get', `https://www.google.com/search?q=${mess.link}`, true);
  xhr.onload = function() {
    var parser = new window.DOMParser();
    if (this.status === 429) {
      chrome.tabs.create({ url: this.responseURL }, (tab) => {
        captchaTabId = tab.id;
        chrome.tabs.onRemoved.addListener(function(tabId) {

          if (captchaTabId === tabId){
            sendResponse({captchaTabClose: true});
          }
        });
      });
      return;
    }
    const html = parser.parseFromString(this.response, 'text/html');
    const res = html.querySelector('#rso a[ping][data-ved]');
    if (!res) {
      sendResponse({isIndex: false});
      return;
    }
    const isIndex = cleanUrl(res.href) === cleanUrl(mess.link);
    sendResponse({isIndex});
  };
  xhr.send();
  return true;
});


const cleanUrl = url => {
  let firstUrl = url.trim().split('://', 2);
  firstUrl = firstUrl.length === 2 ? firstUrl[1] : firstUrl[0];
  firstUrl = firstUrl.replace('www.', '');
  firstUrl = firstUrl.replace(/\/+$/, ''); // trim "/"
  return firstUrl.toLowerCase();
};
