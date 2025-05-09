// components/PhotoPreviewModal.tsx
import React, { useState, useRef, useEffect } from 'react';
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
    FlatList
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PinchGestureHandler, State } from 'react-native-gesture-handler';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import Share from 'react-native-share';
import * as FileSystem from 'expo-file-system';

// Import colors from your utils
import { PRIMARY_COLOR, SECONDARY_COLOR, BACKGROUND_COLOR, ACCENT_COLOR, SUCCESS_COLOR } from '../utils/color';

const { width, height } = Dimensions.get('window');

const PhotoPreviewModal = ({ visible, photo, photos = [], initialIndex = 0, onSave, onDiscard, onDelete }) => {
    const [saving, setSaving] = useState(false);
    const [sharing, setSharing] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [currentPhoto, setCurrentPhoto] = useState(photo);

    const flatListRef = useRef(null);

    // Pinch zoom functionality
    const scale = useSharedValue(1);
    const lastScale = useSharedValue(1);

    // Additional state for magnification info
    const [magnification, setMagnification] = useState(100);

    // Effect to update current photo when initialIndex changes
    useEffect(() => {
        if (visible) {
            // If we have an array of photos, use that
            if (photos && photos.length > 0) {
                setCurrentIndex(initialIndex);
                setCurrentPhoto(photos[initialIndex]);
            } else if (photo) {
                // Otherwise use the single photo prop
                setCurrentPhoto(photo);
            }

            // Reset zoom when modal appears or current photo changes
            scale.value = 1;
            lastScale.value = 1;
            setMagnification(100);
        }
    }, [visible, initialIndex, photo, photos]);

    // Scroll to the current index when it changes
    useEffect(() => {
        if (flatListRef.current && visible && photos.length > 0) {
            flatListRef.current.scrollToIndex({
                index: currentIndex,
                animated: false
            });
        }
    }, [currentIndex, visible]);

    // Handle pinch gesture for zooming
    const onPinchGestureEvent = (event) => {
        // Calculate new scale with constraints
        const newScale = Math.min(Math.max(lastScale.value * event.nativeEvent.scale, 1), 5);
        scale.value = newScale;

        // Update magnification percentage
        setMagnification(Math.round(newScale * 100));
    };

    // Handle end of pinch gesture
    const onPinchHandlerStateChange = (event) => {
        if (event.nativeEvent.oldState === State.ACTIVE) {
            lastScale.value = scale.value;
        }
    };

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
            await onSave(currentPhoto);
        } finally {
            setSaving(false);
        }
    };

    // Handle share functionality
    const handleShare = async () => {
        if (!currentPhoto || !currentPhoto.uri) return;

        try {
            setSharing(true);
            // Provide haptic feedback
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

            // Read the image as base64
            const base64Data = await FileSystem.readAsStringAsync(currentPhoto.uri, {
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

    // Handle delete photo
    const handleDelete = () => {
        if (onDelete && currentPhoto) {
            Alert.alert(
                "Delete Photo",
                "Are you sure you want to delete this photo?",
                [
                    { text: "Cancel", style: "cancel" },
                    {
                        text: "Delete",
                        style: "destructive",
                        onPress: () => {
                            onDelete(currentPhoto);

                            // If this was the last photo, close the modal
                            if (photos.length <= 1) {
                                onDiscard();
                            }
                            // If we deleted the last photo in the array, go to previous
                            else if (currentIndex === photos.length - 1) {
                                setCurrentIndex(currentIndex - 1);
                            }
                            // Otherwise stay on same index (it will show next photo)
                        }
                    }
                ]
            );
        }
    };

    // Navigate to the previous photo
    const goToPreviousPhoto = () => {
        if (photos && photos.length > 1 && currentIndex > 0) {
            // Reset zoom first
            scale.value = 1;
            lastScale.value = 1;
            setMagnification(100);

            // Provide haptic feedback
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

            // Update index
            setCurrentIndex(currentIndex - 1);
        }
    };

    // Navigate to the next photo
    const goToNextPhoto = () => {
        if (photos && photos.length > 1 && currentIndex < photos.length - 1) {
            // Reset zoom first
            scale.value = 1;
            lastScale.value = 1;
            setMagnification(100);

            // Provide haptic feedback
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

            // Update index
            setCurrentIndex(currentIndex + 1);
        }
    };

    // Handle view change when swiping through photos
    const handleViewableItemsChanged = ({ viewableItems }) => {
        if (viewableItems.length > 0) {
            const newIndex = viewableItems[0].index;
            if (newIndex !== undefined && newIndex !== currentIndex) {
                setCurrentIndex(newIndex);
                setCurrentPhoto(photos[newIndex]);

                // Reset zoom
                scale.value = 1;
                lastScale.value = 1;
                setMagnification(100);

                // Provide haptic feedback
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
        }
    };

    // Render a single photo item
    const renderPhotoItem = ({ item }) => {
        return (
            <View style={styles.slideContainer}>
                <PinchGestureHandler
                    onGestureEvent={onPinchGestureEvent}
                    onHandlerStateChange={onPinchHandlerStateChange}
                >
                    <Animated.View style={styles.animatedContainer}>
                        <Animated.Image
                            source={{ uri: item.uri }}
                            style={[styles.previewImage, animatedImageStyle]}
                            resizeMode="contain"
                        />
                    </Animated.View>
                </PinchGestureHandler>
            </View>
        );
    };

    // Handle scroll to failed - retry with a fallback method
    const onScrollToIndexFailed = (info) => {
        const wait = new Promise(resolve => setTimeout(resolve, 500));
        wait.then(() => {
            if (flatListRef.current && photos.length > 0) {
                flatListRef.current.scrollToIndex({
                    index: Math.min(currentIndex, photos.length - 1),
                    animated: false
                });
            }
        });
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
                        {photos && photos.length > 1 && (
                            <Text style={styles.photoCountText}>
                                {currentIndex + 1} / {photos.length}
                            </Text>
                        )}
                        <Text style={styles.magnificationText}>{magnification}%</Text>
                    </View>
                </View>

                <GestureHandlerRootView style={styles.gestureContainer}>
                    {photos && photos.length > 0 ? (
                        <>
                            <FlatList
                                ref={flatListRef}
                                data={photos}
                                renderItem={renderPhotoItem}
                                keyExtractor={(item) => item.id}
                                horizontal
                                pagingEnabled
                                showsHorizontalScrollIndicator={false}
                                initialScrollIndex={currentIndex}
                                getItemLayout={(data, index) => ({
                                    length: width,
                                    offset: width * index,
                                    index,
                                })}
                                onViewableItemsChanged={handleViewableItemsChanged}
                                viewabilityConfig={{
                                    itemVisiblePercentThreshold: 50
                                }}
                                onScrollToIndexFailed={onScrollToIndexFailed}
                                maxToRenderPerBatch={3}
                                windowSize={5}
                            />

                            {/* Navigation buttons */}
                            {currentIndex > 0 && (
                                <TouchableOpacity
                                    style={[styles.navButton, styles.prevButton]}
                                    onPress={goToPreviousPhoto}
                                >
                                    <MaterialCommunityIcons name="chevron-left" size={36} color="white" />
                                </TouchableOpacity>
                            )}

                            {currentIndex < photos.length - 1 && (
                                <TouchableOpacity
                                    style={[styles.navButton, styles.nextButton]}
                                    onPress={goToNextPhoto}
                                >
                                    <MaterialCommunityIcons name="chevron-right" size={36} color="white" />
                                </TouchableOpacity>
                            )}
                        </>
                    ) : (
                        // Fall back to single photo display if no array is provided
                        <PinchGestureHandler
                            onGestureEvent={onPinchGestureEvent}
                            onHandlerStateChange={onPinchHandlerStateChange}
                        >
                            <Animated.View style={styles.imageContainer}>
                                <Animated.Image
                                    source={{ uri: currentPhoto?.uri }}
                                    style={[styles.previewImage, animatedImageStyle]}
                                    resizeMode="contain"
                                />
                            </Animated.View>
                        </PinchGestureHandler>
                    )}

                    {/* Pinch instruction overlay - shown briefly */}
                    <View style={styles.instructionOverlay}>
                        <MaterialCommunityIcons name="gesture-spread" size={48} color="white" />
                        <Text style={styles.instructionText}>Pinch to zoom • Swipe to browse</Text>
                    </View>
                </GestureHandlerRootView>

                <View style={styles.actionBar}>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.discardButton]}
                        onPress={handleDelete}
                        disabled={saving || sharing}
                    >
                        <MaterialCommunityIcons name="delete-outline" size={24} color="white" />
                        <Text style={styles.actionText}>Delete</Text>
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
    photoCountText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '500',
        marginRight: 16,
    },
    magnificationText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '500',
    },
    gestureContainer: {
        flex: 1,
        position: 'relative',
    },
    slideContainer: {
        width,
        height: height - 160, // Adjust for header and action bar
        justifyContent: 'center',
        alignItems: 'center',
    },
    animatedContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
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
        alignSelf: 'center',
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
        textAlign: 'center',
    },
    navButton: {
        position: 'absolute',
        top: '50%',
        marginTop: -25,
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10
    },
    prevButton: {
        left: 10,
    },
    nextButton: {
        right: 10,
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