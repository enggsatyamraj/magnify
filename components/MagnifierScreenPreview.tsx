import React from 'react';

const MagnifierScreenPreview = () => {
    // Google Material Design colors
    const PRIMARY_COLOR = '#1a73e8';
    const SECONDARY_COLOR = '#202124';
    const BACKGROUND_COLOR = '#ffffff';
    const SURFACE_COLOR = '#f1f3f4';
    const ACCENT_COLOR = '#ea4335';

    return (
        <div className="flex flex-col w-full h-screen relative bg-slate-800">
            {/* Camera View (simulated) */}
            <div className="flex-1 bg-gray-900 relative overflow-hidden">
                {/* Camera simulation */}
                <div className="w-full h-full flex items-center justify-center">
                    <img src="/api/placeholder/400/800" alt="Camera preview placeholder" className="w-full h-full object-cover" />
                </div>
            </div>

            {/* Control panel */}
            <div className="absolute bottom-0 left-0 right-0 rounded-t-3xl" style={{ backgroundColor: BACKGROUND_COLOR }}>
                {/* Top toolbar */}
                <div className="flex flex-row justify-between items-center px-5 py-4">
                    <span className="text-lg font-bold" style={{ color: SECONDARY_COLOR }}>Magnify</span>
                    <div className="p-2 rounded-full" style={{ backgroundColor: SURFACE_COLOR }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={SECONDARY_COLOR} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M7 2v11m0 0a4 4 0 0 0 4 4h2a4 4 0 0 0 4-4v-3a4 4 0 0 0-4-4h-2a4 4 0 0 0-4 4z" />
                            <circle cx="12" cy="10" r="1" />
                        </svg>
                    </div>
                </div>

                {/* Slider */}
                <div className="flex flex-row items-center px-5 mb-5">
                    {/* Minus icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={SECONDARY_COLOR} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="5" y1="11" x2="17" y2="11" />
                    </svg>

                    {/* Slider */}
                    <div className="flex-1 mx-3 h-2 rounded-full relative" style={{ backgroundColor: SURFACE_COLOR }}>
                        <div className="absolute left-0 top-0 h-2 rounded-full w-1/2" style={{ backgroundColor: PRIMARY_COLOR }}></div>
                        <div className="absolute w-4 h-4 rounded-full top-1/2 left-1/2 transform -translate-y-1/2" style={{ backgroundColor: PRIMARY_COLOR }}></div>
                    </div>

                    {/* Plus icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={SECONDARY_COLOR} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="11" y1="8" x2="11" y2="14" />
                        <line x1="8" y1="11" x2="14" y2="11" />
                    </svg>
                </div>

                {/* Flashlight button */}
                <div className="flex justify-center mb-6">
                    <div className="p-3 rounded-full" style={{ backgroundColor: SURFACE_COLOR }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={SECONDARY_COLOR} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10 7l5 5-5 5V7z" />
                            <path d="M6 18h12V6H6v12z" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Permission screen (hidden) */}
            <div className="hidden absolute inset-0 z-10 bg-white flex flex-col items-center justify-center px-8">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke={SECONDARY_COLOR} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6.18 6.18L3 9.36V18a1 1 0 0 0 1 1h4" />
                    <path d="M6.18 6.18L9.36 3H18a1 1 0 0 1 1 1v.5" />
                    <path d="M6.18 6.18L21 21" />
                    <path d="M9 9a3 3 0 0 0 5.64 1.46" />
                    <path d="M21 15V9" />
                    <path d="M21 9l3 7m-4.7-3H23" />
                </svg>
                <h2 className="text-xl font-bold mt-5 mb-2" style={{ color: SECONDARY_COLOR }}>Camera Access Needed</h2>
                <p className="text-center mb-8" style={{ color: SECONDARY_COLOR }}>
                    Magnify needs access to your camera to function properly.
                    Please grant camera permission to use the magnifier functionality.
                </p>
                <button className="py-3 px-8 rounded-lg mb-4 text-white font-medium" style={{ backgroundColor: PRIMARY_COLOR }}>
                    Grant Permission
                </button>
                <button className="py-3 px-8 text-blue-600 font-medium" style={{ color: PRIMARY_COLOR }}>
                    Open Settings
                </button>
            </div>
        </div>
    );
};

export default MagnifierScreenPreview;