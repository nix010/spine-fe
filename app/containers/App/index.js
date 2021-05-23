/**
 *
 * App
 *
 * This component is the skeleton around the actual pages, and should only
 * contain code that should be seen on all pages. (e.g. navigation bar)
 */

import React from 'react';
import { Switch, Route, BrowserRouter } from 'react-router-dom';

import GlobalStyle from '../../global-styles';
import routes from 'routes';
import AdminNavbar from '../../components/Navbars/AdminNavbar';
import Footer from '../../components/Footer/Footer';
import Sidebar from '../../components/Sidebar/Sidebar';
import Dashboard from '../Dashboard';

export default function App() {
  const mainPanel = React.useRef(null);
  return (
    <>
      <BrowserRouter>
        <Switch>
          <div className="wrapper">
            <Sidebar routes={routes} />
            <div className="main-panel" ref={mainPanel}>
              <AdminNavbar />
              <div className="content">
                <Route
                  path="/admin"
                  render={props => <Dashboard {...props} />}
                />
              </div>
              <Footer />
            </div>
          </div>
        </Switch>
      </BrowserRouter>
      <GlobalStyle />
    </>
  );
}
