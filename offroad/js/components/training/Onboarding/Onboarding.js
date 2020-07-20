import React, { Component } from 'react';
import { View, Animated } from 'react-native';
import { NavigationActions } from 'react-navigation';
import { connect } from 'react-redux';

import Layout from '../../../native/Layout';
import { completeTrainingStep } from '../step';
import { onTrainingRouteCompleted } from '../../../utils/version';

import X from '../../../themes';
import Styles from './OnboardingStyles';

const Step = {
    OB_SPLASH: 'OB_SPLASH',
    OB_INTRO: 'OB_INTRO',
    OB_SENSORS: 'OB_SENSORS',
    OB_ENGAGE: 'OB_ENGAGE',
    OB_LANECHANGE: 'OB_LANECHANGE',
    OB_DISENGAGE: 'OB_DISENGAGE',
    OB_OUTRO: 'OB_OUTRO',
};

class Onboarding extends Component {
    static navigationOptions = {
        header: null,
    };

    constructor(props) {
        super(props);

        this.state = {
            step: Step.OB_SPLASH,
            stepPoint: 0,
            stepChecks: [],
            engagedMocked: false,
            photoOffset: new Animated.Value(0),
            photoCycled: new Animated.Value(0),
            photoCycledLast: new Animated.Value(0),
            leadEntered: new Animated.Value(0),
            gateHighlighted: new Animated.Value(0),
        };
    }

    componentWillMount() {
        this.handleEngagedMocked(false);
    }

    componentWillUnmount() {
        this.handleEngagedMocked(false);
    }

    setStep(step) {
        this.setState({
            step: '',
            stepChecks: [],
        }, () => {
            return this.setState({ step });
        });
    }

    setStepPoint(stepPoint) {
        this.setState({
            stepPoint: 0,
        }, () => {
            return this.setState({ stepPoint });
        })
    }

    handleRestartPressed = () => {
        this.props.restartTraining();
        this.setStep('OB_SPLASH');
    }

    handleIntroCheckboxPressed(stepCheck) {
        const { stepChecks } = this.state;
        if (stepChecks.indexOf(stepCheck) === -1) {
            const newStepChecks = [...stepChecks, stepCheck];
            this.setState({ stepChecks: newStepChecks });
            if (newStepChecks.length == 3) {
                setTimeout(() => {
                    this.setStep('OB_SENSORS');
                }, 300)
            }
        } else {
            stepChecks.splice(stepChecks.indexOf(stepCheck), 1);
            this.setState({ stepChecks });
        }
    }

    handleSensorRadioPressed(option) {
        switch(option) {
            case 'index':
                this.animatePhotoOffset(0);
                this.animatePhotoCycled(0);
                return this.setStepPoint(0); break;
            case 'camera':
                this.animatePhotoOffset(100);
                this.animatePhotoCycled(0);
                return this.setStepPoint(1); break;
            case 'radar':
                this.animatePhotoOffset(100);
                this.animatePhotoCycled(100);
                this.animateLeadEntered(100);
                return this.setStepPoint(2); break;
        }
    }

    handleEngageRadioPressed(option) {
        switch(option) {
            case 'index':
                this.animatePhotoOffset(0);
                this.animatePhotoCycled(0);
                this.animatePhotoCycledLast(0);
                return this.setStepPoint(0); break;
            case 'cruise':
                this.animatePhotoOffset(100);
                this.animatePhotoCycled(0);
                return this.setStepPoint(1); break;
            case 'monitoring':
                this.animatePhotoOffset(100);
                this.animatePhotoCycled(100);
                return this.setStepPoint(2); break;
        }
    }

    handleLaneChangeRadioPressed(option) {
        switch(option) {
            case 'index':
                this.animatePhotoOffset(0);
                this.animatePhotoCycled(0);
                this.animatePhotoCycledLast(0);
                return this.setStepPoint(0); break;
            case 'start':
                this.animatePhotoOffset(100);
                this.animatePhotoCycled(0);
                this.animatePhotoCycledLast(0);
                return this.setStepPoint(1); break;
            case 'perform':
                this.animatePhotoOffset(0);
                this.animatePhotoCycled(100);
                this.animatePhotoCycledLast(0);
                return this.setStepPoint(2); break;
        }
    }

    handleDisengageRadioPressed(option) {
        switch(option) {
            case 'index':
                this.animatePhotoOffset(0);
                this.animatePhotoCycled(0);
                this.animatePhotoCycledLast(0);
                return this.setStepPoint(0); break;
            case 'limitations':
                this.animatePhotoOffset(100);
                this.animatePhotoCycled(0);
                return this.setStepPoint(1); break;
            case 'disengage':
                this.animatePhotoOffset(100);
                this.animatePhotoCycledLast(100);
                return this.setStepPoint(2); break;
        }
    }

    handleSensorVisualPressed(visual) {
        const { stepChecks } = this.state;
        const hasCheck = (stepChecks.indexOf(visual) > -1);
        if (stepChecks.length > 0 && !hasCheck) {
            this.animatePhotoOffset(0);
            this.setState({ stepChecks: [...stepChecks, visual] });
            this.setStepPoint(0);
            return this.setStep('OB_ENGAGE');
        } else {
            this.setState({ stepChecks: [...stepChecks, visual] });
            switch(visual) {
                case 'camera':
                    this.animatePhotoCycled(100);
                    this.animateLeadEntered(100);
                    return this.setStepPoint(2); break;
                case 'radar':
                    this.animatePhotoOffset(0);
                    this.animateLeadEntered(0);
                    this.animatePhotoCycled(0);
                    this.setStepPoint(0);
                    return this.setStep('OB_ENGAGE'); break;
            }
        }
    }

