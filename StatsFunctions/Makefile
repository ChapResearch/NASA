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
#   BIG NOTE - this makefile copies the seasonFile.js from the Season directory
#              above this one, so it can be deployed easily (don't know how to
#              do it any better way unfortunately ** Sat Jan 18 14:57:48 2020 **
#              EJR


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

functions/package.json:
	cp functions/packagejson-template $@

# the ending touch is necessary because package.json gets updated
#   by the npm when creating the node_modules directory (go figure)
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
# remove the functions that may have been deployed for tests
#
remove-tests:
	firebase functions:delete test2 test3

#
# TESTS TESTS TESTS
#
#   These are tests that were useful at one point.  There are here to serve as examples.
#

#
# XML Test functions - there is a "test" xml that resides in this directory.  When using it, these
#     tests are appropriately configured to have the right "stuff" in them for testing.  Most of these
#     tests generate a match with a match number that is the PID of the sub-shell...for a bit of
#     "randomness" (ish).

TESTYEAR := 2119
TESTTEAM := 5628
TESTCOMP := ElPaso

test1:
	@MATCH=$$$$; \
	EVENT1=`rand -M 180 -u -N 10 -s 1| tr " " "\n" | sort -n | tr "\n" "," | sed -e 's/,$$/\n/' | sed -e 's/\([0-9][0-9]*\)/"&"/g'`; \
	EVENT2=`rand -M 180 -u -N 10 -s 2| tr " " "\n" | sort -n | tr "\n" "," | sed -e 's/,$$/\n/' | sed -e 's/\([0-9][0-9]*\)/"&"/g'`; \
	curl --header "Content-Type: application/json" -X POST \
            -d '{"year":"$(TESTYEAR)","team_number":"$(TESTTEAM)","competition":"$(TESTCOMP)","match":"'$$MATCH'","record":{"one":"47","two":"2","team":"'$$MATCH'","event1":['$$EVENT1'],"event2":['$$EVENT2']}}' \
		https://nasa.chapresearch.com/catcher; \
	    echo "Match number is $$MATCH"


newtest:

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

divideTest:
	curl --header "Content-Type: application/json" -d '{"password":"floopy","year":"2025","team_number":"5628","competition":"ElPaso","match":"5","record":{"one":"4","two":"2"}}' -X POST  https://us-central1-nasa-7a363.cloudfunctions.net/catcher

divideTest2:
	curl --header "Content-Type: application/json" -d '{"password":"floopy","year":"2025","team_number":"5628","competition":"ElPaso","match":"4","record":{"one":"3","two":"2"}}' -X POST  https://us-central1-nasa-7a363.cloudfunctions.net/catcher
