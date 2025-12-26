"use client";
import React, { useRef, useEffect, useState } from 'react';

declare global {
    interface Window {
        Pose: any;
    }
}

interface KeypointOverlayProps {
    videoRef: React.RefObject<HTMLVideoElement | null>;
    isPlaying: boolean;
    onKeypointsDetected?: (keypoints: any[]) => void;
    mirrorKeypoints?: boolean;
}

const KeypointOverlay: React.FC<KeypointOverlayProps> = ({ videoRef, isPlaying, onKeypointsDetected, mirrorKeypoints = false }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const [pose, setPose] = useState<any>(null);

    // MediaPipe Pose connections (33 landmarks)
    const POSE_CONNECTIONS = [
        // Face
        [0, 1], [1, 2], [2, 3], [3, 7], [0, 4], [4, 5], [5, 6], [6, 8],
        // Arms
        [9, 10], [11, 12], [11, 13], [13, 15], [15, 17], [15, 19], [15, 21], [17, 19],
        [12, 14], [14, 16], [16, 18], [16, 20], [16, 22], [18, 20],
        // Body
        [11, 23], [12, 24], [23, 24],
        // Legs
        [23, 25], [24, 26], [25, 27], [26, 28], [27, 29], [28, 30], [29, 31], [30, 32], [27, 31], [28, 32]
    ];

    useEffect(() => {
        const initializeMediaPipe = async () => {
            // Store original console.warn at the start
            const originalConsoleWarn = console.warn;

            try {
                console.log('Initializing MediaPipe Pose...');

                // Suppress CORS warnings for MediaPipe
                console.warn = (...args) => {
                    if (args[0] && typeof args[0] === 'string' && args[0].includes('Cross-Origin-Opener-Policy')) {
                        return; // Skip CORS warnings
                    }
                    originalConsoleWarn.apply(console, args);
                };

                // Load MediaPipe from CDN if not present
                if (!window.Pose) {
                    // Load scripts sequentially
                    await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');
                    await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js');
                    await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js');
                    await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js');
                }

                if (window.Pose) {
                    const poseInstance = new window.Pose({
                        locateFile: (file: string) => {
                            return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
                        }
                    });

                    poseInstance.setOptions({
                        modelComplexity: 1,
                        smoothLandmarks: true,
                        enableSegmentation: false,
                        smoothSegmentation: true,
                        minDetectionConfidence: 0.5,
                        minTrackingConfidence: 0.5
                    });

                    poseInstance.onResults(onResults);
                    setPose(poseInstance);
                    setIsInitialized(true);
                    console.log('MediaPipe Pose initialized successfully');
                } else {
                    console.error('Failed to load MediaPipe Pose class');
                }


                // Restore console.warn after initialization
                setTimeout(() => {
                    console.warn = originalConsoleWarn;
                }, 2000);

            } catch (error) {
                console.error('Failed to load MediaPipe:', error);
                setIsInitialized(false);

                // Restore console.warn even if failed
                setTimeout(() => {
                    console.warn = originalConsoleWarn;
                }, 100);
            }
        };

        // Add small delay to ensure video is ready
        const timer = setTimeout(initializeMediaPipe, 500);

        return () => {
            clearTimeout(timer);
            console.warn = console.warn; // Just in case
        };
    }, []);

    // Cleanup effect
    useEffect(() => {
        return () => {
            if (pose) {
                pose.close();
            }
        };
    }, [pose]);

    // Helper function to load scripts
    const loadScript = (src: string) => {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve(true);
                return;
            }
            const script = document.createElement('script');
            script.src = src;
            script.onload = () => resolve(true);
            script.onerror = reject;
            document.head.appendChild(script);
        });
    };

    useEffect(() => {
        if (!isInitialized || !pose || !videoRef?.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;

        let animationFrameId: number;

        const processFrame = async () => {
            if (video.paused || video.ended || !isPlaying) return;

            try {
                // Match canvas size to video element's display size exactly
                const rect = video.getBoundingClientRect();
                if (canvas.width !== rect.width || canvas.height !== rect.height) {
                    canvas.width = rect.width;
                    canvas.height = rect.height;
                }

                // Send frame to MediaPipe with error handling
                if (pose && typeof pose.send === 'function') {
                    // We need to assure video is loaded
                    if (video.readyState >= 2) {
                        await pose.send({ image: video });
                    }
                }
            } catch (error: any) {
                // Silently handle MediaPipe errors to prevent console spam
                if (error.message && !error.message.includes('Cross-Origin-Opener-Policy')) {
                    console.error('Pose detection error:', error.message);
                }
            }

            if (isPlaying && !video.paused && !video.ended) {
                animationFrameId = requestAnimationFrame(processFrame);
            }
        };

        if (isPlaying) {
            if (video.readyState >= 2) {
                processFrame();
            } else {
                video.addEventListener('loadeddata', () => processFrame(), { once: true });
            }
        } else {
            // Clear canvas if paused
            const ctx = canvas.getContext('2d');
            if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        return () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
        };

    }, [isPlaying, isInitialized, pose, videoRef]);

    const onResults = (results: any) => {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        if (!canvas || !video || !results.poseLandmarks) return;

        try {
            drawPoseMediaPipe(results.poseLandmarks, canvas, video);

            if (onKeypointsDetected) {
                if (mirrorKeypoints) {
                    // Mirror the keypoints for workout comparison (flip x coordinates)
                    const mirroredKeypoints = results.poseLandmarks.map((landmark: any) => ({
                        ...landmark,
                        x: 1 - landmark.x  // Flip x coordinate to match mirrored display
                    }));
                    onKeypointsDetected(mirroredKeypoints);
                } else {
                    // Use original keypoints without mirroring
                    onKeypointsDetected(results.poseLandmarks);
                }
            }
        } catch (error) {
            console.error('Drawing error:', error);
        }
    };

    const drawPoseMediaPipe = (landmarks: any[], canvas: HTMLCanvasElement, video: HTMLVideoElement) => {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Get actual video dimensions and display dimensions
        const videoRect = video.getBoundingClientRect();
        const displayWidth = videoRect.width;
        const displayHeight = videoRect.height;

        // Use videoWidth/Height from video element
        const videoWidth = video.videoWidth || displayWidth;
        const videoHeight = video.videoHeight || displayHeight;


        // Calculate aspect ratios
        const videoAspect = videoWidth / videoHeight;
        const displayAspect = displayWidth / displayHeight;

        // Calculate actual video display area within the video element
        let actualVideoWidth, actualVideoHeight, offsetX = 0, offsetY = 0;

        if (videoAspect > displayAspect) {
            // Video is wider - letterboxed top/bottom (if object-fit: contain)
            // Assuming object-fit: contain which preserves aspect ratio
            actualVideoWidth = displayWidth;
            actualVideoHeight = displayWidth / videoAspect;
            offsetY = (displayHeight - actualVideoHeight) / 2;
        } else {
            // Video is taller - letterboxed left/right
            actualVideoHeight = displayHeight;
            actualVideoWidth = displayHeight * videoAspect;
            offsetX = (displayWidth - actualVideoWidth) / 2;
        }

        // MediaPipe landmarks are normalized (0-1), scale to actual video area
        const scaleX = actualVideoWidth;
        const scaleY = actualVideoHeight;

        // Draw skeleton connections (with mirrored x coordinates)
        POSE_CONNECTIONS.forEach(([i, j]) => {
            const kp1 = landmarks[i];
            const kp2 = landmarks[j];

            // Only draw connections between high-confidence keypoints
            if (kp1 && kp2 && kp1.visibility > 0.65 && kp2.visibility > 0.65) {
                ctx.beginPath();
                const x1 = mirrorKeypoints ? (1 - kp1.x) * scaleX + offsetX : kp1.x * scaleX + offsetX;
                const y1 = kp1.y * scaleY + offsetY;
                const x2 = mirrorKeypoints ? (1 - kp2.x) * scaleX + offsetX : kp2.x * scaleX + offsetX;
                const y2 = kp2.y * scaleY + offsetY;

                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.strokeStyle = '#00FF00';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        });

        // Draw keypoints with different colors (with mirrored x coordinates)
        landmarks.forEach((landmark, index) => {
            // Only show keypoints with high confidence
            if (landmark && landmark.visibility > 0.65) {
                ctx.beginPath();
                const x = mirrorKeypoints ? (1 - landmark.x) * scaleX + offsetX : landmark.x * scaleX + offsetX;
                const y = landmark.y * scaleY + offsetY;

                ctx.arc(x, y, 4, 0, 2 * Math.PI);

                // Different colors for different body parts
                if (index <= 10) {
                    ctx.fillStyle = '#FF6B6B'; // Face and upper body
                } else {
                    ctx.fillStyle = '#38BDF8'; // Unified Blue for all body parts
                }

                ctx.fill();
                // ctx.strokeStyle = '#FFFFFF';
                // ctx.stroke();
            }
        });
    };

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 10
            }}
        />
    );
};

export default KeypointOverlay;
