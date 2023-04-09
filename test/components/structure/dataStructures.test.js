import {
  Course, Group, Project, User, checkIntegrity,
} from '../../../src/components/structure/dataStructures';

const id = 'id';
const name = 'name';
const studentId = 'studentId';
const username = 'username';
const email = 'email';
const description = 'description';
const repo = 'repo';

describe('dataStructures', () => {
  describe('checkIntegrity', () => {
    describe('group check', () => {
      it('does return true with correct type', () => {
        const group = Group.createInstance(id);
        expect(checkIntegrity('group', group)).toBeTruthy();
      });

      it('does return false with incorrect type', () => {
        const group = {
          ...Group.createInstance(id),
          type: {},
        };
        expect(checkIntegrity('group', group)).toBeFalsy();
      });
    });

    describe('project check', () => {
      it('does return true with correct type', () => {
        const project = Project.createInstance(id);
        expect(checkIntegrity('project', project)).toBeTruthy();
      });

      it('does return false with incorrect type', () => {
        const project = {
          ...Project.createInstance(id),
          type: {},
        };
        expect(checkIntegrity('project', project)).toBeFalsy();
      });
    });

    describe('user check', () => {
      it('does return true with correct type', () => {
        const user = User.createInstance(id, name, studentId, username, email);
        expect(checkIntegrity('user', user)).toBeTruthy();
      });

      it('does return false with incorrect type', () => {
        const user = {
          ...User.createInstance(id, name, studentId, username, email),
          type: {},
        };
        expect(checkIntegrity('user', user)).toBeFalsy();
      });
    });

    it('does return false on non-existing object type check', () => {
      expect(checkIntegrity('blabla', {})).toBeFalsy();
    });
  });

  describe('Group', () => {
    describe('on success', () => {
      it('does return a group with correct id input', () => {
        const group = Group.createInstance(id);
        expect(group.id).toBe(id);
        expect(group.type).toBe('group');
        expect(group.subtype).toBe('group');
        expect(group.children).toBeInstanceOf(Array);
      });

      it('does return a group with correct id, children input', () => {
        const group = Group.createInstance(id, []);
        expect(group.id).toBe(id);
        expect(group.type).toBe('group');
        expect(group.subtype).toBe('group');
        expect(group.children).toBeInstanceOf(Array);
      });

      it('does return a group with correct id, children, subtype input', () => {
        const group = Group.createInstance(id, [], 'not-a-group');
        expect(group.id).toBe(id);
        expect(group.type).toBe('group');
        expect(group.subtype).toBe('not-a-group');
        expect(group.children).toBeInstanceOf(Array);
      });

      it('does set children when passing an array', () => {
        const group = Group.createInstance(id);
        group.setChildren(['Hello']);
        expect(group.children).toStrictEqual(['Hello']);
      });

      it('does set remove null values of children when passing an array', () => {
        const group = Group.createInstance(id);
        group.setChildren(['Hello', null]);
        expect(group.children).toStrictEqual(['Hello']);
      });
    });

    describe('on failure', () => {
      it('does return null with wrong id', () => {
        const group = Group.createInstance({});
        expect(group).toBeNull();
      });

      it('does return null with wrong children', () => {
        const group = Group.createInstance(id, {});
        expect(group).toBeNull();
      });

      it('does return null with wrong subtype', () => {
        const group = Group.createInstance(id, [], 2);
        expect(group).toBeNull();
      });

      it('does not set children when not passing an array', () => {
        const group = Group.createInstance(id, []);
        group.setChildren(2);
        expect(group.children).toStrictEqual([]);
      });
    });
  });

  describe('Course', () => {
    describe('on success', () => {
      it('does return a course with correct id, name, description input', () => {
        const course = Course.createInstance(id, name);
        expect(course.id).toBe(id);
        expect(course.type).toBe('group');
        expect(course.subtype).toBe('course');
        expect(course.children).toBeInstanceOf(Array);
        expect(course.name).toBe(name);
      });
    });

    describe('on failure', () => {
      it('does return null with wrong id', () => {
        const course = Course.createInstance({}, name);
        expect(course).toBeNull();
      });

      it('does return null with wrong name', () => {
        const course = Course.createInstance(id, {});
        expect(course).toBeNull();
      });
    });
  });

  describe('Project', () => {
    describe('on success', () => {
      it('does return a project with correct id input', () => {
        const project = Project.createInstance(id);
        expect(project.id).toBe(id);
        expect(project.type).toBe('project');
        expect(project.subtype).toBe('project');
        expect(project.children).toBeInstanceOf(Array);
        expect(project.repo).toBe('default');
      });

      it('does return a project with correct id, repo input', () => {
        const project = Project.createInstance(id, repo);
        expect(project.id).toBe(id);
        expect(project.type).toBe('project');
        expect(project.subtype).toBe('project');
        expect(project.children).toBeInstanceOf(Array);
        expect(project.repo).toBe(repo);
      });

      it('does return a project with correct id, repo, children input', () => {
        const project = Project.createInstance(id, repo, []);
        expect(project.id).toBe(id);
        expect(project.type).toBe('project');
        expect(project.subtype).toBe('project');
        expect(project.children).toBeInstanceOf(Array);
        expect(project.repo).toBe(repo);
      });

      it('does return a project with correct id, repo, children, subtype input', () => {
        const project = Project.createInstance(id, repo, [], 'differentProject');
        expect(project.id).toBe(id);
        expect(project.type).toBe('project');
        expect(project.subtype).toBe('differentProject');
        expect(project.children).toBeInstanceOf(Array);
        expect(project.repo).toBe(repo);
      });

      it('does set children when passing an array', () => {
        const project = Project.createInstance(id);
        project.setChildren(['Hello']);
        expect(project.children).toStrictEqual(['Hello']);
      });

      it('does set remove null values of children when passing an array', () => {
        const project = Project.createInstance(id);
        project.setChildren(['Hello', null]);
        expect(project.children).toStrictEqual(['Hello']);
      });
    });

    describe('on failure', () => {
      it('does return null with wrong id', () => {
        const project = Project.createInstance({});
        expect(project).toBeNull();
      });

      it('does return null with wrong repo', () => {
        const project = Project.createInstance(id, {});
        expect(project).toBeNull();
      });

      it('does return null with wrong children', () => {
        const project = Project.createInstance(id, repo, 2);
        expect(project).toBeNull();
      });

      it('does return null with wrong subtype', () => {
        const project = Project.createInstance(id, repo, [], 2);
        expect(project).toBeNull();
      });

      it('does not set children when not passing an array', () => {
        const project = Project.createInstance(id);
        project.setChildren(2);
        expect(project.children).toStrictEqual([]);
      });
    });
  });

  describe('User', () => {
    describe('on success', () => {
      it('does return a project with correct needed input', () => {
        const user = User.createInstance(id, name, username, email);
        expect(user.id).toBe(id);
        expect(user.name).toBe(name);
        expect(user.username).toBe(username);
        expect(user.email).toBe(email);
        expect(user.subtype).toBe('student');
        expect(user.rights).toBeInstanceOf(Object);
      });

      it('does return a project with correct needed, subtype input', () => {
        const user = User.createInstance(
          id,
          name,
          username,
          email,
          'teaching-assistant',
        );
        expect(user.id).toBe(id);
        expect(user.name).toBe(name);
        expect(user.username).toBe(username);
        expect(user.email).toBe(email);
        expect(user.subtype).toBe('teaching-assistant');
        expect(user.rights).toBeInstanceOf(Object);
      });

      it('does return a project with correct needed, subtype, rights input', () => {
        const user = User.createInstance(
          id,
          name,
          username,
          email,
          'teaching-assistant',
          {},
        );
        expect(user.id).toBe(id);
        expect(user.name).toBe(name);
        expect(user.username).toBe(username);
        expect(user.email).toBe(email);
        expect(user.subtype).toBe('teaching-assistant');
        expect(user.rights).toBeInstanceOf(Object);
      });
    });

    describe('on failure', () => {
      it('does return null with wrong id', () => {
        const user = User.createInstance({}, name, username, email);
        expect(user).toBeNull();
      });

      it('does return null with wrong name', () => {
        const user = User.createInstance(id, {}, username, email);
        expect(user).toBeNull();
      });

      it('does return null with wrong username', () => {
        const user = User.createInstance(id, name, {}, email);
        expect(user).toBeNull();
      });

      it('does return null with wrong email', () => {
        const user = User.createInstance(id, name, username, {});
        expect(user).toBeNull();
      });

      it('does return null with wrong subtype', () => {
        const user = User.createInstance(
          id,
          name,
          username,
          email,
          {},
          {},
        );
        expect(user).toBeNull();
      });

      it('does return null with wrong rights', () => {
        const user = User.createInstance(
          id,
          name,
          username,
          email,
          'teaching-assistant',
          2,
        );
        expect(user).toBeNull();
      });
    });
  });
});
