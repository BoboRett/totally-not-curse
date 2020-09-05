import { Provider } from 'react-redux';
import React from 'react';
import ReactDOM from 'react-dom';
// eslint-disable-next-line no-unused-vars
import _ from 'lodash';

import App from './app';
import createStore from './store/redux-store';

const store = createStore();

window.addEventListener('DOMContentLoaded', () => {
    ReactDOM.render(
        <Provider store={store}>
            <App />
        </Provider>,
    document.querySelector('.root'));
});
