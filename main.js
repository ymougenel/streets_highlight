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

    if (input_file) {
        input_file.addEventListener('change', function () {
            if (!!input_file.files && input_file.files.length > 0) {
                parseCSV(input_file.files[0]);
            }
        })
    }
    else {
        $.ajax({
            type: "GET",
            url: "https://raw.githubusercontent.com/ymougenel/streets_highlight/master/voie-Paris-sur-le-champ-mini.csv",
            dataType: "text",
            success: function(data) {
                toTable(data);
                // Pre-computed values for minified CSV version
                total_length=1894.73
                total_count=6563
                generate_legend();
            }
        });
    }

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
let total_length = 0;
let total_count = 0;
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
    rows.shift(); // ignore CSV header
    rows.forEach(e => {
        content = e.split(DELIMITER)
        street_coor = content[index_coordonates];
        street_name = content[index_street_name];
        // Street found and should be displayed (a 'display' column might exist)
        let len = 0;
        //bug fix for some street format
        if (street_coor && index_is_displayed !== -1 && !content[index_is_displayed]) {
            alert("Error with street format ->" + street_name+ "\n...skipping this element");
            console.log("Error with street format: " + content)
            content[index_is_displayed] = "false";
        }
        else if (street_coor) {
            total_count += 1
            len = streets_counts_and_length(street_coor)
            total_length += len;
        }
        if (street_coor && (index_is_displayed === -1 || content[index_is_displayed].toLowerCase() === "true")) {
            street_coor = street_coor.replaceAll("\"\"", "\\\"");
            street_coor = JSON.parse(street_coor);
            category = content[index_category]
            color = choose_color(category)
            if (index_category === -1) {
                streetTagDisplay = street_name
            } else {
                handle_category(category, len);
                streetTagDisplay = street_name + ' - '+format_long(len, 2)+'km ('+category+")"
            }
            add_street_to_map(JSON.parse(street_coor), streetTagDisplay, color);
            console.log("Done importing street: "+ street_name + " ("+category+")")
        } else {
            console.log("Ignoring street: " + street_name)
        }
    });
}

streets_data = new Map();
function streets_counts_and_length(street_coor) {
    ystreet_coor = street_coor.replaceAll("\"\"", "\\\"");
    ystreet_coor = JSON.parse(ystreet_coor);
    ystreet_coor = JSON.parse(ystreet_coor);
    street_type = ystreet_coor["type"]
    if (street_type =="LineString") {
                 var line = turf.lineString(ystreet_coor["coordinates"]);
    }
    else if (street_type == "MultiLineString") {
                 var line = turf.multiLineString(ystreet_coor["coordinates"]);

    }
    else {
        return 0
    }
    return turf.length(line);

}
function handle_category(category, length) {
    category = category.replaceAll('"','') //Weird side effect when string contains accents
    category = category.normalize();
    str_data = streets_data.get(category);
    if (! str_data) {
        streets_data.set(category,[1,length])
    } else {
        str_data[0] += 1 // Increment category count
        str_data[1] += length // Increase category length
        streets_data.set(category,str_data)
    }
}
//############################################# Display Legend #############################################
mapped_colors = new Map();
colors = []
function choose_color(category) {
    if (! category) {
        return "#002aff";
    }
    colors = [ "#078fc5", "#1c2833", "#e6b800","#5b2c6f","#ff6600","#008000","#264d00","#ff0000","#86592d", "#002aff", "#435058", "#EAC5D8","#3C1518","#B370B0", "#031D44", "#87255B","#5C415D", "#E94F37", "#FC9E4F", "#344966"]
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
    div_block = document.createElement("div")
    div_block.className="category"
    span_color = document.createElement("span");
    span_color.style.backgroundColor = color;
    textNode = document.createElement("p");
    textNode.innerText = textContent;
    div_block.appendChild(span_color);
    div_block.appendChild(textNode);
    return div_block
}
function generate_legend() {
    legend = document.getElementById("legend");
    if (mapped_colors.size > 0) {
        legendNode = document.createElement("h2");
        legendNode.innerText="Légende : ";
        legend.appendChild(legendNode);
        table = document.createElement("table");
        header = document.createElement("tr");
        c1 = document.createElement("th");
        c1.innerText = "Couleur"
        c2 = document.createElement("th");
        c2.innerText = "Catégorie"
        c4 = document.createElement("th");
        c4.innerText = "Nombre"
        c5 = document.createElement("th");
        c5.innerText = "Longueur"
        header.appendChild(c1)
        header.appendChild(c2)
        header.appendChild(c4)
        header.appendChild(c5)
        table.appendChild(header)
        legend.appendChild(table)
    }
    for (const [category, content] of mapped_colors.entries()) {
        let str_data = streets_data.get(category)
        row = generate_row(content[1],category,str_data[0],format_long(str_data[1],2))
        table.appendChild(row)
    }
    totalNode = document.createElement("p");
    totalNode.innerText="Voirie totale : " + total_count + " rues, " + format_long(total_length,2)+ " km";
    legend.appendChild(totalNode);
}

function generate_row(color,category, count, length) {
    row = document.createElement("tr");
    col1 = document.createElement("td");
    span_color = document.createElement("span");
    span_color.style.backgroundColor = color;
    col1.appendChild(span_color)
    col2 = document.createElement("td");
    col2.innerText = capitalizeFirstLetter(category)
    col3 = document.createElement("td");
    col3.innerText = count +" ("+format_long(count/total_count*100,2)+"%)"
    col4 = document.createElement("td");
    col4.innerText = length + " km" + " ("+format_long(length/total_length*100,2)+"%)"
    row.appendChild(col1)
    row.appendChild(col2)
    row.appendChild(col3)
    row.appendChild(col4)
    return row
}

function format_long(number, digit_keep) {
    power = Math.pow(10,digit_keep)
    return Math.round(number * power) / power
}
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}