** Wed Dec 29 17:01:20 2021 **

After 2.5 years, we picked up this project again!  In the mean time,
many things had happened and we had to make quite a few changes.  In
order:

- many functions were using node 8, which was deprecated in firebase.
  Some were using node 6, which was terminated. So we had to fix it.
  We bumped up the "engines" to 12 (packagejson-template).  This,
  though, was not easy.  But, really, the most difficult things were
  not due to this switch, but to the evolution of firebase.

- a couple of the node modules we used were no longer supported:

  - request - development/update on this was terminated, so we *could*
    try to keep using them, but instead, we switch.  We moved to
    node-fetch, BUT ONLY version 2 of node-fetch, because version 3
    was ESM-only.  This caused a few changes inside the functions
    where URL fetching was done.

  - xml2js-promise - we were using a promise layer on top of the XML
    parser (xml2js). But with the evolution of that parser, we no
    longer had to wrap a promise layer around it, it was available
    within the package itself.  Though we had to change a couple of
    things to make it work.

- the "npm busboy" module changed just a bit, there is no longer a
  constructor used, it is just called directly.

- firebase evolved around us, causing a WEALTH of problems.  We'll
  cover each one separately.

- The firebase version we were using before was firebase v8. However,
  whenever we "npm installed" firebase, it gave us the latest
  version. So the biggest piece of magic to make thing works was to
  "npm install" the appropriate version of firebase (v8) by changing
  the Makefile to reference "firebase@8".  That solved a BUNCH of
  problems!

- Firebase integration into Google Cloud messed up a lot of things
  too, but mostly permissions:

  - Cloud Functions - firebase functions (aka Cloud Functions) had to
    have permission to run by anyone, which means that we had to go to
    the Google Cloud Console, and add the permission for allUsers:
    	   -> Google Cloud Console
	   -> Functions
	   -> check off functions to be changed
	   -> click on Permissions on one of those
	   -> ADD Principal - "allUsers" -> Cloud Functions Invoker
    This was necessary because the web site rewrite rules redirected
    access to things like "season.xml" to a function.  But normal
    users wouldn't have the ability to run that function, without the
    change above.

  - Cloud Storage - firebase storage is really a layer on top of cloud
    storage, so there were changes made to cloud storage permissions:
    	- switched to "Uniform" for permissions - as opposed to ACL
	- added permission for "allUsers" -> Storage Object viewer for
	  the base bucket for storage (much like the functions example
          above)

  - Firebase Storage Rules - the rules for accessing firebase storage
    changed to include two things:
        - read was turned on for everything/everyone - as opposed to just
	  authenticated users.
	- write was turned on for /NASA/Season/*.json for everyone.
	  This allows the functions to automatically compose the JSON
	  file for the uploaded XML file.

  - the problem with storage, relative to firebase functions, appears
    to be that the functions run as a particular "user" but that user
    doesn't have the appropriate permission OR the access rules need
    to be changed to allow that "user" to access things.  I didn't
    have the time to figured all of that out.
