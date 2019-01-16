var countDownDate = new Date().getTime();

function eventTagTime(id, event, eventName)
{
    if(event=="Start")
	countDownDate = new Date().getTime();

    var now = new Date().getTime();
    var distance = now - countDownDate;
    var subId = id + "sub";

    // Time calculations for days, hours, minutes and seconds
    var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
//    minutes = minutes*60;
    var seconds = Math.floor((distance % (1000 * 60)) / 1000);
//    seconds += minutes;
    console.log(seconds);

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
    
