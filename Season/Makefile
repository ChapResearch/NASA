#
# Note that the attachments from URLs to these functions is done
#   in the ../Website/firebasejson-template.  The connections as of this
#   writing ** Mon Jan 13 18:32:52 2020 ** are:
#
#     season.xml => season()
#     season.json => seasonJSON()
#     validate => seasonXMLvalidate()
#
#   The function seasonJSONgenerate() is programmed to run whenever a new
#   XML file is found in the target dir.
#

FUNCTIONS := seasonJSONgenerate seasonJSON season seasonXMLvalidate

# this variable gets set to the list of functions each prefaced by "functions:"
#   and separated by commas - this involves replacing the spaces with commas
#   forgive the ugly code, but that's how you can define spaces and commas in make

space := $() $()
comma := ,
FUNCTIONONLY := $(subst $(space),$(comma),$(patsubst %,functions:%,$(FUNCTIONS)))

#
# NPM NOTES
#   - in this version "request" was replaced with node-fetch
#   - node-fetch has been updated to ESM-only, so we have to use version 2
#   - firebase is at v9, but that is ESM too, so we need to do v8
#
NPM_PACKAGES = firebase@8 firebase-admin firebase-functions node-fetch@2 \
               xml2js xhr2 toposort busboy

functions/package.json:
	cp functions/packagejson-template $@

# the ending touch is necessary because package.json gets updated
#   by the npm when creating the node_modules directory
functions/node_modules: functions/package.json
	cd functions; npm install $(NPM_PACKAGES) --save
	touch $@

functions/firebaseInit.js:
	gpg -d ../FirebaseConfig/firebaseInit.js.gpg > $@

.firebaserc:
	cp ../FirebaseConfig/firebaserc-template $@

build: functions/node_modules functions/package.json functions/firebaseInit.js .firebaserc

deploy:	build
	cd functions; firebase deploy --only $(FUNCTIONONLY)

clean:	
	rm -fr functions/node_modules
	rm -fr functions/package.json functions/package-lock.json
	rm -fr functions/firebaseInit.js
	rm -fr .firebaserc

deploy-validate:
	cd functions; firebase deploy --only functions:seasonXMLvalidate

season:
	cd functions; firebase deploy --only functions:season

test-validate:
	curl -F 'data=@DeepSpace2019.xml' https://us-central1-nasa-7a363.cloudfunctions.net/seasonXMLvalidate
