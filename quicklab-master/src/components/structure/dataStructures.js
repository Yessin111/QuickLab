import { logToServer } from '../../actions/actions';

/**
  * Check if the given variable is a non empty String.
  *
  * @param string {String}
  * @return {Boolean}
  */
function isString(string) {
  return string && (typeof (string) === 'string' || string instanceof String);
}

/**
  * Checks the integrity of an object. It checks the object agains the types of
  * a group, user or project.
  *
  * @param type {String}
  * @param obj {Object}
  * @return {Boolean}
  */
export function checkIntegrity(type, obj) {
  switch (type) {
    case 'group': {
      if (!isString(obj.id)) {
        logToServer(new TypeError(`Id is type of ${typeof obj.id} instead of string or is empty.`));
        return false;
      }
      if (!isString(obj.type)) {
        logToServer(
          new TypeError(`Type is type of ${typeof obj.type} instead of string or is empty.`),
        );
        return false;
      }
      if (!isString(obj.subtype)) {
        logToServer(
          new TypeError(`Subtype is type of ${typeof obj.subtype} instead of string or is empty.`),
        );
        return false;
      }
      if (!(obj.children instanceof Array)) {
        logToServer(
          new TypeError(`Children is type of ${typeof obj.children} instead of array.`),
        );
        return false;
      }
      return true;
    }
    case 'project': {
      if (!isString(obj.id)) {
        logToServer(
          new TypeError(`Id is type of ${typeof obj.id} instead of string or is empty.`),
        );
        return false;
      }
      if (!isString(obj.type)) {
        logToServer(
          new TypeError(`Type is type of ${typeof obj.type} instead of string or is empty`),
        );
        return false;
      }
      if (!isString(obj.subtype)) {
        logToServer(
          new TypeError(`Subtype is type of ${typeof obj.subtype} instead of string or is empty`),
        );
        return false;
      }
      if (!isString(obj.repo)) {
        logToServer(
          new TypeError(`Repo is type of ${typeof obj.repo} instead of string or is empty`),
        );
        return false;
      }
      if (!(obj.children instanceof Array)) {
        logToServer(
          new TypeError(`Children is type of ${typeof obj.children} instead of array`),
        );
        return false;
      }
      return true;
    }
    case 'user': {
      if (!isString(obj.id)) {
        logToServer(
          new TypeError(`Id is type of ${typeof obj.id} instead of string or is empty`),
        );
        return false;
      }
      if (!isString(obj.type)) {
        logToServer(
          new TypeError(`Type is type of ${typeof obj.type} instead of string or is empty`),
        );
        return false;
      }
      if (!isString(obj.subtype)) {
        logToServer(
          new TypeError(`Subtype is type of ${typeof obj.subtype} instead of string or is empty`),
        );
        return false;
      }
      if (!isString(obj.name)) {
        logToServer(
          new TypeError(`Name is type of ${typeof obj.repo} instead of string or is empty`),
        );
        return false;
      }
      if (!isString(obj.username)) {
        logToServer(
          new TypeError(`Username is type of ${typeof obj.username} instead of string or is empty`),
        );
        return false;
      }
      if (!isString(obj.email)) {
        logToServer(
          new TypeError(`Email is type of ${typeof obj.email} instead of string or is empty`),
        );
        return false;
      }
      if (!(obj.rights instanceof Object) || obj.rights instanceof Array) {
        logToServer(
          new TypeError(`Rights is type of ${typeof obj.rights} instead of object`),
        );
        return false;
      }
      return true;
    }
    default: {
      return false;
    }
  }
}

/**
  * Group class. Groups have an id, type, subtype and children. For safely
  * creating an instance of a group, use Group.createInstance.
  */
export class Group {
  constructor(id, children, subtype) {
    this.id = id;
    this.type = 'group';
    this.subtype = subtype;
    this.children = children;
  }

  static createInstance(id, children = [], subtype = 'group') {
    const group = new Group(id, children, subtype);
    if (!checkIntegrity('group', group)) {
      return null;
    }
    return group;
  }

  setChildren(array) {
    try {
      if (!(array instanceof Array)) {
        throw new TypeError('Expected type of array as input in the function setChildren.');
      }
      this.children = array.filter(el => el !== null);
    } catch (err) {
      logToServer(err);
    }
  }
}

/**
  * Cource class. A Course is a Group with the extra parameters name and description.
  * To create a Course, use Course.createInstance.
  */
export class Course {
  static createInstance(id, name) {
    const course = Group.createInstance(id, [], 'course');
    if (course && isString(name)) {
      course.name = name;
      return course;
    }
    return null;
  }
}

/**
  * Project class. A project has an id, repo, type, subtype and children. To safely
  * create a Project object, use Project.createInstance.
  */
export class Project {
  constructor(id, repo, children, subtype) {
    this.id = id;
    this.type = 'project';
    this.subtype = subtype;
    this.repo = repo;
    this.children = children;
  }

  static createInstance(id, repo = 'default', children = [], subtype = 'project') {
    const project = new Project(id, repo, children, subtype);
    if (!checkIntegrity('project', project)) {
      return null;
    }
    return project;
  }

  setChildren(array) {
    try {
      if (!(array instanceof Array)) {
        throw new TypeError('Expected type of array as input in the function setChildren.');
      }
      this.children = array.filter(el => el !== null);
    } catch (err) {
      logToServer(err);
    }
  }
}

/**
  * User class. This class contains all the data of an user. If you safely want to
  * create an User, use User.createInstance.
  */
export class User {
  constructor(id, name, username, email, subtype, rights) {
    this.id = id;
    this.name = name;
    this.username = username;
    this.email = email;
    this.type = 'user';
    this.subtype = subtype;
    this.rights = rights;
  }

  static createInstance(id, name, username, email, subtype = 'student', rights = {
    edit: false,
    share: false,
    work: true,
  }) {
    const user = new User(id, name, username, email, subtype, rights);
    if (!checkIntegrity('user', user)) {
      return null;
    }
    return user;
  }
}