    handleEngageVisualPressed(visual) {
        const { stepChecks } = this.state;
        const hasCheck = (stepChecks.indexOf(visual) > -1);
        this.setState({ stepChecks: [...stepChecks, visual] });
        switch(visual) {
            case 'cruise':
                this.animatePhotoCycled(100);
                this.handleEngagedMocked(true);
                return this.setStepPoint(2); break;
            case 'monitoring':
                this.animatePhotoOffset(100);
                this.animatePhotoCycled(100);
                this.animatePhotoCycledLast(100);
                this.setStepPoint(0);
                return this.setStep('OB_LANECHANGE'); break;
        }
    }

    handleLaneChangeVisualPressed(visual) {
        const { stepChecks } = this.state;
        const hasCheck = (stepChecks.indexOf(visual) > -1);
        this.setState({ stepChecks: [...stepChecks, visual] });
        switch(visual) {
            case 'start':
                this.animatePhotoOffset(100);
                this.animatePhotoCycled(100);
                this.animatePhotoCycledLast(100);
                return this.setStepPoint(2); break;
            case 'perform':
                this.animatePhotoOffset(100);
                this.animatePhotoCycled(100);
                this.animatePhotoCycledLast(100);
                this.setStepPoint(0);
                return this.setStep('OB_DISENGAGE'); break;
        }
    }

    handleDisengageVisualPressed(visual) {
        const { stepChecks } = this.state;
        const hasCheck = (stepChecks.indexOf(visual) > -1);
        this.setState({ stepChecks: [...stepChecks, visual] });
        switch(visual) {
            case 'limitations':
                this.animatePhotoOffset(100);
                this.animatePhotoCycled(100);
                this.animatePhotoCycledLast(100);
                return this.setStepPoint(2); break;
            case 'disengage':
                this.animatePhotoOffset(0);
                this.animatePhotoCycled(0);
                this.animatePhotoCycledLast(0);
                this.handleEngagedMocked(false);
                this.setStepPoint(0);
                return this.setStep('OB_OUTRO'); break;
        }
    }

    animatePhotoOffset(offset) {
        const { photoOffset } = this.state;
        Animated.timing(
            photoOffset,
            {
                toValue: offset,
                duration: 1000,
            }
        ).start();
    }

    animatePhotoCycled(offset) {
        const { photoCycled } = this.state;
        Animated.timing(
            photoCycled,
            {
                toValue: offset,
                duration: 800,
            }
        ).start();
    }

    animatePhotoCycledLast(offset) {
        const { photoCycledLast } = this.state;
        Animated.timing(
            photoCycledLast,
            {
                toValue: offset,
                duration: 800,
            }
        ).start();
    }

    animateLeadEntered(offset) {
        const { leadEntered } = this.state;
        Animated.timing(
            leadEntered,
            {
                toValue: offset,
                duration: 500,
            }
        ).start();
    }

    animateTouchGateHighlighted(amount) {
        const { gateHighlighted } = this.state;
        Animated.sequence([
          Animated.timing(
            gateHighlighted,
            {
              toValue: amount,
              duration: 300,
            }
          ),
          Animated.timing(
              gateHighlighted,
              {
                  toValue: 0,
                  duration: 500,
              }
          )
        ]).start()
    }

    handleWrongGatePressed() {
        this.animateTouchGateHighlighted(50);
    }

    handleEngagedMocked(shouldMock) {
        this.setState({ engagedMocked: shouldMock })
        Layout.setMockEngaged(shouldMock);
    }

    renderSplashStep() {
        return (
            <X.Entrance style={ Styles.onboardingSplashView }>
                <X.Text
                    size='jumbo' color='white' weight='bold'
                    style={ Styles.onboardingStepHeader }>
                    환영합니다 [ 오픈파일럿 알파 ]
                </X.Text>
                <X.Text
                    color='white' weight='light'
                    style={ Styles.onboardingStepContext }>
                    이제 모든 설치가 완료되었으므로 테스트하기 전에 오픈파일럿의 기능과 한계를 알파 소프트웨어로 이해하는 것이 중요합니다
                </X.Text>
                <View style={ Styles.onboardingPrimaryAction }>
                    <X.Button
                        color='setupPrimary'
                        onPress={ () => this.setStep('OB_INTRO') }>
                        트레이닝 시작
                    </X.Button>
                </View>
            </X.Entrance>
        )
    }

    renderIntroStep() {
        const { stepChecks } = this.state;
        return (
            <X.Entrance style={ Styles.onboardingStep }>
                <View style={ Styles.onboardingStepPoint }>
                    <View style={ Styles.onboardingStepPointChain }>
                        <X.Button
                            size='small' color='ghost'
                            style={ Styles.onboardingStepPointChainPrevious }
                            onPress={ () => this.setStep('OB_SPLASH') }>
                            <X.Image
                                source={ require('../../../img/icon_chevron_right.png') }
                                style={ Styles.onboardingStepPointChainPreviousIcon } />
                        </X.Button>
                        <View style={ Styles.onboardingStepPointChainNumber }>
                            <X.Text color='white' weight='semibold'>
                                1
                            </X.Text>
                        </View>
                    </View>
                    <View style={ Styles.onboardingStepPointBody }>
                        <X.Text size='bigger' color='white' weight='bold'>
                            오픈파일럿은 진보된 운전자 보조 시스템입니다
                        </X.Text>
                        <X.Text
                            size='smallish' color='white' weight='light'
                            style={ Styles.onboardingStepContextSmall }>
                            운전자 지원 시스템은 자율주행 차량이 아닙니다. 이것은 오픈파일럿이 운전자 없이 주행을 하는것이 아니라 운전자와 함께 동작하도록 설계되었다는것을 의미합니다. 운전하려면 항상 주의를 기울여야 합니다
                        </X.Text>
                        <X.CheckboxField
                            size='small'
                            color='white'
                            isChecked={ stepChecks.includes(1) }
                            onPress={ () => this.handleIntroCheckboxPressed(1) }
                            label='나는 항상 도로를 주시하겠습니다.' />
                        <X.CheckboxField
                            size='small'
                            color='white'
                            isChecked={ stepChecks.includes(2) }
                            onPress={ () => this.handleIntroCheckboxPressed(2) }
                            label='나는 언제라도 핸들을 잡을 준비를 하겠습니다.' />
                        <X.CheckboxField
                            size='small'
                            color='white'
                            isChecked={ stepChecks.includes(3) }
                            onPress={ () => this.handleIntroCheckboxPressed(3) }
                            label='나는 언제라도 핸들을 잡을 준비를 하겠습니다!' />
                    </View>
                </View>
            </X.Entrance>
        )
    }

