//############################################# INIT MAP #############################################
var map = L.map('map').setView([48.866667, 2.333], 13);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

var street_style = {
    "color": "#002aff",
    "weight": 5,
    "opacity": 0.65
};

function add_street_to_map(geojson, streetName) {
    console.log("Adding street: " + streetName + geojson)
    L.geoJSON(geojson, {style: street_style}).bindTooltip(streetName).addTo(map);
}

//############################################# Parse CSV #############################################
(function () {
    var input_file = document.getElementById("csv_file");

    input_file.addEventListener('change', function () {
        if (!!input_file.files && input_file.files.length > 0) {
            parseCSV(input_file.files[0]);
        }
    })
})();
filecontent = null;


function parseCSV(file) {
    if (!file || !FileReader) {
        console.log("error reading file");
        return;
    }
    var reader = new FileReader();
    reader.onload = function (e) {
        toTable(e.target.result);
    }
    reader.readAsText(file);
}

const NEWLINE = "\r\n";
const DELIMETER = ";";

function toTable(text) {
    var rows = text.split(NEWLINE);
    header = rows[0].split(DELIMETER)
    rows.shift();
    rows.forEach(e => {
        content =  e.split(DELIMETER)
        console.log("processing street: " +content[6])
        street_coor = content[11];
        if (street_coor) {
            street_coor = street_coor.replaceAll("\"\"", "\\\"");
            street_coor = JSON.parse(street_coor);
            add_street_to_map(JSON.parse(street_coor), content[6] );
        }
    });

}

// Examples
var botzaris = {
    "geojson": {
        "type": "LineString",
        "coordinates": [[2.3813181, 48.8759806], [2.3813882, 48.8762036], [2.3813727, 48.8762409], [2.3812988, 48.8764081], [2.3812594, 48.8765123], [2.381233, 48.876582], [2.3811874, 48.8767487], [2.3811632, 48.8768872], [2.3811565, 48.8769974], [2.3811486, 48.8771346], [2.3811606, 48.87727], [2.3811733, 48.8773639], [2.3812112, 48.8775517], [2.381239, 48.877636], [2.3812665, 48.8777082], [2.3813067, 48.8777892], [2.3813554, 48.877876], [2.381422, 48.8779783], [2.3814855, 48.8780708], [2.381603, 48.8781986], [2.3817218, 48.8783198], [2.3817754, 48.878363], [2.3818468, 48.878416], [2.381986, 48.8785189], [2.3821347, 48.8786133], [2.3822901, 48.878698], [2.3824467, 48.8787742], [2.382615, 48.8788475], [2.3828141, 48.8789215], [2.3829436, 48.8789687], [2.3830714, 48.8790116], [2.3832728, 48.8790715], [2.3834424, 48.8791186], [2.3836032, 48.8791572], [2.38394, 48.8792311], [2.3841505, 48.8792734], [2.3843556, 48.8793047], [2.3844871, 48.8793238], [2.3847096, 48.8793556], [2.3849773, 48.8793921], [2.3852506, 48.8794233], [2.3856625, 48.879461], [2.3857911, 48.8794722], [2.3859069, 48.8794801], [2.386073, 48.8794913], [2.3862494, 48.8795014], [2.3868025, 48.8795245], [2.3872652, 48.8795338], [2.3877367, 48.879538], [2.3881985, 48.8795324], [2.3883324, 48.8795312], [2.3884202, 48.8795296], [2.3889233, 48.8795248], [2.3891502, 48.8795252], [2.3893588, 48.8795347], [2.3894466, 48.8795444], [2.3895182, 48.8795803]]
    }
}
add_street_to_map(botzaris.geojson,"botzaris")