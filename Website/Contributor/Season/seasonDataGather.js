//
//
// seasonDataGather() - using the XML and the HTML generated by generateHTML2.js, it generates a javascript object with all the data entered into the webpage.
//                              This object will be sent to the Controller phone where it will be sent to the database.
//
//
function seasonDataGather(seasonXML)
{
    var seasonData = {};
    gatherRadioData(seasonData);
    gatherSliderData(seasonData);
    gatherIntChoiceData(seasonData);
    gatherCheckboxData(seasonData);
    gatherEventData(seasonData);
    console.log("we about to go in bois");
    gatherTextInputData(seasonData);

    console.log(seasonData);
    return seasonData;
}

function gatherRadioData(data)
{
    $('div.content').find("input[type=radio]:checked").each(function()
							    {
								var name = $(this).attr("name");
								console.log(data);
								data[name] = $(this).val();
							    });
}

function gatherIntChoiceData(data)
{
    $('div.content').find("input[type=number]").each(function()
							    {
								var name = $(this).attr("name");
								console.log(data);
								data[name] = $(this).val();
							    });
}

function gatherCheckboxData(data)
{
    $('div.content').find("input[type=checkbox]:checked").each(function()
							       {
								   var name = $(this).attr("name");
								   if(data[name] == undefined)
								       data[name] = [];
								   data[name].push($(this).val());
							       });
}


function gatherSliderData(data)
{
    $('div.content').find("input[type=range]").each(function()
							       {
								   var name = $(this).attr("name");
								   console.log(data);
								   data[name] = $(this).val();    
							       });
}


function gatherDropdownData(data) //NEED TO FINISH
{
//    $('div.content').find("input[type=checkbox]:checked").each(function()
//							       {
//								   var name = $(this).attr("name");
//								   if(data[name] == undefined)
//								       data[name] = [];
//								   data[name].push($(this).val());
//							       });
}

function gatherEventData(data)
{
    $('div.content').find(".NASA-event-window").each(function()
						     {
							 $(this).find("div").each(function()
										  {
										      var name = $(this).attr("data-event");
										      var time = $(this).attr("data-time");
										      if(data[name] == undefined)
											  data[name] = [];
										      data[name].push(time);
										  });
						     });
}


function gatherTextInputData(data)
{
    console.log("we in bois");
    $('div.content').find(".NASA-field-textInput").each(function()
						     {
							 $(this).find("textarea").each(function()
										  {
										      var name = $(this).attr("name");
										      var text = "";										      
										      var text = $(this).val();
										      data[name] = text;
										  });
						     });

}