    renderSensorsStepPointIndex() {
        const { stepChecks } = this.state;
        return (
            <View style={ Styles.onboardingStepPoint }>
                <View style={ Styles.onboardingStepPointChain }>
                    <X.Button
                        size='small' color='ghost'
                        style={ Styles.onboardingStepPointChainPrevious }
                        onPress={ () => this.setStep('OB_INTRO') }>
                        <X.Image
                            source={ require('../../../img/icon_chevron_right.png') }
                            style={ Styles.onboardingStepPointChainPreviousIcon } />
                    </X.Button>
                    <View style={ Styles.onboardingStepPointChainNumber }>
                        <X.Text color='white' weight='semibold'>
                            2
                        </X.Text>
                    </View>
                </View>
                <View style={ Styles.onboardingStepPointBody }>
                    <X.Text size='bigger' color='white' weight='bold'>
                        오픈파일럿은 전방의 도로를 보기 위해 여러가지 센서를 사용합니다
                    </X.Text>
                    <X.Text
                        size='smallish' color='white' weight='light'
                        style={ Styles.onboardingStepContextSmall }>
                        차량을 제어하기 위해 어떤 신호를 보내기 전에 센서가 결합되어 도로의 장면을 구성합니다
                    </X.Text>
                    <X.RadioField
                        size='big'
                        color='white'
                        isChecked={ stepChecks.includes('camera') }
                        hasAppend={ true }
                        onPress={ () => this.handleSensorRadioPressed('camera') }
                        label='장치의 카메라' />
                    <X.RadioField
                        size='big'
                        color='white'
                        isDisabled={ !stepChecks.includes('camera') }
                        isChecked={ stepChecks.includes('radar') }
                        hasAppend={ true }
                        onPress={ () => this.handleSensorRadioPressed('radar') }
                        label='차량의 레이더' />
                </View>
            </View>
        )
    }

    renderSensorsStepPointCamera() {
        return (
            <X.Entrance
                transition='fadeInLeft'
                duration={ 1000 }
                style={ Styles.onboardingStepPointSmall }>
                <X.Button
                    size='small' color='ghost' textWeight='light'
                    style={ Styles.onboardingStepPointCrumb }
                    onPress={ () => this.handleSensorRadioPressed('index') }>
                    오픈파일럿 센서
                </X.Button>
                <X.Text size='medium' color='white' weight='bold'>
                    장치의 카메라
                </X.Text>
                <X.Text
                    size='small' color='white' weight='light'
                    style={ Styles.onboardingStepContextSmaller }>
                    비전 알고리즘은 도로를 향한 카메라를 이용하여 운전 경로를 결정합니다
                </X.Text>
                <X.Text
                    size='small' color='white' weight='light'
                    style={ Styles.onboardingStepContextSmaller }>
                    차선을 표시하는선은 차선을 찾는 자신감을 반영하기 위해 다양한 너비로 그려집니다
                </X.Text>
                <X.Button color='ghost'
                    style={ Styles.onboardingStepPointInstruction }
                    onPress={ () => this.animateTouchGateHighlighted(100) }>
                    <X.Text
                        size='small' color='white' weight='semibold'
                        style={ Styles.onboardingStepPointInstructionText }>
                        경로를 선택하세요
                    </X.Text>
                    <X.Image
                      source={ require('../../../img/icon_chevron_right.png') }
                      style={ Styles.onboardingStepPointInstructionIcon } />
                </X.Button>
            </X.Entrance>
        )
    }

    renderSensorsStepPointRadar() {
        return (
            <X.Entrance
                transition='fadeInLeft'
                duration={ 1000 }
                style={ Styles.onboardingStepPointSmall }>
                <X.Button
                    size='small' color='ghost' textWeight='light'
                    style={ Styles.onboardingStepPointCrumb }
                    onPress={ () => this.handleSensorRadioPressed('index') }>
                    오픈파일럿 센서
                </X.Button>
                <X.Text size='medium' color='white' weight='bold'>
                    차량의 레이더
                </X.Text>
                <X.Text
                    size='small' color='white' weight='light'
                    style={ Styles.onboardingStepContextSmaller }>
                    차량에 장착되어있는 레이더는 오픈파일럿의 제어를 위한 앞 차량과의 거리를 측정하는데 도움이 됩니다
                </X.Text>
                <X.Text
                    size='small' color='white' weight='light'
                    style={ Styles.onboardingStepContextSmaller }>
                    이 표시기는 앞차량에 대한 상대적인 속도를 설명하기 위해 빨간색 또는 노란색 중 하나를 나타냅니다
                </X.Text>
                <X.Button color='ghost'
                    style={ Styles.onboardingStepPointInstruction }
                    onPress={ () => this.handleWrongGatePressed() }>
                    <X.Text
                        size='small' color='white' weight='semibold'
                        style={ Styles.onboardingStepPointInstructionText }>
                        앞차량 표시기를 선택하세요
                    </X.Text>
                    <X.Image
                        source={ require('../../../img/icon_chevron_right.png') }
                        style={ Styles.onboardingStepPointInstructionIcon } />
                </X.Button>
            </X.Entrance>
        )
    }

    renderSensorsStep() {
        return (
            <X.Entrance style={ Styles.onboardingStep }>
                { this.renderSensorsStepPoint() }
            </X.Entrance>
        )
    }

