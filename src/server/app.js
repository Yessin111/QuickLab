const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const formidable = require('formidable');
const OktaJwtVerifier = require('@okta/jwt-verifier');
const logger = require('./logger/logger.js');
const projectTypes = require('./api/projectTypes');

const { serverLogger } = logger;

const ApiCaller = require('./api/api');
const ApiConverter = require('./ApiConverter');
const Functions = require('./serverFunctions');
const db = require('./database/database');

const { okta } = require('../config');

const oktaJwtVerifier = new OktaJwtVerifier({
  issuer: `https://${okta.domain}/oauth2/aus15mfw9lCjo4S0v357`, // required
  client_id: okta.client_id,
});

const app = express();

const port = 4000;

app.use(bodyParser.json({
  limit: '100mb',
  extended: true,
}));

app.use(bodyParser.urlencoded({
  limit: '100mb',
  extended: true,
}));

/**
 * Handles the option request that axios sends when you try to add an Authentication
 * header. Otherwise the app receives a request without Authentication first, resulting
 * in a non-authorized result message, before being able to handle an authorized request.
 */
app.options('/*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, Accept, Authentication, Content-Type, Authorization, Content-Length, X-Requested-With');
  res.sendStatus(200);
});

/**
 * Check authentication before actually allowing the request to pass. This means
 * that all routes beneath this method are protected. All routes above this method
 * are not.
 */
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*'); // Fixes CORS warnings
  const accessToken = req.headers.authentication;

  if (!accessToken) {
    res.sendStatus(403);
    serverLogger.warn('Denied access to request without access token');
    return;
  }

  // Link: https://dev-935937.okta.com/oauth2/default/v1/authorize
  oktaJwtVerifier.verifyAccessToken(accessToken, okta.audience)
    .then((jwt) => {
    // the token is valid (per definition of 'valid' above)
      serverLogger.info(`[okta] Valid claim: ${JSON.stringify(jwt.claims)}`);
      next();
    })
    .catch((err) => {
    // a validation failed, inspect the error
      serverLogger.error(`[okta] Error: ${JSON.stringify(err)}`);
      res.sendStatus(403);
    });
});

/**
 * Handle to receive api key and user. Store them to use them in the api calls.
 *
 * @param user {String}
 * @param key {String}
 */
app.post('/postApiKey', (req, res) => {
  const { user, key } = req.body;
  const attributeError = Functions.checkAttributes(['user', 'key'], [user, 'string'], [key, 'string']);

  if (attributeError) {
    serverLogger.error(`[app/postApiKey] ${attributeError.error.toString()}`);
    res.status(attributeError.errorCode).send(attributeError.error.toString());
    return;
  }

  db.updateApiKey(user, key, (error) => {
    if (error) {
      serverLogger.error(error.stack);
      res.status(400).send(error.toString());
    } else {
      Functions.verifyApiKey(user, (err, result) => {
        if (err) {
          serverLogger.error(err.toString());
          res.status(400).send(err.toString());
        } else res.send(result);
      });
    }
  });
});

/**
 * This method verifies the api key of a user.
 *
 * @param user {String}
 */
app.get('/verifyApiKey', (req, res) => {
  const { user } = req.query;
  const attributeError = Functions.checkAttributes(['user'], [user, 'string']);

  if (attributeError) {
    serverLogger.error(`[app/verifyApiKey] ${attributeError.error.toString()}`);
    res.status(attributeError.errorCode).send(attributeError.error.toString());
    return;
  }

  Functions.verifyApiKey(user, (err2, result) => {
    if (err2) {
      serverLogger.error(`[app/verifyApiKey] ${err2.toString()}`);
      res.status(400).send(err2.toString());
    } else res.send(result);
  });
});

/**
 * Handle to log messages to the logger.
 *
 * @param type {String}, Type of the message to log.
 * @param msg {String}, Message to log.
 */
app.post('/logToServer', (req, res) => {
  const { type, msg } = req.body;
  const attributeError = Functions.checkAttributes(['type', 'msg'], [type, 'string'], [msg, 'string']);

  if (attributeError) {
    serverLogger.error(`[app/logToServer] ${attributeError.error.toString()}`);
    res.status(attributeError.errorCode).send(attributeError.error.toString());
    return;
  }

  switch (type) {
    case 'error': {
      serverLogger.error(msg);
      break;
    }
    case 'info': default: {
      serverLogger.info(msg);
    }
  }
  res.sendStatus(200);
});

