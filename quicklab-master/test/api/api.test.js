const util = require('util');
const ApiCaller = require('../../src/server/api/api');
const { api: credentials } = require('../../src/config');
const config = require('../data/values.json').api;
const fs = require('fs');

const api = new ApiCaller(credentials.apiToken);

const suffix = `${new Date().getTime()}`;
const fileName = config.project.tar ? config.project.tar : null;
let user_validation = false;
let user_id = -1;
// Clear entire gitlab instance and add some testing data
beforeAll(async () => {
  jest.setTimeout(10000);

  await api.createEmptyProject(`test_project${suffix}`).then().catch((error) => {
    process.stdout.write(util.inspect(error));
  });

  await api.createGroup(`ed05_test_group${suffix}`).then().catch((error) => {
    process.stdout.write(util.inspect(error));
  });


  await api.createUser(`t${suffix}@liteengineering.nl`, 'TestUser', `t${suffix}liteengineering`).then(res => {
    user_validation = true;
    user_id = res.data.id;
  }).catch(error => {
    if (error.toString().includes('403')) {
      process.stdout.write('API CALLER DOES NOT HAVE THE RIGHTS TO CREATE USERS, TESTING USERS IS ABORTED!')
    }
  });
});

// Clear entire gitlab instance again
afterAll(async () => {
  await api.deleteProject(`test_project${suffix}`).then().catch();
  await api.deleteGroup(`ed05_test_group${suffix}`).then().catch();
  if (user_validation) {
    await api.deleteUser(`${user_id}`).then().catch();
  }

});

/**
 * Project tests     ===================================
 */

test('Get project test', (done) => {
  api.getProject(`test_project${suffix}`).then((res) => {
    expect(res.status).toBe(200);
    expect(res.data.name).toBe(`test_project${suffix}`);
    done();
  }).catch((error) => {
    process.stdout.write(util.inspect(error));
  });
});


test('Get all project test', (done) => {
  if (user_validation) {
     api.getAllProjects().then((res) => {
      expect(res.status).toBe(200);
      done();
    }).catch((error) => {
      process.stdout.write(util.inspect(error));
    });
  }
  done();
});

test('Get project test 404', (done) => {
  api.getProject(`project_that_doesnt_exist${suffix}`).then(() => {

  }).catch((error) => {
    expect(error.toString().includes('404')).toBeTruthy();
    done();
  });
});

test('Create and delete project', async () => {
  jest.setTimeout(10000);

  await api.createEmptyProject(`created_project${suffix}`).then((res) => {
    expect(res.status).toBe(201);
  });

  // Make sure it exists now
  await api.getProject(`created_project${suffix}`).then((res) => {
    expect(res.status).toBe(200);
    expect(res.data.name).toBe(`created_project${suffix}`);
  });

  await api.deleteProject(`created_project${suffix}`).then((res) => {
    expect(res.status).toBe(202);
  });

  // Make sure it doesn't anymore
  await api.getProject(`created_project${suffix}`).then(() => {

  }).catch((error) => {
    expect(error.toString().includes('404')).toBeTruthy();
  });
});

test('Get projects', (done) => {
  api.getProjects().then((res) => {
    expect(res.status).toBe(200);
    done();
  }).catch((error) => {
    process.stdout.write(util.inspect(error));
  });
});


test('Create from url and delete project', async () => {
  jest.setTimeout(10000);

  await api.createProjectFromUrl(`created_url_project${suffix}`, -1, config.project.url).then((res) => {
    expect(res.status).toBe(201);
    expect(res.data.import_status).toBe('scheduled');
  });

  // Make sure it exists now
  await api.getProject(`created_url_project${suffix}`).then((res) => {
    expect(res.status).toBe(200);
    expect(res.data.name).toBe(`created_url_project${suffix}`);
  });

  await api.deleteProject(`created_url_project${suffix}`).then((res) => {
    expect(res.status).toBe(202);
  });

  // Make sure it doesn't anymore
  await api.getProject(`created_url_project${suffix}`).then(() => {

  }).catch((error) => {
    expect(error.toString().includes('404')).toBeTruthy();
  });

});