    renderEngagingStepPointIndex() {
        const { stepChecks } = this.state;
        return (
            <View style={ Styles.onboardingStepPoint }>
                <View style={ Styles.onboardingStepPointChain }>
                    <X.Button
                        size='small' color='ghost'
                        style={ Styles.onboardingStepPointChainPrevious }
                        onPress={ () => this.setStep('OB_SENSORS') }>
                        <X.Image
                            source={ require('../../../img/icon_chevron_right.png') }
                            style={ Styles.onboardingStepPointChainPreviousIcon } />
                    </X.Button>
                    <View style={ Styles.onboardingStepPointChainNumber }>
                        <X.Text color='white' weight='semibold'>
                            3
                        </X.Text>
                    </View>
                </View>
                <View style={ Styles.onboardingStepPointBody }>
                    <X.Text size='bigger' color='white' weight='bold'>
                        크루즈 컨트롤이 설정되면 오픈파일럿이 활성화 됩니다
                    </X.Text>
                    <X.Text
                        size='smallish' color='white' weight='light'
                        style={ Styles.onboardingStepContext }>
                        크루즈 버튼을 눌러 활성화하고 브레이크를 밟아 해제하십시오
                    </X.Text>
                    <X.RadioField
                        size='big'
                        color='white'
                        isChecked={ stepChecks.includes('cruise') }
                        hasAppend={ true }
                        onPress={ () => this.handleEngageRadioPressed('cruise') }
                        label='오픈파일럿 활성화' />
                    <X.RadioField
                        size='big'
                        color='white'
                        isDisabled={ !stepChecks.includes('cruise') }
                        isChecked={ stepChecks.includes('monitoring') }
                        hasAppend={ true }
                        onPress={ () => this.handleEngageRadioPressed('monitoring') }
                        label='운전자 모니터링' />
                </View>
            </View>
        )
    }

    renderEngagingStepPointEngage() {
        return (
            <X.Entrance
                transition='fadeInLeft'
                duration={ 1000 }
                style={ Styles.onboardingStepPointSmall }>
                <X.Button
                    size='small' color='ghost' textWeight='light'
                    style={ Styles.onboardingStepPointCrumb }
                    onPress={ () => this.handleEngageRadioPressed('index') }>
                    오픈파일럿 활성화
                </X.Button>
                <X.Text size='medium' color='white' weight='bold'>
                    오픈파일럿 활성화
                </X.Text>
                <X.Text
                    size='small' color='white' weight='light'
                    style={ Styles.onboardingStepContextSmaller }>
                    편안한 속도로 오픈파일럿을 작동할 준비가 되면 핸들에서 크루즈 컨트롤을 찾고 "SET"을 눌러 시작하십시오                    
                </X.Text>
                <X.Button color='ghost'
                    style={ Styles.onboardingStepPointInstruction }
                    onPress={ () => this.handleWrongGatePressed() }>
                    <X.Text
                        size='small' color='white' weight='semibold'
                        style={ Styles.onboardingStepPointInstructionText }>
                        화면의 "SET" 을 누르세요
                    </X.Text>
                    <X.Image
                        source={ require('../../../img/icon_chevron_right.png') }
                        style={ Styles.onboardingStepPointInstructionIcon } />
                </X.Button>
            </X.Entrance>
        )
    }

    renderEngagingStepPointMonitoring() {
        return (
            <X.Entrance
                transition='fadeInLeft'
                duration={ 1000 }
                style={ Styles.onboardingStepPointSmall }>
                <X.Entrance>
                    <X.Button
                        size='small' color='ghost' textWeight='light'
                        style={ Styles.onboardingStepPointCrumb }
                        onPress={ () => this.handleEngageRadioPressed('index') }>
                        오픈파일럿 활성화후
                    </X.Button>
                    <X.Text size='medium' color='white' weight='bold'>
                        운전자 모니터링
                    </X.Text>
                    <X.Text
                        size='small' color='white' weight='light'
                        style={ Styles.onboardingStepContextSmaller }>
                        오픈파일럿이 활성화될때는 항상 주의를 기울여야 합니다. 오픈파일럿은 3D 안면 재구성및 포즈로 인지도를 모니터링합니다. 운전자 주의 경고된후 수정될 때까지 오픈파일럿이 해제됩니다
                    </X.Text>
                    <X.Button color='ghost'
                        style={ Styles.onboardingStepPointInstruction }
                        onPress={ () => this.handleWrongGatePressed() }>
                        <X.Text
                            size='small' color='white' weight='semibold'
                            style={ Styles.onboardingStepPointInstructionText }>
                            얼굴을 선택하세요
                        </X.Text>
                        <X.Image
                            source={ require('../../../img/icon_chevron_right.png') }
                            style={ Styles.onboardingStepPointInstructionIcon } />
                    </X.Button>
                </X.Entrance>
            </X.Entrance>
        )
    }

    renderLaneChangeStepPointIndex() {
        const { stepChecks } = this.state;
        return (
            <View style={ Styles.onboardingStepPoint }>
                <View style={ Styles.onboardingStepPointChain }>
                    <X.Button
                        size='small' color='ghost'
                        style={ Styles.onboardingStepPointChainPrevious }
                        onPress={ () => this.setStep('OB_ENGAGE') }>
                        <X.Image
                            source={ require('../../../img/icon_chevron_right.png') }
                            style={ Styles.onboardingStepPointChainPreviousIcon } />
                    </X.Button>
                    <View style={ Styles.onboardingStepPointChainNumber }>
                        <X.Text color='white' weight='semibold'>
                            4
                        </X.Text>
                    </View>
                </View>
                <View style={ Styles.onboardingStepPointBody }>
                    <X.Text size='bigger' color='white' weight='bold'>
                        오픈파일럿은 당신의 도움으로 차선을 바꿀 수 있습니다
                    </X.Text>
                    <X.Text
                        size='smallish' color='white' weight='light'
                        style={ Styles.onboardingStepContextSmall }>
                        오픈파일럿은 차선변경이 안전한지 확인할 수 없습니다. 그러므로 운전자의 주의가 필요합니다. BSD가 없으면 오픈파일럿은 다른 차량이 있는지 여부에 관계없이 차선이 변경될수 있습니다
                    </X.Text>
                    <X.RadioField
                        size='big'
                        color='white'
                        isChecked={ stepChecks.includes('start') }
                        hasAppend={ true }
                        onPress={ () => this.handleLaneChangeRadioPressed('start') }
                        label='차선변경 시작' />
                    <X.RadioField
                        size='big'
                        color='white'
                        isDisabled={ !stepChecks.includes('start') }
                        isChecked={ stepChecks.includes('perform') }
                        hasAppend={ true }
                        onPress={ () => this.handleLaneChangeRadioPressed('perform') }
                        label='차선변경 수행' />
                </View>
            </View>
        )
    }

