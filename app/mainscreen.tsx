import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    Image,
    Linking,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Slider from '@react-native-community/slider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ACCENT_COLOR, BACKGROUND_COLOR, PRIMARY_COLOR, SECONDARY_COLOR, SUCCESS_COLOR, SURFACE_COLOR, WARNING_COLOR } from '../utils/color';
import * as ImageManipulator from 'expo-image-manipulator';
import Share from 'react-native-share';
import { BannerAd, BannerAdSize, TestIds, useForeground } from 'react-native-google-mobile-ads';


// Constants for AsyncStorage keys
const STORAGE_KEY_SAVED_PHOTOS = '@magnify_saved_photos';

export default function MagnifierScreen() {
    // Router for navigation
    const router = useRouter();
    const adUnitId = __DEV__ ? TestIds.ADAPTIVE_BANNER : 'ca-app-pub-4617429631705779~7243263837';
    // const bannerRef = useRef < BannerAd > null;


    // Camera permissions
    const [permission, requestPermission] = useCameraPermissions();
    const [mediaLibraryPermission, requestMediaLibraryPermission] = MediaLibrary.usePermissions();
    const [facing, setFacing] = useState<CameraType>('back');
    const [flashOn, setFlashOn] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(0);
    const [superZoomActive, setSuperZoomActive] = useState(false); // New state for 100x zoom
    const [flashIntensity, setFlashIntensity] = useState(0.5);
    const [showIntensitySlider, setShowIntensitySlider] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isFrozen, setIsFrozen] = useState(false);
    const [photo, setPhoto] = useState(null);
    const [showCapturedPhoto, setShowCapturedPhoto] = useState(false);
    const [saving, setSaving] = useState(false);
    const [photoCount, setPhotoCount] = useState(0);
    const GALLERY_STORAGE_KEY = '@magnify_gallery';

    // Filter states
    const [selectedFilter, setSelectedFilter] = useState('normal');
    const [filteredPhotoUri, setFilteredPhotoUri] = useState(null);
    const [isProcessingFilter, setIsProcessingFilter] = useState(false);

    // Animation values for photo preview
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;

    // Animation values for super zoom effect
    const superZoomScale = useRef(new Animated.Value(1)).current;
    const superZoomOpacity = useRef(new Animated.Value(0)).current;

    const cameraRef = useRef(null);
    const { width, height } = Dimensions.get('window');

    // Golden ratio for aesthetically pleasing proportions
    const goldenRatio = 1.618;

    // Filter options with their configuration
    const filterOptions = [
        { id: 'normal', name: 'Normal' },
        {
            id: 'bw',
            name: 'B&W',
            manipulations: [
                {
                    adjust: {
                        saturation: 0,
                        contrast: 1.2
                    }
                }
            ]
        },
        {
            id: 'sepia',
            name: 'Sepia',
            manipulations: [
                {
                    adjust: {
                        saturation: 0.5,
                        contrast: 1.1
                    }
                },
                { tint: '#704214' } // Sepia tint color
            ]
        },
        {
            id: 'vintage',
            name: 'Vintage',
            manipulations: [
                {
                    adjust: {
                        saturation: 0.8,
                        contrast: 0.9
                    }
                },
                { tint: '#FFA500' }
            ]
        },
        {
            id: 'cool',
            name: 'Cool',
            manipulations: [
                {
                    adjust: {
                        saturation: 1.1
                    }
                },
                { tint: '#0066FF' }
            ]
        },
        {
            id: 'warm',
            name: 'Warm',
            manipulations: [
                {
                    adjust: {
                        saturation: 1.1
                    }
                },
                { tint: '#FF6600' }
            ]
        }
    ];

    // Load saved photo count on mount
    useEffect(() => {
        loadSavedPhotoCount();
    }, []);

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

    // Save photo metadata to AsyncStorage
    const savePhotoMetadata = async (photoUri) => {
        try {
            // Generate a unique identifier for the photo
            const timeStamp = Date.now();
            const photoId = `photo_${timeStamp}`;

            // Copy photo from cache to app's documents directory for permanent storage
            // This ensures the photo remains even after app restarts
            const newPath = `${FileSystem.documentDirectory}${photoId}.jpg`;
            await FileSystem.copyAsync({
                from: photoUri,
                to: newPath
            });

            // Create photo metadata object
            const newPhotoEntry = {
                id: photoId,
                uri: newPath,
                timestamp: timeStamp
            };

            // Get existing saved photos
            const savedPhotosJson = await AsyncStorage.getItem(GALLERY_STORAGE_KEY);
            let savedPhotos = [];

            if (savedPhotosJson) {
                savedPhotos = JSON.parse(savedPhotosJson);
            }

            // Add new photo to the array
            savedPhotos.push(newPhotoEntry);

            // Save updated array back to AsyncStorage
            await AsyncStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(savedPhotos));

            // Update photo count
            setPhotoCount(savedPhotos.length);

            return newPhotoEntry;
        } catch (error) {
            console.error("Error saving photo metadata:", error);
            throw error;
        }
    };

    // Replace the loadSavedPhotoCount function with this one:
    const loadSavedPhotoCount = async () => {
        try {
            const savedPhotosJson = await AsyncStorage.getItem(GALLERY_STORAGE_KEY);
            if (savedPhotosJson) {
                const savedPhotos = JSON.parse(savedPhotosJson);
                setPhotoCount(savedPhotos.length);
            }
        } catch (error) {
            console.error("Error loading saved photos count:", error);
        }
    };

    // And update the savePhoto function to use the new metadata function:
    const savePhoto = async () => {
        if (!photo || !filteredPhotoUri) return;

        try {
            setSaving(true);

            // Provide haptic feedback while saving begins
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

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

            // Use the filtered photo URI for saving
            const uriToSave = filteredPhotoUri;

            // Save the photo to the gallery
            const asset = await MediaLibrary.createAssetAsync(uriToSave);

            // Create an album if needed and add the photo to it
            const album = await MediaLibrary.getAlbumAsync('Magnify');
            if (album === null) {
                await MediaLibrary.createAlbumAsync('Magnify', asset, false);
            } else {
                await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
            }

            // Save photo metadata to AsyncStorage
            await savePhotoMetadata(uriToSave);

            // Success message
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            // Hide the photo preview with animation after saving
            hidePhotoPreview(() => {
                // Show success toast after the preview has closed
                Alert.alert("Success", "Photo saved to gallery in the 'Magnify' album");
                resetPhotoState();
            });
        } catch (error) {
            console.error("Error saving photo:", error);
            Alert.alert("Error", "Failed to save photo. Please try again.");
            setSaving(false);
        }
    };

    // Navigate to gallery
    const navigateToGallery = () => {
        router.push('/gallery');
    };

    // Handle zoom slider change
    const handleZoomChange = (value) => {
        setZoomLevel(value);
        // Disable super zoom if regular zoom is being adjusted
        if (superZoomActive && value < 0.8) {
            toggleSuperZoom();
        }
    };

    // Handle flashlight intensity change
    const handleFlashIntensityChange = (value) => {
        setFlashIntensity(value);
    };

    // Toggle flashlight
    const toggleFlash = () => {
        // Provide haptic feedback
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        setFlashOn(prev => !prev);
        // When turning on flashlight, show intensity slider
        if (!flashOn) {
            setShowIntensitySlider(true);
        } else {
            setShowIntensitySlider(false);
        }
    };

    // Toggle 100x super zoom mode
    const toggleSuperZoom = () => {
        // Provide haptic feedback
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        const newSuperZoomState = !superZoomActive;
        setSuperZoomActive(newSuperZoomState);

        if (newSuperZoomState) {
            // Set zoom to maximum when super zoom is activated
            setZoomLevel(1);

            // Show disclaimer alert the first time super zoom is used
            const disclaimerShownKey = '@magnify_disclaimer_shown';
            AsyncStorage.getItem(disclaimerShownKey).then(value => {
                if (!value) {
                    Alert.alert(
                        "Enhanced Zoom Feature",
                        "The 100x magnification feature is a digital enhancement. Actual magnification power depends on your device's camera hardware capabilities.",
                        [{ text: "Got it", style: "default" }]
                    );
                    AsyncStorage.setItem(disclaimerShownKey, 'true');
                }
            });

            // Animate zoom effect indicator
            Animated.sequence([
                Animated.parallel([
                    Animated.timing(superZoomOpacity, {
                        toValue: 0.8,
                        duration: 300,
                        useNativeDriver: true
                    }),
                    Animated.timing(superZoomScale, {
                        toValue: 1.5,
                        duration: 300,
                        useNativeDriver: true
                    })
                ]),
                Animated.parallel([
                    Animated.timing(superZoomOpacity, {
                        toValue: 0,
                        duration: 500,
                        useNativeDriver: true
                    }),
                    Animated.timing(superZoomScale, {
                        toValue: 2,
                        duration: 500,
                        useNativeDriver: true
                    })
                ])
            ]).start();
        } else {
            // Return to normal zoom level when super zoom is deactivated
            setZoomLevel(0.5);
        }
    };

    // Long press on flashlight to toggle intensity slider
    const handleLongPressFlash = () => {
        if (flashOn) {
            // Provide haptic feedback for long press
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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

        // Provide haptic feedback
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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

    // Apply filter to photo
    // @ts-ignore
    const applyFilter = async (filterId) => {
        if (!photo || !photo.uri) return;

        setSelectedFilter(filterId);
        setIsProcessingFilter(true);

        try {
            const filterConfig = filterOptions.find(f => f.id === filterId);

            if (filterId === 'normal') {
                setFilteredPhotoUri(photo.uri);
                setIsProcessingFilter(false);
                return;
            }

            const result = await ImageManipulator.manipulateAsync(
                photo.uri,
                filterConfig.manipulations,
                { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
            );

            setFilteredPhotoUri(result.uri);
        } catch (error) {
            console.error("Error applying filter:", error);
            setFilteredPhotoUri(photo.uri);
            Alert.alert("Filter Error", "Could not apply the selected filter. Using original image.");
        } finally {
            setIsProcessingFilter(false);
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

                // Initially set filtered URI to the original photo
                setFilteredPhotoUri(photoData.uri);
                setSelectedFilter('normal');

                // Display photo with animation
                showPhotoPreview();

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

    // Show photo preview with animation
    const showPhotoPreview = () => {
        setShowCapturedPhoto(true);
        // Reset animation values
        fadeAnim.setValue(0);
        scaleAnim.setValue(0.9);

        // Start animations
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 350,
                useNativeDriver: true,
            }),
        ]).start();
    };

    // Hide photo preview with animation
    const hidePhotoPreview = (callback = () => { }) => {
        // Animate out
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 0.9,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start(() => {
            setShowCapturedPhoto(false);
            callback();
        });
    };

    // Share photo
    const sharePhoto = async () => {
        if (!photo || !filteredPhotoUri) return;

        try {
            // Provide haptic feedback
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

            // Set loading state
            setSaving(true);

            // Read the image as base64
            const base64Data = await FileSystem.readAsStringAsync(filteredPhotoUri, {
                encoding: FileSystem.EncodingType.Base64,
            });

            // Determine mime type (usually jpg for photos)
            const mimeType = 'image/jpeg';

            // Create the sharing options
            const shareOptions = {
                title: 'Share Photo',
                message: 'Check out this photo from Magnify!',
                url: `data:${mimeType};base64,${base64Data}`,
                type: mimeType,
            };

            // Show the share dialog
            const result = await Share.open(shareOptions);
            console.log('Share result:', result);

        } catch (error) {
            console.error("Error sharing photo:", error);

            // Handle the case when user cancels sharing
            if (error.message === 'User did not share' ||
                error.message === 'User canceled' ||
                error.message.includes('cancel')) {
                console.log('User canceled sharing');
                // Just return silently without showing an error
                return;
            }

            // Only show alert for actual errors, not user cancellations
            Alert.alert("Error", "Failed to share photo. Please try again.");
        } finally {
            setSaving(false);
        }
    };


    // Edit photo
    const editPhoto = () => {
        // Edit functionality would go here
        // This is a placeholder for future implementation
        Alert.alert("Coming Soon", "Photo editing will be available in the next update!");
    };

    // Discard the captured photo
    const discardPhoto = () => {
        hidePhotoPreview(resetPhotoState);
    };

    // Reset photo state
    const resetPhotoState = () => {
        setPhoto(null);
        setFilteredPhotoUri(null);
        setSaving(false);
        setSelectedFilter('normal');

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

            <BannerAd unitId={adUnitId} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} />


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

                {/* 100x Super Zoom Animation Overlay */}
                {superZoomActive && (
                    <View style={styles.superZoomIndicator}>
                        <MaterialCommunityIcons name="magnify-plus" size={16} color="white" />
                        <View>
                            <Text style={styles.superZoomIndicatorText}>100x</Text>
                            <Text style={styles.superZoomIndicatorDisclaimer}>Digital zoom - varies by device</Text>
                        </View>
                    </View>
                )}

                {/* Freeze indicator overlay */}
                {isFrozen && (
                    <View style={styles.frozenOverlay}>
                        <MaterialCommunityIcons name="snowflake" size={36} color="white" />
                        <Text style={styles.frozenText}>FROZEN</Text>
                    </View>
                )}
            </View>

            {/* Control panel - positioned outside the camera container, no filter applied here */}
            <View style={styles.controlsContainer}>
                {/* Top toolbar */}
                <View style={styles.toolbar}>
                    <Text style={styles.titleText}>Magnify</Text>
                    <View style={styles.topButtons}>
                        {/* Gallery Button */}
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={navigateToGallery}
                        >
                            <MaterialCommunityIcons
                                name="image-multiple"
                                size={22}
                                color={SECONDARY_COLOR}
                            />
                            {photoCount > 0 && (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>
                                        {photoCount > 99 ? '99+' : photoCount}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>

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
                            style={[
                                styles.actionButton,
                                isFrozen && styles.actionButtonDisabled
                            ]}
                            onPress={toggleCamera}
                            disabled={showCapturedPhoto || isFrozen}
                        >
                            <MaterialCommunityIcons
                                name={facing === 'back' ? 'camera-front' : 'camera-rear'}
                                size={22}
                                color={isFrozen ? '#a0a0a0' : SECONDARY_COLOR}
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
                    {/* Flashlight button */}
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

                    <TouchableOpacity
                        style={[styles.superZoomButton, superZoomActive && styles.superZoomButtonActive]}
                        onPress={toggleSuperZoom}
                        disabled={showCapturedPhoto}
                    >
                        <MaterialCommunityIcons
                            name="magnify-plus-outline"
                            size={24}
                            color={superZoomActive ? BACKGROUND_COLOR : SECONDARY_COLOR}
                        />
                        <View>
                            <Text style={[
                                styles.superZoomButtonText,
                                superZoomActive && styles.superZoomButtonTextActive
                            ]}>
                                100x
                            </Text>
                            <Text style={styles.superZoomDisclaimer}>Digital</Text>
                        </View>
                    </TouchableOpacity>

                    {/* Capture Button - With gradient effect */}
                    <TouchableOpacity
                        style={styles.captureButton}
                        onPress={takePicture}
                        disabled={showCapturedPhoto}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={[PRIMARY_COLOR, SUCCESS_COLOR]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.captureButtonGradient}
                        >
                            <MaterialCommunityIcons
                                name="camera"
                                size={28}
                                color={BACKGROUND_COLOR}
                            />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Improved Photo Preview Modal - Fullscreen with filters */}
            <Modal
                visible={showCapturedPhoto}
                transparent={true}
                animationType="none" // We're handling animation ourselves
                onRequestClose={discardPhoto}
            >
                <View style={styles.modalContainerFullscreen}>
                    <StatusBar style="light" />

                    {/* Animated container with scale and fade */}
                    <Animated.View
                        style={[
                            styles.photoPreviewContainerFullscreen,
                            {
                                opacity: fadeAnim,
                                transform: [{ scale: scaleAnim }]
                            }
                        ]}
                    >
                        {/* Header */}
                        <View style={styles.previewHeaderFullscreen}>
                            <Text style={styles.previewHeaderTextFullscreen}>Preview</Text>
                            <TouchableOpacity
                                style={styles.previewCloseButtonFullscreen}
                                onPress={discardPhoto}
                            >
                                <MaterialCommunityIcons name="close" size={24} color="white" />
                            </TouchableOpacity>
                        </View>

                        {/* Image container */}
                        <View style={styles.imageContainerFullscreen}>
                            {isProcessingFilter ? (
                                <View style={styles.filterLoadingContainer}>
                                    <ActivityIndicator color="white" size="large" />
                                    <Text style={styles.filterLoadingText}>Applying filter...</Text>
                                </View>
                            ) : (
                                <Image
                                    source={{ uri: filteredPhotoUri || photo?.uri }}
                                    style={styles.photoPreviewFullscreen}
                                    resizeMode="contain"
                                />
                            )}

                            {/* Quality badge */}
                            <View style={styles.qualityBadgeFullscreen}>
                                <MaterialCommunityIcons name="image-filter-hdr" size={16} color="white" />
                                <Text style={styles.qualityTextFullscreen}>HD Quality</Text>
                            </View>
                        </View>

                        {/* Action buttons in footer */}
                        <View style={styles.photoActionsFullscreen}>

                            {/* Share button */}
                            <TouchableOpacity
                                style={styles.photoActionButtonFullscreen}
                                onPress={sharePhoto}
                                disabled={isProcessingFilter}
                            >
                                <MaterialCommunityIcons name="share-variant" size={20} color="white" />
                                <Text style={styles.photoActionTextFullscreen}>Share</Text>
                            </TouchableOpacity>

                            {/* Save button */}
                            <TouchableOpacity
                                style={styles.photoActionButtonSaveFullscreen}
                                onPress={savePhoto}
                                disabled={saving || isProcessingFilter}
                            >
                                {saving ? (
                                    <ActivityIndicator color="white" size="small" />
                                ) : (
                                    <MaterialCommunityIcons name="content-save" size={20} color="white" />
                                )}
                                <Text style={styles.photoActionTextFullscreen}>
                                    {saving ? 'Saving...' : 'Save'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>

                    {/* Bottom info tooltip */}
                    <Animated.View
                        style={[
                            styles.infoTooltipFullscreen,
                            { opacity: fadeAnim }
                        ]}
                    >
                        <MaterialCommunityIcons name="information" size={18} color="white" />
                        <Text style={styles.infoTooltipTextFullscreen}>
                            Photos are saved in the "Magnify" album
                        </Text>
                    </Animated.View>
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
    superZoomDisclaimer: {
        color: SECONDARY_COLOR,
        fontSize: 8,
        opacity: 0.7,
        textAlign: 'center',
    },
    frozenText: {
        color: 'white',
        fontWeight: 'bold',
        marginLeft: 5,
    },
    captureButton: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: SECONDARY_COLOR,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
    },
    captureButtonGradient: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    superZoomIndicatorDisclaimer: {
        color: 'white',
        opacity: 0.7,
        fontSize: 8,
        marginLeft: 5,
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
        position: 'relative',
    },
    actionButtonActive: {
        backgroundColor: SUCCESS_COLOR,
    },
    actionButtonDisabled: {
        opacity: 0.5,
    },
    badge: {
        position: 'absolute',
        top: -5,
        right: -5,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: PRIMARY_COLOR,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    badgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
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
        gap: 20, // Adjusted spacing for three buttons
    },
    flashButton: {
        backgroundColor: SURFACE_COLOR,
        padding: 12,
        borderRadius: 30,
    },
    flashButtonActive: {
        backgroundColor: ACCENT_COLOR,
    },
    // NEW STYLES FOR 100x SUPER ZOOM FEATURE
    superZoomButton: {
        backgroundColor: SURFACE_COLOR,
        padding: 12,
        borderRadius: 30,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 14,
    },
    superZoomButtonActive: {
        backgroundColor: WARNING_COLOR,
    },
    superZoomButtonText: {
        color: SECONDARY_COLOR,
        fontSize: 12,
        fontWeight: 'bold',
        marginLeft: 4,
    },
    superZoomButtonTextActive: {
        color: BACKGROUND_COLOR,
    },
    superZoomOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 5,
        pointerEvents: 'none',
    },
    superZoomText: {
        color: 'white',
        fontSize: 72,
        fontWeight: 'bold',
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 10,
    },
    superZoomIndicator: {
        position: 'absolute',
        top: 20,
        left: 20,
        backgroundColor: WARNING_COLOR,
        borderRadius: 12,
        padding: 8,
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 3,
    },
    superZoomIndicatorText: {
        color: 'white',
        fontWeight: 'bold',
        marginLeft: 5,
    },
    intensityLabel: {
        position: 'absolute',
        bottom: -18,
        left: 54, // Positioned under the flashlight button
        fontSize: 12,
        color: SECONDARY_COLOR,
        fontWeight: '500',
    },
    // Fullscreen Photo Preview styles
    modalContainerFullscreen: {
        flex: 1,
        backgroundColor: 'black',
        justifyContent: 'center',
        alignItems: 'center',
    },
    photoPreviewContainerFullscreen: {
        width: '100%',
        height: '100%',
        backgroundColor: 'black',
    },
    previewHeaderFullscreen: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
    },
    previewHeaderTextFullscreen: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
    },
    previewCloseButtonFullscreen: {
        padding: 8,
        borderRadius: 20,
    },
    imageContainerFullscreen: {
        width: '100%',
        height: '100%',
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
    },
    photoPreviewFullscreen: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
    },
    // Filter loading indicator
    filterLoadingContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    filterLoadingText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '500',
        marginTop: 12,
    },
    qualityBadgeFullscreen: {
        position: 'absolute',
        top: 70,
        right: 12,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    qualityTextFullscreen: {
        color: 'white',
        marginLeft: 4,
        fontSize: 12,
        fontWeight: '500',
    },
    filterScrollView: {
        position: 'absolute',
        bottom: 80,
        left: 0,
        right: 0,
        maxHeight: 60,
    },
    filterContainer: {
        paddingHorizontal: 12,
        paddingVertical: 12,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    filterOption: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginHorizontal: 6,
        borderRadius: 20,
        backgroundColor: 'rgba(50, 50, 50, 0.7)',
    },
    filterOptionSelected: {
        backgroundColor: PRIMARY_COLOR,
    },
    filterText: {
        color: 'white',
        fontWeight: '500',
        fontSize: 14,
    },
    filterTextSelected: {
        fontWeight: 'bold',
    },
    photoActionsFullscreen: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    photoActionButtonFullscreen: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(70, 70, 70, 0.6)',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
    },
    photoActionButtonSaveFullscreen: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: PRIMARY_COLOR,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
    },
    photoActionTextFullscreen: {
        marginLeft: 6,
        color: 'white',
        fontWeight: '500',
        fontSize: 14,
    },
    infoTooltipFullscreen: {
        position: 'absolute',
        bottom: 150,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    infoTooltipTextFullscreen: {
        marginLeft: 8,
        color: 'white',
        fontSize: 14,
    }
});