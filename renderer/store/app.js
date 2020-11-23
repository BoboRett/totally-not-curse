export default {
    reducer: function(state = {}, action) {
        switch(action.type) {
            case 'UPDATE_AVAIL':
                return _.assign({}, state, { updateAvailable: action.isAvailable });
            default:
                return state;
        }
    },
    init: () => ({ updateAvailable: false })
};

export function setUpdateAvailable(isAvailable) {
    return {
        type: 'UPDATE_AVAIL',
        isAvailable
    };
}
