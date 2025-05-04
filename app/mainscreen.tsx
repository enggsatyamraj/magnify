import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    Linking,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Slider from '@react-native-community/slider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { ACCENT_COLOR, BACKGROUND_COLOR, PRIMARY_COLOR, SECONDARY_COLOR, SUCCESS_COLOR, SURFACE_COLOR, WARNING_COLOR } from '../utils/color';

export default function MagnifierScreen() {
    // Camera permissions
    const [permission, requestPermission] = useCameraPermissions();
    const [mediaLibraryPermission, requestMediaLibraryPermission] = MediaLibrary.usePermissions();
    const [facing, setFacing] = useState<CameraType>('back');
    const [flashOn, setFlashOn] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(0);
    const [flashIntensity, setFlashIntensity] = useState(0.5);
    const [showIntensitySlider, setShowIntensitySlider] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isFrozen, setIsFrozen] = useState(false);
    const [photo, setPhoto] = useState(null);
    const [showCapturedPhoto, setShowCapturedPhoto] = useState(false);
    const [saving, setSaving] = useState(false);

    const cameraRef = useRef(null);
    const { width, height } = Dimensions.get('window');

    // Request permissions when component mounts
    useEffect(() => {
        const checkPermissions = async () => {
            setLoading(true);
            if (!permission?.granted) {
                await requestPermission();
            }

            if (!mediaLibraryPermission?.granted) {
                await requestMediaLibraryPermission();
            }

            setLoading(false);
        };

        checkPermissions();
    }, []);

    // Handle zoom slider change
    const handleZoomChange = (value) => {
        setZoomLevel(value);
    };

    // Handle flashlight intensity change
    const handleFlashIntensityChange = (value) => {
        setFlashIntensity(value);
    };

    // Toggle flashlight
    const toggleFlash = () => {
        setFlashOn(prev => !prev);
        // When turning on flashlight, show intensity slider
        if (!flashOn) {
            setShowIntensitySlider(true);
        } else {
            setShowIntensitySlider(false);
        }
    };

    // Long press on flashlight to toggle intensity slider
    const handleLongPressFlash = () => {
        if (flashOn) {
            setShowIntensitySlider(prev => !prev);
        }
    };

    // Toggle camera (front/back)
    const toggleCamera = () => {
        // Don't allow camera toggle when frozen
        if (isFrozen) {
            Alert.alert(
                "Camera Frozen",
                "Unfreeze the camera before switching cameras.",
                [{ text: "OK", style: "default" }]
            );
            return;
        }
        setFacing(current => (current === 'back' ? 'front' : 'back'));
    };

    // Toggle freeze frame
    const toggleFreeze = () => {
        if (cameraRef.current) {
            if (isFrozen) {
                // Resume camera preview
                cameraRef.current.resumePreview();
                // Provide haptic feedback
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } else {
                // Pause camera preview
                cameraRef.current.pausePreview();
                // Provide haptic feedback
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
            setIsFrozen(prev => !prev);
        }
    };

    // Take a picture
    const takePicture = async () => {
        if (cameraRef.current) {
            try {
                // Provide haptic feedback
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

                // Take the picture
                const options = {
                    quality: 0.85,
                    base64: false,
                    skipProcessing: false,
                    exif: true
                };

                const photoData = await cameraRef.current.takePictureAsync(options);
                setPhoto(photoData);
                setShowCapturedPhoto(true);

                // Pause the camera preview
                if (!isFrozen) {
                    cameraRef.current.pausePreview();
                    setIsFrozen(true);
                }
            } catch (error) {
                console.error("Error taking picture:", error);
                Alert.alert("Error", "Failed to take picture. Please try again.");
            }
        }
    };

    // Save photo to gallery
    const savePhoto = async () => {
        if (!photo || !photo.uri) return;

        try {
            setSaving(true);

            // Check if we have media library permissions
            if (!mediaLibraryPermission?.granted) {
                const { status } = await requestMediaLibraryPermission();
                if (status !== 'granted') {
                    Alert.alert(
                        "Permission Required",
                        "Magnify needs permission to save photos to your gallery.",
                        [
                            { text: "Cancel", style: "cancel" },
                            { text: "Open Settings", onPress: () => Linking.openSettings() }
                        ]
                    );
                    setSaving(false);
                    return;
                }
            }

            // Save the photo to the gallery
            const asset = await MediaLibrary.createAssetAsync(photo.uri);

            // Create an album if needed and add the photo to it
            const album = await MediaLibrary.getAlbumAsync('Magnify');
            if (album === null) {
                await MediaLibrary.createAlbumAsync('Magnify', asset, false);
            } else {
                await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
            }

            // Success message
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert("Success", "Photo saved to gallery in the 'Magnify' album");
        } catch (error) {
            console.error("Error saving photo:", error);
            Alert.alert("Error", "Failed to save photo. Please try again.");
        } finally {
            setSaving(false);
            discardPhoto();
        }
    };

    // Discard the captured photo
    const discardPhoto = () => {
        setPhoto(null);
        setShowCapturedPhoto(false);

        // Resume camera preview if it was frozen
        if (isFrozen && cameraRef.current) {
            cameraRef.current.resumePreview();
            setIsFrozen(false);
        }
    };

    // Open app settings if permission denied
    const openSettings = () => {
        Alert.alert(
            "Permission Required",
            "Please enable camera access in your device settings to use the magnifier.",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Open Settings", onPress: () => Linking.openSettings() }
            ]
        );
    };

    // Calculate flash filter opacity based on intensity
    // Invert the intensity for filter - higher intensity means less filter opacity
    const getFlashFilterOpacity = () => {
        // Convert intensity (0-1) to opacity (0.8-0)
        // We use 0.8 as max opacity to still allow some light through camera
        // When intensity is at max (1), filter opacity will be at minimum (0)
        return flashOn ? 0.8 - (flashIntensity * 0.8) : 0;
    };

    // Calculate container height to ensure control panel is outside camera view
    const calculateCameraHeight = () => {
        // The control panel should be placed outside the camera container
        // so that the filter doesn't affect it
        return height - 180; // Approximate height for controls
    };

    // Loading state
    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar style="dark" />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={PRIMARY_COLOR} />
                    <Text style={styles.loadingText}>Initializing camera...</Text>
                </View>
            </SafeAreaView>
        );
    }

    // Permission denied
    if (!permission?.granted) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar style="dark" />
                <View style={styles.permissionContainer}>
                    <MaterialCommunityIcons name="camera-off" size={64} color={SECONDARY_COLOR} />
                    <Text style={styles.permissionTitle}>Camera Access Needed</Text>
                    <Text style={styles.permissionText}>
                        Magnify needs access to your camera to function properly.
                        Please grant camera permission to use the magnifier functionality.
                    </Text>
                    <TouchableOpacity
                        style={styles.permissionButton}
                        onPress={requestPermission}
                    >
                        <Text style={styles.permissionButtonText}>Grant Permission</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.settingsButton}
                        onPress={openSettings}
                    >
                        <Text style={styles.settingsButtonText}>Open Settings</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // Main camera view
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />

            <View style={[
                styles.cameraContainer,
                { height: calculateCameraHeight() }
            ]}>
                <CameraView
                    style={styles.camera}
                    facing={facing}
                    ref={cameraRef}
                    enableTorch={flashOn}
                    zoom={zoomLevel}
                />

                {/* Adjustable flash filter overlay - positioned ONLY over the camera view */}
                {flashOn && (
                    <View
                        style={[
                            styles.flashFilter,
                            {
                                backgroundColor: 'black',
                                opacity: getFlashFilterOpacity()
                            }
                        ]}
                    />
                )}

                {/* Freeze indicator overlay */}
                {isFrozen && (
                    <View style={styles.frozenOverlay}>
                        <MaterialCommunityIcons name="snowflake" size={36} color="white" />
                        <Text style={styles.frozenText}>FROZEN</Text>
                    </View>
                )}
            </View>

            {/* Capture Button - Positioned over the camera but below controls */}
            {/* <View style={styles.captureButtonContainer}>
                <TouchableOpacity
                    style={styles.captureButton}
                    onPress={takePicture}
                    disabled={showCapturedPhoto}
                >
                    <View style={styles.captureButtonInner} />
                </TouchableOpacity>
            </View> */}

            {/* Control panel - positioned outside the camera container, no filter applied here */}
            <View style={styles.controlsContainer}>
                {/* Top toolbar */}
                <View style={styles.toolbar}>
                    <Text style={styles.titleText}>Magnify</Text>
                    <View style={styles.topButtons}>
                        {/* Freeze button */}
                        <TouchableOpacity
                            style={[styles.actionButton, isFrozen && styles.actionButtonActive]}
                            onPress={toggleFreeze}
                            disabled={showCapturedPhoto}
                        >
                            <MaterialCommunityIcons
                                name={isFrozen ? "play" : "pause"}
                                size={22}
                                color={isFrozen ? BACKGROUND_COLOR : SECONDARY_COLOR}
                            />
                        </TouchableOpacity>

                        {/* Camera toggle button */}
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={toggleCamera}
                            disabled={showCapturedPhoto}
                        >
                            <MaterialCommunityIcons
                                name={facing === 'back' ? 'camera-front' : 'camera-rear'}
                                size={22}
                                color={SECONDARY_COLOR}
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Zoom slider */}
                <View style={styles.sliderContainer}>
                    <MaterialCommunityIcons name="magnify-minus" size={22} color={SECONDARY_COLOR} />
                    <Slider
                        style={styles.slider}
                        minimumValue={0}
                        maximumValue={1}
                        value={zoomLevel}
                        onValueChange={handleZoomChange}
                        minimumTrackTintColor={PRIMARY_COLOR}
                        maximumTrackTintColor={SURFACE_COLOR}
                        thumbTintColor={PRIMARY_COLOR}
                        disabled={showCapturedPhoto}
                    />
                    <MaterialCommunityIcons name="magnify-plus" size={22} color={SECONDARY_COLOR} />
                </View>

                {/* Flashlight intensity slider (visible only when needed) */}
                {showIntensitySlider && !showCapturedPhoto && (
                    <View style={styles.intensityContainer}>
                        <MaterialCommunityIcons name="brightness-4" size={22} color={SECONDARY_COLOR} />
                        <Slider
                            style={styles.slider}
                            minimumValue={0}
                            maximumValue={1}
                            value={flashIntensity}
                            onValueChange={handleFlashIntensityChange}
                            minimumTrackTintColor={ACCENT_COLOR}
                            maximumTrackTintColor={SURFACE_COLOR}
                            thumbTintColor={ACCENT_COLOR}
                        />
                        <MaterialCommunityIcons name="brightness-7" size={22} color={SECONDARY_COLOR} />
                    </View>
                )}

                {/* Bottom controls */}
                <View style={styles.bottomControls}>
                    <TouchableOpacity
                        style={[styles.flashButton, flashOn && styles.flashButtonActive]}
                        onPress={toggleFlash}
                        onLongPress={handleLongPressFlash}
                        delayLongPress={500}
                        disabled={showCapturedPhoto}
                    >
                        <MaterialCommunityIcons
                            name={flashOn ? "flashlight" : "flashlight-off"}
                            size={24}
                            color={flashOn ? BACKGROUND_COLOR : SECONDARY_COLOR}
                        />
                    </TouchableOpacity>

                    {/* Intensity label */}
                    {flashOn && !showCapturedPhoto && (
                        <Text style={styles.intensityLabel}>
                            {Math.round(flashIntensity * 100)}%
                        </Text>
                    )}

                    {/* Capture Button - Now placed inline with flashlight */}
                    <TouchableOpacity
                        style={styles.captureButton}
                        onPress={takePicture}
                        disabled={showCapturedPhoto}
                    >
                        <View style={styles.captureButtonInner}>
                            <MaterialCommunityIcons
                                name="camera"
                                size={28}
                                color={SECONDARY_COLOR}
                            />
                        </View>
                    </TouchableOpacity>


                </View>
            </View>

            {/* Photo Preview Modal */}
            <Modal
                visible={showCapturedPhoto}
                transparent={true}
                animationType="fade"
                onRequestClose={discardPhoto}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.photoPreviewContainer}>
                        <Image
                            source={{ uri: photo?.uri }}
                            style={styles.photoPreview}
                            resizeMode="contain"
                        />

                        <View style={styles.photoActions}>
                            <TouchableOpacity
                                style={[styles.photoActionButton, styles.discardButton]}
                                onPress={discardPhoto}
                                disabled={saving}
                            >
                                <MaterialCommunityIcons name="close" size={28} color="white" />
                                <Text style={styles.photoActionText}>Discard</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.photoActionButton, styles.saveButton]}
                                onPress={savePhoto}
                                disabled={saving}
                            >
                                {saving ? (
                                    <ActivityIndicator color="white" size="small" />
                                ) : (
                                    <>
                                        <MaterialCommunityIcons name="content-save" size={28} color="white" />
                                        <Text style={styles.photoActionText}>Save</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: BACKGROUND_COLOR,
    },
    cameraContainer: {
        flex: 1,
        position: 'relative',
        overflow: 'hidden', // Ensure the filter doesn't bleed outside
    },
    camera: {
        flex: 1,
        width: '100%',
    },
    flashFilter: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 2,
        pointerEvents: 'none', // Allow touches to pass through to camera
    },
    frozenOverlay: {
        position: 'absolute',
        top: 20,
        right: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 12,
        padding: 8,
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 3,
    },
    frozenText: {
        color: 'white',
        fontWeight: 'bold',
        marginLeft: 5,
    },
    captureButton: {
        width: 50,
        height: 50,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: SECONDARY_COLOR,
        // borderWidth: 1,
        // borderColor: '#000',
        backgroundColor: SURFACE_COLOR
        // shadowOffset: { width: 0, height: 2 },
        // shadowOpacity: 0.2,
        // shadowRadius: 3,
        // elevation: 3,
    },
    captureButtonInner: {
        width: 52,
        height: 52,
        borderRadius: 26,
        // backgroundColor: PRIMARY_COLOR, // Change from white to PRIMARY_COLOR
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: 10,
        color: SECONDARY_COLOR,
        fontSize: 16,
    },
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
    },
    permissionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: SECONDARY_COLOR,
        marginTop: 20,
        marginBottom: 10,
    },
    permissionText: {
        fontSize: 16,
        color: SECONDARY_COLOR,
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 24,
    },
    permissionButton: {
        backgroundColor: PRIMARY_COLOR,
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 8,
        marginBottom: 15,
        elevation: 2,
        shadowColor: SECONDARY_COLOR,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    permissionButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    settingsButton: {
        paddingVertical: 12,
        paddingHorizontal: 30,
    },
    settingsButtonText: {
        color: PRIMARY_COLOR,
        fontSize: 16,
        fontWeight: '500',
    },
    controlsContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: BACKGROUND_COLOR,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingVertical: 15,
        paddingHorizontal: 20,
        shadowColor: SECONDARY_COLOR,
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    toolbar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    titleText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: SECONDARY_COLOR,
    },
    topButtons: {
        flexDirection: 'row',
    },
    actionButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: SURFACE_COLOR,
        marginLeft: 10,
    },
    actionButtonActive: {
        backgroundColor: SUCCESS_COLOR,
    },
    cameraToggle: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: SURFACE_COLOR,
    },
    sliderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 15,
    },
    intensityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 20,
    },
    slider: {
        flex: 1,
        height: 40,
        marginHorizontal: 10,
    },
    bottomControls: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 10,
        gap: 10, // Add spacing between elements
    },
    flashButton: {
        backgroundColor: SURFACE_COLOR,
        padding: 12,
        borderRadius: 30,
    },
    flashButtonActive: {
        backgroundColor: ACCENT_COLOR,
    },
    intensityLabel: {
        marginTop: 8,
        fontSize: 12,
        color: SECONDARY_COLOR,
        fontWeight: '500',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    photoPreviewContainer: {
        width: '90%',
        height: '80%',
        backgroundColor: 'black',
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 5,
    },
    photoPreview: {
        width: '100%',
        height: '85%',
    },
    photoActions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingVertical: 15,
        height: '15%',
    },
    photoActionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 30,
        justifyContent: 'center',
    },
    discardButton: {
        backgroundColor: SECONDARY_COLOR,
    },
    saveButton: {
        backgroundColor: SUCCESS_COLOR,
    },
    photoActionText: {
        color: 'white',
        fontWeight: 'bold',
        marginLeft: 8,
        fontSize: 16,
    },
});