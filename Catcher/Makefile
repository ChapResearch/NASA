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

deploy:	node
	cd functions; firebase deploy --only $(FUNCTIONONLY)

clean:	
	rm -fr functions/node_modules
	rm -fr functions/package.json
	rm -fr .firebaserc

#
# checks to see if the node_modules are there, and will install them if not
# Note that this causes the package.json file to be built too
#

node: 
	[ -d functions/node_modules ] || (cp ../FirebaseConfig/firebaserc-template .firebaserc; \
						cd functions; \
						cp packagejson-template package.json; \
						npm install $(NPM_PACKAGES) --save)
