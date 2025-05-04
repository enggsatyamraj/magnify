import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Dimensions
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as FileSystem from 'expo-file-system';

import PhotoPreviewModal from '../components/PhotoPreviewModal';
import { BACKGROUND_COLOR, PRIMARY_COLOR, SECONDARY_COLOR, ACCENT_COLOR, SURFACE_COLOR } from '../utils/color';

const { width } = Dimensions.get('window');
const GALLERY_STORAGE_KEY = '@magnify_gallery';
const COLUMN_NUM = 3;
const THUMBNAIL_SIZE = width / COLUMN_NUM - 8;
const THUMBNAIL_SPACING = 4;

const GalleryScreen = () => {
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [previewVisible, setPreviewVisible] = useState(false);
    const [deletingPhoto, setDeletingPhoto] = useState(null);

    // Load photos from AsyncStorage on component mount
    useEffect(() => {
        loadPhotos();
    }, []);

    // Load all saved photos
    const loadPhotos = async () => {
        setLoading(true);
        try {
            const savedPhotosJSON = await AsyncStorage.getItem(GALLERY_STORAGE_KEY);
            const savedPhotos = savedPhotosJSON ? JSON.parse(savedPhotosJSON) : [];

            // Sort photos by date (newest first)
            savedPhotos.sort((a, b) => b.timestamp - a.timestamp);

            setPhotos(savedPhotos);
        } catch (error) {
            console.error('Error loading photos:', error);
            Alert.alert('Error', 'Failed to load saved photos');
        } finally {
            setLoading(false);
        }
    };

    // Save a new photo to AsyncStorage and local storage
    const savePhoto = async (uri, timestamp = Date.now()) => {
        try {
            // Generate a unique identifier for the photo
            const photoId = `photo_${timestamp}`;

            // Copy photo from cache to app's documents directory
            const newPath = `${FileSystem.documentDirectory}${photoId}.jpg`;
            await FileSystem.copyAsync({
                from: uri,
                to: newPath
            });

            // Create photo metadata
            const newPhoto = {
                id: photoId,
                uri: newPath,
                timestamp: timestamp
            };

            // Add to existing photos
            const updatedPhotos = [newPhoto, ...photos];

            // Save to AsyncStorage
            await AsyncStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(updatedPhotos));

            // Update state
            setPhotos(updatedPhotos);

            return newPhoto;
        } catch (error) {
            console.error('Error saving photo:', error);
            Alert.alert('Error', 'Failed to save photo');
            throw error;
        }
    };

    // Delete a photo
    const deletePhoto = async (photo) => {
        setDeletingPhoto(photo.id);
        try {
            // Remove from file system
            await FileSystem.deleteAsync(photo.uri);

            // Remove from list
            const updatedPhotos = photos.filter(p => p.id !== photo.id);

            // Update AsyncStorage
            await AsyncStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(updatedPhotos));

            // Update state
            setPhotos(updatedPhotos);

            // If this was the selected photo in preview, close the preview
            if (selectedPhoto && selectedPhoto.id === photo.id) {
                setPreviewVisible(false);
                setSelectedPhoto(null);
            }
        } catch (error) {
            console.error('Error deleting photo:', error);
            Alert.alert('Error', 'Failed to delete photo');
        } finally {
            setDeletingPhoto(null);
        }
    };

    // Prompt user to confirm photo deletion
    const confirmDelete = (photo) => {
        Alert.alert(
            'Delete Photo',
            'Are you sure you want to delete this photo?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => deletePhoto(photo)
                }
            ]
        );
    };

    // Show the preview modal for a photo
    const showPhotoPreview = (photo) => {
        setSelectedPhoto(photo);
        setPreviewVisible(true);
    };

    // Close the preview modal
    const closePhotoPreview = () => {
        setPreviewVisible(false);
    };

    // Render a photo item in the grid
    const renderPhotoItem = ({ item }) => {
        const isDeleting = deletingPhoto === item.id;

        return (
            <TouchableOpacity
                style={styles.photoItem}
                onPress={() => showPhotoPreview(item)}
                disabled={isDeleting}
            >
                <Image
                    source={{ uri: item.uri }}
                    style={styles.thumbnail}
                />

                {isDeleting && (
                    <View style={styles.deleteOverlay}>
                        <ActivityIndicator color="white" size="small" />
                    </View>
                )}

                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => confirmDelete(item)}
                    disabled={isDeleting}
                >
                    <MaterialCommunityIcons name="delete" size={18} color="white" />
                </TouchableOpacity>
            </TouchableOpacity>
        );
    };

    // Go back to camera screen
    const navigateToCamera = () => {
        router.replace("/mainscreen");
    };

    // Main render
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={navigateToCamera}
                >
                    <MaterialCommunityIcons name="arrow-left" size={24} color={SECONDARY_COLOR} />
                </TouchableOpacity>
                <Text style={styles.title}>Your Photos</Text>
                <View style={styles.headerRight} />
            </View>

            {/* Content */}
            <View style={styles.content}>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
                        <Text style={styles.loadingText}>Loading photos...</Text>
                    </View>
                ) : photos.length > 0 ? (
                    <FlatList
                        data={photos}
                        renderItem={renderPhotoItem}
                        keyExtractor={item => item.id}
                        numColumns={COLUMN_NUM}
                        contentContainerStyle={styles.photoGrid}
                    />
                ) : (
                    <View style={styles.emptyContainer}>
                        <MaterialCommunityIcons name="image-off" size={64} color={SECONDARY_COLOR} />
                        <Text style={styles.emptyText}>No photos yet</Text>
                        <TouchableOpacity
                            style={styles.captureButton}
                            onPress={navigateToCamera}
                        >
                            <Text style={styles.captureButtonText}>Take Some Photos</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* Photo Preview Modal */}
            <PhotoPreviewModal
                visible={previewVisible}
                photo={selectedPhoto}
                onDiscard={closePhotoPreview}
                onSave={closePhotoPreview}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: BACKGROUND_COLOR,
    },
    header: {
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: SURFACE_COLOR,
    },
    backButton: {
        padding: 8,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: SECONDARY_COLOR,
    },
    headerRight: {
        width: 40,
    },
    content: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: SECONDARY_COLOR,
    },
    photoGrid: {
        padding: THUMBNAIL_SPACING,
    },
    photoItem: {
        margin: THUMBNAIL_SPACING,
        width: THUMBNAIL_SIZE,
        height: THUMBNAIL_SIZE,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: SURFACE_COLOR,
        position: 'relative',
    },
    thumbnail: {
        width: '100%',
        height: '100%',
    },
    deleteButton: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        borderRadius: 12,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    deleteOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    emptyText: {
        fontSize: 18,
        color: SECONDARY_COLOR,
        marginTop: 16,
        marginBottom: 24,
    },
    captureButton: {
        backgroundColor: PRIMARY_COLOR,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 24,
    },
    captureButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default GalleryScreen;