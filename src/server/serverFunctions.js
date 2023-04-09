const { serverLogger } = require('./logger/logger.js');
const db = require('./database/database');
const ApiCaller = require('./api/api');
const actions = require('./serverActions');

/**
 * Checks input variable variables against its given type.
 * [WARNING] The empty string ('') is also seen as invalid attribute.
 *
 * @param names {Array<String>}
 * @param args {Array<Array<Variable, Type>>}
 * @return {Boolean || Object<error: Error, errorCode: int>}
 */
function checkAttributes(names, ...args) {
  for (let i = 0; i < args.length; i += 1) {
    if (args[i].length < 2) {
      return {
        errorCode: 500,
        error: new Error(`Invalid usagage of checkAttributes function. Invalid amount of parameters. Found: ${args[i].length} parameters.`),
      };
    } if (typeof args[i][0] !== args[i][1]) {
      return {
        errorCode: 400,
        error: new Error(`Variable '${names[i]}' is of the wrong type or null. Expected: ${args[i][1]}, but received: ${typeof args[i][0]}.`),
      };
    }
  }
  return false;
}

/**
 * Recursively re-formats all data in this structure to the format the server requires.
 *
 * @param data { Object: { type } }
 * @param path { string }
 * @returns { Object }
 */
function toServerFormat(data, path = undefined) {
  switch (data.type) {
    case 'project': {
      return data;
    }
    case 'user': {
      return {
        ...data,
        id: data.id.replace('#', ''),
        path,
      };
    }
    case 'group': {
      const group = {
        ...data,
        name: data.id,
        children: data.children.map(child => toServerFormat(child, data.id)),
      };
      delete group.id;
      if (data.subtype === 'course') {
        group.description = data.name;
        group.children = group.children.map(child => ({
          ...child,
          path: group.name,
        }));
      }
      return group;
    }
    default: {
      throw new Error('unknown type');
    }
  }
}

/**
 * Recursively re-formats all data in this structure to the format the client requires.
 *
 * @param data {Object}, Object in server format.
 * @return {Object}, Object in client side format.
 */
function toClientFormat(data) {
  switch (data.type) {
    case 'project': {
      const ret = {
        id: data.name,
        repo: data.repo || 'default',
        type: 'project',
        subtype: 'project',
        children: [],
      };
      return ret;
    }
    case 'user': {
      return {
        id: data.gitlabUsername,
        name: data.name,
        username: data.gitlabUsername,
        email: data.mailAddress,
        type: 'user',
        subtype: data.subtype ? data.subtype : 'student',
        rights: data.rights ? data.rights : {
          edit: data.edit,
          share: data.share,
          work: data.work,
        },
      };
    }
    case 'group': {
      const ret = {
        id: data.name,
        type: 'group',
        subtype: data.subtype ? data.subtype : 'group',
        children: data.children.map(child => toClientFormat(child)),
      };

      if (data.subtype === 'course') {
        ret.name = data.description;
        ret.default_project_settings = {
          defaultRepo: '',
        };
      }
      return ret;
    }
    default: {
      throw new Error(`[functions/toClientFormat] Unkown type: ${data.type}`);
    }
  }
}


/**
 * This action will rename a group, user of project. Please note that currently this has not
 * been implemented yet, but this will be added in some future version.
 *
 * Note: Users cannot be renamed in our tool. Therefore this case is missing.
 *
 * TODO: [ISSUE #138] Implement RENAME action.
 *
 * @param payload {Object: {path, name, type}}
 * @param callback {function}
 * @return {undefined}
 */
async function applyRename(payload, callback) {
  serverLogger.warn(`[applyRename] payload: ${JSON.stringify(payload)}`);
  const { type } = payload;
  switch (type) {
    case 'group': {
      db.renameGroup(payload, callback);
      break;
    }
    case 'project': {
      db.renameRepository(payload, callback);
      break;
    }
    default: {
      serverLogger.warn(`[functions/applyRename] Unkown action type: '${type}'`);
      callback(new Error(`[functions/applyRename] Unkown action type: '${type}'`));
    }
  }
}

