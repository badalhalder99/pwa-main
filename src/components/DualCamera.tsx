import { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';

interface DualCameraProps {
  showToast: (message: string) => void;
}

const DualCamera = ({ showToast }: DualCameraProps) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const videoRef1 = useRef<HTMLVideoElement | null>(null);
  const videoRef2 = useRef<HTMLVideoElement | null>(null);

  const startCamera = async (): Promise<void> => {
    try {
      // Try to get back camera first
      const constraints: MediaStreamConstraints = {
        video: { facingMode: 'environment' },
        audio: false
      };

      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        setStream(mediaStream);
        setStartTime(new Date());
        showToast("Back camera activated");
      } catch {
        // If back camera fails, try default camera
        const defaultStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
        setStream(defaultStream);
        setStartTime(new Date());
        showToast("Using default camera");
      }
    } catch (error) {
      showToast("Unable to access any camera. Please check permissions.");
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

  useEffect(() => {
    if (stream && videoRef1.current && videoRef2.current) {
      videoRef1.current.srcObject = stream;
      videoRef2.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="xsmall:max-w-4xl 2xsmall:max-w-[100%] mx-auto">
      <div className="bg-white rounded-lg overflow-hidden" style={{boxShadow: "rgba(0, 0, 0, 0.05) 0px 6px 24px 0px, rgba(0, 0, 0, 0.08) 0px 0px 0px 0px"}}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Dual Stream View</h2>
            {startTime && (
              <div className="text-sm text-gray-600">
                Started at: {format(startTime, 'HH:mm:ss')}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
              <video
                ref={videoRef1}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            </div>
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
  );
};

export default DualCamera;
