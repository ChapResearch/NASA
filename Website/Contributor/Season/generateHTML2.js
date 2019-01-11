//
//
// generateHTML2() - Basically the first one but better
//
//

function seasonLoad_generateHTML(seasonXML)
{
    var output = "";
//    output += generateHeader();
    
    var layoutFields = seasonXML.find("layout field");
    var elementFields = seasonXML.find("elements field");
    
    layoutFields.each(function()
		      {
			  var type = $(this).find("type").text();
			  var nameObj = $(this).find("name");
			  if(nameObj.length != 0) {
			      console.log("Processing: " + nameObj.text());
			      var targetElementField = findElementByName(elementFields,nameObj.text());
			      console.log(targetElementField);
			  }
			  
			  switch(type)
			  {
			      case "text":        output += generateTextField($(this)); break;
			      case "radio":       output += generateRadioField($(this),targetElementField); break;
			      case "intChoice":   output += generateIntChoiceField($(this),targetElementField); break;
			      case "dropdown":    output += generateDropField($(this),targetElementField); break;
			      case "checkbox":    output += generateCheckboxField($(this),targetElementField); break;
			      case "slider":      output += generateSliderField($(this),targetElementField); break;
			      case "event":       output += generateEventButton($(this),targetElementField); break;
			      case "eventWindow": output += generateEventWindow($(this)); break; 
			  }
		      });
    
//    output += generateFooter();

    return output;
}



function findElementByName(elementFields, targetName)
{
    console.log("looking for " + targetName);

    var retElement = null;
    
    elementFields.each(function()
		       {
			   var name = $(this).find("name").text();
			   if(name == targetName){
			       console.log("found " + name);
			       retElement = $(this);
			   }
		       });
    return(retElement);
}




function fieldPosition(layoutField)
{
    var output = ""
    var location = layoutField.find('location').text();
    var pos = location.split(",");
    if (pos.length != 2){
	pos = [50, 50];
    }

    output += 'style="position:absolute;left:' + pos[0] + '%;top:' + pos[1] + '%;width:200px"';
    return output;
}




function getChoices(name, targetElementField, type)
{
    var choices = targetElementField.find("choice");
    var output = "";
    choices.each(function()
		 {
		     var label = $(this).find("label").text();
		     var value = $(this).find("value").text();
		     if (label == null) {
			 label = value;
		     }
		     output += '<input type="' + type + '" name="' + name + '" value="' + value + '">' + label + '<br>';
		 });
    console.log(output);
    return output;
}




function eventWindowStyle(layoutField)
{
    var output = ""
    var location = layoutField.find('location').text();
    var size = layoutField.find('size').text();
    var dim = size.split(",");
    if (dim.length != 2){
	dim = [15, 50];
    }
    var pos = location.split(",");
    if (pos.length != 2){
	pos = [50, 50];
    }

    output += 'style="position:absolute;left:' + pos[0] + '%;top:' + pos[1] + '%;width:' + dim[0] + '%;height:' + dim[1] + '%;border:3px solid black;"';
    return output;
}
    


    

function generateEventButton(layoutField,elementField)
{
    var output = "";
    var name = layoutField.find('name').text();
    var ewid = layoutField.find('ewid').text();
    var label = elementField.find('label').text();

    output += '<div class="NASA-event-button" ' + fieldPosition(layoutField) + '>';    
    output += '<button onclick="eventTagTime(&quot;' + ewid + '&quot;' + ', &quot;' + label + '&quot;)">' + label + '</button>';
    output += '</div>';

    return output;
}




function generateEventWindow(layoutField)
{
    var output = "";
    var ewid = layoutField.find('ewid').text();
    
    output += '<div class="NASA-event-window" id="' + ewid + '" ' + eventWindowStyle(layoutField) + '>';

    output += '</div>';

    return output;
}



function generateTextField(layoutField)
{
    
    var output = "";

    output += '<div class="NASA-field-text" ' + fieldPosition(layoutField) + '>';
    var text = layoutField.find("label").text();
    output += text;
    output += '</div>';
    
    return output;
}



function generateRadioField(layoutField, elementField)
{
    
    var output = "";
    var label = elementField.children("label").text();
    var name = elementField.children("name").text();    
    
    output += '<div class="NASA-field-radio" ' + fieldPosition(layoutField) + '>';
    output += label + "<br>";
    output += getChoices(name, elementField, "radio");
    output += '</div>';
    
    return output;
    
}



function generateIntChoiceField(layoutField, elementField)
{
    
    var output = "";
    var name = layoutField.find('name').text();
    var label = elementField.find('label').text();
    
    output += '<div class="NASA-field-intChoice" ' + fieldPosition(layoutField) + '>';
    output += label;
    output += '<input type="number" name="' + name + '" step="1">';
    output += '</div>';
    
    return output;

}



function generateCheckboxField(layoutField, elementField)
{
    var output = "";
    var name = layoutField.find('name').text();
    var label = elementField.find('label').text();
    
    output += '<div class="NASA-field-checkbox" ' + fieldPosition(layoutField) + '>';
    output += label + "<br>";
    output += getChoices(name, elementField, "checkbox");
    output += '</div>';

//    console.log(output);
    return output;
}



function generateSliderField(layoutField, elementField)
{
    var output = "";
    var name = layoutField.find('name').text();
    var label = elementField.find('name').text();
    var max = layoutField.find('max').text();
    var min = layoutField.find('min').text();
    
    output += '<div class="NASA-field-intChoice" ' + fieldPosition(layoutField) + '>';
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
    var name = elementField.find('name').text();
    var size = elementField.find('size').text();
	
    output += '<div class="NASA-line" ' + fieldPosition(layoutField) + '>';
    output += '<hr size="' + size + '" width="' + width + '">';
    output += '</div>';

    console.log(output);
    return output;
}

function generateDropField(layoutField,targetElementField)
{
    return("");
}


    
