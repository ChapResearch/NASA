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

ROOT = ..
FBCONFIG = $(ROOT)/FirebaseConfig
DEPLOYDIR = deployment
#DEPLOYDIR = /media/sf_Virtual_Machine_Shares/deployment

# Hidden URL for running Fixit stuff
HIDDENURL = ThisIsAScoutingApp

# FMS testing URL
FMSTESTURL = FMSTEST

.firebaserc: $(FBCONFIG)/firebaserc-template
	cp $(FBCONFIG)/firebaserc-template $@

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
	firebase deploy --only hosting

favicon.ico: nasa-birdy-logo.ico
	cp nasa-birdy-logo.ico favicon.ico
	cp nasa-birdy-logo.ico Contributor/favicon.ico
	cp nasa-birdy-logo.ico Statistics/favicon.ico
	cp nasa-birdy-logo.ico Tools/favicon.ico

clean: 
	rm -fr node_modules
	rm -fr firebase.json .firebaserc
	rm -fr .firebase
	rm -fr deployment
	rm *~

$(DEPLOYDIR):
	mkdir $(DEPLOYDIR)

deploycopy: $(DEPLOYDIR) favicon.ico 
	cp -R Main/* $(DEPLOYDIR)
	cp -R Contributor $(DEPLOYDIR)
	cp -R Statistics $(DEPLOYDIR)
	cp -R Tools $(DEPLOYDIR)
	cp -R Fixit $(DEPLOYDIR)
	rm -fr $(DEPLOYDIR)/$(HIDDENURL)
	mv $(DEPLOYDIR)/Fixit $(DEPLOYDIR)/$(HIDDENURL)
	cp -R FMS $(DEPLOYDIR)
	rm -fr $(DEPLOYDIR)/$(FMSTESTURL)
	mv $(DEPLOYDIR)/FMS $(DEPLOYDIR)/$(FMSTESTURL)
	[ -d $(DEPLOYDIR)/Season ] || mkdir $(DEPLOYDIR)/Season
	cp -R ../Season/*.xml $(DEPLOYDIR)
	cp -R Contributor/Season/* $(DEPLOYDIR)/Season
	cp favicon.ico $(DEPLOYDIR)

deploy:	.firebaserc firebase.json deploycopy
	firebase deploy --only hosting

testdeploy: deploycopy
	rm $(DEPLOYDIR)/Contributor/contributor.appcache
	cp ../Season/DeepSpace2019.xml $(DEPLOYDIR)/season.xml
	curl -L https://nasa.chapresearch.com/season.json > $(DEPLOYDIR)/season.json
	cd $(DEPLOYDIR); python -m SimpleHTTPServer

refresh:
