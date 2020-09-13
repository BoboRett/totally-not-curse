export default {
    reducer: function(state = [], action) {
        switch(action.type) {
            case 'SET_ALL_ADDONS':
                return action.addons;
            default:
                return state;
        }
    },
    init: () => []
};

export function setAddons(addons) {
    return {
        type: 'SET_ALL_ADDONS',
        addons
    };
}
