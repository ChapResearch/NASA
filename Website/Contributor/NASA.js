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
const NASA_Controller_MATCH = '5eda1292-e156-11e8-9f32-f2801f1b9fd1';

function NASA()
{
    this.userName = null;
    this.password = null;
    this.connectedStatus = false;       // get/set through this.connected - defined below
    
    //    this.service = 'battery_service';
    this.service = NASA_Service;;

    //    this.pinger pings the server to "keep alive"
    this.pinger = null;
    //    this.pingerInterval = 120000;
    this.pingerInterval = 0;          // turns off the pinger completely

    // the filters object used when connecting to bluetooth
    //    this.filters = [{ services: [this.service], name: this.name }];
    this.filters = [{ services: [this.service]}];
//    if(name) {
//	this.filters[0].name = name;
//    }

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
    this.matchFN = null;
    this.resetFN = null;
}

Object.defineProperties(NASA.prototype, {
    connected: { set: function(a) {
	                 if(a) {
			     if(!this.connectedStatus) {
				 if(this.pingerInterval) {
				     console.log("setting up pinger for " + this.pinterInterval);
				     this.pinger = setInterval(this.pingerFN.bind(this),this.pingerInterval);
				 }
			     }
			     this.connectedStatus = true;
			 } else {
			     if(this.connectedStatus) {
				 if(this.pinger) {
				     clearInterval(this.pinger);
				     this.pinger = null;
				 }
			     }
			     this.connectedStatus = false;
			 }
	                 if(this.connectionMonitorFN) {
			     this.connectionMonitorFN(a);
			 }},
		 get: function() { return(this.connectedStatus); }},
});

NASA.prototype.pingerFN = function()
{
    console.log("pinger called");
    if(this.connected) {
	console.log("attempting ping");
	var uuid = NASA_UUIDs[NASAObj.slot].transmit;

	var buffer = new ArrayBuffer(1);
	var bufferView = new Uint8Array(buffer);

	bufferView[0] = 1;    // ping
	
	NASAObj.serviceObj.getCharacteristic(uuid)
	    .then(characteristic => {
		characteristic.writeValue(buffer)
	            .catch(error => { NASAObj.connected = false; });
	    });
    }
}    

//
// setUserName() - sets the HUMAN name of this contributor, for
//                 transmission later.
//
NASA.prototype.setUserName = function(name)
{
    this.userName = name;
}

NASA.prototype.getUserName = function()
{
    return(this.userName);
}

NASA.prototype.setPassword = function(password)
{
    this.password = password;
}

//
// sendUserName() - called to tell the Controller the human name of this contributor.
//                 Normally, this is called only during the connection process. The
//                 UI prevents the name change while connected.
//
NASA.prototype.sendUserName = function()
{
    if(this.connected) {
	console.log("attempting to send user name");
	var uuid = NASA_UUIDs[NASAObj.slot].transmit;

	var encoder = new TextEncoder('utf-8');
	var userName = encoder.encode(this.userName);

	var message = new Uint8Array(userName.length + 1);
	message[0] = 4;    // user name
	message.set(userName,1);

	NASAObj.serviceObj.getCharacteristic(uuid)
	    .then(characteristic => {
		characteristic.writeValue(message)
	            .catch(error => { NASAObj.connected = false; });
	    });
    }
}

//
// setTeam() - called when the team number is entered/changed in the UI. This
//             causes a write to the characteristic. If it fails, then the
//             connection is deemed as dropped.
//
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
    
NASA.prototype.setColor = function(color,uiControl)
{
    switch(color) {
    case 'blue':   color = 1; break;
    case 'red':    color = 2; break;
    default:       color = 0; break;
    }

    if(this.connected) {
	uiControl(true);         // disable the associated uiControl
	console.log("attempting to send color report");
	var uuid = NASA_UUIDs[NASAObj.slot].transmit;

	var buffer = new ArrayBuffer(2);
	var bufferView = new Uint8Array(buffer);

	bufferView[0] = 3;    // color report
	bufferView[1] = color;
	
	NASAObj.serviceObj.getCharacteristic(uuid)
	    .then(characteristic => {
		characteristic.writeValue(buffer)
		    .then(() => { uiControl(false); })
	            .catch(error => { NASAObj.connected = false; });
	    });
    }
}

//
// sendData() - sends the given object (data) to the controller.
//              The uiControl is a function that is called to enable/disable the
//              ui element that is used to send data.  It is called with:
//              uiControl(disabled) where disabled is true or false.  If true,
//              then the ui element should be disabled.
//
NASA.prototype.sendData = function(obj,uiControl)
{
    var MAXBLE = 512;
    var CHUNKSIZE = MAXBLE - 2;      // need 2 bytes to transmit each chunk

    if(this.connected) {
	uiControl(true);         // disable the associated uiControl
    
	console.log("attempting to send data");
	var uuid = NASA_UUIDs[NASAObj.slot].transmit;

	var jsonData = JSON.stringify(obj);
	var encoder = new TextEncoder('utf-8');
	var jsonDataEncoded = encoder.encode(jsonData);          // Uint8Array returned

	console.log("encoded data is length of " + (jsonDataEncoded.length + 2));

	// at this point we have the data that needs to be transmitted
	// but it may be too big for a characteristic - so it may need
	// to be broken into chunks.  We use the array in any case to
	// make it easier.

	var chunks = [];
	var chunkCount = Math.floor(jsonDataEncoded.length / CHUNKSIZE);    // count of full chunks
	if(jsonDataEncoded.length % CHUNKSIZE != 0) {
	    chunkCount++;                                                   // have a final non-full chunk
	}

	for(var i=0; i < chunkCount; i++) {
	    chunks.push(jsonDataEncoded.slice(i*CHUNKSIZE,(i+1)*CHUNKSIZE));
	}

	console.log("using " + chunks.length + " chunks");

	// now we have an array of chunks to be transmitted WITHOUT the need to check
	//  the size of the chunk any more.
	
	NASAObj.serviceObj.getCharacteristic(uuid)
	    .then(characteristic => { this._sendChunks(characteristic,uiControl,chunks); })
	    .catch(error => { NASAObj.connected = false; });
    }
}

