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

deploy:	.firebaserc firebase.json deployment
	cp -R Main/* deployment
	cp -R Contributor deployment
	cp -R ../Season deployment
	firebase deploy

refresh:
