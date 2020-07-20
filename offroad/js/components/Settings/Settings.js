import React, { Component } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    TextInput,
    View,
} from 'react-native';
import { NavigationActions } from 'react-navigation';
import { connect } from 'react-redux';

import ChffrPlus from '../../native/ChffrPlus';
import Layout from '../../native/Layout';
import UploadProgressTimer from '../../timers/UploadProgressTimer';
import { formatSize } from '../../utils/bytes';
import { mpsToKph, mpsToMph, kphToMps, mphToMps } from '../../utils/conversions';
import { Params } from '../../config';
import { resetToLaunch } from '../../store/nav/actions';

import {
    updateSshEnabled,
} from '../../store/host/actions';
import {
    deleteParam,
    updateParam,
    refreshParams,
} from '../../store/params/actions';

import X from '../../themes';
import Styles from './SettingsStyles';

const SettingsRoutes = {
    PRIMARY: 'PRIMARY',
    ACCOUNT: 'ACCOUNT',
    DEVICE: 'DEVICE',
    NETWORK: 'NETWORK',
    DEVELOPER: 'DEVELOPER',
}

const Icons = {
    user: require('../../img/icon_user.png'),
    developer: require('../../img/icon_shell.png'),
    warning: require('../../img/icon_warning.png'),
    metric: require('../../img/icon_metric.png'),
    network: require('../../img/icon_network.png'),
    eon: require('../../img/icon_eon.png'),
    calibration: require('../../img/icon_calibration.png'),
    speedLimit: require('../../img/icon_speed_limit.png'),
    plus: require('../../img/icon_plus.png'),
    minus: require('../../img/icon_minus.png'),
    mapSpeed: require('../../img/icon_map.png'),
    openpilot: require('../../img/icon_openpilot.png'),
    openpilot_mirrored: require('../../img/icon_openpilot_mirrored.png'),
    monitoring: require('../../img/icon_monitoring.png'),
    road: require('../../img/icon_road.png'),
}

class Settings extends Component {
    static navigationOptions = {
        header: null,
    }

    constructor(props) {
        super(props);

        this.state = {
            route: SettingsRoutes.PRIMARY,
            expandedCell: null,
            version: {
                versionString: '',
                gitBranch: null,
                gitRevision: null,
            },
            speedLimitOffsetInt: '0',
            githubUsername: '',
            authKeysUpdateState: null,
        }

        this.writeSshKeys = this.writeSshKeys.bind(this);
        this.toggleExpandGithubInput = this.toggleExpandGithubInput.bind(this);
    }

    async componentWillMount() {
        UploadProgressTimer.start(this.props.dispatch);
        await this.props.refreshParams();
        const {
            isMetric,
            params: {
                SpeedLimitOffset: speedLimitOffset
            },
        } = this.props;

        if (isMetric) {
            this.setState({ speedLimitOffsetInt: parseInt(mpsToKph(speedLimitOffset)) })
        } else {
            this.setState({ speedLimitOffsetInt: parseInt(mpsToMph(speedLimitOffset)) })
        }
    }

    async componentWillUnmount() {
        await Layout.emitSidebarExpanded();
        UploadProgressTimer.stop();
    }

    handleExpanded(key) {
        const { expandedCell } = this.state;
        return this.setState({
            expandedCell: expandedCell == key ? null : key,
        })
    }

    handlePressedBack() {
        const { route } = this.state;
        if (route == SettingsRoutes.PRIMARY) {
            this.props.goBack();
        } else {
            this.handleNavigatedFromMenu(SettingsRoutes.PRIMARY);
        }
    }

    handleNavigatedFromMenu(route) {
        this.setState({ route: route })
        this.refs.settingsScrollView.scrollTo({ x: 0, y: 0, animated: false })
        this.props.refreshParams();
    }

    handlePressedResetCalibration = async () => {
        this.props.deleteParam(Params.KEY_CALIBRATION_PARAMS);
        this.props.deleteParam(Params.KEY_LIVE_PARAMETERS);
    }

    // handleChangedSpeedLimitOffset(operator) {
    //     const { speedLimitOffset, isMetric } = this.props;
    //     let _speedLimitOffset;
    //     let _speedLimitOffsetInt;
    //     switch (operator) {
    //       case 'increment':
    //           if (isMetric) {
    //               _speedLimitOffset = kphToMps(Math.max(Math.min(speedLimitOffsetInt + 1, 25), -15));
    //               _speedLimitOffsetInt = Math.round(mpsToKph(_speedLimitOffset));
    //           } else {
    //               _speedLimitOffset = mphToMps(Math.max(Math.min(speedLimitOffsetInt + 1, 15), -10));
    //               _speedLimitOffsetInt = Math.round(mpsToMph(_speedLimitOffset));
    //           }
    //           break;
    //       case 'decrement':
    //           if (isMetric) {
    //               _speedLimitOffset = kphToMps(Math.max(Math.min(speedLimitOffsetInt - 1, 25), -15));
    //               _speedLimitOffsetInt = Math.round(mpsToKph(_speedLimitOffset));
    //           } else {
    //               _speedLimitOffset = mphToMps(Math.max(Math.min(speedLimitOffsetInt - 1, 15), -10));
    //               _speedLimitOffsetInt = Math.round(mpsToMph(_speedLimitOffset));
    //           }
    //           break;
    //     }
    //     this.setState({ speedLimitOffsetInt: _speedLimitOffsetInt });
    //     this.props.setSpeedLimitOffset(_speedLimitOffset);
    // }

    // handleChangedIsMetric() {
    //     const { isMetric, speedLimitOffset } = this.props;
    //     const { speedLimitOffsetInt } = this.state;
    //     if (isMetric) {
    //         this.setState({ speedLimitOffsetInt: parseInt(mpsToMph(speedLimitOffset)) })
    //         this.props.setMetric(false);
    //     } else {
    //         this.setState({ speedLimitOffsetInt: parseInt(mpsToKph(speedLimitOffset)) })
    //         this.props.setMetric(true);
    //     }
    // }

    renderSettingsMenu() {
        const {
            isPaired,
            wifiState,
            simState,
            freeSpace,
            params: {
                Passive: isPassive,
                Version: version,
            },
        } = this.props;
        const software = !!parseInt(isPassive) ? 'dashcam' : 'openpilot';
        let connectivity = 'Disconnected'
        if (wifiState.isConnected && wifiState.ssid) {
            connectivity = wifiState.ssid;
        } else if (simState.networkType && simState.networkType != 'NO SIM') {
            connectivity = simState.networkType;
        }
        const settingsMenuItems = [
            {
                icon: Icons.user,
                title: '계정',
                context: isPaired ? '페어링됨' : '페어링안됨',
                route: SettingsRoutes.ACCOUNT,
            },
            {
                icon: Icons.eon,
                title: '장치',
                context: `${ parseInt(freeSpace) + '%' } Free`,
                route: SettingsRoutes.DEVICE,
            },
            {
                icon: Icons.network,
                title: '네트워크',
                context: connectivity,
                route: SettingsRoutes.NETWORK,
            },
            {
                icon: Icons.developer,
                title: '개발자',
                context: `${ software } v${ version.split('-')[0] }`,
                route: SettingsRoutes.DEVELOPER,
            },
        ];
        return settingsMenuItems.map((item, idx) => {
            const cellButtonStyle = [
              Styles.settingsMenuItem,
              idx == 3 ? Styles.settingsMenuItemBorderless : null,
            ]
            return (
                <View key={ idx } style={ cellButtonStyle }>
                    <X.Button
                        color='transparent'
                        size='full'
                        style={ Styles.settingsMenuItemButton }
                        onPress={ () => this.handleNavigatedFromMenu(item.route) }>
                        <X.Image
                            source={ item.icon }
                            style={ Styles.settingsMenuItemIcon } />
                        <X.Text
                            color='white'
                            size='small'
                            weight='semibold'
                            style={ Styles.settingsMenuItemTitle }>
                            { item.title }
                        </X.Text>
                        <X.Text
                            color='white'
                            size='tiny'
                            weight='light'
                            style={ Styles.settingsMenuItemContext }>
                            { item.context }
                        </X.Text>
                    </X.Button>
                </View>
            )
        })
    }

