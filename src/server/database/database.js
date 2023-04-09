const mysql = require('mysql');
const fs = require('fs');
const { database: credentials } = require('../../config');
const { serverLogger } = require('../logger/logger.js');

/**
 * Setup a new database connection.
 */
const conn = mysql.createConnection({
  ...credentials,
});

/**
 * Creates a connection that accepts multiple sql statements after eachother.
 * Should only be used for running entire files that are stored on the server.
 *
 * Note: This connection is vulnerable to piggybacked attacks.
 */
const multiConn = mysql.createConnection({
  ...credentials,
  multipleStatements: true,
});

/**
  * Handles and error with or without callback.
  *
  * @param error {Error}
  * @param callback {function}
  * @return {undefined}
  */
function handleError(error, callback) {
  serverLogger.info(`[db/handleError] ${error.toString()}`);
  if (callback) callback(error);
  else throw error;
}

/**
 * Takes a full path string, removes the preceding './' (if present) and then separates the
 * parent path and the name of the group.
 *
 * If there are no '/' charachters in the fullPath, it returns an undefined path and
 * the fullPath as name. Else it splits the fullPath into path and name on the last
 * occurrence of '/'.
 *
 * @param fullPath {string} './example/a/b/c/'
 * @returns {{path: undefined, name: string}|{path: string, name: string}}
 */
function splitPath(fullPath) {
  if (!fullPath) return { path: undefined, name: undefined };
  const noPrefix = fullPath.replace('./', '');
  const lastIndex = noPrefix.lastIndexOf('/');

  if (lastIndex === -1) {
    return {
      path: undefined,
      name: noPrefix,
    };
  }
  return {
    path: noPrefix.substring(0, lastIndex),
    name: noPrefix.substring(lastIndex + 1),
  };
}

/**
  * Function that returns a promise that either calls handleError on reject or
  * returns the data if you await the call. If the data returned is null or undefined,
  * that means there was an error and handleError has already been called. To prevent
  * calling the callback twice, (Resulting in trying to send headers to the client twice)
  * check for the result of asyncCall to not be null or undefined. (if (!result))
  *
  * [WARNING:] This function only works with async functions that have a callback as
  *            last parameter. All parameters of the function called should be
  *            specified.
  *
  * @param func {function}, Async function that gets executed.
  * @param callback {function}, Callback to handle errors. Use null for errors to be thrown.
  * @param args {any amount of args}, Arguments of the function called.
  * @return {Promise}, You can await the promise to get the result of the function.
  */