/**
 * The ADD function adds a single group, user or project to the provided path.
 * First the path is converted to the internal format, then the appropriate datbase function
 * is invoked.
 *
 * @param payload {Object: {data, path}}
 * @param callback {function}
 * @return {undefined}
 */
async function applyAdd(payload, callback) {
  const { data, path: fullPath } = payload;

  const type = data ? data.type : null;
  const path = fullPath ? fullPath.replace('./', '') : fullPath;

  switch (type) {
    case 'group': {
      await db.addGroup({
        ...toServerFormat(data),
        path,
      }, null, callback);
      break;
    }
    case 'user': {
      db.addUser({ ...data, path }, null, callback);
      break;
    }
    case 'project': {
      db.addRepository({ ...data, path }, null, callback);
      break;
    }
    default: {
      callback(new Error(`[functions/applyAdd] Unkown action type '${type}'`));
    }
  }
}

/**
 * The DELETE action removes a group, user or project. But the behaviour is very different for
 * the different types:
 * - When a project it deleted, it is simply deleted from the Repositories table
 * - When a user is deleted ONLY it's link to a group is removed, not the user itself
 * - When a group is removed, all subgroups, projects in those groups and users assigned to
 *        these groups are also removed.
 *
 * @param payload  {Object: {parent, id, type}}
 * @param callback {function}
 * @return {undefined}
 */
async function applyDelete(payload, callback) {
  const { parent, id, type } = payload;

  switch (type) {
    case 'group': {
      await db.deleteGroup({
        name: id,
        path: parent.replace('./', ''),
      }, null, callback);
      break;
    }
    case 'user': {
      await db.deleteUser({
        id: id.replace('#', ''),
        path: parent.replace('./', ''),
      }, null, callback);
      break;
    }
    case 'project': {
      await db.deleteRepository({
        id,
        path: parent.replace('./', ''),
      }, null, callback);
      break;
    }
    default: {
      serverLogger.warn(`[functions/applyDelete] Unkown action type: '${type}'`);
      callback();
    }
  }
}

/**
 * The GROUP_DATA action is called when a group is overwritten. For example when a csv file is
 * imported. When this action is being processed, first the entire edition is removed and then
 * the edition and all it's subgroups are added recursively again. This will also add
 * repositories and users if they are in the provided structure.
 *
 * @param payload {Object}
 * @param callback {function}
 * @return {undefined}
 */
async function applyGroupData(payload, callback) {
  const course = toServerFormat(payload);
  const [edition] = course.children;
  db.addAllGroups(edition, null, callback);
}


/**
 * Updates the stored data in the database with a certain action.
 *
 * @param action {Action}
 * @param callback {function}
 * @return {undefined}
 */
async function applyTransaction(action, callback) {
  const { type, payload } = action;
  serverLogger.info(`[applyTransactions] Handling action: ${type}`);
  serverLogger.debug(`payload: ${JSON.stringify(payload)}`);

  switch (type) {
    case actions.RENAME: {
      applyRename(payload, callback);
      break;
    }
    case actions.ADD: {
      applyAdd(payload, callback);
      break;
    }
    case actions.DELETE: {
      applyDelete(payload, callback);
      break;
    }
    case actions.GROUP_DATA: {
      applyGroupData(payload, callback);
      break;
    }
    default: {
      callback(new Error(`Unimplemented action called: ${type}, so just skipping`));
    }
  }
}

/**
 * applyTransactionLog will call applyTransaction on every item in the log, but only after the
 * previous one ran to completion.
 *
 * @param log {[ {action, payload} ]}, a list of actions, which are objects with a type and payload
 * @param callback { function }, invoked after completion of the entire log, or when an error occurs
 */
function applyTransactionLog(log, callback) { // TODO: refactor everywhere
  const [head, ...tail] = log;
  if (!head) {
    callback();
  } else {
    applyTransaction(head, (err1) => {
      if (err1) callback(err1);
      else applyTransactionLog(tail, callback);
    });
  }
}