    renderPrimarySettings() {
        const {
            params: {
                RecordFront: recordFront,
                IsRHD: isRHD,
                IsMetric: isMetric,
                LongitudinalControl: hasLongitudinalControl,
                LimitSetSpeed: limitSetSpeed,
                SpeedLimitOffset: speedLimitOffset,
                OpenpilotEnabledToggle: openpilotEnabled,
                Passive: isPassive,
                IsLdwEnabled: isLaneDepartureWarningEnabled,
                LaneChangeEnabled: laneChangeEnabled,
            },
        } = this.props;
        const { expandedCell, speedLimitOffsetInt } = this.state;
        return (
            <View style={ Styles.settings }>
                <View style={ Styles.settingsHeader }>
                    <X.Button
                        color='ghost'
                        size='small'
                        onPress={ () => this.handlePressedBack() }>
                        {'<  설정'}
                    </X.Button>
                </View>
                <ScrollView
                    ref="settingsScrollView"
                    style={ Styles.settingsWindow }>
                    <X.Table direction='row' color='darkBlue'>
                        { this.renderSettingsMenu() }
                    </X.Table>
                    <X.Table color='darkBlue'>
                        { !parseInt(isPassive) ? (
                            <X.TableCell
                                type='switch'
                                title='오픈파일럿 사용'
                                value={ !!parseInt(openpilotEnabled) }
                                iconSource={ Icons.openpilot }
                                description='오픈파일럿 기능을 사용하여 핸들자동조향은 지원받으세요. 이 기능을 사용하려면 항상 주의를 기울여야 합니다. 이 설정을 변경하면 차량 재시동후 적용됩니다'
                                isExpanded={ expandedCell == 'openpilot_enabled' }
                                handleExpanded={ () => this.handleExpanded('openpilot_enabled') }
                                handleChanged={ this.props.setOpenpilotEnabled } />
                        ) : null }
                        { !parseInt(isPassive) ? (
                            <X.TableCell
                                type='switch'
                                title='자동차선변경 사용'
                                value={ !!parseInt(laneChangeEnabled) }
                                iconSource={ Icons.road }
                                description='주변 환경을 확인후 방향 지시등을 활성화하고 핸들을 원하는 차선 쪽으로 부드럽게 밀어서 오픈 파일럿으로 자동차선변경을 수행하십시오. 오픈 파일럿은 차선이 안전한지 확인할 수 없습니다. 이 기능을 사용하려면 주변 환경을 지속적으로 관찰해야 합니다'
                                isExpanded={ expandedCell == 'lanechange_enabled' }
                                handleExpanded={ () => this.handleExpanded('lanechange_enabled') }
                                handleChanged={ this.props.setLaneChangeEnabled } />
                        ) : null }
                        <X.TableCell
                            type='switch'
                            title='차선이탈경보 사용'
                            value={ !!parseInt(isLaneDepartureWarningEnabled) }
                            iconSource={ Icons.warning }
                            description='50km 이상의 속도로 주행하는동안 방향지시등 조작없이 차량이 차선을 이탈하면 차선이탈경보를 보냅니다'
                            isExpanded={ expandedCell == 'ldw' }
                            handleExpanded={ () => this.handleExpanded('ldw') }
                            handleChanged={ this.props.setLaneDepartureWarningEnabled } />
                        <X.TableCell
                            type='switch'
                            title='운전자모니터링 기록 및 업로드 사용'
                            value={ !!parseInt(recordFront) }
                            iconSource={ Icons.network }
                            description='운전자 모니터링 카메라 데이터를 업로드하고 운전자 모니터링 알고리즘 개선에 참여하세요'
                            isExpanded={ expandedCell == 'record_front' }
                            handleExpanded={ () => this.handleExpanded('record_front') }
                            handleChanged={ this.props.setRecordFront } />
                        <X.TableCell
                            type='switch'
                            title='우측 핸들 사용'
                            value={ !!parseInt(isRHD) }
                            iconSource={ Icons.openpilot_mirrored }
                            description='오픈 파일럿이 좌측 교통 규칙을 준수하도록 허용하고 우측 운전석에서 운전자 모니터링을 수행합니다'
                            isExpanded={ expandedCell == 'is_rhd' }
                            handleExpanded={ () => this.handleExpanded('is_rhd') }
                            handleChanged={ this.props.setIsRHD } />
                        <X.TableCell
                            type='switch'
                            title='미터법 사용'
                            value={ !!parseInt(isMetric) }
                            iconSource={ Icons.metric }
                            description='주행속도표시를 km/h로 변경합니다'
                            isExpanded={ expandedCell == 'metric' }
                            handleExpanded={ () => this.handleExpanded('metric') }
                            handleChanged={ this.props.setMetric } />
                      </X.Table>
                      {/*
                      <X.Table color='darkBlue'>
                        <X.TableCell
                            type='custom'
                            title='Add Speed Limit Offset'
                            iconSource={ Icons.speedLimit }
                            description='Customize the default speed limit warning with an offset in km/h or mph above the posted legal limit when available.'
                            isExpanded={ expandedCell == 'speedLimitOffset' }
                            handleExpanded={ () => this.handleExpanded('speedLimitOffset') }
                            handleChanged={ this.props.setLimitSetSpeed }>
                            <X.Button
                                color='ghost'
                                activeOpacity={ 1 }
                                style={ Styles.settingsSpeedLimitOffset }>
                                <X.Button
                                    style={ [Styles.settingsNumericButton, { opacity: speedLimitOffsetInt == (isMetric ? -15 : -10) ? 0.1 : 0.8 }] }
                                    onPress={ () => this.handleChangedSpeedLimitOffset('decrement')  }>
                                    <X.Image
                                        source={ Icons.minus }
                                        style={ Styles.settingsNumericIcon } />
                                </X.Button>
                                <X.Text
                                    color='white'
                                    weight='semibold'
                                    style={ Styles.settingsNumericValue }>
                                    { speedLimitOffsetInt }
                                </X.Text>
                                <X.Button
                                    style={ [Styles.settingsNumericButton, { opacity: speedLimitOffsetInt == (isMetric ? 25 : 15) ? 0.1 : 0.8 }] }
                                    onPress={ () => this.handleChangedSpeedLimitOffset('increment') }>
                                    <X.Image
                                        source={ Icons.plus }
                                        style={ Styles.settingsNumericIcon } />
                                </X.Button>
                            </X.Button>
                        </X.TableCell>
                        <X.TableCell
                            type='switch'
                            title='Use Map To Control Vehicle Speed'
                            value={ !!parseInt(limitSetSpeed) }
                            isDisabled={ !parseInt(hasLongitudinalControl) }
                            iconSource={ Icons.mapSpeed }
                            description='Use map data to control the vehicle speed. A curvy road icon appears when the car automatically slows down for upcoming turns. The vehicle speed is also limited by the posted legal limit, when available, including the custom offset. This feature is only available for cars where openpilot manages longitudinal control and when EON has internet connectivity. The map icon appears when map data are downloaded.'
                            isExpanded={ expandedCell == 'limitSetSpeed' }
                            handleExpanded={ () => this.handleExpanded('limitSetSpeed') }
                            handleChanged={ this.props.setLimitSetSpeed } />
                    </X.Table>
                    */}
                    <X.Table color='darkBlue'>
                        <X.Button
                            color='settingsDefault'
                            onPress={ () => this.props.openTrainingGuide() }>
                            트레이닝 가이드 다시보기
                        </X.Button>
                    </X.Table>
                </ScrollView>
            </View>
        )
    }