/**
 * Endpoint for adding TAs to a course so they can be assigned in later steps
 * Note that head TAs are assigned to the edition automatically,
 *         whereas 'regular' TAs have to be added manually in the groups view
 * Requires 4 arguments:
 * - normalTas {[String]} - list of all normal TAs (just their gitlab usernames)
 * - headTas {[String]} - list of all head TAs (just their gitlab usernames)
 * - course {String} - course the TAs should be added to
 * - edition {String} - edition the TAs should be added to (should be a subgroup of the course)
 */
app.post('/postTas', (req, res) => {
  serverLogger.info(`REQUEST <========> [app/postTas] \n Body:${JSON.stringify(req.body)}`);
  const {
    normalTas, headTas, course, edition,
  } = req.body;

  const attributeError = Functions.checkAttributes(['normalTas', 'headTas', 'course', 'edition'],
    [normalTas, 'object'],
    [headTas, 'object'],
    [course, 'string'],
    [edition, 'string']);

  if (attributeError) {
    serverLogger.error(`[app/postTas] ${attributeError.error.toString()}`);
    res.status(attributeError.errorCode).send(attributeError.error.toString());
    return;
  }

  Functions.addAvailableTAs(course, edition, normalTas, headTas, (err) => {
    if (err) {
      serverLogger.info('ERROR <========> [app/postTas] \n');
      res.sendStatus(500);
    } else {
      serverLogger.info('RESULT <========> [app/postTas]\n');
      res.sendStatus(200);
    }
  });
});

/**
 * Endpoint for getting all TAs available to a course
 * Requires two parameters: course and edition (both strings)
 */
app.get('/getTas', (req, res) => {
  serverLogger.info(`REQUEST <========> [app/getTas] \n Body:${JSON.stringify(req.body)}`);
  const { course, edition } = req.query;
  const attributeError = Functions.checkAttributes(['course', 'edition'],
    [course, 'string'],
    [edition, 'string']);

  if (attributeError) {
    serverLogger.error(`[app/getTas] ${attributeError.error.toString()}`);
    res.status(attributeError.errorCode).send(attributeError.error.toString());
    return;
  }


  Functions.getAvailableTAs(course, edition, (err, data) => {
    if (err) {
      serverLogger.info('ERROR <========> [app/getTas] \n');
      res.sendStatus(500);
    } else {
      serverLogger.info(`RESULT <========> [app/getTas] ${JSON.stringify(data)}\n`);
      res.send(data);
    }
  });
});

/**
  * An endpoint for storing course information on the server. Currently accepts
  * a data object containing all the information of the course.
  */
app.post('/postCourse', async (req, res) => {
  serverLogger.info(`REQUEST <========> [app/postCourse] \n Body:${JSON.stringify(req.body)}`);
  const attributeError = Functions.checkAttributes(['req.body'],
    [req.body, 'object']);

  if (attributeError) {
    serverLogger.error(`[app/postCourse] ${attributeError.error.toString()}`);
    res.status(attributeError.errorCode).send(attributeError.error.toString());
    return;
  }

  await db.addAllGroups(Functions.toServerFormat(req.body), null, async (error, result) => {
    if (error) {
      serverLogger.error(error.toString());
      res.status(400).send(error);
    } else {
      const adminId = 1;
      const admin = await db.asyncCall(db.insertAdminPrivileges, null, adminId, result.id, 'owner');
      if (admin) {
        serverLogger.info('Succesfully linked course to an admin.');
        res.sendStatus(201);
      } else {
        serverLogger.error('Could not link inserted course.');
        res.status(400).send('Could not link inserted course.');
      }
      serverLogger.info('RESULT <========> [app/postCourse] \n');
    }
  });
});

/**
  * An endpoint for adding and edition to a course on the server. Currently accepts
  * a data object containing all the information of the edition and the name of the
  * course.
  */
