//
//
// generateHTML2() - Basically the first one but better
//
//

function seasonLoad_generateHTML(seasonXML)
{
    var output = '<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>';
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
			      case "textInput":   output += generateTextInputField($(this),targetElementField);break;
			      case "numberInput": output += generateNumberInputField($(this),targetElementField);break;
			      case "radio":       output += generateRadioField($(this),targetElementField); break;
			      case "intChoice":   output += generateIntChoiceField($(this),targetElementField); break;
			      case "dropdown":    output += generateDropField($(this),targetElementField); break;
			      case "checkbox":    output += generateCheckboxField($(this),targetElementField); break;
			      case "slider":      output += generateSliderField($(this),targetElementField); break;
			      case "event":       output += generateEventButton($(this),targetElementField); break;
			      case "eventWindow": output += generateEventWindow($(this)); break;
			      case "line":        output += generateLine($(this)); break;
			      case "box":         output += generateBox($(this)); break;			      
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
    var y = pos[1] + 2;
    var x = pos[0];
    
    output += 'style="position:absolute;left:' + pos[0] + '%;top:' + pos[1] + '%;width:fit-content"';
    return output;
}

function labelPosition(layoutField)
{
    var output = ""
    var location = layoutField.find('location').text();
    var pos = location.split(",");
    if (pos.length != 2){
	pos = [50, 50];
    }

    output += 'style="position:absolute;left:' + pos[0] + '%;top:' + pos[1] + '%;width:230px"';
    return output;
}



function fieldStyleLine(layoutField)
{
    var output = ""
    var location = layoutField.find('location').text();
    var pos = location.split(",");
    var direction = layoutField.find('direction').text();
    var length = layoutField.find('length').text();
    var color = layoutField.find('color').text();
    if (pos.length != 2){
	pos = [50, 50];
    }
    
    if(direction=="vertical")
    {
	output += 'style="position:absolute;left:' + pos[0] + '%;top:' + pos[1] + '%;height:' + length + '%;width:0;border-color:' + color + '"';
    }
    else
    {
	output += 'style="position:absolute;left:' + pos[0] + '%;top:' + pos[1] + '%;width:' + length + '%;height:0;border-color:' + color + '"';
    }
	    
    return output;
}

function fieldStyleBox(layoutField)
{
    var output = ""
    var location = layoutField.find('location').text();
    var pos = location.split(",");
    var size  = layoutField.find('size').text();
    size = size.split(",");
    var color = layoutField.find('color').text();
    if (pos.length != 2){
	pos = [50, 50];
    }
    if (pos.length != 2){
	pos = [50, 50];
    }
    
    output += 'style="position:absolute;left:' + pos[0] + '%;top:' + pos[1] + '%;width:' + size[0] + '%;height:' + size[1] + '%;border-color:' + color + '"';
    
    return output;
}

