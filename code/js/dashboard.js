$(document).ready(function() {
  setTimeout(()=>{
    if ($('#spine_extension').length === 0){
      alert('Trình duyệt của bạn chưa cài extension Sinbyte Seo. Vui lòng xem hướng dẫn để cài đặt');
    }
  }, 1000)
});
let newLoadIndex = false;
let newLoadResponse = false;
$('#btn-check-response').on('click', function(e) {
  if (newLoadResponse) {
    $('.check-response').text('Loading...');
  }
  window.postMessage({ type: 'CHECK_RESPONSE' });
  newLoadResponse = false;
});
$('#btn-check-index').on('click', function(e) {
  if (newLoadIndex) {
    $('.check-status').text('Loading...');
  }
  window.postMessage({ type: 'CHECK_INDEX' });
  newLoadIndex = false;
});
$('#btn-load-link').on('click', function(e) {
  let linkTexts = $('#links').val().split(/\r?\n/);
  linkTexts = linkTexts.map(link=>link.trim()).filter(link=> link.startsWith('http'));
  const resultTable = $('#result-table');
  resultTable.empty();
  const message = linkTexts.map((link, idx) => {
    const callbackIndexElId = `link-cb-${idx}`;
    const callbackResponseElId = `response-cb-${idx}`;
    const callbackStatusElId = `${callbackResponseElId}-status`;
    const callbackRobotElId = `${callbackResponseElId}-robot`;
    const callbackTitleElId = `${callbackResponseElId}-title`;
    resultTable.append(`<tr>
        <td>${idx+1}</td>
        <td class="link-text">${link}</td>
        <td class="check-status" id="${callbackIndexElId}"></td>
        <td class="check-response" id="${callbackStatusElId}"></td>
        <td class="check-response" id="${callbackRobotElId}"></td>
        <td class="check-response title-section" id="${callbackTitleElId}"></td>
    </tr>`);
    return { link, callbackIndexElId, callbackStatusElId, callbackRobotElId, callbackTitleElId };
  });
  newLoadIndex = true;
  newLoadResponse = true;
  window.postMessage({ type: 'WRITE_INDEX_LIST', message });
})
$('#btn-export-results').on('click', () => {
  let csvData = [
  ];
  csvData.push(['"id"', '"link"', '"index"', '"response_code"',
    '"indexing_capability"', '"title"']);

  $('#result-table').find('tr').each((idx, row) => {
    const rowData = [];
    $(row).find('td').each((idx1,td) => rowData.push(td.innerText));
    rowData[5] = (rowData[5] || '').replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '');
    csvData.push(rowData);
  });
  if (!csvData){
    return
  }

  let csvContent = "data:text/csv;charset=utf-8,"
    + csvData.map(e => e.join(",")).join("\n");

  var encodedUri = encodeURI(csvContent);
  var link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "my_data.csv");
  document.body.appendChild(link); // Required for FF
  link.click();
  link.remove();
});


