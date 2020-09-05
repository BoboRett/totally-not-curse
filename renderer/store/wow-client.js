export default {
    reducer: function(state, action) {
        switch(action.type) {
            case 'SET_PATHS':
                return _.assign({}, state, { wowPaths: action.paths });
            case 'SET_VERSION':
                return _.assign({}, state, { clientVersion: action.version });
            default:
                return state;
        }
    },
    init: () => ({ wowPaths: {}, clientVersion: 'wow_retail' })
};

export function setPaths(paths) {
    return {
        type: 'SET_PATHS',
        paths
    };
}

export function setVersion(version) {
    return {
        type: 'SET_VERSION',
        version
    };
}
