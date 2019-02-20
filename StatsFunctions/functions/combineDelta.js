module.exports = {
    combineOP: function (s1,s2) {return combine(s1,s2);},
    deltaOP: function (start,end) {return delta(start,end);}
};

function combine (s1,s2) {
    var output = s1.concat(s2);
    output.sort(function(a, b){return a - b});
    return output;
  
}


function isStart(x,start) {
    if (start.includes(x))
	{
	    return true;
	}
    return false;
}

function isEnd(x,end) {
    if (end.includes(x))
	{
	    return true;
	}
    return false;
}

function delta (start, end) {
    var combined = combine(start,end);
    var output = [];

    var d = 0;
    for (var i = 0; i<combined.length; i++)
	{

	    //last element is start
	    if (i==combined.length-1 &&
		isStart(combined[i], start))
		{
		    break;
		}
	    //next two elements are start and end
	    //separates start, start; end, start; end, end
	    else if (isStart(combined[i],start) &&
		     isEnd(combined[i+1], end))
		{
		    d = combined[i+1] - combined[i];
		    output.push(d);
		    i++;
		}
	    //extra end event with no start
	    //uses previous end element as new "start"
	    else if (isEnd(combined[i],end))
		{
		    if (i == 0)
			{
			    d = combined[i];
			}
		    else 
			{
			    d = combined[i]-combined[i-1];
			}
		    output.push(d);
		}

	}
    return output;
}
