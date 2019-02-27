
function eventTagTime(id, event, eventName)
{
    var minutes = timerGetMins();
    var seconds = timerGetSecs();

    var totalSeconds = seconds + minutes*60

    var minString = "";
    var secString = "";
    
    if(minutes<10)
	minString = "0" + minutes;
    else
	minString = minutes;

    if(seconds<10)
	secString = "0" + seconds;
    else
	secString = seconds;

   
    var element = document.createElement('div');
    var time = document.createElement('span');
    var divToAdd = "" + minString + ":" + secString + "            " + event;
    divToAdd = document.createTextNode(divToAdd);
    time.appendChild(divToAdd);
    time.className = "timeText";
    element.className = "time";
    element.dataset.event = eventName;
    element.dataset.time = totalSeconds;
    element.appendChild(time);
    
    var close = document.createElement('span');
    var x = document.createTextNode('\u2612');
    close.appendChild(x);
    close.className = "close";
    close.onclick = remove;
    element.appendChild(close);
    
    var scoring = document.getElementById(id);
    console.log(id);
    console.log(scoring);
    scoring.scrollTop = scoring.scrollHeight;    
    
    scoring.appendChild(element);    
}

function remove()
{
    this.parentNode.remove();
}



function reset(seasonXML)
{
    var elementFields = seasonXML.find("elements field");
    
//    $('div.content').find(":input").each( function()
//					  {
//					      var name = $(this).attr('name');
//					      var field = $("[name='" + name + "']");
//					      var defaultVal = field.find('default').text();
//					      if(!defaultVal)
//						  defaultVal = 0;
//					      $(this).val(defaultVal);
    //					  });

    $('div.content').find('input[type="radio"]').each( function()
						      {
							  var name = $(this).attr('name');
							  var HTMLval = $(this).attr('value');
							  var field = findElementByName(elementFields,name);
							  var defaultVal = field.find('default').text();
							  if(!defaultVal)
							      defaultVal = 0;
							  $(this).prop('checked',false);
							  if(HTMLval==defaultVal)
							      $(this).prop('checked',true);
						      });

    $('div.content').find('input[type="checkbox"]').each( function()
						      {
							  var name = $(this).attr('name');
							  var HTMLval = $(this).attr('value');
							  var field = findElementByName(elementFields,name);
							  var defaultVal = field.find('default').text();
							  if(!defaultVal)
							      defaultVal = 0;
							  $(this).prop('checked',false);
							  if(HTMLval==defaultVal)
							      $(this).prop('checked',true);
						      });
    
    $('div.content').find('input[type="number"]').each( function()
						      {
							  var name = $(this).attr('name');
							  console.log(name);
							  var field = findElementByName(elementFields,name);
							  var defaultVal = field.find('default').text();
							  console.log(field);
							  if(!defaultVal)
							      defaultVal = 0;
							  $(this).val(defaultVal);
							  $(this).trigger('change');

						      });


    
    $('div.content').find(".NASA-event-window").empty();
    $('div.content').find("textarea").val("");
}
