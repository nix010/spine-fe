const tag = document.createElement('meta');
tag.id = 'spine_extension';
document.body.append(tag);

let linkList = null;

window.addEventListener(
  'message',
  function(e) {
    if (e.data.type === 'WRITE_LIST') {
      linkList = e.data.message;
      return;
    }
    if (e.data.type === 'CHECK_INDEX') {
      checkIndexList();
    }
  },
  false,
);
function checkIndexList() {
  if (!linkList) {
    return;
  }
  const link = linkList[0];
  chrome.runtime.sendMessage({ link: link.link }, res => {
    if (res.captchaTabClose) {
      // resume
      checkIndexList();
      // document.getElementById(link.callbackElId).innerHTML = `<a target="_blank" href="${isIndex}">Captcha</a>`;
      return;
    }
    document.getElementById(link.callbackElId).innerHTML = res.isIndex
      ? '<span class="text-success">Indexed</span>'
      : '<span class="text-danger">NO</span>';
    linkList.shift();
    checkIndexList();
  });
}
