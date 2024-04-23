//############################################# INIT MAP #############################################
const map = L.map('map').setView([48.866667, 2.333], 13);
const accessToken = 'T9AXpuzRABgCTPv1ZobtztZ7ODNt5WfPuUAXi7IOA4vZuYiBTDCwtcJD6qYByT9U';
// List of all our defaults styles names
const styles = ['jawg-streets', 'jawg-sunny', 'jawg-terrain', 'jawg-dark', 'jawg-light'];
const baselayers = {};
// Creating one tile layers for each style
styles.forEach((style) =>
  baselayers[style] = L.tileLayer(
    `https://tile.jawg.io/${style}/{z}/{x}/{y}.png?lang=fr&access-token=${accessToken}`, {
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

//############################################# Display Legend #############################################
mapped_colors = new Map();
colors = []
function choose_color(category) {
    if (! category) {
        return "#002aff";
    }
    colors = [ "#56CBF9", "#1c2833", "#e6b800","#5b2c6f","#b34700","#b30059","#264d00","#86592d","#ff0000", "#87BBA2", "#435058", "#EAC5D8","#3C1518","#B370B0", "#002aff", "#031D44", "#87255B","#5C415D", "#E94F37", "#FC9E4F", "#344966"]
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
        legendNode = document.createElement("h2");
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