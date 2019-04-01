#
# NASA Website Makefile
#
#   The targets in this Makefile include:
#
#	deploy - assemble and send the website to Google Firebase Hosting
#	push - push back up to github
#	refresh - get all github stuff back down
#
#	fb-init - initialize firebase in the current directory (this is because
#		  the firebase files aren't stored in github).
#
#	fb-install-tools - ONLY NEEDS TO BE DONE ONCE PER MACHINE
#			   MUST BE DONE "sudo" because it installs globally
#			   Rerun the command (sudo) ti update the tools
#			   NOTE - running this command in an emacs buffer is
#				pretty ugly because of the color/cursor control
#				that the install script uses.
#
#	fb-login - simple/stupid target to login to firebase. YOU ONY NEED TO DO
#			this once. It is here to remind you what you need to do.
#			firebase-tools must be installed for this to work.
#			This command uses the --no-localhost options of login
#			so it doesn't try to launch a browser. You can, instead,
#			copy the link generated and put it into the browser yourself.
#
#	fb-logout - another simple/stupid target to log OUT of firebase.
#			firebase-tools must be installed for this to work.
#
#	fb-init - initialize firebase for this website. This short-circuits
#			the process a bit, instead of running "firebase init"
#			it configures the configuration files directly.
#

.firebaserc: firebaserc-template
	cp firebaserc-template $@

firebase.json: firebasejson-template
	cp firebasejson-template $@

fb-install-tools:
	sudo npm install -g firebase-tools

fb-login:
	firebase login --no-localhost

fb-logout:
	firebase logout

fb-init: .firebaserc firebase.json

fb-deploy:
	firebase deploy

clean: 
	rm -fr node_modules
	rm -fr firebase.json .firebaserc
	rm -fr .firebase
	rm -fr deployment
	rm *~

deployment:
	mkdir deployment

deploy:
	firebase deploy --only functions:statistics


combinetest:
	curl --header "Content-Type: application/json" -d '{"year":"2020","team_number":"2468","competition":"ElPaso","match":"1","record":{"panelPickupGround":[10,20,30], "panelPickupHuman":[12,23,34],"panelScoredCargoMiddle":[31,35,40],"panelScoredCargoRight":[35,37,45],"panelScoredCargoLeft":[33,45,50],"panelScoredRocketTime":[1,2,3],"averageHAB3Assists":[2,3,4], "averageHAB2Assists":[3,4,5],"averageHAB1Assists":[4,5,6]}}' -XPOST  https://nasa.chapresearch.com/catcher

combinetest2:
	curl --header "Content-Type: application/json" -d @combineTest.json -XPOST  https://nasa.chapresearch.com/catcher

weightTest:
	curl --header "Content-Type: application/json" -d @weightTest.json -XPOST  https://nasa.chapresearch.com/catcher

sumtest2:
	curl --header "Content-Type: application/json" -d '{"password":"floopy","year":"2019","team_number":"5628","competition":"ElPaso","match":"1","record":{"one":"47","two":"2","three":"3"}}' -X POST  https://us-central1-nasa-7a363.cloudfunctions.net/catcher

sumPanelRocket:
	curl --header "Content-Type: application/json" -d '{"password":"floopy","year":"2019","team_number":"5628","competition":"ElPaso","match":"1","record":{"panelScoredRocketLvl1":"2", "panelScoredRocketLvl2":"1", "panelScoredRocketLvl3":"1"}}' -X POST  https://us-central1-nasa-7a363.cloudfunctions.net/catcher

countCargoRocket:
	curl --header "Content-Type: application/json" -d '{"password":"floopy","year":"2019","team_number":"5628","competition":"ElPaso","match":"1","record":{"cargoScoredRocketLvl1":["100","150","200"]}}' -X POST  https://us-central1-nasa-7a363.cloudfunctions.net/catcher

