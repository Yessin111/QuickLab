const axios = require('axios');
const util = require('util');

const Form = require('form-data');
const config = require('../../config');

const { api: credentials } = config;

const defaultProjectSettings = {
  jobs_enabled: false,
};
/**
   * Returns the input string, prefixed with a '/' character if it wasn't already.
   *
   * @param url { string } where a slash needs to be prefixed.
   *
   * @returns {string|*}
   */
function slashPrefd(url) {
  if (url.charAt(0) === '/') return url;
  return `/${url}`;
}

function getHostName() {
  return credentials.hostname;
}

module.exports = class ApiCaller {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.hostname = getHostName();
  }

  /**
     * Performs a http request (using axios).
     *
     * @param method { string } the method (GET, POST, etc..).
     * @param url { string } relative url (for example: /projects).
     * @param headers { object } object containing all http headers.
     * @param params { object } containing all (url) parameters.
     * @param data { object } object containing data (for post and put methods).
     *
     * @returns {Promise<any>}
     */
  call(method, url, headers = {}, params = {}, data = {}) {
    const fullURL = `${getHostName()}/api/v4${slashPrefd(url)}`;
    if (config.verbose) process.stdout.write(`[API Info]: ${method.toUpperCase()} ${fullURL}\n`);
    return new Promise((resolve, reject) => {
      // Send axios request
      const req = {
        method: method.toLowerCase(),
        url: fullURL,
        headers: {
          'Private-Token': this.apiKey,
          'Content-Type': 'application/json',
          ...headers,
        },
        params,
        data,
      };
      if (config.verbose) process.stdout.write(`[API Info]: headers: ${util.inspect(req.headers)}\n`);
      if (config.verbose) process.stdout.write(`[API Info]: params: ${util.inspect(req.params)}\n`);
      if (config.verbose) process.stdout.write(`[API Info]: data: ${util.inspect(req.data)}\n`);
      axios(req)
        .then((result) => {
          if (config.verbose) process.stdout.write(`[API Info]: Request returned code ${util.inspect(result.status)}: ${util.inspect(result.statusText)}\n`);
          resolve(result);
        })
        .catch((error) => {
          if (config.verbose) process.stderr.write(`[API Error]: Request returned code ${util.inspect(error.status)}: ${util.inspect(error.statusText)}\n`);
          reject(error);
        });
    });
  }

  /** =================== PROJECTS (repos) ===================== */

  /**
     * Get all projects in a certain namespace.
     *
     * @param id { int } id of the group we want the projects of,
     *                if left empty this is the users namespace.
     *
     * @returns {*|Promise<any>}
     */
  getProjects(id = -1) {
    if (id === -1) {
      return this.call('get', `/users/${'root'}/projects`);
    }
    return this.call('get', `groups/${encodeURIComponent(id)}/projects`);
  }

  getAllProjects() {
    return this.call('get', '/projects');
  }

  getProject(id, namespace = credentials.namespace) {
    return this.call('get', `/projects/${encodeURIComponent(namespace)}%2F${id}`);
  }

  createEmptyProject(name, parentID = -1) {
    if (parentID === -1) {
      return this.call('post', '/projects', {}, {}, { name, ...defaultProjectSettings });
    }
    return this.call('post', '/projects', {}, {}, {
      name, path: name, namespace_id: parentID, ...defaultProjectSettings,
    });
  }

  /**
   * Creates a project from a url in the specified parent.
   * @param {string} name the name of the project.
   * @param {id} parentID id of the group we want the project in.
   * @param {string} url the url from which the project will be cloned.
   */
  createProjectFromUrl(name, parentID = -1, url = null) {
    if (!url) {
      return this.createEmptyProject(name, parentID);
    }

    if (parentID === -1) {
      return this.call('post', '/projects', {}, {}, { name, import_url: url });
    }
    return this.call('post', '/projects', {}, {}, {
      name, path: name, namespace_id: parentID, import_url: url,
    });
  }

  /**
   * Creates a project from a template file in the specified parent.
   * @param {string} name the name of the project.
   * @param {id} parentID id of the group we want the project in.
   * @param {file} file the file from which the project will be initialised.
   */
  createProjectFromFile(name, parentID = -1, file = null) {
    if (!file) {
      return this.createEmptyProject(name, parentID);
    }

    const form = new Form();
    form.append('path', name);
    form.append('overwrite', 'true');
    form.append('file', file);

    if (parentID === -1) {
      return this.call('post', '/projects/import', form.getHeaders(), {}, form);
    }
    form.append('namespace', parentID);
    return this.call('post', '/projects/import', form.getHeaders(), {}, form);
  }

  addProjectPushRule(id, pushRuleObj) {
    return this.call('post', `/projects/${id}/push_rule`, {}, {}, pushRuleObj);
  }

  deleteProject(name, namespace = credentials.namespace) {
    return this.call('delete', `/projects/${encodeURIComponent(namespace)}%2F${name}`, {}, {}, { id: `${namespace}/${name}` });
  }

  deleteProjectById(id) {
    return this.call('delete', `/projects/${id}`, {}, {}, { id });
  }

  /** =================== GROUPS (courses / editions) ===================== */
  getGroups() {
    return this.call('get', '/groups');
  }

  getGroup(id) {
    return this.call('get', `/groups/${encodeURIComponent(id)}`, {}, { id });
  }

  /**
     * Create a group (possibly within a group/subgroup).
     *
     * @param name { string } name of the group to be created.
     * @param parent { int } id of the parent group.
     * @param description { string } a textual description about the group.
     *
     * @returns {*|Promise<any>}
     */
  createGroup(name, parent = null, description = '') {
    if (parent === null) {
      return this.call('post', '/groups', {}, {}, {
        name,
        path: name,
        description,
        visibility: 'private',
      });
    }
    return this.call('post', '/groups', {}, {}, {
      name,
      path: name,
      parent_id: parent,
      description,
      visibility: 'private',
    });
  }

  deleteGroup(id) {
    return this.call('delete', `/groups/${encodeURIComponent(id)}`);
  }

  getSubgroups(parent) {
    return this.call('get', `/groups/${encodeURIComponent(parent)}/subgroups`);
  }

  /**
     * Delete a subgroup.
     *
     * @param name { string } the name of the subgroup to be deleted.
     * @param path { string } the path to the parent group of the subgroup that needs to be deleted.
     *
     * @returns {*|Promise<any>}
     */
  deleteSubgroup(name, path) {
    const urlParsed = encodeURIComponent(`${path}${slashPrefd(name)}`);
    return this.call('delete', `/groups${slashPrefd(urlParsed)}`, {}, {}, { id: name });
  }

  /** =================== USERS ===================== */

  /**
     * Returns all information about the owner of the API key.
     *
     * @returns {*|Promise<any>}
     */
  getCurrentUser() {
    return this.call('get', '/user');
  }

  /**
     * Get information about a certain user by searching for their id.
     *
     * @param id { int } id of the user.
     *
     * @returns {*|Promise<any>}
     */
  getUserById(id) {
    return this.call('get', `/users/${id}?per_page=10000`);
  }

  /**
     * Get information about a certain user by searching for their email.
     *
     * @param email { string } email of the user.
     *
     * @returns {*|Promise<any>}
     */
  getUserByEmail(email) {
    return this.call('get', `/users?search=${email}&per_page=10000`);
  }

  /**
     * Get information about a certain user by searching for their username.
     *
     * @param username { string } username of the user.
     *
     * @returns {*|Promise<any>}
     */
  getUserByUsername(username) {
    return this.call('get', `/users?search=${username}&per_page=10000`);
  }

  /**
     * Get all members from a group or project.
     *
     * @param type { string } the type which has to be "groups" or "projects".
     * @param id { string } the path to the group where the student should be added.
     *
     * @returns {*|Promise<any>}
     */
  getUsers(type, id) {
    const urlParsed = `${slashPrefd(encodeURIComponent(id))}`;
    return this.call('get', `${slashPrefd(type)}s${urlParsed}/members`, {}, {}, {
      id,
    });
  }

  /**
     * Add a user to a existing project or group.
     *
     * @param type { string } the type which has to be "groups" or "projects"
     *                to choose what the student is added to.
     * @param id { string } the path to the group where the student should be added.
     * @param userID { string } the ID of the user that should be added.
     * @param accessLvl { int } the rights that this student has after addition.
     *
     * Below are all different access levels:
     *
     * 10 => Guest access
     * 20 => Reporter access
     * 30 => Developer access
     * 40 => Maintainer access
     * 50 => Owner access (Only valid for groups)
     *
     * @returns {*|Promise<any>}
     */
  addUser(type, id, userID, accessLvl) {
    const urlParsed = encodeURIComponent(id);
    return this.call('post', `${slashPrefd(type)}s${slashPrefd(urlParsed)}/members`, {}, {}, {
      id, user_id: userID, access_level: accessLvl,
    });
  }

  /**
     * Delete a user from an existing project or group.
     *
     * @param type { string } the type which has to be "groups" or "projects"
     *           to choose what the student is deleted from.
     * @param id { string } the path to the group where the student should be deleted.
     * @param userID { string } the ID of the user that should be deleted.
     *
     * @returns {*|Promise<any>}
     */
  removeUser(type, id, userID) {
    const urlParsed = encodeURIComponent(id);
    return this.call('delete', `${slashPrefd(type)}s${slashPrefd(urlParsed)}/members${slashPrefd(userID)}`, {}, {}, {
      user_id: userID,
    });
  }

  /**
     * Create a new GitLab account for a student.
     *
     * @param email { string } the email address of the student.
     * @param name { string } name of the student.
     * @param username { string } username of the student.
     * @param pwdreset{ boolean } the right to reset their
     * password (which we will have true by default).
     *
     * NOTE: This requires admin rights.
     *
     * @returns {*|Promise<any>}
     */
  createUser(email, name, username, pwdreset = config.pwdResetMail) {
    return this.call('post', '/users', {}, {}, {
      email, name, username, reset_password: pwdreset,
    });
  }

  /**
   * Delete a GitLab account for a student.
   *
   * @param id { string } the ID of the student that was created.
   *
   * NOTE: "This method is only used to delete created 'test' users in bulk."
   *
   * NOTE: This requires admin rights.
   *
   * @returns {*|Promise<any>}
   */
  deleteUser(id) {
    return this.call('delete', `/users${slashPrefd(id)}`, {}, {}, {});
  }

  /**
   * Search for users according to a specific query.
   *
   * @param query { string } the ID of the student that was created.
   * @param perPage { int } the amount of results to be shown per page.
   *
   * @returns {*|Promise<any>}
   */
  searchUsers(query, perPage = 10) {
    return this.call('get', `/users?per_page=${perPage}&search=${query}`);
  }
};