// TODO: [ISSUE #140] Return object {succes: true/false, data:result/null}
function asyncCall(func, callback, ...args) {
  return new Promise((resolve, reject) => {
    func(...args, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
  }).catch((error) => {
    handleError(error, callback);
  });
}

/**
  * Function that creates a promise and executes the specified query.
  *
  * @param query {String}
  * @param params {Object | Array}, Use an object for query with one ?, use array with multiple.
  * @param callback {function}, Callback to handle errors. Insert null or leave it out to
  *                             throw the error.
  * @return {Promise}, You can await the promise to get the result of the query.
  */
function dbQuery(query, params, callback) {
  return new Promise((resolve, reject) => {
    conn.query(query, params, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
  }).catch((error) => {
    handleError(error, callback);
  });
}

/**
 * This function initializes the database connection.
 * An error will be thrown if something is wrong
 * @returns {Promise<void>}
 */
async function init() {
  await conn.connect({}, (err) => {
    if (!err) return true;
    throw err;
  });
}

/**
 * This method initializes the database to the correct tables. It reads the
 * contents of the create_tables query file. It creates a query of the entire file
 * and handles it at once.
 *
 * @param callback {function}, Callback to pass errors and results to.
 * @returns {Promise<void>}
 */
async function createTables(callback) {
  fs.readFile('./src/server/database/queries/create_tables.sql', 'utf8', async (fileError, contents) => {
    if (fileError) handleError(fileError, callback);
    else {
      await multiConn.query(contents, async (queryError) => {
        if (queryError) handleError(queryError, callback);
        if (callback) callback();
      });
    }
  });
}

/**
 * This methods removes all the tables. Can be used to start with a clear instance
 * of the database again. It reads the contetns of the drop_tables file and
 * creates a query of the entire file. It then handles the whole query at once.
 *
 * @param callback {function}, Callback to pass errors and results to.
 * @returns {Promise<void>}
 */
async function dropTables(callback) {
  fs.readFile('./src/server/database/queries/drop_tables.sql', 'utf8', async (fileError, contents) => {
    if (fileError) handleError(fileError, callback);
    else {
      await multiConn.query(contents, async (queryError) => {
        if (queryError) handleError(queryError, callback);
        if (callback) callback();
      });
    }
  });
}

/**
 * AdminPrivileges
 */

/**
 * Gets all the groups that are assigned to a certain admin. It
 * passes the result in a callback.
 *
 * @param adminId {Integer}
 * @param callback {function}
 * @return {Void}
 */
async function getGroupsOfAdmin(adminId, callback) {
  const res = await dbQuery('SELECT groupId FROM AdminPrivileges WHERE ?', { adminId });
  serverLogger.info(`GetGroupsOfAdmin ${JSON.stringify(res)}`);
  if (!res) return;
  callback(null, res);
}

/**
 * Gets all the admins that are assigned to a certain group. It
 * passes the result in a callback.
 *
 * @param groupId {Integer}
 * @param callback {function}
 * @return {Void}
 */
async function _getAdminsOfGroup(groupId, callback) {
  const res = await dbQuery('SELECT adminId FROM AdminPrivileges WHERE ?', { groupId });
  if (!res) return;
  callback(null, res);
}

/**
 * Checks if the given admin is already assigned to the given group. It
 * passes the result, the id of the connection between admin and group, in a callback.
 *
 * @param groupId {Integer}
 * @param callback {function}
 * @return {Void}
 */
async function getAdminPrivileges(adminId, groupId, callback) {
  const res = await dbQuery('SELECT id FROM AdminPrivileges WHERE ? AND ?', [{ adminId }, { groupId }]);
  if (!res) return;
  callback(null, res);
}

/**
 * Inserts a connection between an admin and group into the database. It
 * passes the result, true on success, in a callback.
 *
 * @param adminId {Integer}
 * @param groupId {Integer}
 * @param privelege {String}
 * @param callback {function}
 * @return {Void}
 */
async function insertAdminPrivileges(adminId, groupId, privilege, callback) {
  if ((await asyncCall(getAdminPrivileges, callback, adminId, groupId)).length === 0) {
    if (await dbQuery('INSERT INTO AdminPrivileges SET ?', { adminId, groupId, privilege }, callback)) {
      callback(null, true);
    }
  } else {
    callback(null, true);
  }
}

/**
 * Groups
 */

/**
 * Get a group. Either id, (parentId && name), (path && name) should be defined.
 * It is also possible to get a group with subtype='course' and just a name.
 *
 * @param data { [id], [name], [path], [subtype] }
 * @param parentGroupId {[int]}
 * @param callback {function}
 * @returns {undefined}
 */
async function getGroup(data, parentGroupId, callback) {
  const {
    id, name, path, subtype,
  } = data;

  let res;

  if (id) {
    res = await dbQuery('SELECT * FROM Groups WHERE ?', { id }, callback);
    if (!res) return;
    serverLogger.info(`[db/getGroup] Id => ${JSON.stringify(res)}`);
  } else if (parentGroupId && name) {
    res = await dbQuery(
      'SELECT * FROM Groups WHERE ? AND ?',
      [{ parentGroupId }, { name }],
      callback,
    );
    if (!res) return;
    serverLogger.info(`[db/getGroup] ParentId, Name => ${JSON.stringify(res)}`);
  } else if (path && name) {
    res = await dbQuery('SELECT * FROM Groups WHERE ? AND ?', [{ name }, { path }], callback);
    if (!res) return;
    serverLogger.info(`[db/getGroup] Path, Name => ${JSON.stringify(res)}`);
  } else if (subtype === 'course' && name) {
    res = await dbQuery(
      'SELECT * FROM Groups WHERE ? AND parentGroupId IS NULL',
      { name },
      callback,
    );
    if (!res) return;
    serverLogger.info(`[db/getGroup] Course => ${JSON.stringify(res)}`);
  } else {
    handleError(new Error('Either path or parentId should be given.'), callback);
    return;
  }

  if (res.length === 0) {
    if (callback) callback(null, []);
    return;
  } if (res.length > 1) {
    handleError(new Error('Corrupt db'), callback);
    return;
  }

  const group = {
    ...res[0],
    id: `${res[0].id}`,
    type: 'group',
    subtype: subtype || 'group',
    children: [],
  };

  if (callback) callback(null, group);
}

/**
 * Inserts a group in the database. Course_id and course_description are optional
 * for inserting courses.
 *
 * It first checks if the group already exists.
 * Then it inserts the group if does not exist.
 * It then checks if the group is inserted and passes the result of the insertion
 * to the callback if the callback is defined.
 *
 * @param group {Object: {name, path, description, parentGroupId, subtype}}
 * @param callback {function}
 * @return {undefined}
 */
async function insertGroup(group, callback) {
  const checkExists = await asyncCall(getGroup, callback, group, null);
  if (!checkExists) return;

  if (checkExists.length === 0) {
    const params = {
      name: group.name,
      path: group.path,
      description: group.description,
      parentGroupId: group.parentGroupId,
      subtype: group.subtype,
    };

    const insert = await dbQuery('INSERT INTO Groups SET ?', params, callback);
    if (!insert) return;

    const result = await asyncCall(getGroup, callback, group, null);
    if (!result) return;

    if (callback) callback(null, result);
  } else {
    handleError(
      new Error(`Group with name: ${group.name} and path: ${group.path}  already exists.`),
      callback,
    );
  }
}

/**
 * Creates the correct parameters for inserting a group into the databse. If either
 * the the id of the parent group or the path is missing, then it will query that.
 * If both are missing, then it is impossible to find the parent and it will give
 * an error to the callback.
 *
 * Note: This function is only meant to be used for the group types:
 * - edition
 * - group
 *
 * @param args {Object: {name, path}}
 * @param parentGroupId {[int]}
 * @param subtype {String}
 * @param callback {function}
 * @return {undefined}
 */
async function createGroupParams(args, parentGroupId, subtype, callback) {
  const { name, path } = args;
  const params = {
    name,
    path,
    parentGroupId,
    subtype,
  };

  if (!params.path && !params.parentGroupId) {
    handleError(
      new Error('[db/createGroupParams] Either path or parentGroupId should be defined.'),
      callback,
    );
    return;
  }

  if (!(params.path && params.parentGroupId)) {
    const parentParam = (!params.path) ? {
      id: parentGroupId,
    } : splitPath(params.path);

    if (subtype === 'edition') {
      parentParam.subtype = 'course';
    }

    const parent = await asyncCall(getGroup, callback, parentParam, null);
    if (!parent) return;

    if (parent.length === 0) {
      handleError(new Error('[db/createGroupParams] Parent group cannot be found.'), callback);
      return;
    }

    if (!params.path) {
      if (parent.path) params.path = `${parent.path}/${parent.name}`;
      else params.path = parent.name;
    }
    if (!params.parentGroupId) {
      params.parentGroupId = parent.id;
    }
  }
  params.parentGroupId = `${params.parentGroupId}`;
  callback(null, params);
}

/**
 * Adds a group with subtype course to the db.
 *
 * @param args {Object: {name, description}}
 * @param callback {function}
 * @return {undefined}
 */
async function addCourseSubType(args, callback) {
  const { name, description } = args;
  const params = {
    name,
    path: null,
    description,
    parentGroupId: null,
    subtype: 'course',
  };
  const result = await asyncCall(insertGroup, callback, params);
  if (!result) return;
  if (callback) callback(null, result);
}

/**
 * Adds a group with subtype group to the db.
 *
 * @param args {Object: {name, path}}
 * @param parentGroupId {int}
 * @param callback {function}
 * @return {undefined}
 */
async function addGroupSubType(args, parentGroupId, subtype, callback) {
  const params = await asyncCall(createGroupParams, callback, args, parentGroupId, subtype);
  if (!params) return;
  const result = await asyncCall(insertGroup, callback, params);
  if (!result) return;
  if (callback) callback(null, result);
}

/**
 * Adds a group to the database. The client side id (name in the db) should be specified.
 * Also, either the path or parentId is required to insert the group.
 *
 * @param data { Object: { name, [path], [description], subtype } }
 * @param parentId {[int]}
 * @param callback {function}
 */
async function addGroup(data, parentId, callback) {
  const { path, subtype } = data;

  if (!path && !parentId && subtype !== 'course') {
    handleError(
      new Error('Either path or parentId should be specified.'),
      callback,
    );
    return;
  }

  switch (subtype) {
    case 'course': {
      const result = await asyncCall(addCourseSubType, callback, data);
      if (result && callback) callback(null, result);
      break;
    }
    case 'group': case 'edition': {
      const result = await asyncCall(addGroupSubType, callback, data, parentId, subtype);
      if (result && callback) callback(null, result);
      break;
    }
    default: {
      handleError(new TypeError('Cannot add an unknown group type.'), callback);
    }
  }
}

/**
 * Recursively get all the groups, users and repositories in a group, edition or course.
 * It also (partially) formats all the data to the client side.
 *
 * @param data { id, name, path, subtype }
 * @param parentGroupId { [int] }
 * @param callback {function}
 * @returns {Promise<void>}
 */
async function getAllGroups(data, parentGroupId, callback) {
  if (!data.path && !parentGroupId && data.subtype !== 'course') {
    handleError(new Error('Either a path or a parent ID is required, but none were provided'), callback);
    return;
  }

  const group = await asyncCall(getGroup, callback, data, parentGroupId);
  if (!group) return;

  const subGroups = await dbQuery('SELECT * FROM Groups WHERE ?',
    { parentGroupId: group.id }, handleError);
  if (!subGroups) return;
  const users = await dbQuery('SELECT * FROM Users INNER JOIN UserPrivileges ON Users.gitlabUsername = UserPrivileges.userId WHERE ?', {
    groupId: group.id,
  }, handleError);
  if (!users) return;
  const projects = await dbQuery('SELECT * FROM Repositories WHERE ?', { groupId: group.id }, handleError);
  if (!projects) return;

  const groupChildren = await Promise.all(
    subGroups.map(async sub => asyncCall(getAllGroups, null, sub, group.id)),
  );
  if (!groupChildren) return;

  const ret = {
    ...group,
    children: [
      ...groupChildren.filter(child => child),
      ...projects.map(project => ({
        ...project,
        type: 'project',
        subtype: 'project',
      })),
      ...users.map(user => ({
        ...user,
        type: 'user',
      })),
    ],
  };

  if (callback) callback(null, ret);
}

/**
 * Returns a list of all courses with an array of strings as editions.
 *
 * @param callback {function}
 * @return {undefined}
 */
async function getCourseList(adminId, callback) {
  const groups = (await asyncCall(getGroupsOfAdmin, callback, adminId)).map(el => el.groupId);
  if (groups.length < 1) {
    if (callback) (callback(null, []));
    return;
  }
  const res = await dbQuery('SELECT * FROM Groups WHERE path IS NULL AND id IN (?)', [groups], callback);
  if (!res) return;
  if (res.length === 0) {
    if (callback) callback(null, []);
  } else {
    const result = await Promise.all(res.map(async (course) => {
      const editions = await dbQuery(
        'SELECT * FROM Groups WHERE ?',
        { parentGroupId: course.id },
        null,
      );
      return {
        id: course.name,
        name: course.description,
        editions: editions.map(edition => edition.name),
      };
    })).catch((error) => {
      handleError(error, callback);
    });
    if (!result) return;
    if (callback) callback(null, result);
  }
}

/**
 * Delete a group, all its subgroups, assigned users and repositories.
 * Either id, (name && path) or (name && parentId) should be given.
 *
 * @param data      {Object: { [id], [name], [path] }}
 * @param parentGroupId  {[int]}
 * @param callback  {function}
 */
async function deleteGroup(data, parentGroupId, callback) {
  const {
    id, name, path,
  } = data;

  if (id) {
    const result = await dbQuery('DELETE FROM Groups WHERE ?', { id }, callback);
    if (result) callback(null, result);
  } else if (name && path) {
    const result = await dbQuery('DELETE FROM Groups WHERE ? AND ?', [{ name }, { path }], callback);
    if (result) callback(null, result);
  } else if (name && parentGroupId) {
    const result = await dbQuery(
      'DELETE FROM Groups WHERE ? AND ?',
      [{ name }, { parentGroupId }],
      callback,
    );
    if (result) callback(null, result);
  } else handleError(new Error('Not enough data to delete a Group.'), callback);
}

/**
 * Deletes the connection between a user and a group. The user still exists
 * in the User table.
 *
 * @param data {Object : {id, path}}
 * @param parentGroupId {[int]}
 * @param callback {function}, Callback to pass errors and results.
 * @return {undefined}
 */
async function deleteUser(data, parentGroupId, callback) {
  serverLogger.info(`[db/deleteUser] Remove user. StudentId: ${data.id},  Path: ${data.path}`);
  const parentGroup = parentGroupId ? {
    id: parentGroupId,
  } : await asyncCall(getGroup, callback, {
    ...splitPath(data.path),
    id: parentGroupId,
  }, null);
  if (!parentGroup) return;

  const success = await dbQuery('DELETE FROM UserPrivileges WHERE ? AND ?',
    [{ groupId: parentGroup.id }, { userId: data.username }], callback);
  if (success && callback) callback();
}

/**
 * Deletes a repository.
 *
 * @param data {Object : {id, path}}
 * @param parentGroupId {[int]}
 * @param callback {function}, Callback to pass errors and results.
 * @return {undefined}
 */
async function deleteRepository(data, parentGroupId, callback) {
  serverLogger.info(`[db/deleteRepository] Remove project. Id: ${data.id}, Path: ${data.path}`);
  const parentGroup = parentGroupId ? {
    id: parentGroupId,
  } : await asyncCall(getGroup, callback, {
    ...splitPath(data.path),
    id: parentGroupId,
  }, null);
  if (!parentGroup) return;

  const success = await dbQuery('DELETE FROM Repositories WHERE ? AND ?',
    [{ groupId: parentGroup.id }, { name: data.id }], callback);
  if (success && callback) callback();
}

/**
 * Adds a user to a database (if it doesn't yet exist) and assigns it to a group as defined in the
 * path field, in the user object
 *
 * @param user { Object: { path, name, username, email, id, type, subtype, rights } }
 * @param [parentGroupId] { int | string }, id of the parent group (optional)
 * @param callback { function }
 * @returns {Promise<void>} => only calls return when an error occurs
 */
async function addUser(user, parentGroupId = undefined, callback) {
  const {
    path,
    name,
    username: gitlabUsername,
    email: mailAddress,
    subtype,
    rights,
  } = user;

  // TODO: [ISSUE #139] If the studentId already exists, but other attribute is different: error!
  const res = await dbQuery('INSERT IGNORE INTO Users SET ?', {
    name,
    mailAddress,
    gitlabUsername,
  }, callback);
  if (!res) return;

  const parentGroup = await asyncCall(getGroup, callback, {
    ...splitPath(path),
    id: parentGroupId,
  }, null);
  if (!parentGroup) return;

  const link = await dbQuery('INSERT IGNORE INTO UserPrivileges SET ?', {
    userId: gitlabUsername,
    groupId: parseInt(parentGroup.id, 10),
    edit: rights.edit,
    share: rights.share,
    work: rights.work,
    subtype,
  }, callback);
  if (!link) return;

  if (callback) callback();
}

/**
 * Adds a repository to a group
 *
 * @param repository { Object: { id, [path], repo }}
 * @param parentGroupId { [int] | [string] }
 * @param callback { function }
 * @returns {Promise<void>}, Only calls return when an error occurs.
 */
async function addRepository(repository, parentGroupId = undefined, callback) {
  const {
    id: name, path, repo,
  } = repository;

  const parentGroup = await asyncCall(getGroup, callback, {
    ...splitPath(path),
    id: parentGroupId,
  }, null);
  if (!parentGroup) return;

  const proj = await dbQuery('INSERT IGNORE INTO Repositories SET ?', {
    name,
    groupId: parseInt(parentGroup.id, 10),
    repo,
  }, callback);
  if (!proj) return;

  if (callback) callback();
}

/**
 * Recursively insert all the groups, users and repositories in the given data object.
 *
 * @param data      { Object: { name, [path], [description], subtype, children } }
 * @param parentGroupId  {[int]}
 * @param callback  {function}
 */
async function addAllGroups(data, parentGroupId, callback) {
  serverLogger.info(`[db/addAllGroups]: ${JSON.stringify({ ...data, children: 'hidden' })}`);
  const { children } = data;

  let result = await asyncCall(getGroup, callback, data, parentGroupId);
  if (!result) return;
  if (result.length === 0) {
    result = await asyncCall(addGroup, callback, data, parentGroupId);
  } else if (result.subtype === 'course') {
    addAllGroups(children[0], result.id, callback);
    return;
  } else {
    const clearedGroup = await dbQuery('DELETE FROM Groups WHERE ?', { parentGroupId: result.id }, callback);
    if (!clearedGroup) return;
  }
  if (!result) return;

  const { id } = result;
  if (!id) {
    handleError(new Error('Result has no id'), callback);
    return;
  }

  const mappedResult = await Promise.all(
    children.map((child) => {
      switch (child.type) {
        case 'group': {
          return asyncCall(addAllGroups, null, child, id);
        }
        case 'user': {
          return asyncCall(addUser, null, child, id);
        }
        case 'project': {
          return asyncCall(addRepository, null, child, id);
        }
        default: {
          return new Promise((resolve, reject) => {
            reject(new Error('Undefined type of child.'));
          });
        }
      }
    }),
  ).catch((error) => {
    handleError(error, callback);
  });
  if (mappedResult && callback) callback(null, result);
}


/**
 * Gets an admin by mailAddress or id.
 *
 * @param mailAddress {String}
 * @param id {int}
 * @param callback {function}
 * @return {undefined}
 */
async function getAdmin(mailAddress, id, callback) {
  if (id) {
    const result = await dbQuery('SELECT * FROM Admins WHERE ?', { id }, callback);
    if (!result) return;
    callback(null, result);
  } else if (mailAddress) {
    const result = await dbQuery('SELECT * FROM Admins WHERE ?', { mailAddress }, callback);
    if (!result) return;
    callback(null, result);
  } else {
    handleError(new Error('Can only get admin by mailAddress or id.'), callback);
  }
}

/**
 * Adds an admin to the admin table.
 *
 * @param mailAddress {String}
 * @param gitlabUsername {String}
 * @param gitlabApiToken {String}
 * @param callback {function}
 * @return {undefined}
 */
async function addAdmin(mailAddress, gitlabUsername, gitlabApiToken, callback) {
  const data = {
    mailAddress,
    gitlabUsername,
    gitlabApiToken,
  };
  const checkExists = await asyncCall(getAdmin, callback, mailAddress, null);
  if (!checkExists) return;
  if (checkExists.length === 0) {
    const added = await dbQuery('INSERT INTO Admins SET ?', data, callback);
    if (!added) return;
    const result = await asyncCall(getAdmin, callback, mailAddress, null);
    if (!result) return;
    if (result.length === 0) {
      handleError(new Error('Adding admin failed'), callback);
    } else {
      callback(null, result[0]);
    }
  } else {
    handleError(new Error('Trying to add admin that already exists'), callback);
  }
}

/**
 * Updates the gitlabApiToken of an admin.
 *
 * @param mailAddress {String}
 * @param gitlabApiToken {String}
 * @param callback {function}
 * @return {undefined}
 */
async function updateApiKey(mailAddress, gitlabApiToken, callback) {
  const resultArray = await asyncCall(getAdmin, callback, mailAddress, null);
  if (!resultArray) return;

  if (resultArray.length === 0) {
    const result = await asyncCall(addAdmin, callback, mailAddress, '', gitlabApiToken);
    if (!result) return;

    serverLogger.info('Succesfully added new admin with apiKey');
    callback(null, result);
  } else {
    const admin = resultArray[0];

    const update = await dbQuery('UPDATE Admins SET ? WHERE ?', [{ gitlabApiToken }, { id: admin.id }], callback);
    if (!update) return;

    const result = await asyncCall(getAdmin, callback, null, admin.id);
    if (!result) return;

    if (result.length === 0) {
      handleError(new Error('Updating admin caused it to be deleted'), callback);
      return;
    }

    const updatedAdmin = result[0];

    if (updatedAdmin.gitlabApiToken !== gitlabApiToken) {
      handleError(new Error('Updating admin did not update apiKey'), callback);
      return;
    }

    serverLogger.info('Succesfully updated api key');
    callback(null, gitlabApiToken);
  }
}

/**
 * Retrieves the apiKey from the given user from the database.
 *
 * @param username {String}
 * @param callback {function}
 * @return {undefined}
 */
async function getApiKey(username, callback) {
  const res = await dbQuery('SELECT * FROM Admins WHERE ?', { mailAddress: username }, callback);
  if (res.length > 0) {
    callback(null, res[0].gitlabApiToken);
  } else {
    handleError(new Error('Could not find api token for the given username'), callback);
  }
}

/**
 * Renames a group, and the path of all subgroups
 * @param data Object:{ String:path -> path including old name, String:name -> the new name }}
 * @param callback {Function}
 * @returns {undefined}
 */
async function renameGroup(data, callback) {
  serverLogger.warn(`[db/renameGroup] ${JSON.stringify(data)}`);

  const { name, path: path0 } = data;
  const path = path0.replace('./', '');
  const { name: oldName, path: oldPath } = splitPath(path);

  let ret = await dbQuery(
    `UPDATE Groups SET \`path\` = REPLACE(\`path\`, '${path}', '${oldPath}/${name}') WHERE \`path\` LIKE ('${path}%')`,
    [], callback,
  );
  if (!ret) return;

  ret = await dbQuery(`UPDATE Groups SET \`name\`='${name}' WHERE ? AND ?`, [{ name: oldName }, { path: oldPath }], callback);
  if (!ret) return;

  if (callback) callback();
}

/**
 * Renames a repository
 * @param data Object:{ String:path -> path including old name, String:name -> new name}}
 * @param callback {Function}
 * @returns {undefined}
 */
async function renameRepository(data, callback) {
  serverLogger.warn(`[db/renameRepository] ${data}`);

  const { path, name } = data;
  const { path: parentPath0 } = splitPath(path);
  const { path: parentPath, name: parentName } = splitPath(parentPath0);

  const parent = await asyncCall(getGroup, callback, { name: parentName, path: parentPath }, null);
  if (!parent) return;

  const ret = await dbQuery(`UPDATE Repositories SET \`name\`='${name}' WHERE ?`, { groupId: parent.id }, callback);
  if (!ret) return;

  if (callback) callback();
}

/**
 * Inserts a TA with a gitlabUsername, then calls callback
 * @param gitlabUsername {String}
 * @param callback {function}
 */
async function insertTA(gitlabUsername, callback) {
  const ret = await dbQuery('INSERT IGNORE INTO TAs SET ?', { gitlabUsername }, callback);
  if (!ret) return;
  callback(null);
}

/**
 * Links a TA to a course (such that the user can choose them in the groups view)
 * @param gitlabUsername {String}
 * @param course {String}
 * @param edition {String}
 * @param subtype {?String}
 * @param callback {function}
 */
async function linkTA(gitlabUsername, course, edition, subtype = 'ta', callback) {
  const group = await asyncCall(getGroup, callback, { name: edition, path: course }, null);
  serverLogger.info(`[db/linkTA] ${JSON.stringify(group)}`);
  if (!group) return;

  const ret = await dbQuery('INSERT IGNORE INTO AvailableTAs SET ?', { tGitlabUsername: gitlabUsername, groupId: group.id, subtype }, callback);
  if (!ret) return;
  callback(null);
}

/**
 * Calls the callback with a list of all TAs available to a course in the following format:
 * { headTas: [String], normalTas: [String]}
 * @param course {String}
 * @param edition {String}
 * @param callback {function}
 */
async function getTAs(course, edition, callback) {
  const group = await asyncCall(getGroup, callback, { name: edition, path: course }, null);
  if (!group) return;

  const tas = await dbQuery('SELECT * FROM TAs INNER JOIN AvailableTAs ON TAs.gitlabUsername = AvailableTAs.tGitlabUsername WHERE ? AND ?',
    [{ groupId: group.id }, { subtype: 'ta' }], callback);
  if (!tas) return;

  const head = await dbQuery('SELECT * FROM TAs INNER JOIN AvailableTAs ON TAs.gitlabUsername = AvailableTAs.tGitlabUsername WHERE ? AND ?',
    [{ groupId: group.id }, { subtype: 'head' }], callback);
  if (!head) return;

  callback(null, { normalTas: tas, headTas: head });
}

/**
 * Returns all items that are in a, but not in b
 * !! Note: this doesn't calculate the *symmetric* difference !!
 * @param a {[String]}, list
 * @param b {[String]}, list
 */
function setDifference(a, b) {
  let r = [];
  a.forEach((item) => {
    if (!b.includes(item)) {
      r = [...r, item];
    }
  });
  return r;
}

/**
 * Un-links all TAs from an edition
 * !! Note: doesn't actually remove the TAs, so they can still be used for auto completion !!
 *
 * Works as follows: gets a list of the current TAs, removes all that existed before,
 *      but don't in the newTas list
 *
 * @param course {String}
 * @param edition {String}
 * @param newTas {[String]}
 * @param subtype {[]}
 * @param callback
 * @returns {Promise<void>}
 */
async function clearTAsFromEdition(course, edition, newTas, subtype, callback) {
  const group = await asyncCall(getGroup, callback, { name: edition, path: course }, null);
  if (!group) return;

  const oldTas = await dbQuery('SELECT * FROM AvailableTAs WHERE ? AND ?', [{ groupId: group.id }, { subtype }], callback);
  if (!oldTas) return;

  const toRemove = setDifference(oldTas.map(ta => ta.tGitlabUsername), newTas);

  await Promise.all(toRemove.map(async (name) => {
    await dbQuery('DELETE FROM AvailableTAs WHERE ?', { tGitlabUsername: name }, null);
    return dbQuery(`DELETE u FROM UserPrivileges u INNER JOIN Groups g ON u.groupId = g.id WHERE u.userId = ? AND (g.path LIKE '${course}/${edition}%' OR (g.name = '${edition}' AND g.path = '${course}'))`, [name], null);
  })).catch((error) => {
    handleError(error, callback);
  });

  callback();
}

async function searchUsers(string, callback) {
  const r = await dbQuery('SELECT * FROM TAs WHERE gitlabUsername LIKE ?', `%${string}%`, callback);
  if (!r) return;
  callback(null, r.map(ta => ({ username: ta.gitlabUsername, name: ta.gitlabUsername })));
}

/**
 * Inserts a set of settings into the database.
 * Only one can be stored per course,
 * it there is another one stored, it's overwritten.
 * @param course {String}, course code
 * @param edition {String}, edition
 * @param importType {String}
 * @param importUrl {String}
 * @param deleteTags {boolean}
 * @param commitGitlabUserOnly {boolean}
 * @param rejectSecrets {boolean}
 * @param commitRegex {String}
 * @param branchRegex {String}
 * @param mailRegex {String}
 * @param filenameRegex {String}
 * @param callback {Function}
 */
async function insertProjectSettings(course, edition, importType, importUrl, deleteTags,
  commitGitlabUserOnly, rejectSecrets, commitRegex, branchRegex, mailRegex, filenameRegex,
  callback) {
  const group = await asyncCall(getGroup, callback, { name: edition, path: course }, null);
  if (!group) return;

  const params = {
    groupId: group.id,
    importType,
    importUrl,
    deleteTags,
    commitGitlabUserOnly,
    rejectSecrets,
    commitRegex,
    branchRegex,
    mailRegex,
    filenameRegex,
  };
  const r = await dbQuery('INSERT IGNORE INTO RepoSettings SET ? ON DUPLICATE KEY UPDATE ?', [params, params], callback);
  if (!r) return;
  callback();
}

/**
 * Retrieves project settings from the database (if they exist)
 * @param course {String} course code
 * @param edition {String}
 * @param callback {Function} will be called with an error if one occurs.
 *  Otherwise called with the resulting data set as second argument
 * @returns {Promise<void>}
 */
async function getProjectSettings(course, edition, callback) {
  const group = await asyncCall(getGroup, callback, { name: edition, path: course }, null);
  if (!group) return;

  const r = await dbQuery('SELECT * FROM RepoSettings WHERE ?', { groupId: group.id }, callback);
  if (!r) return;

  callback(null, r);
}

module.exports = {
  conn,
  multiConn,
  splitPath,
  init,
  createTables,
  dropTables,
  asyncCall,
  createGroupParams,
  addGroup,
  addAllGroups,
  getGroup,
  getAllGroups,
  getCourseList,
  deleteGroup,
  addUser,
  addRepository,
  deleteUser,
  deleteRepository,
  updateApiKey,
  getApiKey,
  renameGroup,
  renameRepository,
  insertTA,
  linkTA,
  getTAs,
  clearTAsFromEdition,
  searchUsers,
  insertProjectSettings,
  getProjectSettings,
  insertAdminPrivileges,
};
