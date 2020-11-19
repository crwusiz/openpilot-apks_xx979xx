import React, { Component } from 'react';
import { ActivityIndicator, Alert, ScrollView, TextInput, View } from 'react-native';
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
                gitRemote: null,                
                gitBranch: null,
                gitCommit: null,
            },
            speedLimitOffsetInt: '0',
            githubUsername: '',
            authKeysUpdateState: null,
            gitPullOnProgress : false,            
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

    handleGitPullButtonClick() {
        this.setState({gitPullOnProgress:true});
        Alert.alert('Git pull', 'commit하지 않은 모든 수정사항이 사라집니다.', [            
            { text: '취소', onPress: () => {this.setState({gitPullOnProgress:false}); }, style: 'cancel' },
            { text: 'Git pull & 재부팅', onPress: () => {this.setState({gitPullOnProgress:true}); ChffrPlus.processGitPullandReboot();} },            
        ],
        { cancelable: false },
        );
    }

    handlePressedResetCalibration = async () => {
        this.props.deleteParam(Params.KEY_CALIBRATION_PARAMS);
        this.props.deleteParam(Params.KEY_LIVE_PARAMETERS);
        this.setState({ calibration: null });
        Alert.alert('재부팅', '캘리브레이션 작업을위해서는 재부팅이 필요합니다.', [
            { text: '취소', onPress: () => {}, style: 'cancel' },
            { text: '재부팅', onPress: () => ChffrPlus.reboot() },
        ]);        
    }

    handlePressedMakePrebuilt() {
        this.props.setPrebuiltOn(1)
        ChffrPlus.makePrebuilt()

    }
    handlePressedDeletePrebuilt() {
        this.props.setPrebuiltOn(0)
        ChffrPlus.deletePrebuilt()
    }

    handlePressedUpdatePanda = async () => {
        Alert.alert('판다 플래싱', '판다 플래싱을 실행합니다. 진행되는 동안 판다 LED가 녹색으로 빠르게 깜빡일 것이며, 플래싱이 완료되면 재부팅을 합니다.', [
            { text: '취소', onPress: () => {}, style: 'cancel' },
            { text: '실행', onPress: () => ChffrPlus.updatePandaFirmware() },
        ]);
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
        const software = !!parseInt(isPassive) ? '대시캠' : '오픈파일럿';
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
                context: `${ parseInt(freeSpace) + '%' } 여유`,
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
                                description='오픈파일럿 기능을 사용하여 자동조향 기능을 사용해보세요. 이 기능은 항상 주의를 기울여야 합니다.'
                                isExpanded={ expandedCell == 'openpilot_enabled' }
                                handleExpanded={ () => this.handleExpanded('openpilot_enabled') }
                                handleChanged={ this.props.setOpenpilotEnabled } />
                        ) : null }
                        <X.TableCell
                            type='switch'
                            title='미터법 사용'
                            value={ !!parseInt(isMetric) }
                            iconSource={ Icons.metric }
                            description='주행속도표시를 km/h로 변경합니다'
                            isExpanded={ expandedCell == 'metric' }
                            handleExpanded={ () => this.handleExpanded('metric') }
                            handleChanged={ this.props.setMetric } />                        
                        { !parseInt(isPassive) ? (
                            <X.TableCell
                                type='switch'
                                title='차선변경 사용'
                                value={ !!parseInt(laneChangeEnabled) }
                                iconSource={ Icons.road }
                                description='60km 이상의 속도로 주행시 방향지시등을 켜고 핸들을 원하는 차선 쪽으로 부드럽게 돌려주면 오픈파일럿이 차선변경을 수행합니다. 후측방 감지기가 없는 차량은 차선이 안전한지 확인할 수 없으니 주의하세요'
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
                            title='운전자 모니터링 기록 사용'
                            value={ !!parseInt(recordFront) }
                            iconSource={ Icons.network }
                            description='운전자 모니터링 카메라 데이터를 기록하고 운전자 모니터링 알고리즘개선에 참여하세요'
                            isExpanded={ expandedCell == 'record_front' }
                            handleExpanded={ () => this.handleExpanded('record_front') }
                            handleChanged={ this.props.setRecordFront } />
                      </X.Table>
                      {/*
                        <X.TableCell
                            type='switch'
                            title='우측 핸들 사용'
                            value={ !!parseInt(isRHD) }
                            iconSource={ Icons.openpilot_mirrored }
                            description='오픈파일럿이 좌측 교통 규칙을 준수하도록 허용하고 우측 운전석의 운전자 모니터링을 수행합니다'
                            isExpanded={ expandedCell == 'is_rhd' }
                            handleExpanded={ () => this.handleExpanded('is_rhd') }
                            handleChanged={ this.props.setIsRHD } />                      
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
                                value={ isPaired ? '페어링됨' : '페어링안됨' } />
                            { isPaired ? (
                                <X.Text
                                    color='white'
                                    size='tiny'>
                                    comma connect 앱에서 페어링을 해제할수 있습니다
                                </X.Text>
                            ) : null }
                            <X.Line color='light' />
                            <X.Text
                                color='white'
                                size='tiny'>
                                서비스 이용 약관은 {'https://my.comma.ai/terms.html'} 에서 확인하세요.
                            </X.Text>
                        </X.Table>
                        { isPaired ? null : (
                            <X.Table color='darkBlue' padding='big'>
                                <X.Button
                                    color='settingsDefault'
                                    size='small'
                                    onPress={ this.props.openPairing }>
                                    페어링 설정
                                </X.Button>
                            </X.Table>
                        ) }
                    </View>
                </ScrollView>
            </View>
        )
    }

    calib_description(params){
      var text = '오픈파일럿은 장치를 왼쪽,오른쪽은 4˚ 이내에 장착하고 위,아래는 5˚ 이내에 장착해야 합니다. 오픈파일럿이 계속 보정 중이므로 재설정이 필요한 경우는 처음 셋팅 이외에는 거의 없습니다.';
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
          var pitch_str = Math.abs(pitch).toFixed(1).concat('˚ 위')
        } else {
          var pitch_str = Math.abs(pitch).toFixed(1).concat('˚ 아래')
        }
        if (yaw > 0) {
          var yaw_str = Math.abs(yaw).toFixed(1).concat('˚ 오른쪽에')
        } else {
          var yaw_str = Math.abs(yaw).toFixed(1).concat('˚ 왼쪽에')
        }
        text = text.concat('\n\n장치가', pitch_str, ' 그리고 ', yaw_str, ' 위치해 있습니다. ')
      }
      return text;
    }

    renderDeviceSettings() {
        const { expandedCell } = this.state;
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
        const software = !!parseInt(isPassive) ? '대시캠' : '오픈파일럿';
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
                            description={ this.calib_description(calibrationParams) }
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
                        <X.TableCell
                            type='custom'
                            title='운전자 모니터링'
                            iconSource={ Icons.monitoring }
                            description='최상의 운전자 모니터링 환경을 위해 운전자 모니터링 카메라를 미리보고 최적의 장착위치를 찾아보세요.'
                            isExpanded={ expandedCell == 'driver_view_enabled' }
                            handleExpanded={ () => this.handleExpanded('driver_view_enabled') } >
                            <X.Button
                                size='tiny'
                                color='settingsDefault'
                                isDisabled={ !isOffroad }
                                onPress={ this.props.setIsDriverViewEnabled  }
                                style={ { minWidth: '100%' } }>
                                미리보기
                            </X.Button>
                        </X.TableCell>
                    </X.Table>
                    <X.Table color='darkBlue'>
                        <X.Button
                            size='small'
                            color='settingsDefault'
                            onPress={ () => this.props.reboot() }>
                            시스템 재부팅
                        </X.Button>
                        <X.Line color='transparent' size='tiny' spacing='mini' />                            
                        <X.Button
                            size='small'
                            color='settingsDefault'
                            onPress={ () => this.props.shutdown() }>
                            시스템 종료
                        </X.Button>
                    </X.Table>
                    <X.Table>
                        <X.TableCell
                            title='장치 ID'
                            value={ dongleId } />
                        <X.TableCell
                            title='시리얼 번호'
                            value={ serialNumber } />
                        {/*
                        <X.TableCell
                            title='여유 공간'
                            value={ parseInt(freeSpace) + '%' } />
                        <X.TableCell
                            title='업로드 속도'
                            value={ txSpeedKbps + ' kbps' } />
                        */}                         
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
                            Wifi 설정
                        </X.Button>
                        {/*
                        <X.Line color='transparent' size='tiny' spacing='mini' />
                        <X.Button
                            size='small'
                            color='settingsDefault'
                            onPress={ this.props.openTetheringSettings }>
                            테더링 설정
                        </X.Button>
                        */}
                        <X.Line color='transparent' size='tiny' spacing='mini' />
                        <X.Button
                            size='small'
                            color='settingsDefault'                            
                            onPress={ () => ChffrPlus.openAndroidSettings() }>                                
                            안드로이드 설정
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
                GitRemote: gitRemote,
                GitBranch: gitBranch,
                GitCommit: gitCommit,
                Passive: isPassive,
                PandaFirmwareHex: pandaFirmwareHex,
                PandaDongleId: pandaDongleId,
                CommunityFeaturesToggle: communityFeatures,
                LaneChangeEnabled: laneChangeEnabled,
                LongControlEnabled: longControlEnabled,
                MadModeEnabled: madModeEnabled,
                AutoLaneChangeEnabled: autoLaneChangeEnabled,
                IsPrebuiltOn : isPrebuiltOn,
            },
        } = this.props;
        const { expandedCell, gitPullOnProgress } = this.state;
        const software = !!parseInt(isPassive) ? '대시캠' : '오픈파일럿';
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

                    <X.Table spacing='none'>
                        <X.TableCell
                            title='Git Remote'
                            value={ gitRemote } />                        
                        <X.TableCell
                            title='Git Branch'
                            value={ gitBranch } />
                        <X.TableCell
                            title='Git Commit'
                            value={ gitCommit.slice(0, 7) } />
                        { gitPullOnProgress === true ? (
                            <X.Button
                                size='small'
                                color='settingsDefault'
                                onPress={ () => {} }>
                                Git pull 진행중..
                            </X.Button>
                        ): (
                            <X.Button
                                size='small'
                                color='settingsDefault'
                                onPress={ () => this.handleGitPullButtonClick() }>
                                Git pull 수행
                            </X.Button>
                        )}
                        <X.TableCell
                            type='custom'
                            title='prebuilt 설정'
                            description='prebuilt 파일을 생성하여 부팅시 로딩시간을 줄여줍니다. 재부팅후 적용됩니다.'
                            isExpanded={ expandedCell == 'prebuilt' }
                            handleExpanded={ () => this.handleExpanded('prebuilt') }>
                            {!parseInt(isPrebuiltOn) ? (
                                <X.Button
                                size='tiny'
                                color='settingsDefault'
                                onPress={ () => this.handlePressedMakePrebuilt()  }
                                style={ { minWidth: '100%' } }>
                                생성
                                </X.Button>
                            ) : (
                                <X.Button
                                size='tiny'
                                color='settingsDefault'
                                onPress={ () => this.handlePressedDeletePrebuilt()  }
                                style={ { minWidth: '100%' } }>
                                삭제
                            </X.Button>
                            )}
                        </X.TableCell>                        
                    </X.Table>

                    <X.Table color='darkBlue'>
                        <X.TableCell
                            type='switch'
                            title='SSH 접속 사용'
                            value={ isSshEnabled }
                            iconSource={ Icons.developer }
                            description='SSH를 이용한 장치의 접속을 허용합니다.'
                            isExpanded={ expandedCell == 'ssh' }
                            handleExpanded={ () => this.handleExpanded('ssh') }
                            handleChanged={ this.props.setSshEnabled } />
                        <X.TableCell
                            type='switch'
                            title='커뮤니티기능 사용'
                            value={ !!parseInt(communityFeatures) }
                            iconSource={ Icons.developer }
                            descriptionExtra={
                              <X.Text color='white' size='tiny'>                                  
                                  커뮤니티 기능은 comma에서 공식 지원하지않으며 표준 안전모델 충족기준이 확인되지않았으니 사용시 주의하세요.
                              </X.Text>
                            }
                            isExpanded={ expandedCell == 'communityFeatures' }
                            handleExpanded={ () => this.handleExpanded('communityFeatures') }
                            handleChanged={ this.props.setCommunityFeatures } />                                
                            { !parseInt(isPassive) && !!parseInt(communityFeatures) ? (
                                <X.TableCell
                                    type='switch'
                                    title='Long Control 사용'
                                    value={ !!parseInt(longControlEnabled) }
                                    iconSource={ Icons.openpilot }
                                    description='경고 : 이 기능은 오픈파일럿이 속도를 컨트롤하기때문에 사용시 주의하세요.'
                                    isExpanded={ expandedCell == 'longcontrol_enabled' }
                                    handleExpanded={ () => this.handleExpanded('longcontrol_enabled') }
                                    handleChanged={ this.props.setLongControlEnabled } />
                            ) : null }
                            { !parseInt(isPassive) && !!parseInt(communityFeatures) && !parseInt(longControlEnabled) ? (
                                <X.TableCell
                                    type='switch'
                                    title='MAD 모드 사용'
                                    value={ !!parseInt(madModeEnabled) }
                                    iconSource={ Icons.warning }
                                    description='경고 : 이 기능은 크루즈버튼으로 오픈파일럿이 활성화됩니다.'
                                    isExpanded={ expandedCell == 'madMode_enabled' }
                                    handleExpanded={ () => this.handleExpanded('madMode_enabled') }
                                    handleChanged={ this.props.setMadModeEnabled } />
                            ) : null }
                            { !parseInt(isPassive) && !!parseInt(communityFeatures) && !!parseInt(laneChangeEnabled) ? (
                                <X.TableCell
                                    type='switch'
                                    title='자동차선변경 사용'
                                    value={ !!parseInt(autoLaneChangeEnabled) }
                                    iconSource={ Icons.road }
                                    description='경고 : 이 기능은 안전을위해 후측방감지 옵션이있는 차량만사용하세요.'
                                    isExpanded={ expandedCell == 'autoLaneChange_enabled' }
                                    handleExpanded={ () => this.handleExpanded('autoLaneChange_enabled') }
                                    handleChanged={ this.props.setAutoLaneChangeEnabled } />
                            ) : null }
                    </X.Table>
                               
                        {/*
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
                        */}

                    <X.Table spacing='none'>
                        <X.TableCell
                            title='판다 펌웨어'
                            value={ pandaFirmwareHex != null ? pandaFirmwareHex : '연결안됨' }
                            valueTextSize='tiny' />
                        <X.TableCell
                            title='판다 동글 ID'
                            value={ (pandaDongleId != null && pandaDongleId != "unprovisioned") ? pandaDongleId : '연결안됨' }
                            valueTextSize='tiny' />
                        <X.Button
                            size='small'
                            color='settingsDefault'
                            onPress={ this.handlePressedUpdatePanda  }>
                            판다 플래싱
                        </X.Button>
                    </X.Table>
                    <X.Table color='darkBlue' padding='big'>
                        <X.Button
                            color='settingsDefault'
                            size='small'
                            onPress={ this.props.uninstall }>
                            { `${ software } v${ version } 제거` }
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
                    경고:
                    {'\n'}
                    이렇게 하면 GitHub 설정에 있는 공용 키로 SSH 접속권한이 부여됩니다.
                    {'\n'}
                    자신의 사용자 이름 이외의 GitHub 사용자 이름을 입력하지 마십시오.
                    {'\n'}
                    계속 진행하면 내장된 SSH키가 비활성화 됩니다.
                    {'\n'}
                    COMMA 직원은 절대 GitHub를 추가하라고 하지 않습니다.
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
                                <X.Text color='white' size='tiny'>저장 실패. 사용자 이름과 인터넷에 연결상태를 확인하세요</X.Text>
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
    openAndroidSettings: async () => {
        Layout.emitSidebarCollapsed();
        ChffrPlus.openAndroidSettings();
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
            Alert.alert('커뮤니티 기능 사용', '커뮤니티 기능은 comma에서 공식 지원하지않으며 표준 안전모델 충족기준이 확인되지않았으니 사용시 주의하세요', [
                { text: '취소', onPress: () => {}, style: 'cancel' },
                { text: '사용', onPress: () => {
                    dispatch(updateParam(Params.KEY_COMMUNITY_FEATURES, (communityFeatures | 0).toString()));
                } },
            ]);
        } else {
            dispatch(updateParam(Params.KEY_COMMUNITY_FEATURES, (communityFeatures | 0).toString()));
        }
    },
    setPrebuiltOn: (isPrebuilt) => {
        dispatch(updateParam(Params.KEY_PUT_PREBUILT, (isPrebuilt | 0).toString()));
    },  
    setLaneDepartureWarningEnabled: (isLaneDepartureWarningEnabled) => {
        dispatch(updateParam(Params.KEY_LANE_DEPARTURE_WARNING_ENABLED, (isLaneDepartureWarningEnabled | 0).toString()));
    },
    setLaneChangeEnabled: (laneChangeEnabled) => {
        dispatch(updateParam(Params.KEY_LANE_CHANGE_ENABLED, (laneChangeEnabled | 0).toString()));
    },
    setLongControlEnabled: (longControlEnabled) => {
        dispatch(updateParam(Params.KEY_LONG_CONTROL_ENABLED, (longControlEnabled | 0).toString()));
        if (longControlEnabled == 1) {
          dispatch(updateParam(Params.KEY_MAD_MODE_ENABLED, (0).toString()));
        }
    },
    setMadModeEnabled: (madModeEnabled) => {
        dispatch(updateParam(Params.KEY_MAD_MODE_ENABLED, (madModeEnabled | 0).toString()));
    },
    setAutoLaneChangeEnabled: (autoLaneChangeEnabled) => {
        dispatch(updateParam(Params.KEY_AUTO_LANE_CHANGE_ENABLED, (autoLaneChangeEnabled | 0).toString()));
    },
    deleteParam: (param) => {
        dispatch(deleteParam(param));
    },
    refreshParams: () => {
        dispatch(refreshParams());
    },
});

export default connect(mapStateToProps, mapDispatchToProps)(Settings);
