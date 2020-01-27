#
# Note that the attachments from URLs to these functions is done
#   in the ../Website/firebasejson-template.  The connections as of this
#   writing ** Mon Jan 13 18:32:52 2020 ** are:
#
#     catcher => catcher()
#

FUNCTIONS := catcher

# this variable gets set to the list of functions each prefaced by "functions:"
#   and separated by commas - this involves replacing the spaces with commas
#   forgive the ugly code, but that's how you can define spaces and commas in make

space := $() $()
comma := ,
FUNCTIONONLY := $(subst $(space),$(comma),$(patsubst %,functions:%,$(FUNCTIONS)))

NPM_PACKAGES = firebase firebase-admin firebase-functions

functions/package.json:
	cp functions/packagejson-template $@

# the ending touch is necessary because package.json gets updated
#   by the npm when creating the node_modules directory
functions/node_modules: functions/package.json
	cd functions; npm install $(NPM_PACKAGES) --save
	touch $@

functions/seasonFile.js:
	cp ../Season/$@ $@

functions/firebaseInit.js:
	gpg -d ../FirebaseConfig/firebaseInit.js.gpg > $@

.firebaserc:
	cp ../FirebaseConfig/firebaserc-template $@

build: functions/node_modules functions/package.json functions/seasonFile.js functions/firebaseInit.js .firebaserc

deploy:	build
	cd functions; firebase deploy --only $(FUNCTIONONLY)

clean:	
	rm -fr functions/node_modules
	rm -fr functions/package.json
	rm -fr functions/seasonFile.js
	rm -fr functions/firebaseInit.js
	rm -fr .firebaserc

#
# Simple catcher tests go here.  Note that the URL being used is nasa.charpresearch.com one, meaning that
#   the url must be set-up prior to this running (it always is)

test1:
	curl --header "Content-Type: application/json" -X POST \
            -d '{"year":"2119","team_number":"5628","competition":"ElPaso","match":"1","record":{"one":"47","two":"2","three":"3"}}' \
		https://nasa.chapresearch.com/catcher