/**
 * Returns an entire course by the courseId and editionId. The editionId is needed
 * to select only one edition at the same time, because you can only work on one
 * edition at the same time.
 *
 * The function first retrieves the course group and then adds the recursively
 * retrieved edition and adds them together, converts them to client format and
 * passes it to the callback.
 *
 * @param id {String}, Name of the course. This is id clientside.
 * @param edition {String}, Name of the edition. This is id clientside.
 * @param callback {function}, Used to pass errors and result to the caller of the function.
 * @return {undefined}
 */
function getCourseById(id, edition, callback) {
  db.getGroup({ name: id, subtype: 'course' }, null, async (courseError, course) => {
    if (courseError) callback(courseError);
    else if (course.length === 0) callback(new Error('Course does not exist'));
    else {
      const params = {
        name: edition,
        path: `${id}/${edition}`,
        subtype: 'edition',
      };

      db.getAllGroups(params, course.id, (error, subgroup) => {
        if (error) callback(error);
        else if (subgroup.length === 0) callback(new Error('Edition does not exist'));
        else {
          callback(null, toClientFormat({
            ...course,
            children: [subgroup],
          }));
        }
      });
    }
  });
}

/**
 * This function checks if a certain specified user has already specified an api token in the past.
 * @param user {String}, the user the api should be checked for
 * @param callback {function(error, {boolean})}
 */
function verifyApiKey(user, callback) {
  db.getApiKey(user, (error, result) => {
    if (error) {
      callback(error);
    } else {
      const api = new ApiCaller(result);
      api.getGroups().then(() => {
        callback(null, true);
      }).catch(() => {
        callback(null, false);
      });
    }
  });
}

/**
 * Adds the tas specified to the course.
 *
 * @param course {String}
 * @param edition {String}
 * @param normalTas {[String]}
 * @param headTas {[String]}
 * @param callback {function}
 */
async function addAvailableTAs(course, edition, normalTas, headTas, callback) {
  if (await db.asyncCall(db.clearTAsFromEdition, callback, course, edition, normalTas, 'ta')) return;

  if (await db.asyncCall(db.clearTAsFromEdition, callback, course, edition, headTas, 'head')) return;

  await Promise.all(normalTas.map(async (ta) => {
    await db.asyncCall(db.insertTA, null, ta);
    return db.asyncCall(db.linkTA, null, ta, course, edition, 'ta');
  })).catch((error) => {
    db.handleError(error, callback);
  });

  await Promise.all(headTas.map(async (ta) => {
    await db.asyncCall(db.insertTA, null, ta);
    await db.asyncCall(db.linkTA, null, ta, course, edition, 'head');

    const group = await db.asyncCall(db.getGroup, null,
      { name: edition, path: course }, null);

    return db.asyncCall(db.addUser, null, {
      name: ta,
      username: ta,
      email: `${ta}@tudelft.nl`,
      subtype: 'head_ta',
      rights: { edit: true, work: true, share: true },
    }, group.id);
  })).catch((error) => {
    db.handleError(error, callback);
  });

  callback();
}

/**
 * Calls callback with an objects containing two lists,
 * one with all headTas and one with all normalTas
 * @param course {!String}
 * @param edition {!String}
 * @param callback {!Function} returns { normalTas: [String], headTas: [String] }
 */
async function getAvailableTAs(course, edition, callback) {
  const res = await db.asyncCall(db.getTAs, callback, course, edition);
  if (!res) return;
  callback(null, {
    normalTas: res.normalTas.map(ta => ta.gitlabUsername),
    headTas: res.headTas.map(ta => ta.gitlabUsername),
  });
}

module.exports = {
  applyTransactions: applyTransactionLog,
  applyTransaction,
  toServerFormat,
  toClientFormat,
  getCourseById,
  verifyApiKey,
  addAvailableTAs,
  getAvailableTAs,
  checkAttributes,
};
