window.chartColors = {
    red: 'rgb(255, 99, 132)',
    orange: 'rgb(255, 159, 64)',
    yellow: 'rgb(255, 205, 86)',
    green: 'rgb(75, 192, 192)',
    blue: 'rgb(54, 162, 235)',
    purple: 'rgb(153, 102, 255)',
    grey: 'rgb(201, 203, 207)'
};

function updateTable(data) {
    var tableData = []
    $.each(data, function(country, vals) {
        if (country === 'TOTALS') { return true; }
        var newRow = [];
        newRow.push(country);
        newRow = newRow.concat([vals[4]].concat(vals.slice(0,4)));
        tableData.push(newRow);
    });
    var table = $('#full').DataTable();
    table.clear();
    table.rows.add(tableData).draw();

    var summary = $('#summary').DataTable();
    summary.clear();
    var row = [data['TOTALS']['AF'], data['TOTALS']['AS'], data['TOTALS']['EU'],
        data['TOTALS']['NA'],data['TOTALS']['OC'],data['TOTALS']['SA']];
    summary.row.add(row).draw();
}

function parseData(data, threshold) {
    var labels = [];
    var dv1 = [];
    var dv2 = [];
    var dv3 = [];
    var rest = [0, 0, 0];
    $.each( data, function( key, val ) {
        if (key === 'TOTALS') { return true; }
        if (val[3] < threshold) {
            rest[0] = rest[0] + val[0];
            rest[1] = rest[1] + val[1];
            rest[2] = rest[2] + val[2];
        } else {
            labels.push(key);
            dv1.push(val[0]);
            dv2.push(val[1]);
            dv3.push(val[2]);
        }
    });
    labels.push('Others');
    dv1.push(rest[0]);
    dv2.push(rest[1]);
    dv3.push(rest[2]);
    updateTable(data);
    var color = Chart.helpers.color;
    return {
        labels: labels,
        datasets: [{
            label: 'DV1',
            backgroundColor: color(window.chartColors.red).alpha(0.5).rgbString(),
            borderColor: window.chartColors.red,
            borderWidth: 1,
            data: dv1
        }, {
            label: 'DV2',
            backgroundColor: color(window.chartColors.green).alpha(0.5).rgbString(),
            borderColor: window.chartColors.green,
            borderWidth: 1,
            data: dv2
        }, {
            label: 'DV3',
            backgroundColor: color(window.chartColors.blue).alpha(0.5).rgbString(),
            borderColor: window.chartColors.blue,
            borderWidth: 1,
            data: dv3
        }]

    };
    
}

function resizeInput() {
    this.style.width = this.value.length + 0.3 + "ch";
}

function setMonthsDropdown(months) {
    $('#MonthSelector').empty();
    months.forEach(function(month) {
        if (month === 'TOTALS') { return true; }
        $('#MonthSelector').append('<li><a href="#">' + month + '</a></li>');
    });
    var currentMonth = months[months.length-1];
    sessionStorage.setItem('currentMonth', currentMonth);
    $("#currentm").val(currentMonth);

    $("#MonthSelector li").on('click', function (e) {
        var currentMonth = $(this).text();
        sessionStorage.setItem('currentMonth', currentMonth);
        $("#currentm").val(currentMonth);
        var currentFY = $("#currentFY").val();
        var data = JSON.parse(sessionStorage.getItem('data'));
        window.myHorizontalBar.data = parseData(data[currentFY][currentMonth], threshold);
        window.myHorizontalBar.options.title.text = 'IV Issuances by Foreign State of Chargeability or Place of Birth (' + currentMonth + ')';
        window.myHorizontalBar.update();
    });
    return currentMonth;
}

window.onload = function() {
    var promise = $.getJSON("/data/output.json");
    var ctx = document.getElementById("canvas").getContext("2d");
    
    promise.done(function(data) {
        sessionStorage.setItem('data', JSON.stringify(data));

        var years = Object.keys(data);
        var currentFY = years[years.length - 1];
        sessionStorage.setItem('currentFY', currentFY);
        $("#currentFY").val(currentFY);
        years.forEach(function(year) {
            $('.dropdown-menu').append('<li><a href="#">' + year + '</a></li>');
        });
        var input = document.querySelector('input'); // get the input element
        input.addEventListener('input', resizeInput);
        resizeInput.call(input);

        var currentMonth = setMonthsDropdown(Object.keys(data[currentFY]));
        
        $('#summary').DataTable({
            data: [[0, 0, 0, 0, 0, 0]],
            columns: [
                { title: 'AF' },
                { title: 'AS' },
                { title: 'EU' },
                { title: 'NA' },
                { title: 'OC' },
                { title: 'SA' }
            ],
            paging: false,
            ordering: false,
            info: false,
            searching: false
        });
        $('#full').DataTable({
            data: [[0, 1, 2, 3, 4, 5]],
            responsive: true,
            columns: [
                { title: "Country" },
                { title: "Reg" },
                { title: "DV1" },
                { title: "DV2" },
                { title: "DV3" },
                { title: "Total" }
            ] 
        });
        window.myHorizontalBar = new Chart(ctx, {
            type: 'horizontalBar',
            data: parseData(data[currentFY][currentMonth], 30),
            options: {
                elements: {
                    rectangle: {
                        borderWidth: 2,
                    }
                },
                tooltips: {
                    mode: 'index',
                    position: 'nearest',
                    intersect: true
                },
                responsive: true,
                maintainAspectRatio: false,
                legend: {
                    position: 'right',
                },
                title: {
                    display: true,
                    text: 'IV Issuances by Foreign State of Chargeability or Place of Birth (' + currentMonth + ')'
                },
                scales: {
                    xAxes: [{
                        stacked: true,
                    }],
                    yAxes: [{
                        stacked: true
                    }]
                }
            }
        });

        $(function() {
            $("#slider").slider({
                range: "max",
                min: 10,
                max: 100,
                value: 30,
                step: 10,
                slide: function(event, ui) {
                    var data = JSON.parse(sessionStorage.getItem('data'));
                    let currentMonth = sessionStorage.getItem('currentMonth');
                    let currentFY = sessionStorage.getItem('currentFY');
                    window.myHorizontalBar.data = parseData(data[currentFY][currentMonth], ui.value);
                    window.myHorizontalBar.update();
                    $("#threshold").val(ui.value);
                }
            });
            $("#threshold").val($("#slider").slider("value"));
        });

        $('#FYSelector li').on("click", function(e){
            var currentFY = $(this).text();
            sessionStorage.setItem('currentFY', currentFY);
            $("#currentFY").val(currentFY);

            var threshold = $("#threshold").val();
            var data = JSON.parse(sessionStorage.getItem('data'));
            var currentMonth = setMonthsDropdown(Object.keys(data[currentFY]));
            window.myHorizontalBar.data = parseData(data[currentFY][currentMonth], threshold);
            window.myHorizontalBar.options.title.text = 'IV Issuances by Foreign State of Chargeability or Place of Birth (' + currentMonth + ')';
            window.myHorizontalBar.update();
        });
    });     
};
