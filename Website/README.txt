This directory includes all of the files necessary to deploy
the NASA website to Google Firebase Hosting (FBH).  It is IMPORTANT
to understand that you need to do "make deploy" get deploy
the website to FBH. That will assemble all of the files from the
subdirectories before deployment.

Directories -

	deployment - this is created by the Makefile prior to deploying to FB
	       	     hosting. It is temporary and isn't part of source code (git)

	Main - the main web site that links to everything else.

	Contributor - the directory where the contributor software is developed.
		      It is transferred to the deployment directory before deployment.

	Viewer - the end-user statistical/data viewer web software is kept here
