#
# Note that the attachments from URLs to these functions is done
#   in the ../Website/firebasejson-template.  The connections as of this
#   writing ** Mon Jan 13 18:32:52 2020 ** are:
#
#     recalculate => recalculate()
#     superior => superiorStats()
#
#   The matchStats() function is connected to a change in the database, getting
#   kicked off when a new match result is written.
#

FUNCTIONS := superiorStats matchStats recalculate

# this variable gets set to the list of functions each prefaced by "functions:"
#   and separated by commas - this involves replacing the spaces with commas
#   forgive the ugly code, but that's how you can define spaces and commas in make

space := $() $()
comma := ,
FUNCTIONONLY := $(subst $(space),$(comma),$(patsubst %,functions:%,$(FUNCTIONS)))

NPM_PACKAGES = firebase firebase-admin firebase-functions \
		request request-promise \
                xml2js xml2js-es6-promise xhr2 toposort

deploy:	node
	cd functions; firebase deploy --only $(FUNCTIONONLY)

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

#
# TESTS TESTS TESTS
#
#   These are tests that were useful at one point.  There are here to serve as examples.
#

test:
	curl -H "Content-Type: application/json" -d @combineTest.json https://nasa.chapresearch.com/catcher

test2:
	curl -H "Content-Type: application/json" -d @combineTest2.json https://nasa.chapresearch.com/catcher

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