test('Create from file and delete project', async () => {
  jest.setTimeout(10000);

  await api.createProjectFromFile(`created_file_project${suffix}`, -1, fs.createReadStream(fileName)).then((res) => {
    expect(res.status).toBe(201);
    expect(res.data.import_status).toBe('scheduled');
  });

  // Make sure it exists now
  await api.getProject(`created_file_project${suffix}`).then((res) => {
    expect(res.status).toBe(200);
    expect(res.data.name).toBe(`created_file_project${suffix}`);
  });

  await api.deleteProject(`created_file_project${suffix}`).then((res) => {
    expect(res.status).toBe(202);
  });

  // Make sure it doesn't anymore
  await api.getProject(`created_file_project${suffix}`).then(() => {

  }).catch((error) => {
    expect(error.toString().includes('404')).toBeTruthy();
  });

});


test('Create empty project from url', async () => {
  jest.setTimeout(10000);

  await api.createProjectFromUrl(`created_url_project2${suffix}`).then((res) => {
    expect(res.status).toBe(201);
    expect(res.data.import_status).toBe('none');
  });

  // Make sure it exists now
  await api.getProject(`created_url_project2${suffix}`).then((res) => {
    expect(res.status).toBe(200);
    expect(res.data.name).toBe(`created_url_project2${suffix}`);
  });

  await api.deleteProject(`created_url_project2${suffix}`).then((res) => {
    expect(res.status).toBe(202);
  });

  // Make sure it doesn't anymore
  await api.getProject(`created_url_project2${suffix}`).then(() => {

  }).catch((error) => {
    expect(error.toString().includes('404')).toBeTruthy();
  });

});

test('Create empty project from file', async () => {
  jest.setTimeout(10000);

  await api.createProjectFromFile(`created_file_project12${suffix}`).then((res) => {
    expect(res.status).toBe(201);
    expect(res.data.import_status).toBe('none');
  });

  // Make sure it exists now
  await api.getProject(`created_file_project12${suffix}`).then((res) => {
    expect(res.status).toBe(200);
    expect(res.data.name).toBe(`created_file_project12${suffix}`);
  });

  await api.deleteProject(`created_file_project12${suffix}`).then((res) => {
    expect(res.status).toBe(202);
  });

  // Make sure it doesn't anymore
  await api.getProject(`created_file_project12${suffix}`).then(() => {

  }).catch((error) => {
    expect(error.toString().includes('404')).toBeTruthy();
  });

});
/**
 * Group tests     ===================================
 */

test('Get groups test', (done) => {
  api.getGroups().then((res) => {
    expect(res.status).toBe(200);
    done();
  }).catch();
});

test('Get group test', (done) => {
  api.getGroup(`ed05_test_group${suffix}`).then((res) => {
    expect(res.status).toBe(200);
    expect(res.data.name).toBe(`ed05_test_group${suffix}`);
    done();
  }).catch((error) => {
    process.stdout.write(util.inspect(error));
  });
});

test('Create and delete group test', async () => {
  jest.setTimeout(20000);

  await api.createGroup(`ed05_test_group_create${suffix}`).then((res) => {
    expect(res.status).toBe(201);
  });

  // Make sure it exists now
  await api.getGroup(`ed05_test_group_create${suffix}`).then((res) => {
    expect(res.status).toBe(200);
    expect(res.data.name).toBe(`ed05_test_group_create${suffix}`);
  });

  await api.deleteGroup(`ed05_test_group_create${suffix}`).then((res) => {
    expect(res.status).toBe(202);
  });

  // Make sure it doesn't anymore
  await api.getGroup(`ed05_test_group_create${suffix}`).then(() => {

  }).catch((error) => {
    expect(error.toString().includes('404')).toBeTruthy();
  });
});

test('Get subgroups test', async () => {
  let parentID = 0;

  await api.createGroup(`group_with_sub${suffix}`).then((res) => {
    parentID = res.data.id;
  }).catch((error) => {
    process.stdout.write(util.inspect(error));
  });

  await api.createGroup(`sub_group${suffix}`, parentID).then((res) => {
    expect(res.status).toBe(201);
  }).catch((error) => {
    process.stdout.write(util.inspect(error));
  });

  api.getSubgroups(`group_with_sub${suffix}`).then((res) => {
    expect(res.status).toBe(200);
  }).catch((error) => {
    process.stdout.write(util.inspect(error));
  });

  await api.deleteGroup(`group_with_sub${suffix}`).then((res) => {
    expect(res.status).toBe(202);
  });
});

