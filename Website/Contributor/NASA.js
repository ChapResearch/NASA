//
// BLEInterface.js
//
//   Creates the interface for the NASA contributors to talk to the
//   controller.
//
//   The interface is the "NASA" object.  It is used by:
//
//        var myNASA = new NASA('name','password');
//
//   The "name" is the name of the controller, and the "password" is
//   used to ensure that connections only occur for the appropriate
//   contributors.
//
//   Then all of the NASA operations can be performed.
//

const NASA_Service = 'df85c229-277c-4070-97e3-abc1e134b6a1';

const NASA_UUIDs = {
    A:{ receive:'b5c1d1ae-eb68-42f2-bc5f-278902252ca9',
        transmit:'1a17ae70-1d3f-4193-81c1-99a40cd219cf' },
    
    B:{ receive: '02dad9d7-10c0-467f-9a64-9f2a380dc7bf',
	transmit: '61c15dc1-745f-4d25-bbdd-0518b5669180' },
    
    C:{ receive: '6a081497-98f2-44f6-b75c-e7c719866767',
	transmit: '0cabc681-2ec4-44f4-bb09-7f80c1856923' },
    
    D:{ receive: 'a6a99e2f-3b41-404c-a437-adf0aa3beb30',
	transmit: '4d81b727-c4e0-4f76-a76a-386ed7050ff7' },
    
    E:{ receive: '84f9047f-054e-4a34-92e7-a4ce528e8963',
	transmit: '4ceb6d73-9cea-4813-8f3b-5c78170642e3' },
    
    F:{ receive: '9646616b-2dfd-4f43-b0ea-febc1aa49b54',
	transmit: '7f1d572e-cd58-49c5-b59e-647a3e89de29' },

};

const NASA_Controller_Name = 'd9867b1d-15dd-4f18-a134-3d8e4408fcff';
const NASA_Controller_PW = 'b1de1e91-6d8a-4b5c-8b06-2e64688d3fc9';
const NASA_Controller_Reset = '5eda1292-e156-11e8-9f32-f2801f1b9fd1';

function NASA()
{
    this.name = null;
    this.password = null;
    this.connectedStatus = false;       // get/set through this.connected - defined below
    
    //    this.service = 'battery_service';
    this.service = NASA_Service;;

    // the filters object used when connecting to bluetooth
    //    this.filters = [{ services: [this.service], name: this.name }];
    this.filters = [{ services: [this.service]}];
    if(name) {
	this.filters[0].name = name;
    }

    // the device we're connecting to
    this.device = null;
    
    // the gatt server - this is only valid if connected
    this.server = null;

    // the primary service
    this.serviceObj = null;
    
    // connection monitoring function - it would be "nice" if the web bluetooth
    //   had a "connection" event, as well as the disconnect event. But since
    //   it doesn't, we need to fire the connection event ourselves. This is
    //   done by watching the "connected" variable.
    
    this.connectionMonitorFN = null;
    this.nameFN = null;
}

Object.defineProperties(NASA.prototype, {
    connected: { set: function(a) {
	                 if(a) {
			     this.connectedStatus = true;
			 } else {
			     this.connectedStatus = false;
			 }
	                 if(this.connectionMonitorFN) {
			     this.connectionMonitorFN(a);
			 }},
		 get: function() { return(this.connectedStatus); }},
});
					 

NASA.prototype.setName = function(name)
{
    this.name = name;
}

NASA.prototype.getName = function()
{
    return(this.name);
}

NASA.prototype.setPassword = function(password)
{
    this.password = password;
}

NASA.prototype.setTeam = function(team)
{
    if(this.connected) {
	console.log("attempting to send team number");
	var uuid = NASA_UUIDs[NASAObj.slot].transmit;

	var encoder = new TextEncoder('utf-8');
	var teamNumber = encoder.encode(team);

	var message = new Uint8Array(teamNumber.length + 1);
	message[0] = 2;    // team number
	message.set(teamNumber,1);

	NASAObj.serviceObj.getCharacteristic(uuid)
	    .then(characteristic => {
		characteristic.writeValue(message)
	            .catch(error => { NASAObj.connected = false; });
	    });
    }
}
    
NASA.prototype.setColor = function(color)
{
    switch(color) {
    case 'blue':   color = 1; break;
    case 'red':    color = 2; break;
    default:       color = 0; break;
    }

    if(this.connected) {
	console.log("attempting to send color report");
	var uuid = NASA_UUIDs[NASAObj.slot].transmit;

	var buffer = new ArrayBuffer(2);
	var bufferView = new Uint8Array(buffer);

	bufferView[0] = 3;    // color report
	bufferView[1] = color;
	
	NASAObj.serviceObj.getCharacteristic(uuid)
	    .then(characteristic => {
		characteristic.writeValue(buffer)
	            .catch(error => { NASAObj.connected = false; });
	    });
    }
}



