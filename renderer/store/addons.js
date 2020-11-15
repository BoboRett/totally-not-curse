export default {
    reducer: function(state = [], action) {
        switch(action.type) {
            case 'ADD_ADDONS':
                return _.uniqBy(_.concat(state, action.addons), 'id');
            case 'REMOVE_ADDON':
                return _.reject(state, addon => addon.id === action.addon.id);
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

export function removeAddon(addon) {
    return {
        type: 'REMOVE_ADDON',
        addon
    };
}

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

export function addAddons(addons) {
    return {
        type: 'ADD_ADDONS',
        addons
    };
}
