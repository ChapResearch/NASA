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

#
# this should be called from time to time to update the firebase tools
#
fb-install-tools:
	sudo npm install firebase-functions@latest firebase-admin@latest --save
	sudo npm install -g firebase-tools

#
# this initializes the functions directory and such - but you NEED TO RUN
# this in an xterm, it wants you to use the arrow keys to select things.
#
fb-functions-init:
	firebase init functions
	(cd functions; npm install xml2js)

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
	firebase deploy --only functions:matchStats,functions:superiorStats,functions:recalculate

test:
	curl -H "Content-Type: application/json" -d @combineTest.json https://nasa.chapresearch.com/catcher

test2:
	curl -H "Content-Type: application/json" -d @combineTest2.json https://nasa.chapresearch.com/catcher
