import db from '../../../src/server/database/database';
import logImport from '../../../src/server/logger/logger';

const logger = logImport.serverLogger;

const connect = jest.spyOn(db.conn, 'connect');
const query = jest.spyOn(db.conn, 'query');
const multiQuery = jest.spyOn(db.multiConn, 'query');

function setQueryResultOnce(error, result) {
  query.mockImplementationOnce(async (string, params, callback) => {
    callback(error, result);
  });
}

beforeAll(() => {
  logger.setSynchronous(true);
});

beforeEach(() => {
  connect.mockImplementation((req, callback) => {
    callback();
  });
  query.mockImplementation(async (string, params, callback) => {
    callback(null, []);
  });
});

afterEach(() => {
  connect.mockReset();
  query.mockReset();
  multiQuery.mockReset();
});

afterAll(() => {
  logger.setSynchronous(false);
});

describe('database', () => {
  describe('splitPath', () => {
    it('does split path of length zero', () => {
      expect(db.splitPath('')).toStrictEqual({ path: undefined, name: undefined });
      expect(db.splitPath('./')).toStrictEqual({ path: undefined, name: '' });
    });

    it('does split path of length one', () => {
      expect(db.splitPath('name')).toStrictEqual({ path: undefined, name: 'name' });
      expect(db.splitPath('./name')).toStrictEqual({ path: undefined, name: 'name' });
    });

    it('does split path of length two', () => {
      expect(db.splitPath('path/name')).toStrictEqual({ path: 'path', name: 'name' });
      expect(db.splitPath('./path/name')).toStrictEqual({ path: 'path', name: 'name' });
    });

    it('does split path of length three', () => {
      expect(db.splitPath('path/to/name')).toStrictEqual({ path: 'path/to', name: 'name' });
      expect(db.splitPath('./path/to/name')).toStrictEqual({ path: 'path/to', name: 'name' });
    });

    it('does not split undefined path', () => {
      expect(db.splitPath(undefined)).toStrictEqual({ path: undefined, name: undefined });
    });
  });

  describe('init', () => {
    it('does try to connect to the mysql database on init', async () => db.init().then(() => {
      expect(connect).toHaveBeenCalledTimes(1);
      expect(query).toHaveBeenCalledTimes(0);
    }));

    it('does call error on init error', async () => {
      connect.mockImplementation((req, callback) => {
        callback(req);
      });

      try {
        await db.init();
      } catch (error) {
        expect(connect).toHaveBeenCalledTimes(1);
        expect(query).toHaveBeenCalledTimes(0);
      }
    });
  });

  describe('createTables', () => {
    it('does try to create tables', async () => {
      multiQuery.mockImplementation((contents, callback) => callback());
      await db.asyncCall(db.createTables, null);
      expect(multiQuery).toHaveBeenCalledTimes(1);
    });

    it('does error on error when creating tables', async () => {
      multiQuery.mockImplementation((contents, callback) => callback(new Error()));
      try {
        await db.asyncCall(db.createTables, null);
      } catch (error) {
        expect(multiQuery).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe('dropTables', () => {
    it('does try to drop tables', async () => {
      multiQuery.mockImplementation((contents, callback) => callback());
      await db.asyncCall(db.dropTables, null);
      expect(multiQuery).toHaveBeenCalledTimes(1);
    });

    it('does error on error when dropping tables', async () => {
      multiQuery.mockImplementation((contents, callback) => callback(new Error()));
      try {
        await db.asyncCall(db.dropTables, null);
      } catch (error) {
        expect(multiQuery).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe('addGroup', () => {
    it('Does use the correct amount of queries for adding a course.', async () => {
      const params = {
        name: 'TI1234',
        path: null,
        description: 'CourseName',
        subtype: 'course',
      };

      await db.asyncCall(db.addGroup, null, params, null);
      expect(query).toHaveBeenCalledTimes(3);
    });

    it('Does error on error for adding a course.', async () => {
      const params = {
        name: 'TI1234',
        path: null,
        description: 'CourseName',
        subtype: 'course',
      };

      query.mockReset();
      setQueryResultOnce(new Error());

      try {
        await db.asyncCall(db.addGroup, null, params, null);
      } catch (error) {
        expect(query).toHaveBeenCalledTimes(1);
      }
    });

    it('Does use the correct amount of queries for adding an edition.', async () => {
      const params = {
        name: 'Edition2019',
        path: 'Course',
        subtype: 'edition',
      };

      await db.asyncCall(db.addGroup, null, params, 1);
      expect(query).toHaveBeenCalledTimes(3);
    });

    it('Does error on error for adding an edition.', async () => {
      const params = {
        name: 'Edition2019',
        path: 'Course',
        subtype: 'edition',
      };

      query.mockReset();
      setQueryResultOnce(new Error());

      try {
        await db.asyncCall(db.addGroup, null, params, 1);
      } catch (error) {
        expect(query).toHaveBeenCalledTimes(1);
      }
    });

    it('Does use the correct amount of queries for adding a group.', async () => {
      const params = {
        name: 'Group123',
        path: 'Course/Edition',
        subtype: 'group',
      };

      await db.asyncCall(db.addGroup, null, params, 2);
      expect(query).toHaveBeenCalledTimes(3);
    });

    it('Does error on error for adding a group.', async () => {
      const params = {
        name: 'Group123',
        path: 'Course/Edition',
        subtype: 'group',
      };

      query.mockReset();
      setQueryResultOnce(new Error());

      try {
        await db.asyncCall(db.addGroup, null, params, 2);
      } catch (error) {
        expect(query).toHaveBeenCalledTimes(1);
      }
    });

    it('Does error on error for adding a wrong type.', async () => {
      const params = {
        name: 'Group123',
        path: 'Course/Edition',
        subtype: 'not-a-group',
      };

      try {
        await db.asyncCall(db.addGroup, null, params, 2);
      } catch (error) {
        expect(query).toHaveBeenCalledTimes(0);
      }
    });

    it('Does error on error for adding incorrect input.', async () => {
      try {
        await db.asyncCall(db.addGroup, null, {}, null);
      } catch (error) {
        expect(query).toHaveBeenCalledTimes(0);
      }
    });
  });

  describe('renameGroup', () => {
    it('does call the correct queries on group rename', async () => {

      const data = {
        path: 'path/to/group',
        name: 'Henk',
      };
      await db.asyncCall(db.renameGroup, null, data);

      expect(query).toHaveBeenCalledTimes(2);
    });
  });

  describe('renameRepository', () => {
    it('does call the correct queries on repository rename', async () => {

      const data = {
        path: 'path/to/group',
        name: 'Henk',
      };
      await db.asyncCall(db.renameRepository, null, data);

      expect(query).toHaveBeenCalledTimes(2);
    });
  });

  describe('getGroup', () => {
    it('Does use the correct amount of queries for getting a group by id.', async () => {
      const params = {
        id: 1,
      };

      await db.asyncCall(db.getGroup, null, params, null);
      expect(query).toHaveBeenCalledTimes(1);
    });

    it('Does use the correct amount of queries for getting a group by name and path.', async () => {
      const params = {
        name: 'group123',
        path: 'course/edition',
      };

      await db.asyncCall(db.getGroup, null, params, null);
      expect(query).toHaveBeenCalledTimes(1);
    });

    it('Does use the correct amount of queries for getting a group by name and parentId.', async () => {
      const params = {
        name: 'group123',
      };

      await db.asyncCall(db.getGroup, null, params, 2);
      expect(query).toHaveBeenCalledTimes(1);
    });
  });

  describe('addAllGroups', () => {
    it('does add the correct groups', async () => {
      const edition = {
        name: 'edition1',
        path: 'TI1234',
        type: 'group',
        subtype: 'edition',
        children: [],
      };

      const params = {
        name: 'TI1234',
        path: null,
        description: 'CourseName',
        type: 'group',
        subtype: 'course',
        children: [
          edition,
        ],
      };

      query.mockReset();
      setQueryResultOnce(null, []);
      setQueryResultOnce(null, []);
      setQueryResultOnce(null, []);
      setQueryResultOnce(null, [{ id: 1 }]);
      setQueryResultOnce(null, []);
      setQueryResultOnce(null, []);
      setQueryResultOnce(null, []);
      setQueryResultOnce(null, [{ id: 2 }]);

      await db.asyncCall(db.addAllGroups, null, params, null);
      expect(query).toHaveBeenCalledTimes(8);
    });

    it('does add the correct groups', async () => {
      const edition = {
        name: 'edition1',
        path: 'TI1234',
        type: 'group',
        subtype: 'edition',
        children: [],
      };

      const params = {
        name: 'TI1234',
        path: null,
        description: 'CourseName',
        type: 'group',
        subtype: 'course',
        children: [
          edition,
        ],
      };

      query.mockReset();
      setQueryResultOnce(null, []);
      setQueryResultOnce(null, []);
      setQueryResultOnce(null, []);
      setQueryResultOnce(null, [{ id: 1 }]);
      setQueryResultOnce(null, []);
      setQueryResultOnce(null, []);
      setQueryResultOnce(null, []);
      setQueryResultOnce(null, [{ id: 2 }]);

      await db.asyncCall(db.addAllGroups, null, params, null);
      expect(query).toHaveBeenCalledTimes(8);
    });

    it('does add the subtypes correctly', async () => {
      const user = {
        type: 'user',
        name: 'User1',
        path: 'TI1234',
        id: '123456',
        username: 'Uer123',
        email: 'user123@tudelft.nl',
        rights: {
          work: true,
          edit: false,
          share: true,
        },
      };

      const project = {
        type: 'project',
        id: 'ProjectId',
        path: 'TI1234',
        repo: 'www.google.nl',
      };

      const params = {
        name: 'TI1234',
        path: 'Course/Edition',
        type: 'group',
        subtype: 'group',
        children: [
          user,
          project,
        ],
      };

      query.mockReset();
      setQueryResultOnce(null, [{ id: 1 }]);
      setQueryResultOnce(null, []);
      setQueryResultOnce(null, [{ id: 1 }]);
      setQueryResultOnce(null, []);
      setQueryResultOnce(null, []);
      setQueryResultOnce(null, [{ id: 1 }]);
      setQueryResultOnce(null, []);
      setQueryResultOnce(null, []);
      setQueryResultOnce(null, []);
      setQueryResultOnce(null, []);
      setQueryResultOnce(null, []);

      await db.asyncCall(db.addAllGroups, null, params, null);
      expect(query).toHaveBeenCalledTimes(7);
    });

    it('does error correctly', async () => {
      const edition = {
        name: 'edition1',
        path: 'TI1234',
        type: 'group',
        subtype: 'edition',
        children: [],
      };

      const params = {
        name: 'TI1234',
        path: null,
        description: 'CourseName',
        type: 'group',
        subtype: 'course',
        children: [
          edition,
          {
            ...edition,
            name: 'edition2',
          },
        ],
      };

      try {
        await db.asyncCall(db.addAllGroups, null, params, null);
      } catch (error) {
        expect(query).toHaveBeenCalledTimes(4);
      }
    });

    it('does error on incorrect type', async () => {
      const edition = {
        name: 'edition1',
        path: 'TI1234',
        type: 'no-supported-type',
        subtype: 'edition',
        children: [],
      };

      const params = {
        name: 'TI1234',
        path: null,
        description: 'CourseName',
        type: 'group',
        subtype: 'course',
        children: [
          edition,
          {
            ...edition,
            name: 'edition2',
          },
        ],
      };

      query.mockReset();
      setQueryResultOnce(null, []);
      setQueryResultOnce(null, []);
      setQueryResultOnce(null, []);
      setQueryResultOnce(null, [{ id: 1 }]);

      try {
        await db.asyncCall(db.addAllGroups, null, params, null);
      } catch (error) {
        expect(query).toHaveBeenCalledTimes(4);
      }
    });

    it('does handle incorrect input correctly', async () => {
      try {
        await db.asyncCall(db.addAllGroups, null, {}, null);
      } catch (error) {
        expect(query).toHaveBeenCalledTimes(0);
      }
    });
  });

  describe('delete functions', () => {
    describe('delete group', () => {
      it('does delete with id', async () => {
        await db.asyncCall(db.deleteGroup, null, { id: 2 }, null);
        expect(query).toHaveBeenCalledTimes(1);
      });

      it('does delete with name and path', async () => {
        await db.asyncCall(db.deleteGroup, null, { name: 'Group123', path: 'Course' }, null);
        expect(query).toHaveBeenCalledTimes(1);
      });

      it('does delete with name and parentGroupId', async () => {
        await db.asyncCall(db.deleteGroup, null, { name: 'Group123' }, 1);
        expect(query).toHaveBeenCalledTimes(1);
      });

      it('does error with incorrect params', async () => {
        try {
          await db.asyncCall(db.deleteGroup, null, { name: 'Group123' }, null);
        } catch (error) {
          expect(query).toHaveBeenCalledTimes(0);
        }
      });
    });

    describe('delete user', () => {
      it('does delete with parentId', async () => {
        await db.asyncCall(db.deleteUser, null, { id: 2, path: 'Course' }, 1);
        expect(query).toHaveBeenCalledTimes(1);
      });

      it('does delete without parentId', async () => {
        await db.asyncCall(db.deleteUser, null, { id: 2, path: 'Course/Edition' }, null);
        expect(query).toHaveBeenCalledTimes(2);
      });
    });

    describe('delete repository', () => {
      it('does delete with parentId', async () => {
        await db.asyncCall(db.deleteRepository, null, { id: 2, path: 'Course' }, 1);
        expect(query).toHaveBeenCalledTimes(1);
      });

      it('does delete without parentId', async () => {
        await db.asyncCall(db.deleteRepository, null, { id: 2, path: 'Course/Edition' }, null);
        expect(query).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('getCourseList', () => {
    it('does return empty list', async () => {
      const res = await db.asyncCall(db.getCourseList, null, 1);
      expect(res).toHaveLength(0);
      expect(query).toHaveBeenCalledTimes(1);
    });

    it('does make subsequent calls for a course', async () => {
      setQueryResultOnce(null, [1,2,3,4]);
      setQueryResultOnce(null, [{
        id: 0,
        name: 'AB1234',
        path: null,
        description: 'COURSE',
        subtype: 'course',
        parentId: null,
      }]);
      setQueryResultOnce(null, [{
        id: 1,
        name: 'Edition',
        path: null,
        description: null,
        subtype: 'edition',
        parentId: 0,
      }]);
      const res = await db.asyncCall(db.getCourseList, null, 1);
      expect(query).toHaveBeenCalledTimes(3);
      expect(res).toHaveLength(1);
      expect(res).toStrictEqual([{
        editions: ['Edition'],
        id: 'AB1234',
        name: 'COURSE',
      }]);
    });

    it('does pass errors', async () => {
      setQueryResultOnce(null, [{
        id: 0,
        name: 'AB1234',
        path: null,
        description: 'COURSE',
        subtype: 'course',
        parentId: null,
      }]);
      setQueryResultOnce(new Error('Oops'), null);
      try {
        await db.asyncCall(db.getCourseList, null, 1);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(query).toHaveBeenCalledTimes(2);
      }
    });
  });

  describe('createGroupParams', () => {
    it('does throw error on no path and no parentGroupId', () => {
      try {
        db.createGroupParams({}, null, null, () => {});
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
      expect(query).toHaveBeenCalledTimes(0);
    });

    it('does return group on path only', async () => {
      setQueryResultOnce(null, [
        {
          id: 1,
          name: 'AB1234',
          path: null,
          description: 'COURSE',
          subtype: 'course',
          parentId: null,
        }]);
      const ret = await db.asyncCall(db.createGroupParams, null, { name: 'Edition', path: 'AB1234' }, null, 'edition');
      expect(ret).toStrictEqual({
        name: 'Edition',
        parentGroupId: '1',
        path: 'AB1234',
        subtype: 'edition',
      });
      expect(query).toHaveBeenCalledTimes(1);
    });

    it('does return group when it is a subgroup with only parentGroupId given', async () => {
      setQueryResultOnce(null, [
        {
          id: 2,
          name: 'Edition',
          path: 'AB1234',
          description: null,
          subtype: 'edition',
          parentId: null,
        }]);
      const ret = await db.asyncCall(db.createGroupParams, null, { name: 'GroupName' }, 2, 'group');
      expect(ret).toStrictEqual({
        name: 'GroupName',
        parentGroupId: '2',
        path: 'AB1234/Edition',
        subtype: 'group',
      });
      expect(query).toHaveBeenCalledTimes(1);
    });

    it('does return group on parentGroupId only', async () => {
      setQueryResultOnce(null, [
        {
          id: 1,
          name: 'AB1234',
          path: null,
          description: 'COURSE',
          subtype: 'course',
          parentId: null,
        }]);
      const ret = await db.asyncCall(db.createGroupParams, null, { name: 'Edition' }, 1, 'edition');
      expect(ret).toStrictEqual({
        name: 'Edition',
        parentGroupId: '1',
        path: 'AB1234',
        subtype: 'edition',
      });
      expect(query).toHaveBeenCalledTimes(1);
    });

    it('does return undefined on database error', async () => {
      setQueryResultOnce(new Error('Oops'), null);
      let ret;
      try {
        ret = await db.asyncCall(db.createGroupParams, null, { name: 'Edition', path: 'Course' }, null, 'edition');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
      expect(ret).toBeUndefined();
      expect(query).toHaveBeenCalledTimes(1);
    });

    it('does throw error when parent group cannot be found', async () => {
      setQueryResultOnce(null, []);
      let ret;
      try {
        ret = await db.asyncCall(db.createGroupParams, null, { name: 'Edition', path: 'Course' }, null, 'edition');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
      expect(ret).toBeUndefined();
      expect(query).toHaveBeenCalledTimes(1);
    });
  });

  describe('getAllGroups', () => {
    it('does throw error when no path and parentGroupId are given for a non-course', async () => {
      let ret;
      try {
        ret = await db.asyncCall(db.getAllGroups, null, { name: 'AB1234', subtype: 'group' }, null);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
      expect(ret).toBeUndefined();
      expect(query).toHaveBeenCalledTimes(0);
    });

    it('does return empty course', async () => {
      setQueryResultOnce(null, [{
        id: 1,
        name: 'AB1234',
        path: null,
        description: 'COURSE',
        subtype: 'course',
        parentId: null,
      }]);
      const ret = await db.asyncCall(db.getAllGroups, null, { name: 'AB1234', subtype: 'course' }, 0);
      expect(ret).toStrictEqual({
        children: [], description: 'COURSE', id: '1', name: 'AB1234', parentId: null, path: null, subtype: 'course', type: 'group',
      });
      expect(query).toHaveBeenCalledTimes(4);
    });

    it('does throw error on database error for group query', async () => {
      setQueryResultOnce(new Error('Oops'), null);
      let ret;
      try {
        ret = await db.asyncCall(db.getAllGroups, null, { name: 'AB1234', subtype: 'course' }, 0);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
      expect(ret).toBeUndefined();
      expect(query).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateApiKey', () => {
    it('does update on non existing admin', async () => {
      query.mockReset();
      setQueryResultOnce(null, []);
      setQueryResultOnce(null, []);
      setQueryResultOnce(null, []);
      setQueryResultOnce(null, [{}]);
      await db.asyncCall(db.updateApiKey, null, 'mail', 'token');
      expect(query).toHaveBeenCalledTimes(4);
    });

    it('does update on existing admin', async () => {
      query.mockReset();
      setQueryResultOnce(null, [{ id: 2 }]);
      setQueryResultOnce(null, []);
      setQueryResultOnce(null, [{ gitlabApiToken: 'token', id: 2 }]);
      await db.asyncCall(db.updateApiKey, null, 'mail', 'token');

      expect(query).toHaveBeenCalledTimes(3);
    });

    it('does error on wrong updated token', async () => {
      query.mockReset();
      setQueryResultOnce(null, [{ id: 2 }]);
      setQueryResultOnce(null, []);
      setQueryResultOnce(null, [{ gitlabApiToken: 'token2', id: 2 }]);
      try {
        await db.asyncCall(db.updateApiKey, null, 'mail', 'token');
      } catch (error) {
        expect(query).toHaveBeenCalledTimes(3);
      }
    });

    it('does error incorrect get request', async () => {
      query.mockReset();
      setQueryResultOnce(null, []);
      setQueryResultOnce(new Error('Wrong get request'), null);
      setQueryResultOnce(null, []);
      setQueryResultOnce(null, [{}]);
      try {
        await db.asyncCall(db.updateApiKey, null, 'mail', 'token');
      } catch (error) {
        expect(query).toHaveBeenCalledTimes(2);
      }
    });

    it('does error on deleted admin', async () => {
      query.mockReset();
      setQueryResultOnce(null, [{ id: 2 }]);
      setQueryResultOnce(null, []);
      setQueryResultOnce(null, []);
      try {
        await db.asyncCall(db.updateApiKey, null, 'mail', 'token');
      } catch (error) {
        expect(query).toHaveBeenCalledTimes(3);
      }
    });

    it('does error on incorrect input', async () => {
      try {
        db.asyncCall(db.updateApiKey, null, null, null);
      } catch (error) {
        expect(query).toHaveBeenCalledTimes(0);
      }
    });
  });
});
