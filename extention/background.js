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
    const {link} = message;

    const onload = async function() {
      const {response} = this;
      let parser = new window.DOMParser();
      let title = '';
      let robot = '';
      if (response){
        const html = parser.parseFromString(response, 'text/html');
        robot = html.querySelector('meta[name="robots"]');
        robot = robot ? robot.content : null;
        title = html.querySelector('title');
        title = title && title.innerText;
      }
      const status = await getResponseStatusCode(link) || this.status;
      if (!robot){
        robot = await getIndexAbility(link)
      }
      sendResponse({status, robot, title});
    };
    const onerror = function() {
      console.log('error::::');
      sendResponse({status: 'Error', robot: '', title: ''});
    };
    makeRequest(link, { onload, onerror })
  }
  return true;
});

const makeRequest = (url, options) => {
  var xhr = new XMLHttpRequest();
  xhr.open('get', url, true);
  xhr.onload = options.onload;
  xhr.onerror = options.onerror;
  xhr.send();
};

const getIndexAbility = async url => {
  try{
    let hostname = new URL(url);
    const {origin, pathname} = hostname;
    let robotUrl = `${origin}/robots.txt`;
    const resp = await fetch(robotUrl);
    const respText = await resp.text();
    const lines = respText.split(/\r?\n/)
    const isRobot = lines.some(line => {
      const check = line.split(': ', 2);

      if (!['Disallow', 'Allow'].includes(check[0])){
        return false
      }
      if (pathname.indexOf(check[1]) === 0)
        return true;
      return match(check[1], pathname);
    });
    return isRobot ? 'robots.txt' : 'Allow'
  } catch {
    return 'Allow'
  }

};
const getResponseStatusCode = async url => {
  try {
    const response = await fetch(`https://prod.sureoakdata.com/api/v1/redirect-checker?initialURL=${url}`, {
      method: "POST",
      headers: {
        // 'Content-Type': 'application/x-www-form-urlencoded',
        'Referer': 'https://www.sureoak.com/',
        'origin': 'https://www.sureoak.com',
      }
    });
    const resp = await response.json();
    return resp.redirects[0].httpStatusCode
  } catch {
    return null
  }
};


const cleanUrl = url => {
  let firstUrl = url.trim().split('://', 2);
  firstUrl = firstUrl.length === 2 ? firstUrl[1] : firstUrl[0];
  firstUrl = firstUrl.replace('www.', '');
  firstUrl = firstUrl.replace(/\/+$/, ''); // trim "/"
  return firstUrl.toLowerCase();
};

function match(first, second) {
  if (first.length == 0 && second.length == 0)
    return true;

  if (first.length > 1 && first[0] == '*' &&
    second.length == 0)
    return false;

  if ((first.length > 1 && first[0] == '?') ||
    (first.length != 0 && second.length != 0 &&
      first[0] == second[0]))
    return match(first.substring(1),
      second.substring(1));

  if (first.length > 0 && first[0] == '*')
    return match(first.substring(1), second) ||
      match(first, second.substring(1));

  return false;
}