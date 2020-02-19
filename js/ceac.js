function transparentize(color, opacity) {
  var alpha = opacity === undefined ? 0.6 : 1 - opacity;
  return Chart.helpers.color(color).alpha(alpha).rgbString();
}

window.chartColors = {
  red: 'rgb(255, 99, 132)',
  orange: 'rgb(255, 159, 64)',
  yellow: 'rgb(255, 205, 86)',
  lightGreen: 'rgb(18, 173, 42)',
  darkGreen: 'rgb(75, 140, 97)',
  blueish: 'rgb(0, 230, 230)',
  blue: 'rgb(54, 162, 235)',
  purple: 'rgb(153, 102, 255)',
  grey: 'rgb(201, 203, 207)'
};

function getData() {
    var currentDate = $("#currentDate").val().toString();
    var alldata = JSON.parse(sessionStorage.getItem('ceac' + year.toString()));
    var data = alldata[currentDate];
    var region = $('#currentREG').val() || 'AF';
    return {
        labels: data[region].labels,
        datasets: [{
          label: "Issued",
          borderColor: window.chartColors.darkGreen,
          backgroundColor: transparentize(window.chartColors.darkGreen),
          data: data[region].issued,
          fill: "start",
        }, {
          label: "Ready",
          borderColor: window.chartColors.lightGreen,
          backgroundColor: transparentize(window.chartColors.lightGreen),
          data: data[region].ready,
          fill: '-1',
        }, {
          label: "Transit",
          borderColor: window.chartColors.blueish,
          backgroundColor: transparentize(window.chartColors.blueish),
          data: data[region].transit,
          fill: '-1',
        }, {
          label: "AP",
          borderColor: window.chartColors.purple,
          backgroundColor: transparentize(window.chartColors.purple),
          data: data[region].AP,
          fill: '-1',
        }, {
          label: "Refused",
          borderColor: window.chartColors.red,
          backgroundColor: transparentize(window.chartColors.red),
          data: data[region].refused,
          fill: '-1',
        }, {
          label: "No response",
          borderColor: window.chartColors.yellow,
          backgroundColor: transparentize(window.chartColors.yellow),
          data: data[region].nonres,
          fill: '-1',
        }, {
          label: "Hole",
          borderColor: window.chartColors.blue,
          backgroundColor: transparentize(window.chartColors.blue),
          data: data[region].holes,
          fill: '-1',
        }]
    }
}

function getEmbassyData() {
    var currentDate = $("#currentDate").val().toString();
    var alldata = JSON.parse(sessionStorage.getItem('ceac' + year.toString() + 'emb'));
    var data = alldata[currentDate];
    var region = $('#currentEmbREG').val() || 'All';
    return {
        labels: alldata.meta.labels[region],
        datasets: [{
          label: "Issued",
          borderColor: window.chartColors.darkGreen,
          backgroundColor: transparentize(window.chartColors.darkGreen),
          data: data[region].issued,
          fill: "start"
        }, {
          label: "Ready",
          borderColor: window.chartColors.lightGreen,
          backgroundColor: transparentize(window.chartColors.lightGreen),
          data: data[region].nonres,
          fill: '-1'
        }, {
          label: "Administrative Processing",
          borderColor: window.chartColors.purple,
          backgroundColor: transparentize(window.chartColors.purple),
          data: data[region].ap,
          fill: '-1'
        }, {
          label: "Refused",
          borderColor: window.chartColors.red,
          backgroundColor: transparentize(window.chartColors.red),
          data: data[region].refused,
          fill: '-1'
        }]
    }
}

function updateChart() {
    window.myLine.data = getData();
    window.myLine.update();
}

function updateEmbassyChart() {
    window.myEmbLine.data = getEmbassyData();
    window.myEmbLine.update();
}

