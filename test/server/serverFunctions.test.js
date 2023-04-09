const fns = require('../../src/server/serverFunctions');
const { serverLogger } = require('../../src/server/logger/logger.js');
const db = require('../../src/server/database/database');

jest.mock('../../src/server/database/database');
const getGroup = jest.spyOn(db, 'getGroup');
const getAllGroups = jest.spyOn(db, 'getAllGroups');

beforeAll(() => {
  serverLogger.setSynchronous(true);
});

describe('serverFunctions', () => {
  describe('toServerFormat', () => {
    it('does convert group to server format', () => {
      const sf = fns.toServerFormat({
        id: 'AB1234',
        name: 'course',
        type: 'group',
        subtype: 'course',
        children: [],
      });
      expect(sf)
        .toStrictEqual({
          children: [],
          name: 'AB1234',
          description: 'course',
          type: 'group',
          subtype: 'course',
        });
    });

    it('does convert group with children to server format', () => {
      const sf = fns.toServerFormat({
        id: 'AB1234',
        name: 'course',
        type: 'group',
        subtype: 'course',
        children: [{
          id: 'name',
          type: 'project',
          children: [],
        }],
      });
      expect(sf)
        .toStrictEqual({
          children: [{
            id: 'name',
            path: 'AB1234',
            type: 'project',
            children: [],
          }],
          name: 'AB1234',
          description: 'course',
          type: 'group',
          subtype: 'course',
        });
    });

    it('does convert project to server format', () => {
      const sf = fns.toServerFormat({
        id: 'name',
        type: 'project',
        children: [],
      });
      expect(sf)
        .toStrictEqual({
          children: [],
          id: 'name',
          type: 'project',
        });
    });

    it('does throw error on unknown type', () => {
      try {
        fns.toServerFormat({
          type: 'unknown type',
        });
      } catch (error) {
        expect(error)
          .toBeInstanceOf(Error);
        expect(error.toString())
          .toBe('Error: unknown type');
      }
    });

    it('does convert user to server format', () => {
      const sf = fns.toServerFormat({
        type: 'user',
        id: '#username',
      }, 'path');
      expect(sf)
        .toStrictEqual({
          type: 'user',
          id: 'username',
          path: 'path',
        });
    });
  });

  describe('toClientFormat', () => {
    it('does convert group to client format', () => {
      const sf = fns.toClientFormat({
        children: [],
        name: 'AB1234',
        description: 'course',
        type: 'group',
        subtype: 'course',
      });
      expect(sf)
        .toStrictEqual({
          id: 'AB1234',
          name: 'course',
          type: 'group',
          subtype: 'course',
          children: [],
          default_project_settings: {
            defaultRepo: '',
          },
        });
    });
  });

  describe('toClientFormat', () => {
    it('does convert group with a child to client format', () => {
      const sf = fns.toClientFormat({
        children: [{
          children: [],
          name: 'Edition',
          type: 'group',
          subtype: 'edition',
        }],
        name: 'AB1234',
        description: 'course',
        type: 'group',
        subtype: 'course',
      });
      expect(sf)
        .toStrictEqual({
          id: 'AB1234',
          name: 'course',
          type: 'group',
          subtype: 'course',
          children: [{
            id: 'Edition',
            type: 'group',
            subtype: 'edition',
            children: [],
          }],
          default_project_settings: {
            defaultRepo: '',
          },
        });
    });

    it('does convert group without subtype to client format with default type', () => {
      const sf = fns.toClientFormat({
        children: [],
        name: 'name',
        description: 'course',
        type: 'group',
      });
      expect(sf)
        .toStrictEqual({
          id: 'name',
          type: 'group',
          subtype: 'group',
          children: [],
        });
    });

    it('does convert project to client format', () => {
      const sf = fns.toClientFormat({
        name: 'name',
        repo: 'repo',
        type: 'project',
      });
      expect(sf)
        .toStrictEqual({
          id: 'name',
          repo: 'repo',
          type: 'project',
          subtype: 'project',
          children: [],
        });
    });

    it('does convert project without defined to client format with default repo', () => {
      const sf = fns.toClientFormat({
        name: 'name',
        type: 'project',
      });
      expect(sf)
        .toStrictEqual({
          id: 'name',
          repo: 'default',
          type: 'project',
          subtype: 'project',
          children: [],
        });
    });

    it('does convert user to client format', () => {
      const sf = fns.toClientFormat({
        name: 'name',
        mailAddress: 'mail',
        gitlabUsername: 'username',
        type: 'user',
        subtype: 'ta',
        edit: 1,
        work: 1,
        share: 1,
      });
      expect(sf)
        .toStrictEqual({
          email: 'mail',
          id: 'username',
          name: 'name',
          rights: {
            edit: 1,
            share: 1,
            work: 1,
          },
          subtype: 'ta',
          type: 'user',
          username: 'username',
        });
    });

    it('does convert user without subtype to client format with default subtype', () => {
      const sf = fns.toClientFormat({
        name: 'name',
        mailAddress: 'mail',
        gitlabUsername: 'username',
        type: 'user',
        edit: 1,
        work: 1,
        share: 1,
      });
      expect(sf)
        .toStrictEqual({
          email: 'mail',
          id: 'username',
          name: 'name',
          rights: {
            edit: 1,
            share: 1,
            work: 1,
          },
          subtype: 'student',
          type: 'user',
          username: 'username',
        });
    });

    it('does convert user to client format with alternative rights format', () => {
      const sf = fns.toClientFormat({
        name: 'name',
        mailAddress: 'mail',
        gitlabUsername: 'username',
        type: 'user',
        subtype: 'ta',
        rights: {
          edit: 1,
          work: 1,
          share: 1,
        },
      });
      expect(sf)
        .toStrictEqual({
          email: 'mail',
          id: 'username',
          name: 'name',
          rights: {
            edit: 1,
            share: 1,
            work: 1,
          },
          subtype: 'ta',
          type: 'user',
          username: 'username',
        });
    });

    it('does throw error on unknown type', () => {
      try {
        fns.toClientFormat({
          type: 'unknown type',
        });
      } catch (error) {
        expect(error)
          .toBeInstanceOf(Error);
      }
    });
  });
});

afterAll(() => {
  // Restore the default
  serverLogger.setSynchronous(false);
});