function fieldStyleTextInput(layoutField)
{
    var output = ""
    var location = layoutField.find('location').text();
    var pos = location.split(",");
    if (pos.length != 2){
	pos = [50, 50];
    }
    var y = pos[1] + 2;
    var x = pos[0];
    var size = layoutField.find('size').text();
    var sizeArray = size.split(',');
    var width = sizeArray[0];
    var height = sizeArray[1];
    
    output += 'style="position:absolute;left:' + pos[0] + '%;top:' + pos[1] + '%;width:' + width + '%;height:' + height + '%;"';
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
		     output += '<label><input type="' + type + '" name="' + name + '" value="' + value + '"><span>' + label + '</span><br></label>';
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
    output += '<button onclick="eventTagTime(&quot;' + ewid + '&quot;' + ', &quot;' + label + '&quot;, &quot;' + name + '&quot;)">' + label + '</button>';
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


function generateTextInputField(layoutField,elementField)
{
    
    var output = "";

    output += '<div class="NASA-field-textInput" ' + fieldStyleTextInput(layoutField) + '>';
    var label = elementField.find("label").text();
    var name = layoutField.find("name").text();
    output += '<div>' + label;
    output += '</div><div style="height: 100%; width: 100%;"><textarea name="' + name + '" style="width:100%;height:100%;font-size:18px;resize:none;"></textarea>';
    output += '</div>';
    output += '</div>';    
    
    return output;
}

function generateNumberInputField(layoutField,elementField)
{
    var output = "";

    // reuse the text input function fieldStyleTextInput() - no reason to create a new one
    
    output += '<div class="NASA-field-numberInput" ' + fieldStyleTextInput(layoutField) + '>';
    var label = elementField.find("label").text();
    var name = layoutField.find("name").text();
    output += '<div>' + label;
    output += '</div><div style="height: 100%; width: 100%;"><input type="number" name="' + name + '" style="width:100%;height:100%;" value="1"></input>';
    output += '</div>';
    output += '</div>';    
    
    return output;
}


function generateRadioField(layoutField, elementField)
{
    
    var output = "";
    var label = elementField.children("label").text();
    var name = elementField.children("name").text();    
    
    output += '<div class="NASA-field-radio" ' + fieldPosition(layoutField) + '>';
    output += '<div><Strong>' + label + "</Strong><br></div>";
    output += '<div>';
    output += getChoices(name, elementField, "radio");
    output += '</div>';    
    output += '</div></div>';
    
    return output;
    
}



function generateIntChoiceField(layoutField, elementField)
{
    
    var output = "";
    var name = layoutField.find('name').text();
    var label = elementField.find('label').text();
    var defaultValue = elementField.find('default').text();
    console.log(defaultValue);
    if(defaultValue=="")
	defaultValue = 0;

    var min = elementField.find('min');
    var max = elementField.find('max');
    
    output += '<div class="NASA-field-intChoice" ' + fieldPosition(layoutField) + '>';
    output += '<div>';    
    output += label;
    output += '</div>';
    output += '<div class="numSpinner">';    
    output += '<input type="number" name="' + name + '" step="1" ';
    if(min.length) {
	output += 'min="' + min.text() + '" ';
    }
    if(max.length) {
	output += 'max="' + max.text() + '" ';
    }
    output += 'value = "' + defaultValue + '">';
    output += '</div>';    
    output += '</div>';
    
    return output;

}



function generateCheckboxField(layoutField, elementField)
{
    var output = "";
    var name = layoutField.children('name').text();
    var label = elementField.children('label').text();
    
    output += '<div class="NASA-field-checkbox" ' + fieldPosition(layoutField) + '>';
    output += '<div><Strong>' + label + "</Strong></div>";
    output += '<div>'
    output += getChoices(name, elementField, "checkbox");
    output += '</div></div>';

//    console.log(output);
    return output;
}



function generateSliderField(layoutField, elementField)
{
    var output = "";
    var name = layoutField.find('name').text();
    var textName = name + "DisplayValue";
    var label = elementField.find('label').text();
    var max = layoutField.find('max').text();
    var min = layoutField.find('min').text();
    var defaultVal = elementField.find('default').text();
    
    output += '<div class="NASA-slider-field" ' + fieldPosition(layoutField) + '>';
    output += '<div>' + label + '</div>';
    output += '<div><input type="range" max="' + max + '" min="' + min + '" id="' + name + '" value="' + defaultVal + '">';
    output += '<span>Value: </span>';
    output += '<span id="' + textName + '">' + defaultVal + '</span>';
    output += '<script>'
    output += 'var slider = $("#' + name + '");';
    output += 'var output = $("#' + textName + '");';    
    output += 'slider.oninput = function() {';    
    output += 'output.innerHTML = this.value; }';
    output += '</script></div>';
    output += '</div>';
    
    
    return output;
}



function generateLine(layoutField)
{
    var output = "";
    
    output += '<div class="NASA-line" ';
    output += fieldStyleLine(layoutField);
    output += '>';
    output += '</div>';

    console.log(output);
    return output;
}

function generateBox(layoutField)
{
    var output = "";
    
    output += '<div class="NASA-box" ';
    output += fieldStyleBox(layoutField);
    output += '>';
    output += '</div>';

    console.log(output);
    return output;
}

function generateDropField(layoutField,targetElementField)
{
    return("");
}


//
// THE FOLLOWING SECTION DEALS WITH USING THE DATA SENT BY THE CONTROLLER
// AND PLUGGING IT INTO THE VARIOUS ELEMENTS IN WHICH IT MAY WANT TO APPEAR
//

function seasonSetValue(element, value)
{
    var target = $('[name="' + element + '"]');
    var type = target.prop('nodeName').toUpperCase();

    switch(type)
    {
	case "TEXTAREA":   plugInTextarea(value, target);break;
	case "INPUT":      plugInInput(value, target);break;
    }
}


function plugInTextarea(value, target)
{
    target.val(value);
}

function plugInInput(value, target)
{
    var inputType = target.prop('input').toUpperCase();
    switch(inputType)
    {
	case "RADIO":	 target[value].prop('checked', true);break;
	case "CHECKBOX": target[value].prop('checked', true);break;
	case "NUMBER":   target.parent().find(".numSpinner_value").text(value);
    }
}
