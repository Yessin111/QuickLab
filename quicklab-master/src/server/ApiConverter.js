const fs = require('fs');
const logger = require('./logger/logger.js');
const projectTypes = require('./api/projectTypes');
const config = require('../config');

const { serverLogger } = logger;

/**
 * Async function to wait.
 *
 * @param ms {int}
 * @return {Promise}
 */
async function wait(ms) {
  serverLogger.debug(`Server is busy. Retrying in ${ms} ms.`);
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Converts a name to gitlab format.
 *
 * @param name {String}
 * @return {String}
 */
function gitLabNameConverter(name) {
  return name.replace(' ', '_');
}

/**
 * Checks if a group already exists on GitLab. If it does, skip and continue.
 * If it doesnt, create a new group with the given data. It returns the id of the
 * existing or created group.
 *
 * @param name {String}
 * @param parentID {int}
 * @param path {String}
 * @param description {String}
 * @param api {ApiCaller}
 * @return {Promise}
 */
async function createGroup(name, parentID, path, description, api) {
  const findUrl = path ? path.concat('/', name) : name;

  return new Promise(async (resolve, reject) => {
    await api.getGroup(encodeURI(findUrl))
      .then((res) => {
        serverLogger.debug(`Group already exists: name: ${name}, path: ${findUrl}`);
        resolve(res.data.id);
      })
      .catch(async (err1) => {
        if (err1.toString().includes('404')) {
          serverLogger.debug(`Group does not exist: name: ${name}, path: ${findUrl}`);

          await api.createGroup(name, parentID, description)
            .then((res) => {
              serverLogger.debug(`Created group: name: ${name}, parentID: ${parentID}`);

              resolve(res.data.id);
            }).catch((err2) => {
              serverLogger.error(`Error creating group: name: ${name}, parentID: ${parentID}`);
              serverLogger.error(`${err2.toString()}`);

              reject();
            });
        } else if (err1.toString().includes('502')) {
          await wait(2000);

          createGroup(name, parentID, path, description, api)
            .then((res) => {
              resolve(res);
            })
            .catch(() => {
              reject();
            });
        } else {
          serverLogger.error(`Error finding group: name: ${name}, path: ${findUrl}`);
          serverLogger.error(`${err1.toString()}`);

          reject();
        }
      });
  });
}

/**
 * Creates an api call for the creation of a repository.
 * @param repo {RepositoryType Object}
 * @param name {String}
 * @param parentID {int}
 * @param api {ApiCaller}
 * @return {Promise}
 */
function createProjectApiCall(repo, name, parentID, api) {
  switch (repo.type) {
    case projectTypes.IMPORT_FROM_URL:
      return api.createProjectFromUrl(name, parentID, repo.url);
    case projectTypes.FORK_FROM_URL:
      return new Promise((_, reject) => {
        // TODO: create project fork method [Issue 31]
        // apiCall = api.create_project_fork(name, parentID, repo.url, repo.removeRemote);
        reject(new Error('Unsupported operation: creating a project from a fork'));
      });
    case projectTypes.IMPORT_FROM_FILE: {
      const file = repo.file ? fs.createReadStream(repo.file) : null;
      return api.createProjectFromFile(name, parentID, file);
    }
    case projectTypes.EMPTY: default:
      return api.createEmptyProject(name, parentID);
  }
}

/**
 * Checks if a project already exists. If it does not, it creates a new project with
 * the given data and adds the settings to it. It returns the id of the project.
 *
 * @param name {String}
 * @param parentID {int}
 * @param path {String}
 * @param repo {RepositoryType Object}
 * @param defaultProjectSettings {RepositorySettings Object}
 * @param api {ApiCaller}
 * @return {int}
 */
async function createProject(name, parentID, path, repo, defaultProjectSettings, api) {
  return new Promise(async (resolve, reject) => {
    await (path ? api.getProject(name, path) : api.getProject(name))
      .then((res) => {
        serverLogger.debug(`Project already exists:  name: ${name} , path: ${path}`);

        resolve(res.data.id);
      })
      .catch(async (err1) => {
        if (err1.toString().includes('404')) {
          serverLogger.debug(`Project does not exist:  name: ${name} , path: ${path}`);

          await createProjectApiCall(repo, name, parentID, api)
            .then(async (res) => {
              serverLogger.debug(`Created project: name: ${name}, parentID: ${parentID}.`);

              const pushRules = {
                deny_delete_tag: !defaultProjectSettings.allowDeleteTag,
                member_check: defaultProjectSettings.memberCheck,
                prevent_secrets: defaultProjectSettings.preventSecrets,
                commit_message_regex: defaultProjectSettings.commitMessageRegex,
                branch_name_regex: defaultProjectSettings.branchNameRegex,
                author_email_regex: defaultProjectSettings.authorEmailRegex,
                file_name_regex: defaultProjectSettings.fileNameRegex,
                max_file_size: defaultProjectSettings.maxFileSize,
              };

              await api.addProjectPushRule(res.data.id, pushRules)
                .then((result) => {
                  serverLogger.debug('Added pushrules Project.', result);
                })
                .catch((err2) => {
                  if (err2.toString().includes('404')) {
                    serverLogger.error('Upgrade your GitLab license to add push rules');
                  }
                });

              resolve(res.data.id);
            })
            .catch((err) => {
              serverLogger.error(`Error creating project: name: ${name}, parentID: ${parentID}`);
              serverLogger.error(`${err.toString()}`);

              reject();
            });
        } else if (err1.toString().includes('502')) {
          await wait(2000);

          await createProject(name, parentID, path, repo, defaultProjectSettings, api)
            .then((res) => {
              resolve(res);
            })
            .catch(() => {
              reject();
            });
        } else {
          serverLogger.error(`Error finding project: name: ${name}, path: ${path}`);
          serverLogger.error(`${err1.toString()}`);

          reject();
        }
      });
  });
}

/**
 * Searches a user by username and then by email if it is not found yet.
 * If it is not found after that it will create that user with the given data.
 *
 * @param email {String}
 * @param name {String}
 * @param username {String}
 * @param pwdreset {Boolean}
 * @param api {ApiCaller}
 * @return {int}
 */
async function createUser(email, name, username, pwdreset, api) {
  let ret = -1;
  let callErr;

  await api.getUserByUsername(username).then((res) => {
    if (res.data.length === 0) {
      ret = 0;
    } else {
      serverLogger.debug(`User with username(${username}) already exists: ${name}`);
      ret = res.data[0].id;
    }
  }).catch((err) => {
    if (err.toString().includes('404')) {
      serverLogger.debug(`User does not exist: ${name}`);
      ret = 0;
    } else if (err.toString().includes('502')) {
      callErr = -2;
    } else {
      serverLogger.error(`Error finding user: name: ${name}, username: ${username}, email: ${email}`);
      serverLogger.error(`${err.toString()}`);
      ret = -1;
    }
  });

  if (ret === 0 && !callErr) {
    await api.getUserByEmail(email).then((res) => {
      if (res.data.length === 0) {
        ret = 0;
      } else {
        serverLogger.debug(`User with email(${email}) already exists: ${name}`);
        ret = res.data[0].id;
      }
    }).catch((err) => {
      if (err.toString().includes('404')) {
        serverLogger.debug(`User does not exist: ${name}`);
        ret = 0;
      } else if (err.toString().includes('502')) {
        callErr = -2;
      } else {
        serverLogger.error(`Error finding user: name: ${name}, username: ${username}, email: ${email}`);
        serverLogger.error(`${err.toString()}`);
        ret = -1;
      }
    });
  }


  if (callErr === -2) {
    await wait(2000);
    return createUser(email, name, username, pwdreset, api);
  }
  if (ret !== 0 && !callErr) {
    return ret;
  }

  await api.createUser(email, name, username, pwdreset).then((res) => {
    serverLogger.debug('Created User.');
    ret = res.data.id;
  }).catch((err) => {
    if (err.toString().includes('409')) {
      serverLogger.debug(`Creating User: name: ${name}, email: ${email}, username: ${username} already exists`);
      callErr = -2;
    } else if (err.toString().includes('502')) {
      callErr = -2;
    } else {
      serverLogger.error(`Error creating user: name: ${name}, username: ${username}, email: ${email}`);
      serverLogger.error(`${err.toString()}`);
      ret = -1;
    }
  });
  if (callErr === -2) {
    await wait(2000);

    return createUser(email, name, username, pwdreset, api);
  }
  return ret;
}

/**
 * Adds a user to a group.
 *
 * @param parentType {String}
 * @param parentID {int}
 * @param userId {int}
 * @param accessLevel {int}
 * @param api {ApiCaller}
 * @return {<Void>}
 */
async function addUserToGroup(parentType, parentID, userId, accessLevel, api) {
  await api.addUser(parentType, parentID, userId, accessLevel).then(() => {
    serverLogger.debug(`Added: ${userId} to ${parentID}`);
  }).catch(async (err) => {
    if (err.toString().includes('409')) {
      serverLogger.debug(`Member ${userId} already exist in ${parentType}: ${parentID}`);
    } else if (err.toString().includes('502')) {
      await wait(2000);
      await addUserToGroup(parentType, parentID, userId, accessLevel, api);
    } else {
      serverLogger.error(`Error adding user(${userId}) to ${parentType}(${parentID})`);
      serverLogger.error(`${err.toString()}`);
    }
  });
}

/**
 * Converts data from the client to apiCalls to write it to GitLab.
 *
 * @param data {Object}
 * @param api {ApiCaller}
 * @param parentID {int}
 * @param parentType {String}
 * @param path {String}
 * @param repo {RepositoryType}
 * @param defSettings {RepositorySettings}
 * @return {String}
 */
async function convertToApiCall(data, api, parentID = null, parentType = null, path = '', repo = null, defSettings = {}) {
  let { id, name: description } = data;
  if (!description) {
    description = '';
  }
  const { children } = data;
  id = gitLabNameConverter(id);
  let nextParentID = -1;

  switch (data.type) {
    case 'group': {
      await createGroup(id, parentID, path, description, api)
        .then((res) => {
          nextParentID = res;
        })
        .catch(() => {
          nextParentID = -1;
        });
      break;
    }
    case 'project': {
      await createProject(id, parentID, path, repo, defSettings, api)
        .then((res) => {
          nextParentID = res;
        })
        .catch(() => {
          nextParentID = -1;
        });
      break;
    }
    case 'user': {
      const username = data.username.replace(/#|@/g, '');
      const userId = await createUser(data.email, data.name, username, config.pwdResetMail, api);
      const subtype = data.subtype ? data.subtype : 'student';
      let rights = 20;
      if (subtype === 'head_ta') {
        rights = 50;
      } else if (subtype === 'ta') {
        rights = 40;
      } else if (subtype === 'student') {
        rights = 30;
      } else {
        serverLogger.debug(`ConvertToApiCall, user with unrecognized subtype: ${JSON.stringify(data)}`);
      }
      await addUserToGroup(parentType, parentID, userId, rights, api);
      return '';
    }
    default: {
      return '';
    }
  }
  serverLogger.debug(`${id}: ${nextParentID}`);
  if (nextParentID === -1) {
    return '';
  }
  let nextPath;
  if (path === '') {
    nextPath = id;
  } else {
    nextPath = `${path}/${id}`;
  }
  const promises = Object.keys(children).map(
    key => convertToApiCall(
      children[key],
      api,
      nextParentID,
      data.type,
      nextPath,
      repo,
      defSettings,
    ),
  );
  await Promise.all(promises);
  if (parentID === null && parentType === '' && path === '') {
    const edition = children.length > 0 && children[0];
    if (edition && edition.id) {
      return `${api.hostname}/${nextPath}/${edition.id}`;
    }
    return `${api.hostname}/${nextPath}`;
  }

  return '';
}

exports.convertToApiCall = convertToApiCall;
