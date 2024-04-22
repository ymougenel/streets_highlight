//############################################# INIT MAP #############################################
const map = L.map('map').setView([48.866667, 2.333], 13);
const accessToken = 'T9AXpuzRABgCTPv1ZobtztZ7ODNt5WfPuUAXi7IOA4vZuYiBTDCwtcJD6qYByT9U';
// List of all our defaults styles names
const styles = ['jawg-streets', 'jawg-sunny', 'jawg-terrain', 'jawg-dark', 'jawg-light'];
const baselayers = {};
// Creating one tile layers for each style
styles.forEach((style) =>
  baselayers[style] = L.tileLayer(
    `https://tile.jawg.io/${style}/{z}/{x}/{y}.png?access-token=${accessToken}`, {
      attribution: '<a href="http://jawg.io" title="Tiles Courtesy of Jawg Maps" target="_blank" class="jawg-attrib">&copy; <b>Jawg</b>Maps</a> | <a href="https://www.openstreetmap.org/copyright" title="OpenStreetMap is open data licensed under ODbL" target="_blank" class="osm-attrib">&copy; OSM contributors</a>',
    }
  )
);
// Set the default layer when you open the map
baselayers['jawg-light'].addTo(map);
// Associating each style name to its tile layer
L.control.layers(baselayers).addTo(map);
let street_style = {
    "weight": 5,
    "opacity": 0.85
};

function add_street_to_map(geojson, streetName, color) {
    console.log("Adding street: " + streetName)
    L.geoJSON(geojson, {style: {"color":color,...street_style}}).bindTooltip(streetName).addTo(map);
}

//############################################# Parse CSV #############################################
(function () {
    let input_file = document.getElementById("csv_file");

    input_file.addEventListener('change', function () {
        if (!!input_file.files && input_file.files.length > 0) {
            parseCSV(input_file.files[0]);
        }
    })
})();

function parseCSV(file) {
    if (!file || !FileReader) {
        console.log("error reading file");
        return;
    }
    let reader = new FileReader();
    reader.onload = function (e) {
        toTable(e.target.result);
        generate_legend();
    }
    reader.readAsText(file);

}

////// COLORS parsing //////
mapped_colors = new Map();
colors = []
function choose_color(category) {
    if (! category) {
        return "#002aff";
    }
    colors = ["#002aff", "#1c2833", "#e6b800","#5b2c6f","#b34700","#b30059","#264d00","#86592d"]
    content = mapped_colors.get(category);
    if (! content) { // Unknown category
        color = colors[mapped_colors.size % colors.length]
        mapped_colors.set(category, [1,color])
    }
    else {
        content[0] += 1;
        color = content[1];
    }
    return color;
}

