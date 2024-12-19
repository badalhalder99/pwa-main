import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/index";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ARMeasure } from './components/ARMeasure';
import "./App.css";

interface Toast {
  id: number;
  message: string;
  timestamp: string;
}

const App = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  const showToast = (message: string): void => {
    const newToast: Toast = {
      id: Date.now(),
      message,
      timestamp: format(new Date(), 'HH:mm:ss')
    };
    setToasts(prev => [...prev, newToast]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== newToast.id));
    }, 3000);
  };

  useEffect(() => {
    // Simulate splash screen
    setTimeout(() => setIsLoading(false), 2000);

    // Handle PWA installation
    const handleBeforeInstallPrompt = (e: Event): void => {
      e.preventDefault();
      setDeferredPrompt(e);
      showToast("This app can be installed on your device!");
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async (): Promise<void> => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        showToast('Thank you for installing our app!');
      }
      setDeferredPrompt(null);
    }
  };

  if (isLoading) {
    return (
      <div className="h-[100vh] bg-[#f9fcff] flex items-center justify-center flex-col">
        <div className="border border-solid border-[#ddd] rounded-md">
          <img src="/logo.png" alt="App Logo" className="mb-2 text-center" />
          <p className="animate-pulse text-[18px] font-semibold text-center mb-2">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className="fixed top-4 right-4 bg-black text-white p-4 rounded-md shadow-lg z-50"
        >
          <div className="text-sm opacity-80">{toast.timestamp}</div>
          {toast.message}
        </div>
      ))}

      {deferredPrompt && (
        <button
          onClick={handleInstall}
          className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-md z-50"
        >
          Install App
        </button>
      )}

      <BrowserRouter>
        <Routes>
          <Route path="/ar" element={<Index showToast={showToast} />} />
          <Route path="/" element={<ARMeasure />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
};

export default App;

