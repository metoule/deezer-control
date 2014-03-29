#!/usr/bin/python

import argparse
import re
import sys
import os
import zipfile

# Mercurial API : http://mercurial.selenic.com/wiki/MercurialApi
from mercurial import ui, hg, commands

# Color output
class bcolors:
	BOLD = "\033[1m"
	PURPLE = '\033[95m'
	BLUE = '\033[94m'
	GREEN = '\033[92m'
	YELLOW = '\033[93m'
	RED = '\033[91m'
	ENDC = '\033[0m'

	def disable(self):
		self.BOLD = ''
		self.PURPLE = ''
		self.BLUE = ''
		self.GREEN = ''
		self.YELLOW = ''
		self.RED = ''
		self.ENDC = ''

gCommandLineParser = argparse.ArgumentParser(description='Deliver Deezer Control.')
gCommandLineParser.add_argument('version', help='version of the extension')

def addFolderToZip(zip_file, folder): 
	for file in os.listdir(folder):
		full_path = os.path.join(folder, file)
		if os.path.isfile(full_path):
			zip_file.write(full_path)
		elif os.path.isdir(full_path):
			addFolderToZip(zip_file, full_path)

if __name__ == '__main__':
	# parse command line
	aCmdLineOptions = gCommandLineParser.parse_args()
	
	print bcolors.BOLD + bcolors.BLUE + "1. Ensure there's no uncommited changes" + bcolors.ENDC
	aHgRepo = hg.repository(ui.ui(), '.')
	aHgRepoStatus = aHgRepo.status()
	
	# get repo status - returns a tuple of files modified, added, removed, deleted, unknown(?), ignored and clean in the current working directory
	aUncommitedChanges = False
	aMeaning = [ 'modified', 'added', 'removed', 'deleted', 'unknown(?)', 'ignored', 'clean' ]
	for i in range(len(aHgRepoStatus)):
		if len(aHgRepoStatus[i]) > 0:
			print bcolors.RED + "   %s files have been %s" % (len(aHgRepoStatus[i]), aMeaning[i]) + bcolors.ENDC
			aUncommitedChanges = True
	
	# are there uncommited changes ? 
	if aUncommitedChanges == True:
		sys.exit("There are uncommited changes, aborting...") 
	
	
	print bcolors.BOLD + bcolors.BLUE + "2. Replace old version by new one in manifest" + bcolors.ENDC
	aNewVersion = aCmdLineOptions.version
	
	# get old version for replace
	with open('manifest.json', 'r') as aManifestFile:
		aOldContent = aManifestFile.readlines()
		
	# write new version
	with open('manifest.json', 'w') as aManifestFile:
		for line in aOldContent:
			if 'manifest_version' not in line and 'version' in line:
				aOldVersion = re.search('\"version\"[\s]*:[\s]*\"(.*)\"', line).group(1)
				print bcolors.YELLOW + "   Replacing old version %s by new one %s" % (aOldVersion, aNewVersion) + bcolors.ENDC					
				line = line.replace(aOldVersion, aNewVersion)
			aManifestFile.write(line)
	
	# abort here so that we don't write an empty file 
	if aOldVersion == aNewVersion:
		sys.exit("New version is the same as the old one, aborting...") 
			
	# Commit new version
	print bcolors.BLUE + "3. Commit manifest.json with message 'Bumped version'" + bcolors.ENDC
	commands.commit(ui.ui(), aHgRepo, 'manifest.json', message='Bumped version')
	
	# Tag repository
	aTagName = 'DEEZER_CONTROL_%s' % aNewVersion
	print bcolors.BLUE + "4. Tag repository with name %s" % aTagName  + bcolors.ENDC
	commands.tag(ui.ui(), aHgRepo, aTagName)
	
	# Create .zip file
	aZipName = 'deezer_control_%s.zip' % aNewVersion
	print bcolors.BLUE + "5. Create delivery file %s" % aZipName  + bcolors.ENDC
	with zipfile.ZipFile(aZipName, 'w') as aMyZip:
		aMyZip.write('CHANGELOG')
		aMyZip.write('LICENSE.txt')
		aMyZip.write('manifest.json')
		for file in os.listdir('.'):
			if file.endswith('.html'):
				aMyZip.write(file)
		addFolderToZip(aMyZip, 'css')
		addFolderToZip(aMyZip, 'imgs')
		addFolderToZip(aMyZip, '_locales')
		addFolderToZip(aMyZip, 'scripts')
		
