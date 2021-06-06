const tag = document.createElement('meta');
tag.id = 'spine_extension';
document.body.append(tag);

let indexCheckList = null;
let responseCheckList = null;


window.addEventListener(
  'message',
  function(e) {
    if (e.data.type === 'WRITE_INDEX_LIST') {
      indexCheckList = [...e.data.message];
      responseCheckList = [...e.data.message];
      return;
    }
    if (e.data.type === 'CHECK_RESPONSE') {
      checkResponseList();
      return;
    }
    if (e.data.type === 'CHECK_INDEX') {
      checkIndexList();
      return;
    }
  },
  false,
);

function checkResponseList() {
  if (!responseCheckList.length) {
    return;
  }
  const { link, callbackStatusElId, callbackRobotElId, callbackTitleElId } = responseCheckList[0];
  chrome.runtime.sendMessage({ type: 'CHECK_RESPONSE', message: {link}}, res => {
    const {status, robot, title} = res;
    console.log(res);
    document.getElementById(callbackStatusElId).innerText = status;
    document.getElementById(callbackRobotElId).innerText = robot;
    document.getElementById(callbackTitleElId).innerText = title;

    responseCheckList.shift();
    checkResponseList();
  });
}

function checkIndexList() {
  if (!indexCheckList) {
    return;
  }
  const {link, callbackIndexElId} = indexCheckList[0];
  chrome.runtime.sendMessage({ type: 'CHECK_INDEX', message: {link}}, res => {
    if (res.captchaTabClose) {
      checkIndexList();
      return;
    }
    document.getElementById(callbackIndexElId).innerHTML = res.isIndex
      ? '<span class="text-success">Indexed</span>'
      : '<span class="text-danger">NO</span>';
    indexCheckList.shift();
    checkIndexList();
  });
}

