let captchaTabId = null;
chrome.runtime.onMessage.addListener((mess, sender, sendResponse) => {
  const { type, message } = mess;
  if (type === 'CHECK_INDEX'){
    const onload = function() {
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
    makeRequest(`https://www.google.com/search?q=${message.link}`, { onload })
  } else if (type === 'CHECK_RESPONSE'){
    const onload = function() {
      const {response, status} = this;
      let parser = new window.DOMParser();
      let title = '';
      let robot = '';
      if (response){
        const html = parser.parseFromString(response, 'text/html');
        robot = html.querySelector('meta[name="robot"]');
        console.log(robot);
        robot = robot ? robot.value : 'Allow';
        title = html.querySelector('title');
        title = title && title.innerText;
      }
      sendResponse({status, robot, title});
    };
    const onerror = function() {
      console.log('error::::');
      sendResponse({status: 'Error', robot: '', title: ''});
    };
    makeRequest(message.link, { onload, onerror })
  }
  return true;
});

const makeRequest = (url, options) => {
  var xhr = new XMLHttpRequest();
  xhr.open('get', url, true);
  xhr.onload = options.onload;
  if(options.onerror){
    xhr.onerror = options.onerror;
  }
  xhr.send();
};


const cleanUrl = url => {
  let firstUrl = url.trim().split('://', 2);
  firstUrl = firstUrl.length === 2 ? firstUrl[1] : firstUrl[0];
  firstUrl = firstUrl.replace('www.', '');
  firstUrl = firstUrl.replace(/\/+$/, ''); // trim "/"
  return firstUrl.toLowerCase();
};
