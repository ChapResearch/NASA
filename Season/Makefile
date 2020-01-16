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

NPM_PACKAGES = firebase firebase-admin firebase-functions request request-promise \
               xml2js xml2js-es6-promise xhr2 toposort busboy

deploy:	node
	cd functions; firebase deploy --only $(FUNCTIONONLY)

deploy-validate:
	cd functions; firebase deploy --only functions:seasonXMLvalidate

test-validate:
	curl -F 'data=@DeepSpace2019.xml' https://us-central1-nasa-7a363.cloudfunctions.net/seasonXMLvalidate

clean:	
	rm -fr functions/node_modules
	rm -fr functions/package.json

#
# checks to see if the node_modules are there, and will install them if not
# Note that this causes the package.json file to be built too
#

node: 
	[ -d functions/node_modules ] || (cd functions; \
						cp packagejson-template package.json; \
						npm install $(NPM_PACKAGES) --save)