app.post('/addEdition', async (req, res) => {
  serverLogger.info(`REQUEST <========> [app/addEdition] \n Body:${JSON.stringify(req.body)}`);
  const { course, edition } = req.body;

  const attributeError = Functions.checkAttributes(['course', 'edition'],
    [course, 'string'],
    [edition, 'string']);

  if (attributeError) {
    serverLogger.error(`[app/addEdition] ${attributeError.error.toString()}`);
    res.status(attributeError.errorCode).send(attributeError.error.toString());
    return;
  }

  const params = {
    ...Functions.toServerFormat(edition),
    path: course,
  };

  await db.addGroup(params, null, (error) => {
    serverLogger.info('RESULT <========> [app/addEdition] \n');
    if (error) {
      serverLogger.error(error.toString());
      res.status(400).send(error);
    } else res.sendStatus(201);
  });
});

/**
  * An endpoint for getting information about all the courses on the server.
  * Currently returns the id and name of every course with all de editions as
  * strings in an array.
  */
app.get('/getCourseList', async (req, res) => {
  serverLogger.info(`REQUEST <========> [app/getCourseList] \n Body:${JSON.stringify(req.body)}`);
  const adminId = 1;
  await db.getCourseList(adminId, (error, list) => {
    serverLogger.info('RESULT <========> [app/getCourseList] \n');
    if (error) {
      serverLogger.error(error.toString());
      res.status(400).send(error);
    } else res.send(list);
  });
});

/**
  * An endpoint for getting a single course out of the store. The course is
  * selected by id.
  */
app.get('/getCourseById', async (req, res) => {
  serverLogger.info(`REQUEST <========> [app/getCourseById] \n Body:${JSON.stringify(req.query)}`);
  const { course, edition } = req.query;
  const attributeError = Functions.checkAttributes(['course', 'edition'],
    [course, 'string'],
    [edition, 'string']);

  if (attributeError) {
    serverLogger.error(`[app/getCourseById] ${attributeError.error.toString()}`);
    res.status(attributeError.errorCode).send(attributeError.error.toString());
    return;
  }

  Functions.getCourseById(course, edition, (error, result) => {
    serverLogger.info('RESULT <========> [app/getCourseById] \n');
    if (error) {
      serverLogger.error(error.toString());
      res.status(400).send(error);
    } else res.send(result);
  });
});


/**
 * Checks whether a file was given as import. If so it copies the file
 * and closes the received file object. Then it will call the API caller and
 * removes the file after it is done.
 */
function formidablePromise(req, opts) {
  return new Promise(((resolve, reject) => {
    const form = new formidable.IncomingForm(opts);
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      return resolve({ fields, files });
    });
  }));
}

/**
  * Converts the groups to api calls that create the groups on GitLab.
  *
  * @param groups {Groups}
  */
app.post('/submit', (req, res) => {
  formidablePromise(req).then(async (data) => {
    const groups = JSON.parse(data.fields.groups);
    const project = JSON.parse(data.fields.project);
    const { user } = data.fields;
    const apiKey = await db.asyncCall(db.getApiKey, (error) => {
      serverLogger.error(error.toString());
      res.sendStatus(400).send(error.toString());
    }, user);
    if (groups.groups) {
      let filename;
      if (project.type === projectTypes.IMPORT_FROM_FILE) {
        const { file } = data.files;
        filename = file ? project.file : null;
        fs.createReadStream(file.path).pipe(fs.createWriteStream(filename));
        project.file = filename;
        fs.unlinkSync(file.path);
      }
      let sendPath = '';
      const api = new ApiCaller(apiKey);
      await ApiConverter.convertToApiCall(groups.groups, api, null, '', '', project, project.settings).then((path) => {
        if (filename) {
          fs.unlinkSync(filename);
        }
        sendPath = path;
      });

      res.send(sendPath);
    } else {
      res.sendStatus(400);
    }
  });
});

/**
  * Handles the action log and updates the data accordingly.
  *
  * @param log {Array}
  * @param course {String}
  * @return {Groups}
  */
