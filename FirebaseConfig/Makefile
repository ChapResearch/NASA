#
# This makefile is ONLY USED when wanting to edit the firebaseInit.js
# file.
#

decrypt:
	gpg -d firebaseInit.js.gpg > firebaseInit.js

#
# Encryption will ask you for a passphrase/password to do the encryption.
# This passphrase will be, by default, stored in your Linux "keyring" so
# you won't have to supply next time.  This can be a little disconcerting,
# because you won't be asked for the password, but it will work. HOWEVER,
# since the file is decrypted numerous times duing the build process, it
# is VERY nice that you don't have to continue to whack in the password.

encrypt:
	gpg -c firebaseInit.js

#
# If you want to clear the cache of passwords, rebooting won't work. You
# have to tell the password agent to reload.  Use this target to do it.
#
clearPassphrase:
	gpg-connect-agent reloadagent /bye

clean:
	rm -f firebaseInit.js
	rm -f *~

