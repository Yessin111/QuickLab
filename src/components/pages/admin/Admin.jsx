import React from 'react';
import { Route, Switch, Redirect } from 'react-router-dom';

import CourseSetup from './adminpages/CourseSetup';
import CourseSubmit from './adminpages/CourseSubmit';
import CourseData from './adminpages/CourseData';
import ImportCSV from './adminpages/ImportCSV';
import AdminLayout from './AdminLayout';
import AdminHome from './adminpages/AdminHome';
import TaForm from './adminpages/TaForm';
import ProjectSettings from './adminpages/ProjectSettings';

/**
 * The Admin page which handles the page switching.
 */
function Admin() {
  return (
    <AdminLayout>
      <Switch>
        <Route path="/tool" exact component={AdminHome} />
        <Route path="/tool/*/*" render={() => (<Redirect to="../404" />)} />
        <Route path="/tool/course-setup" component={CourseSetup} />
        <Route path="/tool/course-submit" component={CourseSubmit} />
        <Route path="/tool/project-settings" component={ProjectSettings} />
        <Route path="/tool/import-csv" component={ImportCSV} />
        <Route path="/tool/course-data" component={CourseData} />
        <Route path="/tool/ta-form" component={TaForm} />
        <Route path="*" render={() => (<Redirect to="../404" />)} />
      </Switch>
    </AdminLayout>
  );
}

export default Admin;