function add_color_to_legend(textContent, color) {
    legend = document.getElementById("legend");
    div_block = document.createElement("div")
    div_block.className="category"
    span_color = document.createElement("span");
    span_color.style.backgroundColor = color;
    textNode = document.createElement("p");
    textNode.innerText = textContent;
    div_block.appendChild(span_color);
    div_block.appendChild(textNode);
    legend.appendChild(div_block);
}
function generate_legend() {
    legend = document.getElementById("legend");
    total_count = 0
    if (mapped_colors.size > 0) {
        legendNode = document.createElement("p");
        legendNode.innerText="Légende : ";
        legend.appendChild(legendNode);
    }
    for (const [category, content] of mapped_colors.entries()) {
        count = content[0]
        total_count += count
        add_color_to_legend(category+" ("+count+")",content[1]);
    }
    totalNode = document.createElement("p");
    totalNode.innerText="total => " + total_count;
    legend.appendChild(totalNode);
}
function toTable(text) {
    let NEWLINE;
    let DELIMITER = ";";
    // Deduce CSV format (new line, delimiter is forced to semicolon due to array presence)
    const count_CR = (text.match(/\r/g) || []).length;
    const count_LF = (text.match(/\n/g) || []).length;
    const count_CRLF = (text.match(/\r\n/g) || []).length;
    if (count_CR > count_LF && count_CR > count_CRLF) NEWLINE = "\r";
    else if (count_LF > count_CR && count_LF > count_CRLF) NEWLINE = "\n";
    else NEWLINE = "\r\n"

    console.log("=>Format CSV analysed: separator=" + DELIMITER + " newline=" + NEWLINE.charCodeAt(0));

    let rows = text.split(NEWLINE);
    header = rows[0].split(DELIMITER)
    index_street_name = header.indexOf('L_LONGMIN');
    index_coordonates = header.indexOf('Geometry');
    index_is_displayed = header.indexOf("display");
    index_category = header.indexOf("catégorie");
    rows.shift();
    rows.forEach(e => {
        content = e.split(DELIMITER)
        street_coor = content[index_coordonates];
        street_name = content[index_street_name];
        // Street found and should be displayed (a 'display' column might exist)

        //bug fix for some street format
        if (street_coor && index_is_displayed !== -1 && !content[index_is_displayed]) {
            alert("Error with street format ->" + street_name+ "\n...skipping this element");
            console.log("Error with street format: " + content)
            content[index_is_displayed] = "false";
        }
        if (street_coor && (index_is_displayed === -1 || content[index_is_displayed].toLowerCase() === "true")) {
            street_coor = street_coor.replaceAll("\"\"", "\\\"");
            street_coor = JSON.parse(street_coor);
            category = content[index_category]
            color = choose_color(category)
            if (index_category === -1) {
                streetTagDisplay = street_name
            } else {
                streetTagDisplay = street_name + ' ('+category+")"
            }
            add_street_to_map(JSON.parse(street_coor), streetTagDisplay, color);
            console.log("Done importing street: "+ street_name + " ("+category+")")
        } else {
            console.log("Ignoring street: " + street_name)
        }
    });
}

// Examples
/*let botzaris = {
    "geojson": {
        "type": "LineString",
        "coordinates": [[2.3813181, 48.8759806], [2.3813882, 48.8762036], [2.3813727, 48.8762409], [2.3812988, 48.8764081], [2.3812594, 48.8765123], [2.381233, 48.876582], [2.3811874, 48.8767487], [2.3811632, 48.8768872], [2.3811565, 48.8769974], [2.3811486, 48.8771346], [2.3811606, 48.87727], [2.3811733, 48.8773639], [2.3812112, 48.8775517], [2.381239, 48.877636], [2.3812665, 48.8777082], [2.3813067, 48.8777892], [2.3813554, 48.877876], [2.381422, 48.8779783], [2.3814855, 48.8780708], [2.381603, 48.8781986], [2.3817218, 48.8783198], [2.3817754, 48.878363], [2.3818468, 48.878416], [2.381986, 48.8785189], [2.3821347, 48.8786133], [2.3822901, 48.878698], [2.3824467, 48.8787742], [2.382615, 48.8788475], [2.3828141, 48.8789215], [2.3829436, 48.8789687], [2.3830714, 48.8790116], [2.3832728, 48.8790715], [2.3834424, 48.8791186], [2.3836032, 48.8791572], [2.38394, 48.8792311], [2.3841505, 48.8792734], [2.3843556, 48.8793047], [2.3844871, 48.8793238], [2.3847096, 48.8793556], [2.3849773, 48.8793921], [2.3852506, 48.8794233], [2.3856625, 48.879461], [2.3857911, 48.8794722], [2.3859069, 48.8794801], [2.386073, 48.8794913], [2.3862494, 48.8795014], [2.3868025, 48.8795245], [2.3872652, 48.8795338], [2.3877367, 48.879538], [2.3881985, 48.8795324], [2.3883324, 48.8795312], [2.3884202, 48.8795296], [2.3889233, 48.8795248], [2.3891502, 48.8795252], [2.3893588, 48.8795347], [2.3894466, 48.8795444], [2.3895182, 48.8795803]]
    }
}
add_street_to_map(botzaris.geojson, "botzaris")*/