import { useEffect, useState } from "react";
import DualCamera from "../components/DualCamera";
import style from './page.module.css';

interface IndexProps {
  showToast: (message: string) => void;
}

const Index = ({ showToast }: IndexProps) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const handleOnline = (): void => setIsOnline(true);
    const handleOffline = (): void => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#f9fcff] flex justify-center items-center">
      <div className={`${style.customContainer} px-4 py-8`} >
        <div className="text-center mb-8">
          <span className="inline-block px-4 py-1 mb-4 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">
            {isOnline ? 'Online' : 'Offline'} Mode
          </span>
          <h1 className="text-2xl font-bold small:text-red-500 2xsmall:text-blue-500">
            Video Streams
          </h1>
        </div>

        <DualCamera showToast={showToast} />
      </div>
    </div>
  );
};

export default Index;
