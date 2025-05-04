import React, { useState } from 'react';

const FlashlightIntensityDemo = () => {
    // State variables
    const [flashOn, setFlashOn] = useState(false);
    const [flashIntensity, setFlashIntensity] = useState(0.5);
    const [showIntensitySlider, setShowIntensitySlider] = useState(false);

    // Google Material Design colors
    const PRIMARY_COLOR = '#1a73e8';
    const SECONDARY_COLOR = '#202124';
    const BACKGROUND_COLOR = '#ffffff';
    const SURFACE_COLOR = '#f1f3f4';
    const ACCENT_COLOR = '#ea4335';

    // Toggle flashlight
    const toggleFlash = () => {
        setFlashOn(prev => !prev);
        if (!flashOn) {
            setShowIntensitySlider(true);
        } else {
            setShowIntensitySlider(false);
        }
    };

    // Calculate flash filter opacity based on intensity
    const getFlashFilterOpacity = () => {
        return flashOn ? 0.8 - (flashIntensity * 0.8) : 0;
    };

    return (
        <div className="flex flex-col w-full h-screen relative bg-slate-800">
            {/* Camera View Container with fixed height */}
            <div className="h-4/5 relative overflow-hidden">
                {/* Camera View (simulated) */}
                <div className="w-full h-full flex items-center justify-center bg-gray-900">
                    <img src="/api/placeholder/400/800" alt="Camera preview placeholder" className="w-full h-full object-cover" />

                    {/* Flash intensity filter overlay - only applied to camera area */}
                    {flashOn && (
                        <div
                            className="absolute inset-0 pointer-events-none bg-black"
                            style={{ opacity: getFlashFilterOpacity() }}
                        />
                    )}
                </div>
            </div>

            {/* Control panel - outside the filter area */}
            <div className="absolute bottom-0 left-0 right-0 rounded-t-3xl p-4" style={{ backgroundColor: BACKGROUND_COLOR }}>
                {/* Top section */}
                <div className="flex flex-row justify-between items-center mb-4">
                    <span className="text-lg font-bold" style={{ color: SECONDARY_COLOR }}>Magnify</span>
                    <div className="p-2 rounded-full" style={{ backgroundColor: SURFACE_COLOR }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={SECONDARY_COLOR} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M7 2v11m0 0a4 4 0 0 0 4 4h2a4 4 0 0 0 4-4v-3a4 4 0 0 0-4-4h-2a4 4 0 0 0-4 4z" />
                            <circle cx="12" cy="10" r="1" />
                        </svg>
                    </div>
                </div>

                {/* Zoom slider */}
                <div className="flex flex-row items-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={SECONDARY_COLOR} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="5" y1="11" x2="17" y2="11" />
                    </svg>

                    <div className="flex-1 mx-3 h-2 rounded-full relative" style={{ backgroundColor: SURFACE_COLOR }}>
                        <div className="absolute left-0 top-0 h-2 rounded-full w-1/2" style={{ backgroundColor: PRIMARY_COLOR }}></div>
                        <div className="absolute w-4 h-4 rounded-full top-1/2 left-1/2 transform -translate-y-1/2" style={{ backgroundColor: PRIMARY_COLOR }}></div>
                    </div>

                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={SECONDARY_COLOR} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="11" y1="8" x2="11" y2="14" />
                        <line x1="8" y1="11" x2="14" y2="11" />
                    </svg>
                </div>

                {/* Flashlight intensity slider (only shown when active) */}
                {showIntensitySlider && (
                    <div className="flex flex-row items-center mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={SECONDARY_COLOR} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="5" />
                            <path d="M12 1v2" />
                            <path d="M12 21v2" />
                            <path d="M4.22 4.22l1.42 1.42" />
                            <path d="M18.36 18.36l1.42 1.42" />
                            <path d="M1 12h2" />
                            <path d="M21 12h2" />
                            <path d="M4.22 19.78l1.42-1.42" />
                            <path d="M18.36 5.64l1.42-1.42" />
                        </svg>

                        <div className="flex-1 mx-3 h-2 rounded-full relative" style={{ backgroundColor: SURFACE_COLOR }}>
                            <div
                                className="absolute left-0 top-0 h-2 rounded-full"
                                style={{
                                    backgroundColor: ACCENT_COLOR,
                                    width: `${flashIntensity * 100}%`
                                }}
                            ></div>
                            <div
                                className="absolute w-4 h-4 rounded-full top-1/2 transform -translate-y-1/2"
                                style={{
                                    backgroundColor: ACCENT_COLOR,
                                    left: `${flashIntensity * 100}%`
                                }}
                            ></div>
                        </div>

                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={SECONDARY_COLOR} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="5" />
                            <path d="M12 1v2" />
                            <path d="M12 21v2" />
                            <path d="M4.22 4.22l1.42 1.42" />
                            <path d="M18.36 18.36l1.42 1.42" />
                            <path d="M1 12h2" />
                            <path d="M21 12h2" />
                            <path d="M4.22 19.78l1.42-1.42" />
                            <path d="M18.36 5.64l1.42-1.42" />
                        </svg>
                    </div>
                )}

                {/* Flashlight button */}
                <div className="flex flex-col items-center">
                    <button
                        className="p-3 rounded-full flex items-center justify-center"
                        style={{
                            backgroundColor: flashOn ? ACCENT_COLOR : SURFACE_COLOR,
                            transition: 'background-color 0.3s'
                        }}
                        onClick={toggleFlash}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke={flashOn ? BACKGROUND_COLOR : SECONDARY_COLOR}
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M18 6l-12 12"></path>
                            <path d="M15 6v12l-3-3"></path>
                            <path d="M9 6v12l3-3"></path>
                        </svg>
                    </button>

                    {/* Intensity percentage label */}
                    {flashOn && (
                        <span className="mt-2 text-xs" style={{ color: SECONDARY_COLOR }}>
                            {Math.round(flashIntensity * 100)}%
                        </span>
                    )}
                </div>
            </div>

            {/* Interactive controls */}
            <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-lg">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold mr-2" style={{ color: SECONDARY_COLOR }}>Intensity:</span>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={flashIntensity}
                        onChange={(e) => setFlashIntensity(parseFloat(e.target.value))}
                        className="w-24"
                    />
                </div>
                <div className="text-xs text-center mb-2" style={{ color: SECONDARY_COLOR }}>
                    Filter only on camera area
                </div>
                <div className="flex justify-center">
                    <button
                        className="text-xs py-1 px-2 rounded"
                        style={{ backgroundColor: PRIMARY_COLOR, color: 'white' }}
                        onClick={toggleFlash}
                    >
                        {flashOn ? 'Turn Off Light' : 'Turn On Light'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FlashlightIntensityDemo;