test('Add and remove subgroup test', async () => {
  let pID = 0;

  await api.createGroup(`a_group_with_sub${suffix}`).then((res) => {
    pID = res.data.id;
    expect(res.status).toBe(201);
  }).catch((error) => {
    process.stdout.write(util.inspect(error));
  });

  await api.createGroup(`subgroup${suffix}`, pID).then((res) => {
    expect(res.status).toBe(201);
  }).catch((error) => {
    process.stdout.write(util.inspect(error));
  });

  await api.getSubgroups(`a_group_with_sub${suffix}`).then((res) => {
    expect(res.status).toBe(200);
  }).catch((error) => {
    process.stdout.write(util.inspect(error));
  });

  await api.deleteSubgroup(`subgroup${suffix}`, `a_group_with_sub${suffix}`).then((res) => {
    expect(res.status).toBe(202);
  });

  await api.deleteGroup(`a_group_with_sub${suffix}`).then((res) => {
    expect(res.status).toBe(202);
  });
});

test('Add and remove subgroup in subgroup test', async () => {
  let pID = 0;
  let subID = 0;

  await api.createGroup(`cp-ed-05-parent-group${suffix}`).then((res) => {
    pID = res.data.id;
    expect(res.status).toBe(201);
  }).catch((error) => {
    process.stdout.write(util.inspect(error));
  });

  await api.createGroup(`B${suffix}`, pID).then((res) => {
    subID = res.data.id;
    expect(res.status).toBe(201);
  }).catch((error) => {
    process.stdout.write(util.inspect(error));
  });

  await api.createGroup(`C${suffix}`, subID).then((res) => {
    expect(res.status).toBe(201);
  }).catch((error) => {
    process.stdout.write(util.inspect(error));
  });

  await api.deleteSubgroup(`C${suffix}`, `cp-ed-05-parent-group${suffix}/B${suffix}`).then((res) => {
    expect(res.status).toBe(202);
  }).catch((error) => {
    process.stdout.write(util.inspect(error));
  });

  await api.deleteGroup(`cp-ed-05-parent-group${suffix}`).then((res) => {
    expect(res.status).toBe(202);
  });
});

test('Add project in group test', async () => {
  let parentID = 0;
  let subID = 0;

  await api.createGroup(`cp-ed-05-group${suffix}`).then((res) => {
    parentID = res.data.id;
    expect(res.status).toBe(201);
  }).catch((error) => {
    process.stdout.write(util.inspect(error));
  });

  await api.createGroup(`C${suffix}`, parentID).then((res) => {
    subID = res.data.id;
    expect(res.status).toBe(201);
  }).catch((error) => {
    process.stdout.write(util.inspect(error));
  });

  await api.createEmptyProject(`test_project2${suffix}`, subID).then((res) => {
    expect(res.status).toBe(201);
  }).catch((error) => {
    process.stdout.write(util.inspect(error));
  });

  await api.deleteGroup(`cp-ed-05-group${suffix}`).then((res) => {
    expect(res.status).toBe(202);
  });
});

test('Add url project in group test', async () => {
  let parentID = 0;

  await api.createGroup(`cp-ed-05-group4${suffix}`).then((res) => {
    parentID = res.data.id;
    expect(res.status).toBe(201);
  }).catch((error) => {
    process.stdout.write(util.inspect(error));
  });

  await api.createProjectFromUrl(`test_project24${suffix}`, parentID, config.project.url).then((res) => {
    expect(res.status).toBe(201);
    expect(res.data.import_status).toBe('scheduled');

  }).catch();

  await api.deleteGroup(`cp-ed-05-group4${suffix}`).then((res) => {
    expect(res.status).toBe(202);
  });
});

test('Add file project in group test', async () => {
  let parentID = 0;

  await api.createGroup(`cp-ed-05-group5${suffix}`).then((res) => {
    parentID = res.data.id;
    expect(res.status).toBe(201);
  }).catch((error) => {
    process.stdout.write(util.inspect(error));
  });

  await api.createProjectFromFile(`test_project245${suffix}`, parentID, fs.createReadStream(fileName)).then((res) => {
    expect(res.status).toBe(201);
    expect(res.data.import_status).toBe('scheduled');

  }).catch();

  await api.deleteGroup(`cp-ed-05-group5${suffix}`).then((res) => {
    expect(res.status).toBe(202);
  });
});