    renderAccountSettings() {
        const { isPaired } = this.props;
        const { expandedCell } = this.state;
        return (
            <View style={ Styles.settings }>
                <View style={ Styles.settingsHeader }>
                    <X.Button
                        color='ghost'
                        size='small'
                        onPress={ () => this.handlePressedBack() }>
                        {'<  계정 설정'}
                    </X.Button>
                </View>
                <ScrollView
                    ref="settingsScrollView"
                    style={ Styles.settingsWindow }>
                    <View>
                        <X.Table>
                            <X.TableCell
                                title='장치 페어링 상태'
                                value={ isPaired ? '연결됨' : '연결안됨' } />
                            { isPaired ? (
                                <X.Text
                                    color='white'
                                    size='tiny'>
                                    comma connect앱에서 장치 페어링을 해제할수 있습니다
                                </X.Text>
                            ) : null }
                            <X.Line color='light' />
                            <X.Text
                                color='white'
                                size='tiny'>
                                서비스 이용 약관 : {'https://my.comma.ai/terms.html'}
                            </X.Text>
                        </X.Table>
                        { isPaired ? null : (
                            <X.Table color='darkBlue' padding='big'>
                                <X.Button
                                    color='settingsDefault'
                                    size='small'
                                    onPress={ this.props.openPairing }>
                                    장치 페어링설정 
                                </X.Button>
                            </X.Table>
                        ) }
                    </View>
                </ScrollView>
            </View>
        )
    }

    calib_description(params){
      var text = 'openpilot requires the device to be mounted within 4° left or right and within 5° up or down. openpilot is continuously calibrating, resetting is rarely required.';
      if ((params == null) || (params == undefined)) {
        var calib_json = null
      } else {
        var calib_json = JSON.parse(params);
      }
      if ((calib_json != null) && (calib_json.hasOwnProperty('calib_radians'))) {
        var calibArr = (calib_json.calib_radians).toString().split(',');
        var pi = Math.PI;
        var pitch = parseFloat(calibArr[1]) * (180/pi)
        var yaw = parseFloat(calibArr[2]) * (180/pi)
        if (pitch > 0) {
          var pitch_str = Math.abs(pitch).toFixed(1).concat('° up')
        } else {
          var pitch_str = Math.abs(pitch).toFixed(1).concat('° down')
        }
        if (yaw > 0) {
          var yaw_str = Math.abs(yaw).toFixed(1).concat('° right')
        } else {
          var yaw_str = Math.abs(yaw).toFixed(1).concat('° left')
        }
        text = text.concat('\n\nYour device is pointed ', pitch_str, ' and ', yaw_str, '. ')
      }
      return text;
    }

