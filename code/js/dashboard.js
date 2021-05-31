$(document).ready(function() {
  if (!$('#spine_extension')){
    alert('Cần extension Spine để hoạt động');
  }
});
let newLoad = false;
$('#btn-check-index').on('click', function(e) {
  if (newLoad) {
    $('.check-status').text('Loading...');
  }
  window.postMessage({ type: 'CHECK_INDEX' });
  newLoad = false;
});
$('#btn-load-link').on('click', function(e) {
  let linkTexts = $('#links').val().split(/\r?\n/);
  linkTexts = linkTexts.map(link=>link.trim()).filter(link=> link.startsWith('http'));
  const resultTable = $('#result-table');
  resultTable.empty();
  const message = linkTexts.map((link, idx) => {
    let callbackElId = `link-cb-${idx}`;
    resultTable.append(`<tr><td>${idx+1}</td><td>${link}</td><td class="check-status" id="${callbackElId}"></td></tr>`);
    return { link, callbackElId };
  });
  newLoad = true;
  window.postMessage({ type: 'WRITE_LIST', message });
})