    renderLaneChangeStepPointStart() {
        return (
            <X.Entrance
                transition='fadeInLeft'
                duration={ 1000 }
                style={ Styles.onboardingStepPointSmall }>
                <X.Entrance>
                    <X.Button
                        size='small' color='ghost' textWeight='light'
                        style={ Styles.onboardingStepPointCrumb }
                        onPress={ () => this.handleLaneChangeRadioPressed('index') }>
                        오픈파일럿 컨트롤
                    </X.Button>
                    <X.Text size='medium' color='white' weight='bold'>
                        차선변경 시작
                    </X.Text>
                    <X.Text
                        size='small' color='white' weight='light'
                        style={ Styles.onboardingStepContextSmaller }>
                        오픈파일럿이 활성화된 상태에서 방향지시등을 커고 주변 환경을 확인하고 차선을 변경해도 안전한지 확인하세요
                    </X.Text>
                    <X.Button color='ghost'
                        style={ Styles.onboardingStepPointInstruction }
                        onPress={ () => this.handleWrongGatePressed() }>
                        <X.Text
                            size='small' color='white' weight='semibold'
                            style={ Styles.onboardingStepPointInstructionText }>
                            방향지시등을 선택하세요
                        </X.Text>
                        <X.Image
                            source={ require('../../../img/icon_chevron_right.png') }
                            style={ Styles.onboardingStepPointInstructionIcon } />
                    </X.Button>
                </X.Entrance>
            </X.Entrance>
        )
    }

    renderLaneChangeStepPointPerform() {
        return (
            <X.Entrance
                transition='fadeInLeft'
                duration={ 1000 }
                style={ Styles.onboardingStepPointSmall }>
                <X.Entrance>
                    <X.Button
                        size='small' color='ghost' textWeight='light'
                        style={ Styles.onboardingStepPointCrumb }
                        onPress={ () => this.handleLaneChangeRadioPressed('index') }>
                        오픈파일럿 차선변경
                    </X.Button>
                    <X.Text size='medium' color='white' weight='bold'>
                        차선변경 수행
                    </X.Text>
                    <X.Text
                        size='small' color='white' weight='light'
                        style={ Styles.onboardingStepContextSmaller }>
                        핸들을 원하는 차선으로 부드럽게 밀어내고 주변 안전을 지속적으로 관찰하세요. 방향지시신호와 핸들조향의 조합으로 오픈파일럿이 차선을 변경하도록 유도할 것입니다
                    </X.Text>
                    <X.Button color='ghost'
                        style={ Styles.onboardingStepPointInstruction }
                        onPress={ () => this.handleWrongGatePressed() }>
                        <X.Text
                            size='small' color='white' weight='semibold'
                            style={ Styles.onboardingStepPointInstructionText }>
                            핸들을 선택하세요
                        </X.Text>
                        <X.Image
                            source={ require('../../../img/icon_chevron_right.png') }
                            style={ Styles.onboardingStepPointInstructionIcon } />
                    </X.Button>
                </X.Entrance>
            </X.Entrance>
        )
    }

    renderDisengagingStepPointIndex() {
        const { stepChecks } = this.state;
        return (
            <View style={ Styles.onboardingStepPoint }>
                <View style={ Styles.onboardingStepPointChain }>
                    <X.Button
                        size='small' color='ghost'
                        style={ Styles.onboardingStepPointChainPrevious }
                        onPress={ () => this.setStep('OB_LANECHANGE') }>
                        <X.Image
                            source={ require('../../../img/icon_chevron_right.png') }
                            style={ Styles.onboardingStepPointChainPreviousIcon } />
                    </X.Button>
                    <View style={ Styles.onboardingStepPointChainNumber }>
                        <X.Text color='white' weight='semibold'>
                            5
                        </X.Text>
                    </View>
                </View>
                <View style={ Styles.onboardingStepPointBody }>
                    <X.Text size='bigger' color='white' weight='bold'>
                        오픈파일럿은 브레이크를 밟으면 비활성화됩니다
                    </X.Text>
                    <X.Text
                        size='smallish' color='white' weight='light'
                        style={ Styles.onboardingStepContextSmall }>
                        잠재적으로 안전하지 않은 상황에 부딪히거나 고속도로를 빠져나갈 때, 브레이크를 밟으면 해제할수 있습니다
                    </X.Text>
                    <X.RadioField
                        size='big'
                        color='white'
                        isChecked={ stepChecks.includes('limitations') }
                        hasAppend={ true }
                        onPress={ () => this.handleDisengageRadioPressed('limitations') }
                        label='제한된 기능' />
                    <X.RadioField
                        size='big'
                        color='white'
                        isDisabled={ !stepChecks.includes('limitations') }
                        isChecked={ stepChecks.includes('disengage') }
                        hasAppend={ true }
                        onPress={ () => this.handleDisengageRadioPressed('disengage') }
                        label='차선변경 수행' />
                </View>
            </View>
        )
    }