    renderDeviceSettings() {
        const {
            expandedCell,
        } = this.state;

        const {
            serialNumber,
            txSpeedKbps,
            freeSpace,
            isPaired,
            params: {
                DongleId: dongleId,
                Passive: isPassive,
                CalibrationParams: calibrationParams,
            },
            isOffroad,
        } = this.props;
        const software = !!parseInt(isPassive) ? 'dashcam' : 'openpilot';
        return (
            <View style={ Styles.settings }>
                <View style={ Styles.settingsHeader }>
                    <X.Button
                        color='ghost'
                        size='small'
                        onPress={ () => this.handlePressedBack() }>
                        {'<  장치 설정'}
                    </X.Button>
                </View>
                <ScrollView
                    ref="settingsScrollView"
                    style={ Styles.settingsWindow }>
                    <X.Table color='darkBlue'>
                        <X.TableCell
                            type='custom'
                            title='카메라 캘리브레이션'
                            iconSource={ Icons.calibration }
                            description='캘리브레이션 알고리즘은 도로를 비추는 카메라에서 활성화 됩니다. 장치가 잘못된 캘리브레이션 경고를 보내주거나 장치를 다른 위치에 재장착한 경우에만 캘리브레이션 재설정을 권장합니다'
                            isExpanded={ expandedCell == 'calibration' }
                            handleExpanded={ () => this.handleExpanded('calibration') }>
                            <X.Button
                                size='tiny'
                                color='settingsDefault'
                                onPress={ this.handlePressedResetCalibration  }
                                style={ { minWidth: '100%' } }>
                                리셋
                            </X.Button>
                        </X.TableCell>
                    </X.Table>
                    <X.Table color='darkBlue'>
                        <X.TableCell
                            type='custom'
                            title='운전자 모니터링'
                            iconSource={ Icons.monitoring }
                            description='최상의 운전자 모니터링 환경을 위해 장치 장착위치를 최적화하는데 도움이 되도록 드라이버를 마주 보는 카메라를 미리 보십시오.'
                            isExpanded={ expandedCell == 'driver_view_enabled' }
                            handleExpanded={ () => this.handleExpanded('driver_view_enabled') } >
                            <X.Button
                                size='tiny'
                                color='settingsDefault'
                                isDisabled={ !isOffroad }
                                onPress={ this.props.setIsDriverViewEnabled  }
                                style={ { minWidth: '100%' } }>
                                Preview
                            </X.Button>
                        </X.TableCell>
                    </X.Table>
                    <X.Table>
                        <X.TableCell
                            title='페어링'
                            value={ isPaired ? '예' : '아니오' } />
                        <X.TableCell
                            title='동글 ID'
                            value={ dongleId } />
                        <X.TableCell
                            title='시리얼 번호'
                            value={ serialNumber } />
                        <X.TableCell
                            title='남은 용량'
                            value={ parseInt(freeSpace) + '%' }
                             />
                        <X.TableCell
                            title='업로드 속도'
                            value={ txSpeedKbps + ' kbps' }
                             />
                    </X.Table>
                    <X.Table color='darkBlue'>
                        <X.Button
                            size='small'
                            color='settingsDefault'
                            onPress={ () => this.props.reboot() }>
                            재부팅
                        </X.Button>
                        <X.Line color='transparent' size='tiny' spacing='mini' />
                        <X.Button
                            size='small'
                            color='settingsDefault'
                            onPress={ () => this.props.shutdown() }>
                            종료
                        </X.Button>
                    </X.Table>
                </ScrollView>
            </View>
        )
    }

    renderNetworkSettings() {
        const { expandedCell } = this.state;
        return (
            <View style={ Styles.settings }>
                <View style={ Styles.settingsHeader }>
                    <X.Button
                        color='ghost'
                        size='small'
                        onPress={ () => this.handlePressedBack() }>
                        {'<  네트워크 설정'}
                    </X.Button>
                </View>
                <ScrollView
                    ref="settingsScrollView"
                    style={ Styles.settingsWindow }>
                    <X.Line color='transparent' spacing='tiny' />
                    <X.Table spacing='big' color='darkBlue'>
                        <X.Button
                            size='small'
                            color='settingsDefault'
                            onPress={ this.props.openWifiSettings }>
                            WiFi설정 열기
                        </X.Button>
                        <X.Line color='transparent' size='tiny' spacing='mini' />
                        <X.Button
                            size='small'
                            color='settingsDefault'
                            onPress={ this.props.openTetheringSettings }>
                            테더링설정 열기
                        </X.Button>
                    </X.Table>
                </ScrollView>
            </View>
        )
    }

