let captchaTabId = null;
let applicationTabId = null;

chrome.runtime.onMessage.addListener((mess, sender, sendResponse) => {
  const { type, message } = mess;
  if (type === 'CHECK_INDEX'){
    chrome.tabs.query({currentWindow: true, active : true}, (tabs)=>{
      if (!applicationTabId && tabs){
        applicationTabId = tabs[0].id;
      }
    });
    const onload = function() {
      var parser = new window.DOMParser();
      if (this.status === 429) {
        chrome.tabs.create({ url: this.responseURL }, (tab) => {
          captchaTabId = tab.id;
          var myAudio = new Audio(chrome.runtime.getURL("./noti.mp3"));
          myAudio.play();
          chrome.webRequest.onCompleted.addListener((e)=>{
            const { tabId, url, type } = e;
            if (type === 'main_frame' && url.startsWith('https://www.google.com/search?q=') && tabId === captchaTabId){
              sendResponse({captchaTabClose: true});
              chrome.tabs.remove(tab.id, () => {
                if (applicationTabId){
                  chrome.tabs.update(applicationTabId, {active: true});
                }
              });
            }
          }, { urls: ['*://*.google.com/*'] }, null);
        });
        return;
      }
      const html = parser.parseFromString(this.response, 'text/html');
      const res = html.querySelector('#rso a[ping][data-ved]');
      if (!res) {
        sendResponse({isIndex: false});
        return;
      }
      const isIndex = cleanUrl(res.href) === cleanUrl(message.link);
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
    const robotGroups = parser(respText);
    return isRobot(url, robotGroups) ? 'robots.txt' : 'Allow'
  } catch {
    return 'Allow'
  }

};
const getResponseStatusCode = async url => {
  try {
    const response = await fetch("https://www.askapache.com/online-tools/http-headers-tool/", {
      "headers": {
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
        "cache-control": "max-age=0",
        "content-type": "multipart/form-data; boundary=----WebKitFormBoundaryN42fKAYYWzNDlAfo",
        "sec-ch-ua-mobile": "?0",
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "same-origin",
        "upgrade-insecure-requests": "1",
      },
      "referrer": "https://www.askapache.com/online-tools/http-headers-tool/",
      "body": "------WebKitFormBoundaryN42fKAYYWzNDlAfo\r\nContent-Disposition: form-data; " +
        `name=\"http_url\"\r\n\r\n${url}\r\n` +
        "------WebKitFormBoundaryN42fKAYYWzNDlAfo\r\nContent-Disposition: form-data; name=\"http_referer\"\r\n\r\nhttps://www.askapache.com/online-tools/http-headers-tool/\r\n------WebKitFormBoundaryN42fKAYYWzNDlAfo\r\nContent-Disposition: form-data; name=\"http_request_method\"\r\n\r\nGET\r\n------WebKitFormBoundaryN42fKAYYWzNDlAfo\r\nContent-Disposition: form-data; name=\"_wp_http_referer\"\r\n\r\n/online-tools/http-headers-tool/\r\n------WebKitFormBoundaryN42fKAYYWzNDlAfo--\r\n",
      "method": "POST",
    });
    var parser = new window.DOMParser();
    const htmlText = await response.text();
    const html = parser.parseFromString(htmlText, 'text/html');
    const resp = html.querySelector('pre').innerText;
    const statusCodes = resp.match(/(?<= HTTP\/).*(?= )/)[0];
    return statusCodes.split(' ', 2)[1];
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

// Robot util
//////////////
function applyRecords(path, records) {
  let numApply = 0;
  let maxSpecificity = 0;

  for (let i = 0; i < records.length; i += 1) {
    const record = records[i];
    if (record.path.test(path)) {
      numApply += 1;
      if (record.specificity > maxSpecificity) {
        maxSpecificity = record.specificity;
      }
    }
  }

  return {
    numApply,
    maxSpecificity,
  };
}

const USER_AGENT = 'user-agent';
const ALLOW = 'allow';
const DISALLOW = 'disallow';
const SITEMAP = 'sitemap';
const CRAWL_DELAY = 'crawl-delay';
const HOST = 'host';
// Regex's for cleaning up the file.
const comments = /#.*$/gm;
const whitespace = ' ';
const lineEndings = /[\r\n]+/g;
const recordSlices = /(\w+-)?\w+:\s\S*/g;

function cleanComments(rawString) {
  // Replace comments and whitespace
  return rawString
    .replace(comments, '');
}

function cleanSpaces(rawString) {
  return rawString.replace(whitespace, '').trim();
}

function splitOnLines(string) {
  return string.split(lineEndings);
}

function robustSplit(string) {
  return !string.includes('<html>') ? [...string.match(recordSlices)].map(cleanSpaces) : [];
}

function parseRecord(line) {
  // Find first colon and assume is the field delimiter.
  const firstColonI = line.indexOf(':');
  return {
    // Fields are non-case sensitive, therefore lowercase them.
    field: line.slice(0, firstColonI).toLowerCase().trim(),
    // Values are case sensitive (e.g. urls) and therefore leave alone.
    value: line.slice(firstColonI + 1).trim(),
  };
}

function parsePattern(pattern) {
  const regexSpecialChars = /[\-\[\]\/\{\}\(\)\+\?\.\\\^\$\|]/g;
  const wildCardPattern = /\*/g;
  const EOLPattern = /\\\$$/;
  const flags = 'm';

  const regexString = pattern
    .replace(regexSpecialChars, '\\$&')
    .replace(wildCardPattern, '.*')
    .replace(EOLPattern, '$');

  return new RegExp(regexString, flags);
}

function groupMemberRecord(value) {
  return {
    specificity: value.length,
    path: parsePattern(value),
  };
}

function parser(rawString) {
  let lines = splitOnLines(cleanSpaces(cleanComments(rawString)));

  // Fallback to the record based split method if we find only one line.
  if (lines.length === 1) {
    lines = robustSplit(cleanComments(rawString));
  }

  const robotsObj = {
    sitemaps: [],
  };
  let agent = '';

  lines.forEach((line) => {
    const record = parseRecord(line);
    switch (record.field) {
      case USER_AGENT:
        const recordValue = record.value.toLowerCase();
        if (recordValue !== agent && recordValue.length > 0) {
          // Bot names are non-case sensitive.
          agent = recordValue;
          robotsObj[agent] = {
            allow: [],
            disallow: [],
            crawlDelay: 0,
          };
        } else if (recordValue.length === 0) { // Malformed user-agent, ignore its rules.
          agent = '';
        }
        break;
      // https://developers.google.com/webmasters/control-crawl-index/docs/robots_txt#order-of-precedence-for-group-member-records
      case ALLOW:
        if (agent.length > 0 && record.value.length > 0) {
          robotsObj[agent].allow.push(groupMemberRecord(record.value));
        }
        break;
      case DISALLOW:
        if (agent.length > 0 && record.value.length > 0) {
          robotsObj[agent].disallow.push(groupMemberRecord(record.value));
        }
        break;
      // Non standard but support by google therefore included.
      case SITEMAP:
        if (record.value.length > 0) {
          robotsObj.sitemaps.push(record.value);
        }
        break;
      case CRAWL_DELAY:
        if (agent.length > 0) {
          robotsObj[agent].crawlDelay = Number.parseInt(record.value, 10);
        }
        break;
      // Non standard but included for completeness.
      case HOST:
        if (!('host' in robotsObj)) {
          robotsObj.host = record.value;
        }
        break;
      default:
        break;
    }
  });

  // Return only unique sitemaps.
  robotsObj.sitemaps = robotsObj.sitemaps.filter((val, i, s) => s.indexOf(val) === i);
  return robotsObj;
}

function applyRecords(path, records) {
  let numApply = 0;
  let maxSpecificity = 0;

  for (let i = 0; i < records.length; i += 1) {
    const record = records[i];
    if (record.path.test(path)) {
      numApply += 1;
      if (record.specificity > maxSpecificity) {
        maxSpecificity = record.specificity;
      }
    }
  }

  return {
    numApply,
    maxSpecificity,
  };
}

isRobot = (url, botGroups) => {
  const group = Object.keys(botGroups).some(name => {
    const group = botGroups[name];
    return isRobotForGroup(url, group)
  })
  return group;
};

isRobotForGroup = (url, botGroup) => {
  if(botGroup.length === 0){
    return false
  }
  const allow = applyRecords(url, botGroup.allow);
  if (allow.numApply > 0){
    return true
  }
  const disallow = applyRecords(url, botGroup.disallow);
  if (disallow.numApply > 0){
    return true
  }
  return false
};

// const botGroup = parser(
//   `#robots_txt_lt_english.php
//
// User-agent: Twitterbot
// Disallow:
// Allow: /work/book/*
//
// User-agent: 008
// Disallow: /
//
// User-agent: Sosospider
// Disallow: /
//
// User-agent: AccompanyBot
// Disallow: /
//
// User-agent: *
// Crawl-delay: 2
// Disallow: /ajax_*
// Disallow: /ajaxinc_*
// Disallow: /api_*
// Disallow: /api-*
// Disallow: /api-*
// Disallow: /api/
// Disallow: /api/*`
// )
// console.log(botGroup);
// console.log(isRobot('https://www.librarything.com/api-v1/newslivenations', botGroup));
