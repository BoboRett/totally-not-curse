import { HashRouter as Router, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import React from 'react';
import ReactDOM from 'react-dom';
// eslint-disable-next-line no-unused-vars
import _ from 'lodash';

import App from './app';
import createStore from './store/redux-store';

const store = createStore();
window.store = store;

window.addEventListener('DOMContentLoaded', () => {
    ReactDOM.render(
        <Provider store={store}>
            <Router>
                <Route path="/">
                    <App />
                </Route>
            </Router>
        </Provider>,
    document.querySelector('.root'));
});
