import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

// Import colors from your utils
import { PRIMARY_COLOR, SECONDARY_COLOR, BACKGROUND_COLOR, SURFACE_COLOR, ACCENT_COLOR, SUCCESS_COLOR } from '../utils/color';

const PhotoCaptureDemo = () => {
    // State variables
    const [showCapturedPhoto, setShowCapturedPhoto] = useState(false);
    const [isFrozen, setIsFrozen] = useState(false);
    const [saving, setSaving] = useState(false);

    // Simulate taking a picture
    const takePicture = () => {
        console.log('Taking picture');
        setShowCapturedPhoto(true);
        setIsFrozen(true);
    };

    // Simulate saving photo
    const savePhoto = () => {
        setSaving(true);
        setTimeout(() => {
            setSaving(false);
            discardPhoto();
        }, 2000);
    };

    // Discard photo
    const discardPhoto = () => {
        setShowCapturedPhoto(false);
        setIsFrozen(false);
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            {/* Camera View Container */}
            <View style={styles.cameraContainer}>
                {/* Camera View (simulated) */}
                <View style={styles.camera}>
                    <Image
                        source={{ uri: 'https://via.placeholder.com/400x800' }}
                        style={styles.cameraPreview}
                    />

                    {/* Freeze indicator */}
                    {isFrozen && !showCapturedPhoto && (
                        <View style={styles.frozenOverlay}>
                            <MaterialCommunityIcons name="snowflake" size={24} color="white" />
                            <Text style={styles.frozenText}>FROZEN</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Control panel */}
            <View style={styles.controlsContainer}>
                {/* Top section */}
                <View style={styles.toolbar}>
                    <Text style={styles.titleText}>Magnify</Text>
                    <View style={styles.topButtons}>
                        {/* Freeze button */}
                        <TouchableOpacity
                            style={[styles.actionButton, isFrozen && styles.actionButtonActive]}
                            onPress={() => setIsFrozen(!isFrozen)}
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
                            disabled={isFrozen || showCapturedPhoto}
                        >
                            <MaterialCommunityIcons
                                name="camera-front"
                                size={22}
                                color={SECONDARY_COLOR}
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Zoom slider */}
                <View style={styles.sliderContainer}>
                    <MaterialCommunityIcons name="magnify-minus" size={22} color={SECONDARY_COLOR} />
                    <View style={styles.sliderPlaceholder}>
                        <View style={styles.sliderTrack} />
                        <View style={styles.sliderThumb} />
                    </View>
                    <MaterialCommunityIcons name="magnify-plus" size={22} color={SECONDARY_COLOR} />
                </View>

                {/* Bottom controls with flashlight and capture buttons */}
                <View style={styles.bottomControls}>
                    {/* Flashlight button */}
                    <TouchableOpacity style={styles.flashButton}>
                        <MaterialCommunityIcons
                            name="flashlight-off"
                            size={24}
                            color={SECONDARY_COLOR}
                        />
                    </TouchableOpacity>

                    {/* Capture button */}
                    <TouchableOpacity
                        style={styles.captureButton}
                        onPress={takePicture}
                        disabled={showCapturedPhoto}
                    >
                        <MaterialCommunityIcons
                            name="camera"
                            size={28}
                            color="white"
                        />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Photo Preview Modal */}
            {showCapturedPhoto && (
                <View style={styles.modalContainer}>
                    <View style={styles.photoPreviewContainer}>
                        {/* Photo preview */}
                        <View style={styles.photoPreview}>
                            <Image
                                source={{ uri: 'https://via.placeholder.com/700x500' }}
                                style={styles.previewImage}
                                resizeMode="contain"
                            />
                        </View>

                        {/* Action buttons */}
                        <View style={styles.photoActions}>
                            {/* Discard button */}
                            <TouchableOpacity
                                style={[styles.photoActionButton, styles.discardButton]}
                                onPress={discardPhoto}
                                disabled={saving}
                            >
                                <MaterialCommunityIcons name="close" size={22} color="white" />
                                <Text style={styles.photoActionText}>Discard</Text>
                            </TouchableOpacity>

                            {/* Save button */}
                            <TouchableOpacity
                                style={[styles.photoActionButton, styles.saveButton]}
                                onPress={savePhoto}
                                disabled={saving}
                            >
                                {saving ? (
                                    <View style={styles.savingContainer}>
                                        <ActivityIndicator color="white" size="small" />
                                        <Text style={styles.photoActionText}>Saving...</Text>
                                    </View>
                                ) : (
                                    <>
                                        <MaterialCommunityIcons name="content-save" size={22} color="white" />
                                        <Text style={styles.photoActionText}>Save</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}

            {/* Interactive helper controls */}
            <View style={styles.helperContainer}>
                <Text style={styles.helperTitle}>Capture Demo Controls</Text>
                <TouchableOpacity
                    style={styles.helperButton}
                    onPress={takePicture}
                    disabled={showCapturedPhoto}
                >
                    <Text style={styles.helperButtonText}>Take Photo</Text>
                </TouchableOpacity>
                <Text style={styles.helperText}>
                    Use this button or the camera button next to the flashlight
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    cameraContainer: {
        flex: 1,
        position: 'relative',
    },
    camera: {
        flex: 1,
        width: '100%',
    },
    cameraPreview: {
        flex: 1,
        width: '100%',
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
    },
    frozenText: {
        color: 'white',
        fontWeight: 'bold',
        marginLeft: 5,
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
    sliderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 20,
    },
    sliderPlaceholder: {
        flex: 1,
        height: 2,
        backgroundColor: SURFACE_COLOR,
        marginHorizontal: 10,
        position: 'relative',
    },
    sliderTrack: {
        position: 'absolute',
        left: 0,
        top: 0,
        height: 2,
        width: '50%',
        backgroundColor: PRIMARY_COLOR,
    },
    sliderThumb: {
        position: 'absolute',
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: PRIMARY_COLOR,
        top: -7,
        left: '50%',
        marginLeft: -8,
    },
    bottomControls: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 10,
    },
    flashButton: {
        padding: 12,
        borderRadius: 30,
        backgroundColor: SURFACE_COLOR,
        marginRight: 30,
    },
    captureButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: PRIMARY_COLOR,
        borderWidth: 2,
        borderColor: ACCENT_COLOR,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 50,
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
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    previewImage: {
        width: '100%',
        height: '100%',
    },
    photoActions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingVertical: 15,
        height: 70,
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
    savingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    helperContainer: {
        position: 'absolute',
        top: 20,
        left: 20,
        backgroundColor: 'white',
        padding: 12,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        zIndex: 40,
    },
    helperTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: SECONDARY_COLOR,
        marginBottom: 8,
    },
    helperButton: {
        backgroundColor: PRIMARY_COLOR,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 4,
        marginBottom: 8,
    },
    helperButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
        textAlign: 'center',
    },
    helperText: {
        fontSize: 12,
        color: SECONDARY_COLOR,
    },
});

export default PhotoCaptureDemo;