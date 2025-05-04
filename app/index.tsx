import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BACKGROUND_COLOR, PRIMARY_COLOR, SECONDARY_COLOR } from '../utils/color';
import { APP_NAME } from '../utils/constant';

export default function SplashScreen() {
    // Animation values
    const iconAnimation = useRef(new Animated.Value(0)).current;
    const textAnimations = useRef(
        APP_NAME.split('').map(() => new Animated.Value(0))
    ).current;

    useEffect(() => {
        // Icon animation
        Animated.timing(iconAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
        }).start();

        // Staggered text animation
        Animated.stagger(
            150, // Stagger timing (milliseconds between each letter)
            textAnimations.map(animation =>
                Animated.timing(animation, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                })
            )
        ).start();
    }, []);

    return (
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: BACKGROUND_COLOR }}>
            <Animated.View style={{
                opacity: iconAnimation,
                transform: [
                    {
                        scale: iconAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.5, 1]
                        })
                    }
                ]
            }}>
                <MaterialCommunityIcons name="magnify" size={224} color={PRIMARY_COLOR} />
            </Animated.View>

            <View style={{ flexDirection: 'row' }}>
                {APP_NAME.split('').map((letter, index) => (
                    <Animated.Text
                        key={index}
                        style={{
                            color: SECONDARY_COLOR,
                            fontSize: 30,
                            opacity: textAnimations[index],
                            transform: [
                                {
                                    translateY: textAnimations[index].interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [20, 0]
                                    })
                                }
                            ]
                        }}
                    >
                        {letter}
                    </Animated.Text>
                ))}
            </View>

            <ActivityIndicator size="large" color={SECONDARY_COLOR} style={{ position: 'absolute', bottom: 100 }} />
        </SafeAreaView>
    );
}