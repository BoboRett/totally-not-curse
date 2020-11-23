import { createStore, combineReducers } from 'redux';

import addons from './addons';
import app from './app';
import wowClient from './wow-client';
export default function() {
    const store = createStore(
        combineReducers({
            addons: addons.reducer,
            app: app.reducer,
            wowClient: wowClient.reducer
        }),
        _.assign({
            addons: addons.init(),
            app: app.init(),
            wowClient: wowClient.init()
        })
    );
    return store;
}