// 
// Attach the following to a button:
//
//    $('button.connect').click(myNASA.connect());
//
// 

NASA.prototype._disconnect = function()
{
    this.connected = false;
    if(this.connectionMonitorFN) {
	this.connectionMonitorFN(false);
    }
}

// connect() - connects to a controller out there. The name & pw must 
//             be as specified when the NASA object was created,
//             because eventually there will be
//             TONS of NASA users, and everyone needs to be able
//             connect to THEIR controller. The password will stop
//             nafarious contributors from connecting.
//
NASA.prototype.connect = function(reportFN)
{
    NASAObj = this;

    reportFN("contact");

    navigator.bluetooth.requestDevice({ filters: this.filters })
	.then(device => {
	    if(device.name) {
		if(this.nameFN) {
		    this.nameFN(device.name);
		}
	    }
	    device.addEventListener('gattserverdisconnected',NASAObj._disconnect.bind(NASAObj));
	    NASAObj.device = device;
	    return(device.gatt.connect());
	})
	.then(server => {
	    NASAObj.server = server;
	    console.log("connected - getting primary service");
	    return(NASAObj.server.getPrimaryService(NASA_Service));
	})

    // first get the contoller name, so any errors may be figured out - particularly
    //   if the controller name wasn't available
    
	.then(service => {
	    reportFN("contact-done");
	    reportFN("name");
	    NASAObj.serviceObj = service;
	    console.log("getting name of controller - characteristic");
	    return(NASAObj.serviceObj.getCharacteristic(NASA_Controller_Name));
	})
	.then(characteristic => {
	    console.log("get name of controller - value");
	    return(characteristic.readValue());
	})
	.then(value => {
	    var decoder = new TextDecoder('utf-8');
	    var name = decoder.decode(value);

	    console.log('Name is "' + name + '"');
	    
	    NASAObj.nameFN(name);
	    
	    reportFN("name-done");
	})

    // now check to see if we have the right server password
    
	.then(() => {
	    reportFN("password");
	    console.log("getting password of controller - characteristic");
	    return(NASAObj.serviceObj.getCharacteristic(NASA_Controller_PW));
	})

	.then(characteristic => {
	    console.log("get password of controller - value");
	    return(characteristic.readValue());
	})
	.then(value => {
	    var decoder = new TextDecoder('utf-8');
	    var password = decoder.decode(value);

	    if(password != NASAObj.password) {
		NASAObj.disconnect();
		throw new Error("password-fail");
	    }
	    NASAObj.connected = true;
	    reportFN("password-done");
	})

    // check to see if we can have the slot we're asking for
    
	.then( () => {
	    reportFN("slot");
	    console.log("attempting to reserve slot");
	    var uuid = NASA_UUIDs[NASAObj.slot].transmit;
	    return(NASAObj.serviceObj.getCharacteristic(uuid));
	})

	.then(characteristic => {
	    let encoder = new TextEncoder('utf-8');
	    // TODO - write name to characteristic using the write value protocol
	    let value = "floopy";
	    console.log("writing to characteristic");
	    characteristic.writeValue(encoder.encode(value))
		.then(() => { reportFN("slot-done");} )
	        .catch(error => { reportFN("slot-fail"); NASAObj.connected = false; });
	})

	.catch(error => {

	    console.log('"' + error +'"');
	    switch(error.toString()) {
	    case 'DOMException: GATT operation not permitted.':
		error = 'slot-fail';
		break;
	    case 'DOMException: User cancelled the requestDevice() chooser.':
	    case 'NotFoundError: User cancelled the requestDevice() chooser.':
		error = "contact-fail";
		break;
	    case 'Error: password-fail':
		error = 'password-fail';
		break;
	    }

	    reportFN(error);
 	    NASAObj.connected = false;
	});
};

NASA.prototype.disconnect = function()
{
    if(this.connected) {
	this.device.gatt.disconnect();
    }
}

//
// connectionMonitor() - used to specify a callback that is called whenever
//                       the NASA connection is made/lost.
//
NASA.prototype.connectionMonitor = function(fn)
{
    this.connectionMonitorFN = fn;
}

NASA.prototype.nameMonitor = function(fn)
{
    this.nameFN = fn;
}