test('Add project with pushrules in subgroup test', async () => {
  let parentID = 0;

  await api.createGroup(`cp-ed-05-group-2${suffix}`).then((res) => {
    parentID = res.data.id;
    expect(res.status).toBe(201);
  }).catch((error) => {
    process.stdout.write(util.inspect(error));
  });

  await api.createEmptyProject(`test_project2${suffix}`, parentID).then((res) => {
    expect(res.status).toBe(201);
  }).catch((error) => {
    process.stdout.write(util.inspect(error));
  });


  let projectId = -1
  await api.getProjects(parentID)
    .then(res => {
      expect(res.status).toBe(200);
      expect(res.data.length).toBe(1);
      projectId = res.data[0].id;

    })
    .catch();

  await api.addProjectPushRule(projectId, {}).then((res) => {
    expect(res.status).toBe(201);
  }).catch((error) => {
    expect(error.toString()).toMatch(/404/);
  });

  await api.deleteProjectById(projectId)
    .then(res => {
      expect(res.status).toBe(202);
    })
    .catch();


  await api.getProjects(parentID)
    .then(res => {
      expect(res.status).toBe(200);
      expect(res.data.length).toBe(0);

    })
    .catch();

  await api.deleteGroup(`cp-ed-05-group-2${suffix}`).then((res) => {
    expect(res.status).toBe(202);
  });
});

// TODO: test get information about a subgroup

/**
 * User tests     ===================================
 */

test('Creating users', async () => {

  if (user_validation) {
    let testUserID = -1
    const testName = 'TestUser';
    const testUsername = `${testName}${suffix}liteengineering`.toLocaleLowerCase();
    const testEmail = `${testUsername}@liteengineering.nl`;

    await api.createUser(testEmail, testName, testUsername, true)
      .then(res => {
        testUserID = res.data.id
        expect(res.status).toBe(201);
      })
      .catch();

    await api.searchUsers('Test').then(res => {
      expect(res.status).toBe(200);
      expect(res.data.length).toBe(2)
    }).catch();
    await api.getUserById(testUserID).then(res => {
      expect(res.status).toBe(200);
      expect(res.data.name).toBe(testName);
      expect(res.data.email).toBe(testEmail);
      expect(res.data.username).toBe(testUsername);
    }).catch();
    await api.getUserByEmail(testEmail).then(res => {
      expect(res.status).toBe(200);
      expect(res.data.length).toBe(1);
      expect(res.data[0].name).toBe(testName);
      expect(res.data[0].username).toBe(testUsername);
    }).catch();
    await api.getUserByUsername(testUsername).then(res => {
      expect(res.status).toBe(200);
      expect(res.data.length).toBe(1);
      expect(res.data[0].name).toBe(testName);
      expect(res.data[0].email).toBe(testEmail);
    }).catch();
    await api.deleteUser(`${testUserID}`)
      .then(res => {
        expect(res.status).toBe(204);
      })
      .catch();
  }

});

test('Current user', async () => {
  await api.getCurrentUser().then(res => {
    expect(res.status).toBe(200);
  })
})

test('Adding Users user', async () => {
  if (user_validation) {
    let testUserID = -1
    const testName = 'TestMover';
    const testUsername = `${testName}${suffix}liteengineering.nl`.toLocaleLowerCase();
    const testEmail = `${testUsername}@liteengineering.nl`;

    await api.createUser(testEmail, testName, testUsername, true)
      .then(res => {
        testUserID = res.data.id
        expect(res.status).toBe(201);
      })
      .catch();

    let moverPath = '';
    let moverId = '';
    await api.createGroup(`test_mover${suffix}`, null, 'Testing moving users to group')
      .then(res => {
        expect(res.status).toBe(201);
        moverPath = res.data.path;
        moverId = res.data.id;
      })
      .catch();

    await api.addUser('group', moverPath, `${testUserID}`, 10)
      .then(res => {
        expect(res.status).toBe(201);
      })
      .catch();

    await api.getUsers('group', moverPath)
      .then(res => {
        expect(res.status).toBe(200);
        expect(res.data.length).toBe(2)
        expect(res.data[1].name).toBe(testName)
        expect(res.data[1].username).toBe(testUsername)
        expect(res.data[1].access_level).toBe(10)
      })
      .catch();


    await api.removeUser('group', moverPath, `${testUserID}`)
      .then(res => {
        expect(res.status).toBe(204);
      })
      .catch();


    await api.getUsers('group', moverPath)
      .then(res => {
        expect(res.status).toBe(200);
      })
      .catch();


    await api.deleteGroup(moverId).then(res => {
      expect(res.status).toBe(202);
    }).catch()


    await api.deleteUser(`${testUserID}`)
      .then(res => {
        expect(res.status).toBe(204);
      })
      .catch();
  }
})
// TODO
