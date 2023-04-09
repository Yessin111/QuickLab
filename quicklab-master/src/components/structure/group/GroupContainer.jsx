import React from 'react';
import PropTypes from 'prop-types';
import GroupDisplay from './GroupDisplay';

import { checkIntegrity } from '../dataStructures';

function GroupContainer({ groups, functions }) {
  let groupContainer;
  const groupData = {
    ...groups,
    siblings: [],
  };
  if (checkIntegrity('group', groups)) {
    groupContainer = <GroupDisplay key={groups.id} data={groupData} parent="." functions={functions} />;
  } else {
    groupContainer = (
      <span>
        Root object is no group or is corrupted.
        <br />
        Try reloading your data.
      </span>
    );
  }
  return (
    <div className="groupContainer">
      {groupContainer}
    </div>
  );
}

export default GroupContainer;
GroupContainer.propTypes = {
  groups: PropTypes.shape({}).isRequired,
  functions: PropTypes.shape({
    renameGroupData: PropTypes.func.isRequired,
    addGroupData: PropTypes.func.isRequired,
    deleteGroupMember: PropTypes.func.isRequired,
  }).isRequired,
};
