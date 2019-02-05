#
# 


NPM_PACKAGES = firebase firebase-admin request request-promise \
               xml2js xml2js-es6-promise xhr2 toposort

package-install:
	cd functions; npm install $(NPM_PACKAGES) --save

deploy:
	cd functions; firebase deploy --only functions:seasonJSONgenerate,functions:seasonJSON,functions:season

