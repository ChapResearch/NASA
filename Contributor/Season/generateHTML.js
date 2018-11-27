//
// generateHTML.js
//
//        This file will take a js object that represents a NASA season desciption
//        and generate the HTML that will paint the screen. It is assumed that this output
//        is in the context of a <form>.
//

function generateHTML(season)
{
    var layout = season.app.layout[0].field;
    var elements = season.app.elements[0].field;
    var output = "";
    output += generateHeader();
    
    for(var i=0; i<layout.length; i++){
	var field = layout[i];
	var type = getField("type",field, null);
	switch(type){
	case "text":        output += generateTextField(field,elements); break;
	case "radio":       output += generateRadioField(field,elements); break;
	case "intChoice":   output += generateIntChoiceField(field,elements); break;
	case "dropdown":    output += generateDropField(field,elements); break;
	case "checkbox":    output += generateCheckboxField(field,elements); break;
	case "slider":      output += generateSliderField(field,elements); break;
	case "event":       output += generateEventButton(field,elements); break;
	case "eventWindow": output += generateEventWindow(field,elements); break;
	}
	    
//	console.log(getLayoutField("type",layoput[i], null));
//	console.log(getLayoutField("name",layout[i], null));
//	console.log(getLayoutField("type",layout[i], null));	
    }

    output += generateFooter();

    return output;
    
}

function generateHeader()
{
    var output = "";
    output += '<html>';
    output += '<head>';
    output += '<link rel="stylesheet" type="text/css" href="NASA.css">';
    output += '<script type="text/javascript" src="NASA.js"></script>';
    output += '<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>';
    output += '</head>';
    output += '<body>';

    return output;
}

function generateFooter()
{
    var output = "";
    output += '</body>';
    output += '</html>';

    return output;
}

function getField(name, field, def) // def = default
{

    if ( field.hasOwnProperty(name) ) {
//	console.log(field[name]);
        return (field[name][0]);
    }

    return def;
}



function generateTextField(field, elements)
{
    
    var output = "";

    output += '<div class="NASA-field-text" ' + fieldPosition(field) + '>';
    var text = getField("label", field, "[NULL]");
    output += text;
    output += '</div>';
    
    return output;
}

function generateEventButton(field,elements)
{
    var output = "";
    var name = getField("name", field, "[NULL]")
    var ewid = getField("ewid", field, "[NULL]")    
    var label = findElementLabel(name, elements);

    output += '<div class="NASA-event-button" ' + fieldPosition(field) + '>';    
    output += '<button onclick="eventTagTime(&quot;' + ewid + '&quot;' + ', &quot;' + label + '&quot;)">' + label + '</button>';
    output += '</div>';

    return output;
}

function generateEventWindow(field,elements)
{
    var output = "";
    var ewid = getField("ewid", field, "[NULL]")
    var label = getField("label", field, "[NULL]")    
    
    output += '<div class="NASA-event-window" id="' + ewid + '" ' + eventWindowStyle(field) + '>';

    output += '</div>';

    return output;
}


function generateRadioField(field, elements)
{
    
    var output = "";
    var name = getField("name", field, "[NULL]")
    var label = findElementLabel(name, elements);
    
    output += '<div class="NASA-field-radio" ' + fieldPosition(field) + '>';
    output += label + "<br>";
    output += getChoices(name, elements, "radio");
    output += '</div>';
    
    return output;
    
}


function generateIntChoiceField(field, elements)
{
    
    var output = "";
    var name = getField("name", field, "[NULL]");
    var label = findElementLabel(name, elements);
    
    output += '<div class="NASA-field-intChoice" ' + fieldPosition(field) + '>';
    output += label;
    output += '<input type="number" name="' + name + '" step="1">';
    output += '</div>';
    
    return output;

}


function generateDropField(field, elements)
{
    
    var output = "";
    var name = getField("name", field, "[NULL]");
    var label = findElementLabel(name, elements);
    
    output += '<div class="NASA-field-dropDown" ' + fieldPosition(field) + '>';
    output += label + "<br>";
    output += getDDChoices(name, elements);
    output += '</div>';
    
    return output;
}