function resizeForText(text) {
    var $this = $(this);
    if (!text.trim()) {
        text = $this.val().trim();
    }
    var $span = $this.parent().find('span');
    $span.text(text);
    var $inputSize = $span.width();
    $this.css('width', $inputSize);
    $this.css('margin-left', '5px');
    $this.css('margin-right', '5px');
}

var substringMatcher = function(strs) {
  return function findMatches(q, cb) {
    var matches, substringRegex;

    // an array that will be populated with substring matches
    matches = [];

    // regex used to determine if a string contains the substring `q`
    substrRegex = new RegExp(q, 'i');

    // iterate through the pool of strings and for any string that
    // contains the substring `q`, add it to the `matches` array
    $.each(strs, function(i, str) {
      if (substrRegex.test(str)) {
        matches.push(str);
      }
    });

    cb(matches);
  };
};

function tmpl(str, data) {
  return str.replace(/\{ *([\w_]+) *\}/g, function (str, key) {
    return data[key] || '';
  });
}

function updateTable(data) {
    var currentDate = $("#currentDate").val().toString();
    var ldata = data[currentDate];
    var summary = $('#summary').DataTable();
    summary.clear();
    ldata['summary'].forEach(function(row) {
      summary.row.add(row).draw();
    });
}

$(document).ready(function() {
  $('#RegSelector li').on('click', function(e){
      $("#currentREG").val($(this).text());
      updateChart();
  });
  $("#currentREG").val("AF");
  $('#EmbRegSelector li').on('click', function(e){
      $("#currentEmbREG").val($(this).text());
      updateEmbassyChart();
  });
  $("#currentEmbREG").val("All");
  var ctx = document.getElementById("canvas").getContext("2d");
  var ectx = document.getElementById("embassy-canvas").getContext("2d");
  var ceacFetch = $.getJSON('/data/density/' + year.toString() + '/ceac.json');
  var embFetch = $.getJSON('/data/embassies/' + year.toString() + '/ABD.json');

  $.when(ceacFetch, embFetch).done(function(data, embData) {
    sessionStorage.setItem('ceac' + year.toString(), JSON.stringify(data[0]));
    sessionStorage.setItem('ceac' + year.toString() + 'emb', JSON.stringify(embData[0]));

    $(function() {
        var data = JSON.parse(sessionStorage.getItem('ceac' + year.toString()));
        var labels = Object.keys(data);
        $("#slider").slider({
            range: "max",
            min: 0,
            max: labels.length - 1,
            value: labels.length - 1,
            step: 1,
            slide: function(event, ui) {
                var data = JSON.parse(sessionStorage.getItem('ceac' + year.toString()));
                var labels = Object.keys(data);
                $("#currentDate").val(labels[ui.value]);
                updateTable(data);
                updateChart();
                updateEmbassyChart();
            }
        });
        $("#currentDate").val(labels[$("#slider").slider("value")]);
        $('#summary').DataTable({
            data: [['AF', 0, 0, 0, 0], ['AS', 0, 0, 0, 0], ['EU', 0, 0, 0, 0],
                   ['OC', 0, 0, 0, 0], ['SA', 0, 0, 0, 0], ['Totals', 0, 0, 0, 0]],
            columns: [
                { title: 'Region' },
                { title: 'Issued' },
                { title: 'Refused' },
                { title: 'AP' },
                { title: 'Ready' }
            ],
            paging: false,
            ordering: false,
            info: false,
            searching: false
        });
        updateTable(data);
    });

    const dates = Object.keys(data[0]);
    var dumps = document.getElementById('dumps');
    if (dumps !== null) {
      dates.forEach(function(date){
        var node = document.createElement("LI");
        var a = document.createElement('a');
        let dataFile = "FY20" + year.toString() + "-ceac-" + date + ".csv";
        var textnode = document.createTextNode(dataFile);
        a.setAttribute('href', '/data/raw/' + year.toString() + '/' + dataFile);
        a.setAttribute('id', date);
        a.appendChild(textnode);
        node.appendChild(a);
        dumps.appendChild(node);
      });
    }

    const cols = Object.keys(embData[0]['meta']['embassies']);
    const embassies = [];
    cols.forEach(function(col) {
      var embassy = embData[0]['meta']['embassies'][col];
      embassies.push(embassy.city + ', ' + embassy.country);
    });
    $('#embCode').val(cols[0]);
    $('#currentEMB').val(embassies[0]);
    resizeForText.call($('#currentEMB'), embassies[0]);

    $('#autocomplete').autocomplete({
      source: embassies,
      select: function (event, ui) {
        var value = ui.item.value;
        var embassy = cols[embassies.indexOf(value)];
        $('#embCode').val(embassy);
        $('#currentEMB').val(value);
        $("#currentEmbREG").val("All");
        resizeForText.call($('#currentEMB'), value);
        let embUrl = "/data/embassies/" + year.toString() + "/" + embassy + ".json";
        var jsonData = $.getJSON(embUrl).done(function (results) {
          sessionStorage.setItem('ceac' + year.toString() + 'emb', JSON.stringify(results));
          updateEmbassyChart();
        });

      }
    });

    var config = {
      type: 'bar',
      data: getData(),
      options: {
        animation : false,
        responsive: true,
        maintainAspectRatio: false,
        title:{
          display:true,
          text: "DV-20" + year.toString() + " CEAC Data"
        },
        tooltips: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: function(tooltipItem, data) {
              var datasetLabel = data.datasets[tooltipItem.datasetIndex].label;
              var label = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index];
              return datasetLabel + ': ' + label + '%';
            }
          }
        },
        hover: {
          mode: 'index'
        },
        scales: {
          xAxes: [{
            stacked: true,
            ticks:{ autoSkip:false, maxTicksLimit:10 },
            barPercentage: 1.0,
            categoryPercentage: 1.0,
            scaleLabel: {
              display: true,
              labelString: 'Case number'
            }
          }],
          yAxes: [{
            stacked: true,
            ticks: {
              max: 100,
              min: 0,
              stepSize: 20
            },
            scaleLabel: {
              display: true,
              labelString: 'Percentage'
            }
          }]
        }
      }
    };
    window.myLine = new Chart(ctx, config);

    let embassy = $('#embCode').val() || 'ABD';
    let embUrl = "/data/embassies/" + year.toString() + "/" + embassy + ".json";
    var jsonData = $.getJSON(embUrl).done(function (results) {
      sessionStorage.setItem('ceac' + year.toString() + 'emb', JSON.stringify(results));
      var econfig = {
        type: 'bar',
        data: getEmbassyData(),
        options: {
          animation : false,
          responsive: true,
          maintainAspectRatio: false,
          title: {
            display: true,
            text: 'DV-20' + year.toString() + ' CEAC Data for Embassies'
          },
          tooltips: {
            mode: 'index',
            intersect: false
          },
          hover: {
            mode: 'index'
          },
          scales: {
            xAxes: [{
              stacked: true,
              ticks:{ autoSkip:false, maxTicksLimit:10 },
              barPercentage: 1.0,
              categoryPercentage: 1.0,
              scaleLabel: {
                display: true,
                labelString: 'Case number'
              }
            }],
            yAxes: [{
              stacked: true,
              scaleLabel: {
                display: true,
                labelString: 'Number of cases'
              }
            }]
          }
        }
      };
      window.myEmbLine = new Chart(ectx, econfig);
    });
  });
  if (year == 19) {
    $.get('/data/hof' + year.toString() + '.json', function(data){
      var TableData = [];
      data.forEach(function(entry) {
        TableData.push([entry['_id'], entry['count']]);
      });

      $('#hof').DataTable({
          data: TableData,
          columns: [
              { title: 'Username' },
              { title: 'Count' }
          ],
          paging: true,
          ordering: false,
          info: false,
          searching: false
      });
    });
  };
});