    renderDeveloperSettings() {
        const {
            isSshEnabled,
            params: {
                Version: version,
                GitBranch: gitBranch,
                GitCommit: gitRevision,
                Passive: isPassive,
                PandaFirmwareHex: pandaFirmwareHex,
                PandaDongleId: pandaDongleId,
                CommunityFeaturesToggle: communityFeatures,
            },
        } = this.props;
        const { expandedCell } = this.state;
        const software = !!parseInt(isPassive) ? 'dashcam' : 'openpilot';
        return (
            <View style={ Styles.settings }>
                <View style={ Styles.settingsHeader }>
                    <X.Button
                        color='ghost'
                        size='small'
                        onPress={ () => this.handlePressedBack() }>
                        {'<  개발자 설정'}
                    </X.Button>
                </View>
                <ScrollView
                    ref="settingsScrollView"
                    style={ Styles.settingsWindow }>
                    <X.Table color='darkBlue'>
                        <X.TableCell
                            type='switch'
                            title='커뮤니티기능 설정'
                            value={ !!parseInt(communityFeatures) }
                            iconSource={ Icons.developer }
                            descriptionExtra={
                              <X.Text color='white' size='tiny'>
                                  이 기능은 comma에서 공식 지원하지않으며 표준 안전모델 충족기준이 확인되지않은 커뮤니티의 고유 기능입니다 :{'\n'}
                              </X.Text>
                            }
                            isExpanded={ expandedCell == 'communityFeatures' }
                            handleExpanded={ () => this.handleExpanded('communityFeatures') }
                            handleChanged={ this.props.setCommunityFeatures } />
                        <X.TableCell
                            type='switch'
                            title='SSH 사용'
                            value={ isSshEnabled }
                            iconSource={ Icons.developer }
                            description='SSH를 사용한 EON연결 허용'
                            isExpanded={ expandedCell == 'ssh' }
                            handleExpanded={ () => this.handleExpanded('ssh') }
                            handleChanged={ this.props.setSshEnabled } />
                        <X.TableCell
                            iconSource={ Icons.developer }
                            title='인증된 SSH 키'
                            descriptionExtra={ this.renderSshInput() }
                            isExpanded={ expandedCell === 'ssh_keys' }
                            handleExpanded={ this.toggleExpandGithubInput }
                            type='custom'>
                            <X.Button
                                size='tiny'
                                color='settingsDefault'
                                onPress={ this.toggleExpandGithubInput }
                                style={ { minWidth: '100%' } }>
                                { expandedCell === 'ssh_keys' ? '취소' : '편집' }
                            </X.Button>
                        </X.TableCell>
                    </X.Table>
                    <X.Table spacing='none'>
                        <X.TableCell
                            title='버전'
                            value={ `${ software } v${ version }` } />
                        <X.TableCell
                            title='Git 브랜치'
                            value={ gitBranch } />
                        <X.TableCell
                            title='Git 리비전'
                            value={ gitRevision.slice(0, 12) }
                            valueTextSize='tiny' />
                        <X.TableCell
                            title='판다 펌웨어'
                            value={ pandaFirmwareHex != null ? pandaFirmwareHex : 'N/A' }
                            valueTextSize='tiny' />
                        <X.TableCell
                            title='판다 동글 ID'
                            value={ (pandaDongleId != null && pandaDongleId != "unprovisioned") ? pandaDongleId : 'N/A' }
                            valueTextSize='tiny' />
                    </X.Table>
                    <X.Table color='darkBlue' padding='big'>
                        <X.Button
                            color='settingsDefault'
                            size='small'
                            onPress={ this.props.uninstall }>
                            { `${ software } 제거` }
                        </X.Button>
                    </X.Table>
                </ScrollView>
            </View>
        )
    }