function generateCheckboxField(field, elements)
{
    var output = "";
    var name = getField("name", field, "[NULL]");
    var label = findElementLabel(name, elements);
    
    output += '<div class="NASA-field-checkbox" ' + fieldPosition(field) + '>';
    output += label + "<br>";
    output += getChoices(name, elements, "checkbox");
    output += '</div>';

//    console.log(output);
    return output;
}


function generateSliderField(field, elements)
{
    var output = "";
    var name = getField("name", field, "[NULL]");
    var label = findElementLabel(name, elements);
    var max = getField('max', field, null);
    var min = getField('min', field, null);
    
    output += '<div class="NASA-field-intChoice" ' + fieldPosition(field) + '>';
    output += label;
    output += '<input type="range" name="' + name + '" max="' + max + '" min="' + min + '" id="' + label + '" value="5">';
    output += '<p>Value: <span id="' + name + '"></span></p>';
    output += '</div>';    
    output += '<script>	var slider = document.getElementById("' + label + '");';
    output += 'var output = document.getElementById("' + name + '");';
    output += 'output.innerHTML = slider.value;';
    output += 'slider.oninput = function() { output.innerHTML = this.value; }';
    output += '</script>';
    
    return output;
}


function generateLine(field,elements)
{
    var output = "";
    var name = getField("name", field, "[NULL]");
    var size = getField('size', field, null);
	
    output += '<div class="NASA-line" ' + fieldPosition(field) + '>';
    output += '<hr size="' + size + '" width="' + width + '">';
    output += '</div>';

    console.log(output);
    return output;
}


function fieldPosition(field)
{
    var output = ""
    var location = getField("location", field, "0,0");
    var pos = location.split(",");
    if (pos.length != 2){
	pos = [50, 50];
    }

    output += 'style="position:absolute;left:' + pos[0] + 'vw;top:' + pos[1] + 'vh;width:200px"';
    return output;
}

function eventWindowStyle(field)
{
    var output = ""
    var location = getField("location", field, "0,0");
    var size = getField("size", field, "0,0");
    var dim = size.split(",");
    if (dim.length != 2){
	dim = [15, 50];
    }
    var pos = location.split(",");
    if (pos.length != 2){
	pos = [50, 50];
    }

    output += 'style="position:absolute;left:' + pos[0] + 'vw;top:' + pos[1] + 'vh;width:' + dim[0] + 'vw;height:' + dim[1] + 'vh;"';
    return output;
}


function getElementField(name, elements)
{
    for(i=0; i<elements.length; i++){
	var elementName = getField('name', elements[i], null);
	if (elementName && elementName === name){
	    return elements[i];
	}
    }

    return "NULL";
}

    
function findElementLabel(name, elements)
{
    for(i=0; i<elements.length; i++){
	var elementName = getField('name', elements[i], null);
	if (elementName && elementName === name){
	    return getField('label', elements[i], "[NULL]");
	}
    }

    return "NULL";
}


function getChoices(name, elements, type)
{
    var field = getElementField(name, elements);
    var choices = field.choice;
    var output = "";
    for (i=0; i<choices.length; i++){
	var name = getField('label', choices[i], null);
	var value = getField('value', choices[i], null);
	if (name == null)
	    name = value;
	output += '<input type="' + type + '" name="' + name + '" value="' + value + '">' + name + '<br>';
    }

    return output;
}


function getDDChoices(name, elements)
{
    var field = getElementField(name, elements);
    var choices = field.choice;
    var output = "<select>";
    for (i=0; i<choices.length; i++){
	var name = getField('label', choices[i], null);
	var value = getField('value', choices[i], null);
	if (name == null)
	    name = value;
	output += '<option value="' + value + '">' + name + '</option>';
    }

    output += "</select>";
    return output;
}    
