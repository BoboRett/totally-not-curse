import { createStore, combineReducers } from 'redux';

import addons from './addons';
import wowClient from './wow-client';
export default function() {
    const store = createStore(
        combineReducers({
            addons: addons.reducer,
            wowClient: wowClient.reducer
        }),
        _.assign({
            addons: addons.init(),
            wowClient: wowClient.init()
        })
    );
    return store;
}