    renderSshInput() {
        let { githubUsername, authKeysUpdateState } = this.state;
        let githubUsernameIsValid = githubUsername.match(/[a-zA-Z0-9-]+/) !== null;

        return (
            <View>
                <X.Text color='white' size='tiny'>
                    WARNING:
                    {'\n'}
                    This grants SSH access to all public keys in your GitHub settings.
                    {'\n'}
                    Never enter a GitHub username other than your own.
                    {'\n'}
                    The built-in SSH key will be disabled if you proceed.
                    {'\n'}
                    A comma employee will never ask you to add their GitHub.
                    {'\n'}
                </X.Text>
                <View style={ Styles.githubUsernameInputContainer }>
                    <X.Text
                        color='white'
                        weight='semibold'
                        size='small'
                        style={ Styles.githubUsernameInputLabel }>
                        GitHub 사용자이름
                    </X.Text>
                    <TextInput
                        style={ Styles.githubUsernameInput }
                        onChangeText={ (text) => this.setState({ githubUsername: text, authKeysUpdateState: null })}
                        onFocus={ () => Layout.emitSidebarCollapsed() }
                        onBlur={ () => Layout.emitSidebarExpanded() }
                        value={ githubUsername }
                        ref={ ref => this.githubInput = ref }
                        underlineColorAndroid='transparent'
                    />
                </View>
                <View>
                    <X.Button
                        size='tiny'
                        color='settingsDefault'
                        isDisabled={ !githubUsernameIsValid }
                        onPress={ this.writeSshKeys }
                        style={ Styles.githubUsernameSaveButton }>
                        <X.Text color='white' size='small' style={ Styles.githubUsernameInputSave }>저장</X.Text>
                    </X.Button>
                    { authKeysUpdateState !== null &&
                        <View style={ Styles.githubUsernameInputStatus }>
                            { authKeysUpdateState === 'inflight' &&
                                <ActivityIndicator
                                    color='white'
                                    refreshing={ true }
                                    size={ 37 }
                                    style={ Styles.connectingIndicator } />
                            }
                            { authKeysUpdateState === 'failed' &&
                                <X.Text color='white' size='tiny'>저장 실패. 사용자 이름이 올바르고 인터넷에 연결되어 있는지 확인하세요</X.Text>
                            }
                        </View>
                    }
                    <View style={ Styles.githubSshKeyClearContainer }>
                        <X.Button
                            size='tiny'
                            color='settingsDefault'
                            onPress={ this.clearSshKeys }
                            style={ Styles.githubUsernameSaveButton }>
                            <X.Text color='white' size='small' style={ Styles.githubUsernameInputSave }>모두 제거</X.Text>
                        </X.Button>
                    </View>
                </View>
            </View>
        );
    }

    toggleExpandGithubInput() {
        this.setState({ authKeysUpdateState: null });
        this.handleExpanded('ssh_keys');
    }

    clearSshKeys() {
        ChffrPlus.resetSshKeys();
    }

    async writeSshKeys() {
        let { githubUsername } = this.state;

        try {
            this.setState({ authKeysUpdateState: 'inflight' })
            const resp = await fetch(`https://github.com/${githubUsername}.keys`);
            const githubKeys = (await resp.text());
            if (resp.status !== 200) {
                throw new Error('Non-200 response code from GitHub');
            }

            await ChffrPlus.writeParam(Params.KEY_GITHUB_SSH_KEYS, githubKeys);
            this.toggleExpandGithubInput();
        } catch(err) {
            console.log(err);
            this.setState({ authKeysUpdateState: 'failed' });
        }
    }

    renderSettingsByRoute() {
        const { route } = this.state;
        switch (route) {
            case SettingsRoutes.PRIMARY:
                return this.renderPrimarySettings();
            case SettingsRoutes.ACCOUNT:
                return this.renderAccountSettings();
            case SettingsRoutes.DEVICE:
                return this.renderDeviceSettings();
            case SettingsRoutes.NETWORK:
                return this.renderNetworkSettings();
            case SettingsRoutes.DEVELOPER:
                return this.renderDeveloperSettings();
        }
    }

    render() {
        return (
            <X.Gradient color='dark_blue'>
                { this.renderSettingsByRoute() }
            </X.Gradient>
        )
    }
}

const mapStateToProps = state => ({
    isSshEnabled: state.host.isSshEnabled,
    serialNumber: state.host.serial,
    simState: state.host.simState,
    wifiState: state.host.wifiState,
    isPaired: state.host.device && state.host.device.is_paired,
    isOffroad: state.host.isOffroad,

    // Uploader
    txSpeedKbps: parseInt(state.uploads.txSpeedKbps),
    freeSpace: state.host.thermal.freeSpace,

    params: state.params.params,
});

