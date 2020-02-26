module.exports = {
    combineOP: function (s1,s2) {return combine(s1,s2);},
    deltaOP: function (start,end,strict) {return deltaCalc(start,end,strict);}
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

//
// deltaCalc() - calculate the delta between a set of start events and end events.
//               There are two ways to calculate the deltas, either strict or not.
//
//                 STRICT - an end event must be preceeded by a start event. If that
//                          is the case, then a "delta" amount is generated as the
//                          difference between the start and end event. If an end
//                          event is not directly preceeded by a start, no delta is
//                          produced.
//
//             NOT STRICT - every end event generates a delta - think of this as
//                          the *end* being the important piece of data, even if there
//                          was no associated start. In this mode, if an end event
//                          is the first event (no preceeding start) then a delta is
//                          produced relative to zero. If an end event is followed
//                          directly by another end event, the delta is the difference
//                          between the two. Otherwise, the delta is calculated between
//                          the start event directly preceeding the end event.
//
function deltaCalc(start,end,strict)
{
    var combined = combine(start,end);
    var output = [];

    const NONE = 0;
    const START = 1;
    const END = 2;

    var prevType = NONE;
    var prevValue = 0;
    
    for(var i=0; i < combined.length; i++) {

	if(isEnd(combined[i],end)) {
	    if(!strict || prevType == START) {          // and *end* causes a delta in non-strict mode
		output.push(combined[i] - prevValue);   // or, if strict, only with an end following a start
	    }
	    prevType = END;
	} else {
	    prevType = START;
	}

	prevValue = combined[i];
    }

    return(output);
}
