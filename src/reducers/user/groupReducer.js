import * as types from '../../actions/actionTypes';
import * as projectTypes from '../../components/structure/project/projectTypes';

const initialState = {
  groups: null,
  defaultProjectSettings: {
    type: projectTypes.EMPTY,
    settings: null,
  },
  log: [],
  error: null,
  tas: [],
  headTas: [],
};

/**
 * Can be passed to the array.sort method to sort the children in a group.
 * It prefers groups over projects, and it prefers projects over users.
 */
function groupSorter(a, b) {
  if (a.type === b.type) {
    if (a.type === 'user') {
      return a.name.localeCompare(b.name);
    }
    return a.id.localeCompare(b.id);
  } if ((a.type === 'group' && b.type === 'project')
    || (a.type === 'project' && b.type === 'user')) {
    return -1;
  }
  return 1;
}

/**
 * Sort the group's children recursively.
 * @param {object} group the group to recursively sort.
 */
function recursiveSort(group) {
  if (group.children) {
    const children = group.children.map(child => recursiveSort(child)).sort(groupSorter);
    return {
      ...group,
      children,
    };
  }
  return group;
}


/**
 * Finds the object in the group parameter with the specified path.
 * When it has found the group,
 * it applies the function to the group and returns the new group with the result from the function.
 * @param {string} path the path to look for
 * @param {object} group the group to look in
 * @param {function} func the function to apply on the group when found
 */
function findAndApply(path, group, func) {
  if (path.startsWith('./')) {
    const split = path.split('/');
    if (split[1] === group.id) {
      return findAndApply(split.slice(2).join('/'), group, func);
    }
    return findAndApply(path.substring(2), group, func);
  }
  const ret = group;
  if (!path) {
    return func(ret);
  }
  const split = path.split('/');
  const currentKey = split.shift();
  const restPath = split.join('/');
  return {
    ...group,
    children: group.children.map(
      (child) => {
        if (child.id === currentKey) {
          return findAndApply(restPath, child, func);
        }
        return child;
      },
    ),
  };
}

function getParent(path) {
  const split = path.split('/');
  return split.slice(0, split.length - 1).join('/');
}

/**
 * Function to reduce all data received from the actions.
 *
 * @param {object} state
 * @param {object} action
 */
export default function reducer(state = initialState, action) {
  switch (action.type) {
    case types.GROUP_DATA: {
      const groups = action.payload;
      return {
        ...state,
        groups: recursiveSort(groups),
        log: [
          ...state.log,
          action,
        ],
      };
    }
    case types.RENAME: {
      let exists = false;
      findAndApply(getParent(action.payload.path), state.groups, (parent) => {
        if (parent.children.some(c => c.id === action.payload.name)) {
          exists = true;
        }
        return parent;
      });
      if (exists) {
        window.alert('[WARNING]: A member with this id already exists, please enter a different name');
        return state;
      }
      return {
        ...state,
        groups: recursiveSort(findAndApply(action.payload.path, state.groups,
          child => ({
            ...child,
            id: action.payload.name,
          }))),
        log: [
          ...state.log,
          action,
        ],
      };
    }
    case types.ADD: {
      return {
        ...state,
        groups: findAndApply(action.payload.path, state.groups, parent => ({
          ...parent,
          children: [...parent.children, action.payload.data].sort(groupSorter),
        })),
        log: [
          ...state.log,
          action,
        ],
      };
    }
    case types.RECEIVE_GROUPS: {
      return {
        ...state,
        groups: recursiveSort(action.payload),
        log: [],
      };
    }
    case types.FETCH_GROUPS_ERROR: {
      return {
        ...state,
        error: action.payload,
      };
    }
    case types.DELETE_MEMBER: {
      if (!window.confirm('[WARNING]: Deleting this member cannot be undone. Do you wish to continue?')) {
        return state;
      }
      return {
        ...state,
        groups: findAndApply(action.payload.parent, state.groups,
          g => ({
            ...g,
            children: g.children.filter(m => action.payload.id !== m.id),
          })),
        log: [
          ...state.log,
          action,
        ],
      };
    }
    case 'EDIT_DEFAULT_REPO': {
      return {
        ...state,
        defaultProjectSettings: action.payload,
      };
    }
    case types.UPDATE_TAS: {
      const {
        tas, headTas,
      } = action.payload;
      return {
        ...state, tas, headTas,
      };
    }
    default: {
      return state;
    }
  }
}
