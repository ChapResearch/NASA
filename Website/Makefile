#
# NASA Website Makefile
#

ROOT = ..
FBCONFIG = $(ROOT)/FirebaseConfig
DEPLOYDIR = deployment

# Hidden URL for running Fixit stuff
HIDDENURL = ThisIsAScoutingApp

# FMS testing URL
FMSTESTURL = FMSTEST

.firebaserc: $(FBCONFIG)/firebaserc-template
	cp $(FBCONFIG)/firebaserc-template $@

Statistics/firebaseInit.js:
	gpg -d ../FirebaseConfig/firebaseInit.js.gpg > $@

firebase.json: firebasejson-template
	cp firebasejson-template $@

favicon.ico: nasa-birdy-logo.ico
	cp nasa-birdy-logo.ico favicon.ico
	cp nasa-birdy-logo.ico Contributor/favicon.ico
	cp nasa-birdy-logo.ico Statistics/favicon.ico
	cp nasa-birdy-logo.ico Tools/favicon.ico

clean:
	rm -fr Contributor/index.html
	rm -fr node_modules
	rm -fr firebase.json .firebaserc
	rm -fr .firebase
	rm -fr $(DEPLOYDIR)
	rm -fr *~

$(DEPLOYDIR):
	[ -d $(DEPLOYDIR) ] || mkdir $(DEPLOYDIR)

deploycopy: $(DEPLOYDIR) Statistics/firebaseInit.js favicon.ico 
	cp -R Main/* $(DEPLOYDIR)
	cp -RP Contributor $(DEPLOYDIR)
	cp -R Statistics $(DEPLOYDIR)
	cp -R Tools $(DEPLOYDIR)
	cp -R Fixit $(DEPLOYDIR)
	rm -fr $(DEPLOYDIR)/$(HIDDENURL)
	mv $(DEPLOYDIR)/Fixit $(DEPLOYDIR)/$(HIDDENURL)
	cp -R FMS $(DEPLOYDIR)
	rm -fr $(DEPLOYDIR)/$(FMSTESTURL)
	mv $(DEPLOYDIR)/FMS $(DEPLOYDIR)/$(FMSTESTURL)
	[ -d $(DEPLOYDIR)/Season ] || mkdir $(DEPLOYDIR)/Season
	cp -R Contributor/Season/* $(DEPLOYDIR)/Season
	cp favicon.ico $(DEPLOYDIR)

index:
	[ -f Contributor/index.html ] || cp Contributor/index-template Contributor/index.html

index-cached:
	[ -f Contributor/index.html ] || cp Contributor/index-cached-template Contributor/index.html

deploy:	.firebaserc firebase.json index deploycopy
	firebase deploy --only hosting

deploy-cached:	.firebaserc firebase.json index-cached deploycopy
	firebase deploy --only hosting

#######
# TEST FUNCTIONS
#
#    Use these targets to do testing of the contributor (and other web things) locally.
#    You can start up a local server if you want, but I just use the google app for
#    a local web server.
#
#    These things work by reassigning the DEPLOYDIR to somewhere else.
#    When I'm working (EJR) I have a shared folder between my virtual
#    machine and the HOST OS on my Windows box. Then I run Chrome on the
#    Windows side, since it has access to the laptop's BLE.  I run the
#    web server on Chrome, pointing to the HOST side of the TESTDEPLOYDIR.
#
#      testXML - target to set up the test XML (copies it to season.XML)
#      testdeploy - sets up the local folder for working
#      testclean - just cleans up, like a normal clean would do but in
#                   the TESTDEPLOYDIR
#      localserver - use this target to start-up a local server on THIS machine
#                    (or virtual machine in my case). I don't normally do this
#                    because the virtual machine isn't appropriately set-up to
#                    access BLE - and I don't WANT to set it up, because I'd
#                    have to shift back and forth a lot.

TESTDEPLOYDIR = /media/sf_Virtual_Machine_Shares/deployment

testXML:
	cp test.xml $(DEPLOYDIR)/season.xml

testdeploy: DEPLOYDIR = $(TESTDEPLOYDIR)
testdeploy: $(DEPLOYDIR) .firebaserc firebase.json season.xml season.json seasonfiles index deploycopy

testclean: DEPLOYDIR = $(TESTDEPLOYDIR)
testclean: clean

season.xml:
	curl -L https://nasa.chapresearch.com/season.xml > season.xml

season.json:
	curl -L https://nasa.chapresearch.com/season.json > season.json

seasonfiles: season.xml season.json
	cp $^ $(DEPLOYDIR)

localserver:
	cd $(DEPLOYDIR); python -m SimpleHTTPServer

generatejson:
	@tmpid=$$$$; \
		echo "using temp file temp$$tmpid.xml"; \
		gsutil cp season.xml gs://nasa-7a363.appspot.com/NASA/Season/temp$$tmpid.xml; \
		while : ; do \
			echo trying...; \
			gsutil ls gs://nasa-7a363.appspot.com/NASA/Season | grep temp$$tmpid.json > /dev/null && break; \
			sleep 1; \
		done; \
		gsutil cp gs://nasa-7a363.appspot.com/NASA/Season/temp$$tmpid.json season.json; \
		gsutil rm gs://nasa-7a363.appspot.com/NASA/Season/temp$$tmpid.json; \
		gsutil rm gs://nasa-7a363.appspot.com/NASA/Season/temp$$tmpid.xml;




#
# a few firebase tools in case you forgot how to run firebase
#
fb-install-tools:
	sudo npm install -g firebase-tools

fb-login:
	firebase login --no-localhost

fb-logout:
	firebase logout

fb-init: .firebaserc firebase.json

fb-deploy:
	firebase deploy --only hosting
