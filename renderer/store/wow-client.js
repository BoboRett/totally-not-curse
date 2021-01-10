export default {
    reducer: function(state = {}, action) {
        switch(action.type) {
            case 'SET_PATH':
                return _.assign({}, state, { paths: _.assign({}, state.paths, { [action.client]: action.path })});
            case 'SET_PATHS':
                return _.assign({}, state, { paths: action.paths });
            case 'SET_VERSION':
                return _.assign({}, state, { version: action.version });
            default:
                return state;
        }
    },
    init: () => ({ paths: {}, version: 'wow_retail' })
};

export function setPaths(paths) {
    return {
        type: 'SET_PATHS',
        paths
    };
}

export function setPath(client, path) {
    return {
        type: 'SET_PATH',
        client,
        path
    };
}

export function setVersion(version) {
    return {
        type: 'SET_VERSION',
        version
    };
}
