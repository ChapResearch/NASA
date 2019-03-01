#
# 


NPM_PACKAGES = firebase firebase-admin request request-promise \
               xml2js xml2js-es6-promise xhr2 toposort busboy

package-install:
	cd functions; npm install $(NPM_PACKAGES) --save

deploy:
	cd functions; firebase deploy --only functions:seasonJSONgenerate,functions:seasonJSON,functions:season,functions:seasonXMLvalidate

deploy-validate:
	cd functions; firebase deploy --only functions:seasonXMLvalidate

test-validate:
	curl -F 'data=@DeepSpace2019.xml' https://us-central1-nasa-7a363.cloudfunctions.net/seasonXMLvalidate



