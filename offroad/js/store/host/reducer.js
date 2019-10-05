import {
    ACTION_SIM_STATE_CHANGED,
    ACTION_NAV_AVAILABILITY_CHANGED,
    ACTION_CONNECTION_STATUS_CHANGED,
    ACTION_THERMAL_DATA_CHANGED,
    ACTION_WIFI_STATE_CHANGED,
    ACTION_DEVICE_IDS_AVAILABLE,
    ACTION_DEVICE_REFRESHED,
    ACTION_HOST_IS_SSH_ENABLED,
    ACTION_DEVICE_IS_PAIRED_CHANGED,
    ACTION_ACCOUNT_CHANGED,
    ACTION_DEVICE_STATS_CHANGED,
    ACTION_UPDATE_IS_AVAILABLE_CHANGED,
} from './actions';
import SimState from './SimState';

const initialHostState = {
    simState: SimState.UNKNOWN,
    isNavAvailable: false,
    isConnected: false,
    thermal: {},
    wifiState: {},
    imei: null,
    serial: null,
    device: null,
    isSshEnabled: false,
    deviceIsPaired: false,
    hasPrime: false,
    deviceStats: {},
    updateIsAvailable: false,
    updateReleaseNotes: "",
};

export default (state = initialHostState, action) => {
    switch (action.type) {
        case ACTION_SIM_STATE_CHANGED:
            return {
                ...state,
                simState: action.simState,
            }
        case ACTION_NAV_AVAILABILITY_CHANGED:
            return {
                ...state,
                isNavAvailable: action.isNavAvailable,
            }
        case ACTION_CONNECTION_STATUS_CHANGED:
            return {
                ...state,
                isConnected: action.isConnected,
            }
        case ACTION_THERMAL_DATA_CHANGED:
            return {
                ...state,
                thermal: action.thermalData,
            }
        case ACTION_WIFI_STATE_CHANGED:
            return {
                ...state,
                wifiState: action.wifiState,
            }
        case ACTION_DEVICE_IDS_AVAILABLE:
            return {
                ...state,
                imei: action.imei,
                serial: action.serial,
            }
        case ACTION_DEVICE_REFRESHED:
            return {
                ...state,
                device: action.device,
            }
        case ACTION_HOST_IS_SSH_ENABLED:
            return {
                ...state,
                isSshEnabled: action.isSshEnabled,
            }
        case ACTION_DEVICE_IS_PAIRED_CHANGED:
            return {
                ...state,
                deviceIsPaired: action.deviceIsPaired,
            }
        case ACTION_ACCOUNT_CHANGED:
            return {
                ...state,
                account: action.account,
            }
        case ACTION_DEVICE_STATS_CHANGED:
            return {
                ...state,
                deviceStats: action.deviceStats,
            }
        case ACTION_UPDATE_IS_AVAILABLE_CHANGED:
            return {
                ...state,
                updateIsAvailable: action.updateIsAvailable,
                updateReleaseNotes: action.updateReleaseNotes,
            }
        default:
            return state;
    }
}