app.post('/saveTransactions', (req, res) => {
  const { course: courseId, edition, log } = req.body;
  const attributeError = Functions.checkAttributes(['course', 'edition', 'log'],
    [courseId, 'string'],
    [edition, 'string'],
    [log, 'object']);

  if (attributeError) {
    serverLogger.error(`[app/saveTransactions] ${attributeError.error.toString()}`);
    res.status(attributeError.errorCode).send(attributeError.error.toString());
    return;
  }

  const logTypes = log.map(transaction => transaction.type);
  serverLogger.info(
    `REQUEST <========> [app/saveTransactions] \n Log: ${JSON.stringify(logTypes)}`,
  );

  Functions.applyTransactions(log, (err2) => {
    if (err2) {
      serverLogger.error(err2.toString());
      Functions.getCourseById(courseId, edition, (err3, res3) => {
        serverLogger.info('RESULT <========> [app/saveTransactions] \n');
        if (err3) {
          serverLogger.error(err3.toString());
          res.status(400).send({ error: err3.toString() });
        } else {
          res.status(400).send({
            error: err2.toString(),
            result: res3,
          });
        }
      });
    } else {
      Functions.getCourseById(courseId, edition, (err3, res3) => {
        serverLogger.info('RESULT <========> [app/saveTransactions] \n');
        if (err3) {
          serverLogger.error(err3.toString());
          res.status(400).send({ error: err3.toString() });
        } else res.send(res3);
      });
    }
  });
});

/**
  * Handles the action to reset the database.
  */
app.post('/resetDatabase', (req, res) => {
  serverLogger.info(`REQUEST <========> [app/resetDatabase] \n Body:${JSON.stringify(req.body)}`);
  db.dropTables((err) => {
    if (err) {
      serverLogger.error(err.stack);
      res.status(500).send(err);
      throw err;
    } else {
      db.createTables((err2) => {
        serverLogger.info('RESULT <========> [app/resetDatabase] \n');
        if (err2) {
          serverLogger.error(err2.stack);
          res.status(500).send(err2);
          throw err2;
        } else res.sendStatus(200);
      });
    }
  });
});

/**
  * An endpoint for getting information about all the TAs in the database
  */
app.get('/getUserList', async (req, res) => {
  const { value } = req.query;
  const attributeError = Functions.checkAttributes(['value'],
    [value, 'string']);

  if (attributeError) {
    serverLogger.error(`[app/getUserList] ${attributeError.error.toString()}`);
    res.status(attributeError.errorCode).send(attributeError.error.toString());
    return;
  }

  serverLogger.info(`Request at /getUserList searching for: ${value}`);
  db.searchUsers(value, (err, result) => {
    if (err) {
      serverLogger.error(`/getUserList returned with${err.toString()}`);
      res.send([]);
    }
    serverLogger.info(`[app/getUserList] sending: ${JSON.stringify(result)}`);
    res.send(result);
  });
});

/**
 * Format:
 * {
 *  "course": "TI1234",
 *  "edition": "2019-2020 Q1"
 * }
 */
app.get('/projectSettings', async (req, res) => {
  console.log(req.query);
  const { course, edition } = req.query;
  await db.getProjectSettings(course, edition, (err, data) => {
    if (err) {
      res.sendStatus(500);
    } else {
      console.log(data);
      res.send(data);
    }
  });
});

/**
 * Format:
 * {
 *  "course": "TI1234",
 *  "edition": "2019-2020 Q1",
 *  "importType": "zip|url|empty|fork",
 *  "importUrl": "http://www.example.com/",
 *  "deleteTags": false,
 *  "commitGitlabUserOnly": true,
 *  "rejectSecrets": true,
 *  "commitRegex": "",
 *  "branchRegex": "",
 *  "mailRegex": "",
 *  "filenameRegex": ""
 * }
 */
app.post('/projectSettings', async (req, res) => {
  const {
    course,
    edition,
    importType,
    importUrl,
    deleteTags,
    commitGitlabUserOnly,
    rejectSecrets,
    commitRegex,
    branchRegex,
    mailRegex,
    filenameRegex,
  } = req.body;
  console.log(req.body);
  await db.insertProjectSettings(course, edition, importType, importUrl, deleteTags,
    commitGitlabUserOnly, rejectSecrets, commitRegex, branchRegex, mailRegex, filenameRegex,
    (err) => {
      if (err) {
        res.sendStatus(500);
      } else {
        res.sendStatus(200);
      }
    });
});

app.listen(port);