    renderDisengagingStepPointLimitations() {
        return (
            <X.Entrance
                transition='fadeInLeft'
                duration={ 1000 }
                style={ Styles.onboardingStepPointSmall }>
                <X.Entrance>
                    <X.Button
                        size='small' color='ghost' textWeight='light'
                        style={ Styles.onboardingStepPointCrumb }
                        onPress={ () => this.handleDisengageRadioPressed('index') }>
                        오픈파일럿 해제
                    </X.Button>
                    <X.Text size='medium' color='white' weight='bold'>
                        제한된 기능
                    </X.Text>
                    <X.Text
                        size='small' color='white' weight='light'
                        style={ Styles.onboardingStepContextSmaller }>
                        어떤 상황은 오픈파일럿에 의해 처리되지 않는다는 것을 명심하세요. 신호등, 정지표지판, 차량 차단기 및 보행자와 같은 경우는 인식되지않고 오픈파일럿이 가속될 수 있습니다
                    </X.Text>
                    <X.Button color='ghost'
                        style={ Styles.onboardingStepPointInstruction }
                        onPress={ () => this.handleWrongGatePressed() }>
                        <X.Text
                            size='small' color='white' weight='semibold'
                            style={ Styles.onboardingStepPointInstructionText }>
                            신호등을 선택하세요
                        </X.Text>
                        <X.Image
                            source={ require('../../../img/icon_chevron_right.png') }
                            style={ Styles.onboardingStepPointInstructionIcon } />
                    </X.Button>
                </X.Entrance>
            </X.Entrance>
        )
    }

    renderDisengagingStepPointDisengage() {
        return (
            <X.Entrance
                transition='fadeInLeft'
                duration={ 1000 }
                style={ Styles.onboardingStepPointSmall }>
                <X.Entrance>
                    <X.Button
                        size='small' color='ghost' textWeight='light'
                        style={ Styles.onboardingStepPointCrumb }
                        onPress={ () => this.handleDisengageRadioPressed('index') }>
                        오픈파일럿 해제
                    </X.Button>
                    <X.Text size='medium' color='white' weight='bold'>
                        오픈파일럿 해제
                    </X.Text>
                    <X.Text
                        size='small' color='white' weight='light'
                        style={ Styles.onboardingStepContextSmaller }>
                        오픈파일럿이 작동 중일 때, 핸들을 조향하기 위해 손을 핸들에 대고 있을 수 있습니다. 핸들 조향 제어는 브레이크를 밟아 해제할 때까지 오픈파일럿에 의해 관리됩니다
                    </X.Text>
                    <X.Button color='ghost'
                        style={ Styles.onboardingStepPointInstruction }
                        onPress={ () => this.handleWrongGatePressed() }>
                        <X.Text
                            size='small' color='white' weight='semibold'
                            style={ Styles.onboardingStepPointInstructionText }>
                            브레이크를 선택하세요
                        </X.Text>
                        <X.Image
                            source={ require('../../../img/icon_chevron_right.png') }
                            style={ Styles.onboardingStepPointInstructionIcon } />
                    </X.Button>
                </X.Entrance>
            </X.Entrance>
        )
    }

    renderEngagingStep() {
        return (
            <X.Entrance style={ Styles.onboardingStep }>
                { this.renderEngagingStepPoint() }
            </X.Entrance>
        )
    }

    renderLaneChangeStep() {
        return (
            <X.Entrance style={ Styles.onboardingStep }>
                { this.renderLaneChangeStepPoint() }
            </X.Entrance>
        )
    }

    renderDisengagingStep() {
        return (
            <X.Entrance style={ Styles.onboardingStep }>
                { this.renderDisengagingStepPoint() }
            </X.Entrance>
        )
    }

    renderOutroStep() {
        return (
            <X.Entrance style={ Styles.onboardingOutroView }>
                <X.Text
                    size='jumbo' color='white' weight='bold'
                    style={ Styles.onboardingStepHeader }>
                    Congratulations! You have completed openpilot training.
                </X.Text>
                <X.Text
                    color='white' weight='light'
                    style={ Styles.onboardingStepContextSmaller }>
                    This guide can be replayed at any time from the
                    device settings. To learn more about openpilot, read the
                    wiki and join the community at discord.comma.ai
                </X.Text>
                <X.Line color='transparent' spacing='small' />
                <View style={ Styles.onboardingActionsRow }>
                    <View style={ Styles.onboardingPrimaryAction }>
                        <X.Button
                            color='setupPrimary'
                            onPress={ this.props.completeTrainingStep }>
                            트레이닝 완료
                        </X.Button>
                    </View>
                    <View style={ Styles.onboardingSecondaryAction }>
                        <X.Button
                            color='setupInverted'
                            textColor='white'
                            onPress={ this.handleRestartPressed }>
                            다시사작
                        </X.Button>
                    </View>
                </View>
            </X.Entrance>
        )
    }

    renderSensorsStepPoint() {
        const { stepPoint } = this.state;
        switch (stepPoint) {
            case 0:
                return this.renderSensorsStepPointIndex(); break;
            case 1:
                return this.renderSensorsStepPointCamera(); break;
            case 2:
                return this.renderSensorsStepPointRadar(); break;
        }
    }

    renderEngagingStepPoint() {
        const { stepPoint } = this.state;
        switch (stepPoint) {
            case 0:
                return this.renderEngagingStepPointIndex(); break;
            case 1:
                return this.renderEngagingStepPointEngage(); break;
            case 2:
                return this.renderEngagingStepPointMonitoring(); break;
        }
    }

    renderLaneChangeStepPoint() {
        const { stepPoint } = this.state;
        switch (stepPoint) {
            case 0:
                return this.renderLaneChangeStepPointIndex(); break;
            case 1:
                return this.renderLaneChangeStepPointStart(); break;
            case 2:
                return this.renderLaneChangeStepPointPerform(); break;
        }
    }