//
// _sendChunks() - sends the given chunks to the Controller. This routine
//                 will resursively call itself after each chunk is transmitted.
//                 Note that each chunk is json encoded data (not that it matters
//                 for this routine).
//
NASA.prototype._sendChunks = function(characteristic,uiControl,chunks)
{
    if(chunks.length) {

	var chunk = chunks.shift();
	var message = new Uint8Array(chunk.length + 2);

	message[0] = 5;                        // data report transmission
	message[1] = (chunks.length==0)?1:0;    // zero is non-final, otherwise is final
	
	message.set(chunk,2);

	// TODO - need to trow error upon the catch here
	
	characteristic.writeValue(message)
	    .then(() => { this._sendChunks(characteristic,uiControl,chunks); })
	    .catch(error => { NASAObj.connected = false; });
    } else {
	uiControl(false);         // enable the associated uiControl
    }
}    

//
// _notifySetup() - called to set-up notifications for changes to the match number.
//
NASA.prototype._notifySetup = function(matchCharacteristic)
{
    return matchCharacteristic.startNotifications()
	        .then(() => {
		    matchCharacteristic.addEventListener('characteristicvaluechanged', (event) => {
			console.log("event");
		    })
		});
}

//
// _disconnect() - this routine is attached to the bluetooth interface to be called
//                 when the connection drops.
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

    console.log(this.filters);

    // kick-off the connection process by getting the BLE device and connecting to the device
    //  that the user specified in the pop-up. The disconnect listener is attached upon
    //  the filters, imply specify the service UUID - no names - it doesn't work right in the API yet
    
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

    // if we get this far, then we have a connection, so get the primary service for it
    
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

    // get the name of the controller and tell the UI about it.
    
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
	    reportFN("password-done");
	})

    // since things have gone OK up to this point, we'll just grab the match
    //  number without providing any status for it...

    	.then(() => {
	    console.log("getting match number of controller - characteristic");
	    return(NASAObj.serviceObj.getCharacteristic(NASA_Controller_MATCH));
	})
	.then(characteristic => {
	    return(characteristic.readValue());
	})
	.then(value => {
	    var decoder = new TextDecoder('utf-8');
	    var match = decoder.decode(value);
	    if(NASAObj.matchFN) {
		NASAObj.matchFN(match);
	    }
	})

    // then set-up the notifications on the match number

    	.then(() => {
	    console.log("setting up notifications");
	    return(NASAObj.serviceObj.getCharacteristic(NASA_Controller_MATCH));
	})
	.then((matchCharacteristic) => {
	    console.log("here we go");
	    return(matchCharacteristic.startNotifications());
	})
    	.then((matchCharacteristic) => {
	    matchCharacteristic.addEventListener('characteristicvaluechanged', (event) => {
		var decoder = new TextDecoder('utf-8');
		var match = decoder.decode(event.target.value);
		if(NASAObj.matchFN){
		    NASAObj.matchFN(match);
		}
		if(NASAObj.resetFN) {
		    NASAObj.resetFN();
		}
	    })
	})

    // check to see if we can have the slot we're asking for
    
	.then( () => {
	    reportFN("slot");
	    console.log("attempting to reserve slot");
	    var uuid = NASA_UUIDs[NASAObj.slot].transmit;
	    return(NASAObj.serviceObj.getCharacteristic(uuid));
	})
	.then(characteristic => {
	    console.log("claiming slot");

	    var buffer = new ArrayBuffer(1);
	    var bufferView = new Uint8Array(buffer);
	    bufferView[0] = 0;    // slot claim

	    // this write will fail if we can't have the slot we wanted
	    return(characteristic.writeValue(buffer));
	})
    
    // if we get here, then everything went well, and we're connected
    //   we do kick-off the sending of the user name, but it isn't
    //   part of this promise chain.

        .then(() => {
	    reportFN("slot-done");
	    NASAObj.sendUserName();
	    NASAObj.connected = true;
	})

	.catch(error => {

	    console.log('"' + error +'"');
	    switch(error.toString()) {
	    case 'NotSupportedError: GATT operation not permitted.':
	    case 'DOMException: GATT operation not permitted.':
		error = 'slot-fail';
		reportFN("slot-fail");
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

//
// disconnect() - can be called internally/externally to disconnect
//
NASA.prototype.disconnect = function()
{
    console.log("disconnect called when " + (this.connected?"connected":"not connected"));
    if(this.connected) {
	this.device.gatt.disconnect();
	this.connected = false;
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

//
// nameMonitor() - use to specify a callback that is called whenever the
//                 name of the controller has changed.
//
NASA.prototype.nameMonitor = function(fn)
{
    this.nameFN = fn;
}

//
// matchMonitor() - use to specifuy the callback that is called whenever the
//                  match number from the Controller changes.
//
NASA.prototype.matchMonitor = function(fn)
{
    this.matchFN = fn;
}

//
// resetMontitor()- use to specify the callback that is called when the Controller
//                  requests a reset of the Contributors.
//
NASA.prototype.resetMonitor = function(fn)
{
    this.resetFN = fn;
}