const mapDispatchToProps = dispatch => ({
    dispatch,
    goBack: async () => {
        await dispatch(resetToLaunch());
        await Layout.goBack();
    },
    openPairing: () => {
        dispatch(NavigationActions.navigate({ routeName: 'SetupQr' }));
    },
    openWifiSettings: async () => {
        await dispatch(NavigationActions.navigate({ routeName: 'SettingsWifi' }));
        Layout.emitSidebarCollapsed();
    },
    openTetheringSettings: async () => {
        Layout.emitSidebarCollapsed();
        ChffrPlus.openTetheringSettings();
    },
    reboot: () => {
        Alert.alert('재부팅', '재부팅하시겠습니까?', [
            { text: '취소', onPress: () => {}, style: 'cancel' },
            { text: '재부팅', onPress: () => ChffrPlus.reboot() },
        ]);
    },
    shutdown: () => {
        Alert.alert('종료', '종료하시겠습니까?', [
            { text: '취소', onPress: () => {}, style: 'cancel' },
            { text: '종료', onPress: () => ChffrPlus.shutdown() },
        ]);
    },
    uninstall: () => {
        Alert.alert('제거', '제거하시겠습니까?', [
            { text: '취소', onPress: () => {}, style: 'cancel' },
            { text: '제거', onPress: () => ChffrPlus.writeParam(Params.KEY_DO_UNINSTALL, "1") },
        ]);
    },
    openTrainingGuide: () => {
        dispatch(NavigationActions.reset({
            index: 0,
            key: null,
            actions: [
                NavigationActions.navigate({ routeName: 'Onboarding' })
            ]
        }))
    },
    setOpenpilotEnabled: (openpilotEnabled) => {
        dispatch(updateParam(Params.KEY_OPENPILOT_ENABLED, (openpilotEnabled | 0).toString()));
    },
    setMetric: (useMetricUnits) => {
        dispatch(updateParam(Params.KEY_IS_METRIC, (useMetricUnits | 0).toString()));
    },
    setRecordFront: (recordFront) => {
        dispatch(updateParam(Params.KEY_RECORD_FRONT, (recordFront | 0).toString()));
    },
    setIsRHD: (isRHD) => {
        dispatch(updateParam(Params.KEY_IS_RHD, (isRHD | 0).toString()));
    },
    setIsDriverViewEnabled: (isDriverViewEnabled) => {
        dispatch(updateParam(Params.KEY_IS_DRIVER_VIEW_ENABLED, (isDriverViewEnabled | 1).toString()));
    },
    setSshEnabled: (isSshEnabled) => {
        dispatch(updateSshEnabled(!!isSshEnabled));
    },
    setHasLongitudinalControl: (hasLongitudinalControl) => {
        dispatch(updateParam(Params.KEY_HAS_LONGITUDINAL_CONTROL, (hasLongitudinalControl | 0).toString()));
    },
    setLimitSetSpeed: (limitSetSpeed) => {
        dispatch(updateParam(Params.KEY_LIMIT_SET_SPEED, (limitSetSpeed | 0).toString()));
    },
    setSpeedLimitOffset: (speedLimitOffset) => {
        dispatch(updateParam(Params.KEY_SPEED_LIMIT_OFFSET, (speedLimitOffset).toString()));
    },
    setCommunityFeatures: (communityFeatures) => {
        if (communityFeatures == 1) { 
            Alert.alert('커뮤니티 기능 사용', '커뮤니티 고유 기능은 comma에서 공식 지원하지않으며 표준 안전모델 충족기준이 확인되지않았으니 사용시 각별히 주의하세요', [
                { text: '취소', onPress: () => {}, style: 'cancel' },
                { text: '사용', onPress: () => {
                    dispatch(updateParam(Params.KEY_COMMUNITY_FEATURES, (communityFeatures | 0).toString()));
                } },
            ]);
        } else {
            dispatch(updateParam(Params.KEY_COMMUNITY_FEATURES, (communityFeatures | 0).toString()));
        }
    },
    setLaneDepartureWarningEnabled: (isLaneDepartureWarningEnabled) => {
        dispatch(updateParam(Params.KEY_LANE_DEPARTURE_WARNING_ENABLED, (isLaneDepartureWarningEnabled | 0).toString()));
    },
    setLaneChangeEnabled: (laneChangeEnabled) => {
        dispatch(updateParam(Params.KEY_LANE_CHANGE_ENABLED, (laneChangeEnabled | 0).toString()));
    },
    deleteParam: (param) => {
        dispatch(deleteParam(param));
    },
    refreshParams: () => {
        dispatch(refreshParams());
    },
});

export default connect(mapStateToProps, mapDispatchToProps)(Settings);
