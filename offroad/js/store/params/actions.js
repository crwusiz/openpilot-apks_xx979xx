import ChffrPlus from '../../native/ChffrPlus';
import { Params } from '../../config';

export const ACTION_PARAM_CHANGED = 'ACTION_PARAM_CHANGED';
export const ACTION_PARAM_DELETED = 'ACTION_PARAM_DELETED';

const PARAMS = [
  "AccessToken",
  "CalibrationParams",
  "CompletedTrainingVersion",
  "ControlsParams",
  "DongleId",
  "GitBranch",
  "GitCommit",
  "GitRemote",
  "HasAcceptedTerms",
  "HasCompletedSetup",
  "IsGeofenceEnabled",
  "IsMetric",
  "IsUploadVideoOverCellularEnabled",
  "LimitSetSpeed",
  "LiveParameters",
  "LongitudinalControl",
  "Passive",
  "RecordFront",
  "SpeedLimitOffset",
  "TrainingVersion",
  "Version",
  "OpenpilotEnabledToggle",
  "Offroad_ChargeDisabled",
  "Offroad_TemperatureTooHigh",
  "Offroad_ConnectivityNeededPrompt",
  "Offroad_ConnectivityNeeded",
];

export function refreshParams() {
  return async function(dispatch) {
    await Promise.all(PARAMS.map(function(param) {
      return ChffrPlus.readParam(param).then(function(value) {
        dispatch({ type: ACTION_PARAM_CHANGED, payload: { param, value }});
      });
    }));
  }
}

export function updateParam(param, value) {
  return function(dispatch) {
    dispatch({ type: ACTION_PARAM_CHANGED, payload: { param, value }});
    setTimeout(() => {
      ChffrPlus.writeParam(param, value);
    }, 0);
  }
}

export function deleteParam(param) {
  return function(dispatch) {
    dispatch({ type: ACTION_PARAM_DELETED, payload: { param }});
    setTimeout(function() {
      ChffrPlus.deleteParam(param);
    }, 0);
  }
}