import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, Dimensions, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BACKGROUND_COLOR, PRIMARY_COLOR, SECONDARY_COLOR, SUCCESS_COLOR } from '../utils/color';
import { APP_NAME } from '../utils/constant';
import { router } from 'expo-router';

export default function SplashScreen() {
    // Get screen dimensions to apply golden ratio
    const { width, height } = Dimensions.get('window');
    const goldenRatio = 1.618;

    // Animation values
    const fadeIn = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(0.8)).current;
    const textOpacity = useRef(new Animated.Value(0)).current;
    const circleSize = Math.min(width, height) / goldenRatio;

    useEffect(() => {
        // Staggered animations for a professional entrance
        Animated.sequence([
            // First animate the circle and icon
            Animated.parallel([
                Animated.timing(fadeIn, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(scale, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ]),
            // Then animate the text
            Animated.timing(textOpacity, {
                toValue: 1,
                duration: 600,
                delay: 200,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            router.replace('/mainscreen');
        }, 3000)

        return () => {
            clearTimeout(timer);
        }
    }, [])

    return (
        <SafeAreaView style={styles.container}>
            {/* Subtle background pattern */}
            <View style={styles.patternContainer}>
                {Array.from({ length: 20 }).map((_, index) => (
                    <View
                        key={index}
                        style={[
                            styles.patternDot,
                            {
                                top: `${Math.random() * 100}%`,
                                left: `${Math.random() * 100}%`,
                                opacity: Math.random() * 0.2 + 0.05
                            }
                        ]}
                    />
                ))}
            </View>

            {/* Main content - following golden ratio for visual harmony */}
            <View style={styles.contentContainer}>
                {/* Animated circle with gradient */}
                <Animated.View
                    style={[
                        styles.circleContainer,
                        {
                            opacity: fadeIn,
                            transform: [{ scale }],
                            width: circleSize,
                            height: circleSize,
                            borderRadius: circleSize / 2,
                        }
                    ]}
                >
                    <LinearGradient
                        colors={[PRIMARY_COLOR, SUCCESS_COLOR]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.gradient}
                    >
                        <MaterialCommunityIcons
                            name="magnify"
                            size={circleSize / 2} // Icon size proportional to circle
                            color={BACKGROUND_COLOR}
                        />
                    </LinearGradient>
                </Animated.View>

                {/* App name with animated fade in */}
                <Animated.View
                    style={[
                        styles.textContainer,
                        {
                            opacity: textOpacity,
                            marginTop: circleSize / goldenRatio / 2 // Spacing based on golden ratio
                        }
                    ]}
                >
                    <Text style={styles.appName}>{APP_NAME}</Text>
                    <Text style={styles.tagline}>See the world in detail</Text>
                </Animated.View>
            </View>

            {/* Activity indicator */}
            <ActivityIndicator
                size="small"
                color={PRIMARY_COLOR}
                style={styles.loader}
            />

            {/* Version text */}
            <Text style={styles.versionText}>v1.0.0</Text>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: BACKGROUND_COLOR,
    },
    patternContainer: {
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden',
    },
    patternDot: {
        position: 'absolute',
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: PRIMARY_COLOR,
    },
    contentContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    circleContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: SECONDARY_COLOR,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    gradient: {
        width: '100%',
        height: '100%',
        borderRadius: 1000, // Large value to ensure it remains circular
        justifyContent: 'center',
        alignItems: 'center',
    },
    textContainer: {
        alignItems: 'center',
    },
    appName: {
        color: SECONDARY_COLOR,
        fontSize: 32,
        fontWeight: 'bold',
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    tagline: {
        color: SECONDARY_COLOR,
        fontSize: 16,
        opacity: 0.7,
    },
    loader: {
        position: 'absolute',
        bottom: 80,
    },
    versionText: {
        position: 'absolute',
        bottom: 20,
        color: SECONDARY_COLOR,
        opacity: 0.5,
        fontSize: 12,
    }
});