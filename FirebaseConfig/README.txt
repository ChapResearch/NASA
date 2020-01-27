The files in this directory are used to configure firebase for development
and deployment. Makefiles throughout this system refer to these files to
configure local copies for deployment.

------------------------------------------------------------------------
FIREBASE PROJECT CONFIG

For example, the ".firebaserc" file names the particular project that all
of these deployment routines use.  The firebaserc-template can be copied
to .firebaserc to instantly configure for deployment.

------------------------------------------------------------------------
FIREBASE API KEY FILE

Access to firebase on Google requires the use of an API key (apiKey).
That key must be deployed along with the functions/files for the system
to work. However, that apiKey should NOT be placed on github in clear
text (BTW - it HAS been up there unfortunately, but has been fixed).

So this directory includes an encrypted version of the apiKey along with
the firebase initialization code.  All functions must make use of this
file when doing a deployment.  Each Makefile deals with this.

The file is called firebaseInit.js and its encrypted version is
firebaseInit.js.gpg. The linux command used for encryption/decryption is
"gpg" which is normally installed on all Linux boxes. If not, do an
"apt-get install gnupg" or your platform's equivalent.

If you need to change the file, you'll need to decrypt it, edit it, the
re-encrypt it.  The Makefile in this directory has those commands in it.

Note that .gitignore is instructed to IGNORE ALL firebaseInit.js files.
In this way, you won't be tempted to push them up to github.
