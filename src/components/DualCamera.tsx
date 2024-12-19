import { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';

interface DualCameraProps {
  showToast: (message: string) => void;
}

const DualCamera = ({ showToast }: DualCameraProps) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [detectedColor, setDetectedColor] = useState<string | null>(null);
  const videoRef1 = useRef<HTMLVideoElement | null>(null);
  const videoRef2 = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const startCamera = async (): Promise<void> => {
    try {
      const constraints: MediaStreamConstraints = {
        video: { facingMode: 'environment' },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      setStartTime(new Date());
      showToast("Back camera activated");
    } catch (error) {
      showToast("Unable to access camera. Please check permissions.");
      console.log(error)
    }
  };

  const stopCamera = (): void => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setStartTime(null);
      showToast("Camera stopped");
    }
  };

  const getAverageColor = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number) => {
    const radius = 20; // Half of the circle width (40px)
    const imageData = ctx.getImageData(centerX - radius, centerY - radius, radius * 2, radius * 2);
    let r = 0, g = 0, b = 0, count = 0;

    for (let x = 0; x < radius * 2; x++) {
      for (let y = 0; y < radius * 2; y++) {
        // Check if the pixel is within the circle
        const dx = x - radius;
        const dy = y - radius;
        if (dx * dx + dy * dy <= radius * radius) {
          const i = (y * radius * 2 + x) * 4;
          r += imageData.data[i];
          g += imageData.data[i + 1];
          b += imageData.data[i + 2];
          count++;
        }
      }
    }

    return {
      r: Math.round(r / count),
      g: Math.round(g / count),
      b: Math.round(b / count)
    };
  };

  const analyzeColor = (): void => {
    if (canvasRef.current && videoRef1.current) {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        const videoWidth = videoRef1.current.videoWidth;
        const videoHeight = videoRef1.current.videoHeight;

        // Set canvas size to match video
        canvas.width = videoWidth;
        canvas.height = videoHeight;

        // Draw the current video frame
        context.drawImage(videoRef1.current, 0, 0, videoWidth, videoHeight);

        // Get the center coordinates
        const centerX = videoWidth / 2;
        const centerY = videoHeight / 2;

        // Get average color within the circle
        const color = getAverageColor(context, centerX, centerY);

        // Update the detected color
        setDetectedColor(`rgb(${color.r}, ${color.g}, ${color.b})`);
      }
    }
  };

  useEffect(() => {
    if (stream && videoRef1.current && videoRef2.current) {
      videoRef1.current.srcObject = stream;
      videoRef2.current.srcObject = stream;
    }

    // Analyze color more frequently for smoother updates
    const interval = setInterval(() => {
      if (stream) analyzeColor();
    }, 100); // Update every 100ms instead of 1000ms for smoother color tracking

    return () => {
      clearInterval(interval);
      stopCamera();
    };
  }, [stream]);

  return (
    <>
      <div className="xsmall:max-w-4xl 2xsmall:max-w-[100%] mx-auto">
        <div
          className="bg-white rounded-lg overflow-hidden"
          style={{
            boxShadow:
              "rgba(0, 0, 0, 0.05) 0px 6px 24px 0px, rgba(0, 0, 0, 0.08) 0px 0px 0px 0px",
          }}
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Dual Stream View</h2>
              {startTime && (
                <div className="text-sm text-gray-600">
                  Started at: {format(startTime, "HH:mm:ss")}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left video stream with circular tracker */}
              <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                <video
                  ref={videoRef1}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                {/* Circular tracker */}
                <div
                  className="absolute top-1/2 left-1/2 w-10 h-10 rounded-full border-4 border-white transform -translate-x-1/2 -translate-y-1/2"
                  style={{ boxShadow: "0 0 10px rgba(0, 0, 0, 0.3)" }}
                ></div>
                {/* Canvas for color analysis */}
                <canvas
                  ref={canvasRef}
                  className="hidden" // Hide the canvas but keep it for color analysis
                />
              </div>

              {/* Right video stream */}
              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                <video
                  ref={videoRef2}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="mt-4">
              {!stream ? (
                <button
                  onClick={startCamera}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Start Video Streams
                </button>
              ) : (
                <button
                  onClick={stopCamera}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Stop Video Streams
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="xsmall:max-w-4xl 2xsmall:max-w-[100%] mx-auto mt-">
        {detectedColor && (
          <>
            <div
              className="px-4 py-1 text-black text-sm w-[50px] h-[50px] rounded-md mt-[20px] mb-[10px]"
              style={{ background: detectedColor }}
            >
            </div>
            <p
              onClick={() => {
                navigator.clipboard.writeText(detectedColor);
                alert(`Copied: ${detectedColor}`);
              }}
            >
              <span className='font-medium'>Color Code:</span> {detectedColor}
            </p>
          </>
        )}
      </div>
    </>
  );
};

export default DualCamera;