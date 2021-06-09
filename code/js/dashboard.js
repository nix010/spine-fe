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
    $(row).find('td').each((idx1,td) => rowData.push(`${td.innerText}`));
    rowData[5] = (rowData[5] || '').replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '');
    csvData.push(rowData);
  });
  exportToCsv('my_data.csv', csvData);
});

function exportToCsv(filename, rows) {
  var processRow = function (row) {
    var finalVal = '';
    for (var j = 0; j < row.length; j++) {
      var innerValue = row[j] === null ? '' : row[j].toString();
      if (row[j] instanceof Date) {
        innerValue = row[j].toLocaleString();
      };
      var result = innerValue.replace(/"/g, '""');
      if (result.search(/("|,|\n)/g) >= 0)
        result = '"' + result + '"';
      if (j > 0)
        finalVal += ',';
      finalVal += result;
    }
    return finalVal + '\n';
  };

  var csvFile = '';
  for (var i = 0; i < rows.length; i++) {
    csvFile += processRow(rows[i]);
  }

  var blob = new Blob([csvFile], { type: 'text/csv;charset=utf-8;' });
  if (navigator.msSaveBlob) { // IE 10+
    navigator.msSaveBlob(blob, filename);
  } else {
    var link = document.createElement("a");
    if (link.download !== undefined) { // feature detection
      // Browsers that support HTML5 download attribute
      var url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
}