    renderDisengagingStepPoint() {
        const { stepPoint } = this.state;
        switch (stepPoint) {
            case 0:
                return this.renderDisengagingStepPointIndex(); break;
            case 1:
                return this.renderDisengagingStepPointLimitations(); break;
            case 2:
                return this.renderDisengagingStepPointDisengage(); break;
        }
    }

    renderStep() {
        const { step } = this.state;
        switch (step) {
            case Step.OB_SPLASH:
                return this.renderSplashStep(); break;
            case Step.OB_INTRO:
                return this.renderIntroStep(); break;
            case Step.OB_SENSORS:
                return this.renderSensorsStep(); break;
            case Step.OB_ENGAGE:
                return this.renderEngagingStep(); break;
            case Step.OB_LANECHANGE:
                return this.renderLaneChangeStep(); break;
            case Step.OB_DISENGAGE:
                return this.renderDisengagingStep(); break;
            case Step.OB_OUTRO:
                return this.renderOutroStep(); break;
        }
    }

    render() {
        const {
            step,
            stepPoint,
            stepChecks,
            photoOffset,
            photoCycled,
            photoCycledLast,
            leadEntered,
            engagedMocked,
            gateHighlighted,
        } = this.state;

        const overlayStyle = [
            Styles.onboardingOverlay,
            stepPoint > 0 ? Styles.onboardingOverlayCollapsed : null,
        ];

        const gradientColor = engagedMocked ? 'engaged_green' : 'dark_blue';

        const Animations = {
            leadIndicatorDescended: {
                transform: [{
                    translateY: photoCycled.interpolate({
                        inputRange: [0, 100],
                        outputRange: [0, 40]
                    })
                }, {
                    translateX: photoCycled.interpolate({
                        inputRange: [0, 100],
                        outputRange: [0, -10]
                    })
                }, {
                    scaleX: photoCycled.interpolate({
                        inputRange: [0, 100],
                        outputRange: [1, 1.5]
                    })
                }, {
                    scaleY: photoCycled.interpolate({
                        inputRange: [0, 100],
                        outputRange: [1, 1.5]
                    })
                }]
            },
        };

        return (
            <View style={ Styles.onboardingContainer }>
                <Animated.Image
                    source={ require('../../../img/photo_baybridge_a_01.jpg') }
                    style={ [Styles.onboardingPhoto, {
                        transform: [{
                            translateX: photoOffset.interpolate({
                                inputRange: [0, 100],
                                outputRange: [0, -50]
                            })
                        }],
                    }] }>
                </Animated.Image>
                <Animated.Image
                    source={ require('../../../img/illustration_training_lane_01.png') }
                    style={ [Styles.onboardingVisualLane, {
                        transform: [{
                            translateX: photoOffset.interpolate({
                                inputRange: [0, 100],
                                outputRange: [50, 0]
                            })
                        }],
                        opacity: photoOffset.interpolate({
                            inputRange: [0, 100],
                            outputRange: [0, 1],
                        })
                    }] } />

                <View style={[{ flexDirection: 'row',
        justifyContent: 'center', position: 'absolute' }, Styles.onboardingVisualLane]}>
                    <Animated.Image
                        source={ require('../../../img/illustration_training_lane_01.png') }
                        tintColor='lime'
                        pointerEvents='none'
                        style={ [Styles.absoluteFill, {
                            opacity: gateHighlighted.interpolate({
                                inputRange: [0, 100],
                                outputRange: [0, 1],
                            })
                        }] } />
                    { stepPoint == 1 ? (
                        <View style={ Styles.onboardingVisualLaneTouchGate }>
                            <X.Button
                                onPress={ () => { this.handleSensorVisualPressed('camera') } }
                                style={ Styles.onboardingVisualLaneTouchGateButton } />
                        </View>
                    ) : null }
                </View>

                { (step === 'OB_SENSORS' && stepPoint > 1) ? (
                    <View style={ Styles.onboardingVisuals }>
                        <Animated.Image
                            source={ require('../../../img/photo_baybridge_b_01.jpg') }
                            style={ [Styles.onboardingPhotoCycled, {
                                opacity: photoCycled.interpolate({
                                    inputRange: [0, 100],
                                    outputRange: [0, 1],
                                })
                            }] } />
                        <Animated.Image
                            source={ require('../../../img/illustration_training_lane_02.png') }
                            style={ [Styles.onboardingVisualLaneZoomed, {
                                opacity: photoCycled.interpolate({
                                    inputRange: [0, 100],
                                    outputRange: [0, 1],
                                })
                            }] }>
                        </Animated.Image>
                        <Animated.Image
                            source={ require('../../../img/illustration_training_lead_01.png') }
                            style={ [Styles.onboardingVisualLead,
                                Animations.leadIndicatorDescended ] } />
                        <Animated.Image
                            source={ require('../../../img/illustration_training_lead_02.png') }
                            style={ [Styles.onboardingVisualLead,
                                Styles.onboardingVisualLeadZoomed,
                                Animations.leadIndicatorDescended, {
                                opacity: photoCycled.interpolate({
                                    inputRange: [0, 100],
                                    outputRange: [0, 1]
                                }),
                            }] } />
                        <Animated.View
                            style={ [Styles.onboardingVisualLeadTouchGate,
                                Animations.leadIndicatorDescended, {
                                  opacity: gateHighlighted.interpolate({
                                      inputRange: [0, 100],
                                      outputRange: [0, 1],
                                  }),
                                }] }>
                            <X.Button
                                style={ Styles.onboardingVisualLeadTouchGateButton }
                                onPress={ () => { this.handleSensorVisualPressed('radar') } } />
                        </Animated.View>
                    </View>
                ) : null }

                { step === 'OB_ENGAGE' ? (
                    <View style={ Styles.onboardingVisuals }>
                        <Animated.Image
                            source={ require('../../../img/photo_wheel_buttons_01.jpg') }
                            style={ [Styles.onboardingPhotoCruise] } />
                        { stepPoint == 1 ? (
                            <Animated.View
                              style={ [Styles.onboardingVisualCruiseTouchContainer, {
                                opacity: gateHighlighted.interpolate({
                                    inputRange: [0, 100],
                                    outputRange: [0, 1],
                                }),
                              }] }>
                                <X.Button
                                    style={ Styles.onboardingVisualCruiseTouchGateButton }
                                    onPress={ () => { this.handleEngageVisualPressed('cruise') } } />
                            </Animated.View>
                        ) : null }
                        { stepPoint == 2 ? (
                            <React.Fragment>
                                <Animated.Image
                                    source={ require('../../../img/photo_monitoring_01.jpg') }
                                    style={ [Styles.onboardingPhotoCycled, Styles.onboardingFaceImage, {
                                        opacity: photoCycled.interpolate({
                                            inputRange: [0, 100],
                                            outputRange: [0, 1],
                                        }),
                                    }] }>
                                </Animated.Image>
                                <Animated.View style={ [Styles.onboardingFaceTouchGate, {
                                  opacity: gateHighlighted.interpolate({
                                      inputRange: [0, 100],
                                      outputRange: [0, 1],
                                  }),
                                }]}>
                                    <X.Button
                                        style={ Styles.onboardingTouchGateButton }
                                        onPress={ () => { this.handleEngageVisualPressed('monitoring') } } />
                                </Animated.View>
                            </React.Fragment>
                        ) : null }
                    </View>
                ) : null }

                { step === 'OB_LANECHANGE' ? (
                    <View style={ Styles.onboardingVisuals }>
                        <Animated.Image
                            source={ require('../../../img/photo_turn_signal_02.jpg') }
                            style={ [Styles.onboardingPhotoSignal] } />
                        { stepPoint == 1 ? (
                            <Animated.View style={ [Styles.onboardingSignalTouchGate, {
                              opacity: gateHighlighted.interpolate({
                                  inputRange: [0, 100],
                                  outputRange: [0, 1],
                              }),
                            }]}>
                                <X.Button
                                    style={ Styles.onboardingTouchGateButton }
                                    onPress={ () => { this.handleLaneChangeVisualPressed('start') } } />
                            </Animated.View>
                        ) : null }
                        { stepPoint == 2 ? (
                            <React.Fragment>
                                <Animated.Image
                                    source={ require('../../../img/photo_wheel_hands_01.jpg') }
                                    style={ [Styles.onboardingPhotoCycled, {
                                        opacity: photoCycled.interpolate({
                                            inputRange: [0, 100],
                                            outputRange: [0, 1],
                                        }),
                                    }] }>
                                </Animated.Image>
                                <Animated.View style={ [Styles.onboardingWheelTouchGate, {
                                  opacity: gateHighlighted.interpolate({
                                      inputRange: [0, 100],
                                      outputRange: [0, 1],
                                  }),
                                }]}>
                                    <X.Button
                                        style={ Styles.onboardingTouchGateButton }
                                        onPress={ () => { this.handleLaneChangeVisualPressed('perform') } } />
                                </Animated.View>
                            </React.Fragment>
                        ) : null }
                    </View>
                ) : null }

                { step === 'OB_DISENGAGE' ? (
                    <View style={ Styles.onboardingVisuals }>
                        <Animated.Image
                            source={ require('../../../img/photo_traffic_light_01.jpg') }
                            style={ [Styles.onboardingPhotoCruise] } />
                        { stepPoint == 1 ? (
                            <Animated.View style={ [Styles.onboardingLightTouchGate, {
                                opacity: gateHighlighted.interpolate({
                                    inputRange: [0, 100],
                                    outputRange: [0, 1],
                                }),
                            }]}>
                                <X.Button
                                    style={ Styles.onboardingTouchGateButton }
                                    onPress={ () => { this.handleDisengageVisualPressed('limitations') } } />
                            </Animated.View>
                        ) : null }
                        { stepPoint == 2 ? (
                            <View style={ Styles.onboardingVisuals }>
                                <Animated.Image
                                    source={ require('../../../img/photo_pedals_01.jpg') }
                                    style={ [Styles.onboardingPhotoCycled, Styles.onboardingPhotoPedals, {
                                        opacity: photoCycledLast.interpolate({
                                            inputRange: [0, 100],
                                            outputRange: [0, 1],
                                        }),
                                    }] } />
                                <Animated.View style={ [Styles.onboardingBrakePedalTouchGate, {
                                  opacity: gateHighlighted.interpolate({
                                      inputRange: [0, 100],
                                      outputRange: [0, 1],
                                  }),
                                }]}>
                                    <X.Button
                                        style={ Styles.onboardingTouchGateButton }
                                        onPress={ () => { this.handleDisengageVisualPressed('disengage') } } />
                                </Animated.View>
                                <Animated.View style={ [Styles.onboardingGasPedalTouchGate, {
                                  opacity: gateHighlighted.interpolate({
                                      inputRange: [0, 100],
                                      outputRange: [0, 1],
                                  }),
                                }] }>
                                    <X.Button
                                        style={ Styles.onboardingTouchGateButton }
                                        onPress={ () => { this.handleDisengageVisualPressed('disengage') } } />
                                </Animated.View>
                            </View>
                        ) : null }
                    </View>
                ) : null }

                <Animated.View
                    style={ overlayStyle }>
                    <X.Gradient
                        color={ gradientColor }>
                        { this.renderStep() }
                    </X.Gradient>
                </Animated.View>
            </View>
        )
    }
}

const mapStateToProps = state => ({});

const mapDispatchToProps = dispatch => ({
    completeTrainingStep: completeTrainingStep('Onboarding', dispatch),
    restartTraining: () => {
        onTrainingRouteCompleted('Onboarding');
    },
});
export default connect(mapStateToProps, mapDispatchToProps)(Onboarding);
