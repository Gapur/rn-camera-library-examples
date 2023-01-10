import React, { useState, useEffect, useRef } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Image,
} from 'react-native';
import {
  Camera,
  useCameraDevices,
  useFrameProcessor,
} from 'react-native-vision-camera';
import { scanBarcodes, BarcodeFormat } from 'vision-camera-code-scanner';
import Animated, {
  useAnimatedProps,
  useSharedValue,
} from 'react-native-reanimated';
import RNPickerSelect from 'react-native-picker-select';

const AnimatedText = Animated.createAnimatedComponent(TextInput);

export default function App() {
  const camera = useRef(null);
  const [cameraPermission, setCameraPermission] = useState();
  const [currentExample, setCurrentExample] = useState('take-photo');
  const [photoPath, setPhotoPath] = useState();
  const [snapshotPath, setSnapshotPath] = useState();
  const detectorResult = useSharedValue('');

  useEffect(() => {
    (async () => {
      const cameraPermissionStatus = await Camera.requestCameraPermission();
      setCameraPermission(cameraPermissionStatus);
    })();
  }, []);

  const devices = useCameraDevices();
  const cameraDevice = devices.back;

  const frameProcessor = useFrameProcessor(frame => {
    'worklet';
    const detectedBarcodes = scanBarcodes(frame, [BarcodeFormat.QR_CODE]);
    const barcodesStr = detectedBarcodes
      .map(barcode => barcode.displayValue)
      .join('');
    console.log('Barcodes:', barcodesStr);
    detectorResult.value = barcodesStr;
  }, []);

  const animatedTextProps = useAnimatedProps(
    () => ({ text: detectorResult.value }),
    [detectorResult.value],
  );

  const handleTakePhoto = async () => {
    try {
      const photo = await camera.current.takePhoto({
        flash: 'on',
      });
      setPhotoPath(photo.path);
    } catch (e) {
      console.log(e);
    }
  };

  const renderTakingPhoto = () => {
    return (
      <View>
        <Camera
          ref={camera}
          style={styles.camera}
          device={cameraDevice}
          isActive
          photo
        />
        {photoPath && (
          <Image style={styles.image} source={{ uri: photoPath }} />
        )}
        <TouchableOpacity onPress={handleTakePhoto}>
          <Text>Take Photo</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const handleRecordVideo = async () => {
    try {
      camera.current.startRecording({
        flash: 'on',
        onRecordingFinished: video => console.log(video),
        onRecordingError: error => console.error(error),
      });
    } catch (e) {
      console.log(e);
    }
  };

  const renderRecordingVideo = () => {
    return null;
  };

  const handleTakeSnapshot = async () => {
    try {
      const snapshot = await camera.current.takeSnapshot({
        quality: 85,
        skipMetadata: true,
      });
      setSnapshotPath(snapshot.path);
    } catch (e) {
      console.log(e);
    }
  };

  const renderTakingSnapshot = () => {
    return (
      <View>
        <Camera
          ref={camera}
          style={styles.camera}
          device={cameraDevice}
          isActive
          photo
        />
        {snapshotPath && (
          <Image style={styles.image} source={{ uri: snapshotPath }} />
        )}
        <TouchableOpacity onPress={handleTakeSnapshot}>
          <Text>Take Snapshot</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderCodeScanner = () => {
    return (
      <View>
        <Camera
          style={styles.camera}
          device={cameraDevice}
          isActive
          frameProcessor={frameProcessor}
          frameProcessorFps={5}
        />
        <AnimatedText
          style={styles.barcodeText}
          animatedProps={animatedTextProps}
          editable={false}
          multiline
        />
      </View>
    );
  };

  const renderContent = () => {
    if (cameraDevice === null) {
      return <ActivityIndicator size="large" color="#1C6758" />;
    }
    if (cameraPermission !== 'authorized') {
      return null;
    }
    switch (currentExample) {
      case 'take-photo':
        return renderTakingPhoto();
      case 'record-video':
        return renderRecordingVideo();
      case 'take-snapshot':
        return renderTakingSnapshot();
      case 'code-scanner':
        return renderCodeScanner();
      default:
        return null;
    }
  };

  const handleChangePicketSelect = value => {
    setPhotoPath(null);
    setSnapshotPath(null);
    setCurrentExample(value);
  };

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.saveArea}>
        <View style={styles.header}>
          <Text style={styles.headerText}>React Native Camera Libraries</Text>
        </View>
      </SafeAreaView>

      <View style={styles.caption}>
        <Text style={styles.captionText}>
          Welcome To React-Native-Vision-Camera Tutorial
        </Text>
      </View>

      <RNPickerSelect
        style={styles.pickerSelect}
        onValueChange={handleChangePicketSelect}
        items={[
          { label: 'Take Photo', value: 'take-photo' },
          { label: 'Record Video', value: 'record-video' },
          { label: 'Take Snapshot', value: 'take-snapshot' },
          { label: 'Code Scanner', value: 'code-scanner' },
        ]}
      />

      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#EEF2E6',
  },
  saveArea: {
    backgroundColor: '#3D8361',
  },
  header: {
    height: 50,
    backgroundColor: '#3D8361',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    color: '#ffffff',
    fontSize: 20,
  },
  caption: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captionText: {
    color: '#100F0F',
    fontSize: 16,
    fontWeight: '600',
  },
  camera: {
    height: 460,
    width: '92%',
    alignSelf: 'center',
  },
  barcodeText: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    textAlign: 'center',
    color: '#100F0F',
    fontSize: 24,
  },
  pickerSelect: {
    paddingVertical: 12,
  },
  image: {
    width: 66,
    height: 58,
  },
});
