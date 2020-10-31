export default {
    reducer: function(state = [], action) {
        switch(action.type) {
            case 'SET_ALL_ADDONS':
                return action.addons;
            case 'SET_ADDON':
                _.assign(
                    _.find(state, { id: action.addonId }),
                    action.payload
                );
                return _.clone(state);
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

export function setAddon(addonId, payload) {
    return {
        type: 'SET_ADDON',
        addonId,
        payload
    };
}
