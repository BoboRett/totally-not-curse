import { createStore } from 'redux';

import wowClient from './wow-client';

export default function() {
    const store = createStore(wowClient.reducer, wowClient.init());
    return store;
}
