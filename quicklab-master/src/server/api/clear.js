const api = require('./api');

// ###############################################################################################
// ###                                     !!!  WARNING  !!!                                   ###
// ###    DO NOT ALTER/REMOVE THE FILTER OPTIONS, THIS CAN CLEAR THE WHOLE GITLAB INSTANCE     ###
// ###                                     !!!  WARNING  !!!                                   ###
// ###############################################################################################

async function clear() {
  let groupsPromises = [];
  await api.get_groups().then(async (res) => {
    const { data } = res;
    groupsPromises = data.filter(a => a.id > 33).map(a => api.delete_group(a.id));
  });
  await Promise.all(groupsPromises);

  let projectPromises = [];
  await api.get_all_projects().then(async (res) => {
    const { data } = res;
    projectPromises = data.filter(a => a.id > 123).map(a => api.delete_project_by_id(a.id));
  });
  await Promise.all(projectPromises);

  let userPromises = [];
  await api.get_user_by_username('liteengineering').then(async (res) => {
    const { data } = res;
    userPromises = data.filter(a => a.is_admin === false).map(a => api.delete_user(`${a.id}`));
  });
  await Promise.all(userPromises);
}

clear();
