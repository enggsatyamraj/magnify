import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    StyleSheet,
    Image,
    ActivityIndicator,
    StatusBar,
    Dimensions,
    Alert,
    Platform
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PinchGestureHandler, State } from 'react-native-gesture-handler';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
    useDerivedValue
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import Share from 'react-native-share';
import * as FileSystem from 'expo-file-system';

// Import colors from your utils
import { PRIMARY_COLOR, SECONDARY_COLOR, BACKGROUND_COLOR, ACCENT_COLOR, SUCCESS_COLOR } from '../utils/color';

const { width, height } = Dimensions.get('window');

const PhotoPreviewModal = ({ visible, photo, onSave, onDiscard }) => {
    const [saving, setSaving] = useState(false);
    const [sharing, setSharing] = useState(false);

    // Pinch zoom functionality
    const scale = useSharedValue(1);
    const focalX = useSharedValue(0);
    const focalY = useSharedValue(0);

    // Track previous scale for continuous zooming
    const lastScale = useSharedValue(1);

    // Additional state for magnification info
    const [magnification, setMagnification] = useState(100);

    // Handle pinch gesture
    const onPinchGestureEvent = (event) => {
        // Calculate new scale with constraints
        const newScale = Math.min(Math.max(lastScale.value * event.nativeEvent.scale, 1), 5);
        scale.value = newScale;

        // Update focal point for centered zooming
        focalX.value = event.nativeEvent.focalX;
        focalY.value = event.nativeEvent.focalY;

        // Update magnification percentage (1 = 100%, 2 = 200%, etc.)
        setMagnification(Math.round(newScale * 100));
    };

    // Handle end of pinch gesture
    const onPinchHandlerStateChange = (event) => {
        if (event.nativeEvent.oldState === State.ACTIVE) {
            lastScale.value = scale.value;
        }
    };

    // Reset zoom when modal changes visibility
    React.useEffect(() => {
        if (visible) {
            // Reset to default when newly shown
            scale.value = 1;
            lastScale.value = 1;
            setMagnification(100);
        }
    }, [visible]);

    // Create animated styles for the image
    const animatedImageStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { scale: scale.value }
            ]
        };
    });

    // Handle save with loading indicator
    const handleSave = async () => {
        setSaving(true);
        try {
            // Add a slight delay for UX
            await new Promise(resolve => setTimeout(resolve, 500));
            await onSave();
        } finally {
            setSaving(false);
        }
    };

    // Handle share functionality
    const handleShare = async () => {
        if (!photo || !photo.uri) return;

        try {
            setSharing(true);
            // Provide haptic feedback
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

            // Read the image as base64
            const base64Data = await FileSystem.readAsStringAsync(photo.uri, {
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
            setSharing(false);
        }
    };

    // If the modal is not visible, return null
    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onDiscard}
        >
            <StatusBar backgroundColor="black" barStyle="light-content" />
            <View style={styles.modalContainer}>
                <View style={styles.headerBar}>
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={onDiscard}
                    >
                        <MaterialCommunityIcons name="close" size={24} color="white" />
                    </TouchableOpacity>
                    <View style={styles.headerInfo}>
                        <Text style={styles.magnificationText}>{magnification}%</Text>
                    </View>
                </View>

                <GestureHandlerRootView style={styles.gestureContainer}>
                    <PinchGestureHandler
                        onGestureEvent={onPinchGestureEvent}
                        onHandlerStateChange={onPinchHandlerStateChange}
                    >
                        <Animated.View style={styles.imageContainer}>
                            <Animated.Image
                                source={{ uri: photo?.uri }}
                                style={[styles.previewImage, animatedImageStyle]}
                                resizeMode="contain"
                            />

                            {/* Pinch instruction overlay - shown briefly */}
                            <View style={styles.instructionOverlay}>
                                <MaterialCommunityIcons name="gesture-spread" size={48} color="white" />
                                <Text style={styles.instructionText}>Pinch to zoom</Text>
                            </View>
                        </Animated.View>
                    </PinchGestureHandler>
                </GestureHandlerRootView>

                <View style={styles.actionBar}>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.discardButton]}
                        onPress={onDiscard}
                        disabled={saving || sharing}
                    >
                        <MaterialCommunityIcons name="delete-outline" size={24} color="white" />
                        <Text style={styles.actionText}>Discard</Text>
                    </TouchableOpacity>

                    {/* Share button */}
                    <TouchableOpacity
                        style={[styles.actionButton, styles.shareButton]}
                        onPress={handleShare}
                        disabled={saving || sharing}
                    >
                        {sharing ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator color="white" size="small" />
                                <Text style={styles.actionText}>Sharing...</Text>
                            </View>
                        ) : (
                            <>
                                <MaterialCommunityIcons name="share-variant" size={24} color="white" />
                                <Text style={styles.actionText}>Share</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, styles.saveButton]}
                        onPress={handleSave}
                        disabled={saving || sharing}
                    >
                        {saving ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator color="white" size="small" />
                                <Text style={styles.actionText}>Saving...</Text>
                            </View>
                        ) : (
                            <>
                                <MaterialCommunityIcons name="content-save-outline" size={24} color="white" />
                                <Text style={styles.actionText}>Save</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        backgroundColor: 'black',
        justifyContent: 'space-between'
    },
    headerBar: {
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        zIndex: 10
    },
    closeButton: {
        padding: 8,
    },
    headerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    magnificationText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '500',
    },
    gestureContainer: {
        flex: 1
    },
    imageContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'black',
    },
    previewImage: {
        width: width,
        height: height - 160, // Adjust for header and action bar
        backgroundColor: 'transparent',
    },
    instructionOverlay: {
        position: 'absolute',
        bottom: 100,
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        padding: 16,
        borderRadius: 16,
        // This will fade out after showing briefly
        opacity: 0.8
    },
    instructionText: {
        color: 'white',
        fontSize: 16,
        marginTop: 8,
    },
    actionBar: {
        height: 80,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        paddingBottom: 16
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 24,
        minWidth: 110,
    },
    discardButton: {
        backgroundColor: SECONDARY_COLOR,
    },
    shareButton: {
        backgroundColor: ACCENT_COLOR,
    },
    saveButton: {
        backgroundColor: SUCCESS_COLOR,
    },
    actionText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});

export default PhotoPreviewModal;