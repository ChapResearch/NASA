//
//
// generateHTML2() - Basically the first one but better
//
//

var script = document.createElement('script');
script.src = 'http://code.jquery.com/jquery-1.11.0.min.js';
script.type = 'text/javascript';
document.getElementsByTageName('head')[0].appendChild(script);

function seasonLoad_generateHTML(seasonXML,target)
{
    var output = "";
//    output += generateHeader();
    
    var layoutFields = $("layout field", seasonXML);
    var elementFields =  $("elements field", seasonXML);
    
	layoutFields.each(function()
	{
	    var type = $(this).find("type").text();
	    var name = $(this).find("name").text();
	    var targetElementField = fieldElementByName(elementFields,name);
	    
	    switch(type)
	    {
		case "text":        output += generateTextField($(this),targetElementField); break;
		case "radio":       output += generateRadioField($(this),targetElementField); break;
		case "intChoice":   output += generateIntChoiceField(field,targetElementField); break;
		case "dropdown":    output += generateDropField(field,targetElementField); break;
		case "checkbox":    output += generateCheckboxField(field,targetElementField); break;
		case "slider":      output += generateSliderField(field,targetElementField); break;
		case "event":       output += generateEventButton(field,targetElementField); break;
		case "eventWindow": output += generateEventWindow(field,targetElementField); break; 
	    }
	});
    
//    output += generateFooter();

    return output;
}



function findElementByName(elementFields, targetName)
{
    elementFields.each(function()
		       {
			   var name = $(this).find("name").text();
			   if(name == targetName){
			       return $(this);
			   }
		       });
    return null;
}




function fieldPosition(layoutField)
{
    var output = ""
    var location = layoutField('location');
    var pos = location.split(",");
    if (pos.length != 2){
	pos = [50, 50];
    }

    output += 'style="position:absolute;left:' + pos[0] + 'vw;top:' + pos[1] + 'vh;width:200px"';
    return output;
}




function getChoices(name, targetElementField, type)
{
    var choices = targetElementField.find("choices");
    var output = "";
    choices.each(function()
		 {
		     var name = this.find("name");
		     var value = this.find("value");
		     if (name == null)
			 name = value;
		     output += '<input type="' + type + '" name="' + name + '" value="' + value + '">' + name + '<br>';
		 }

    return output;
}




function eventWindowStyle(field)
{
    var output = ""
    var location = layoutField('location');
    var size = layoutField('size');
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
    


    

function generateEventButton(layoutField,elementField)
{
    var output = "";
    var name = layoutField.find('name');
    var ewid = layoutField.find('ewid');
    var label = elementField.find('name');

    output += '<div class="NASA-event-button" ' + fieldPosition(field) + '>';    
    output += '<button onclick="eventTagTime(&quot;' + ewid + '&quot;' + ', &quot;' + label + '&quot;)">' + label + '</button>';
    output += '</div>';

    return output;
}




function generateEventWindow(layoutField,elementField)
{
    var output = "";
    var ewid = layoutField.find('ewid');
    var label = elementField.find('name');    
    
    output += '<div class="NASA-event-window" id="' + ewid + '" ' + eventWindowStyle(field) + '>';

    output += '</div>';

    return output;
}



function generateTextField(layoutField, elementField)
{
    
    var output = "";

    output += '<div class="NASA-field-text" ' + fieldPosition(field) + '>';
    var text = layoutField.find("label").text();
    output += text;
    output += '</div>';
    
    return output;
}



function generateRadioField(layoutField, elementField)
{
    
    var output = "";
    var label = elementField.find("label").text();
    
    output += '<div class="NASA-field-radio" ' + fieldPosition(field) + '>';
    output += label + "<br>";
    output += getChoices(name, elementField, "radio");
    output += '</div>';
    
    return output;
    
}



function generateIntChoiceField(layoutField, elementField)
{
    
    var output = "";
    var name = layoutfield.find('name');
    var label = elementField.find('label');;
    
    output += '<div class="NASA-field-intChoice" ' + fieldPosition(field) + '>';
    output += label;
    output += '<input type="number" name="' + name + '" step="1">';
    output += '</div>';
    
    return output;

}



function generateCheckboxField(layoutField, elementField)
{
    var output = "";
    var name = layoutField.find('name')
    var label = elementField.find('label');
    
    output += '<div class="NASA-field-checkbox" ' + fieldPosition(field) + '>';
    output += label + "<br>";
    output += getChoices(name, elementField, "checkbox");
    output += '</div>';

//    console.log(output);
    return output;
}



function generateSliderField(layoutField, elementField)
{
    var output = "";
    var name = layoutField.find('name');
    var label = elementField.find('name');
    var max = layoutField.find('max');
    var min = layoutField.find('min');
    
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



function generateLine(layoutField,elementField)
{
    var output = "";
    var name = elementField.find('name');
    var size = elementField.find('size');
	
    output += '<div class="NASA-line" ' + fieldPosition(field) + '>';
    output += '<hr size="' + size + '" width="' + width + '">';
    output += '</div>';

    console.log(output);
    return output;
}




    
