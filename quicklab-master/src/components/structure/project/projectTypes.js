const IMPORT_FROM_URL = 'importFromURL';
const IMPORT_FROM_FILE = 'importFromFile';
const FORK_FROM_URL = 'forkFromUrl';
const EMPTY = 'emptyProject';

/**
 * Creates an object that represents a project import from the specified URL.
 */
function createProjectFromUrl(url) {
  if (typeof url !== 'string') {
    throw new TypeError();
  }
  return {
    type: IMPORT_FROM_URL,
    url,
  };
}

/**
 * Creates an object that represents a project fork from the specified URL.
 */
function createForkedProject(url, removeRemote = false) {
  if (typeof url !== 'string' || typeof removeRemote !== 'boolean') {
    throw new TypeError();
  }
  return {
    type: FORK_FROM_URL,
    url,
    removeRemote,
  };
}

/**
 * Creates an object that represents a project import that is empty.
 */
function createEmptyProject() {
  return {
    type: EMPTY,
  };
}

/**
 * Creates an object that represents a project import from a file.
 */
function createProjectFromFile(file) {
  return {
    type: IMPORT_FROM_FILE,
    file,
  };
}
/**
 * Returns the default project settings.
 */
function getDefaultSettings() {
  return {
    allowDeleteTag: false,
    memberCheck: true,
    preventSecrets: true,
    commitMessageRegex: '',
    branchNameRegex: '',
    authorEmailRegex: '',
    fileNameRegex: '',
  };
}

export {
  IMPORT_FROM_URL,
  IMPORT_FROM_FILE,
  FORK_FROM_URL,
  EMPTY,
  createProjectFromUrl,
  createForkedProject,
  createEmptyProject,
  createProjectFromFile,
  getDefaultSettings,
};
