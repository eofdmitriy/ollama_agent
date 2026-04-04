import { useState, useEffect } from 'react';

interface DeviceDetection {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouchDevice: boolean;
  isIOS: boolean;
  isAndroid: boolean;
}

export const useDeviceDetection = (): DeviceDetection => {
  // Изначальное состояние (безопасно для серверного рендеринга)
  const [deviceInfo, setDeviceInfo] = useState<DeviceDetection>({
    isMobile: false,
    isTablet: false,
    isDesktop: true, // По умолчанию считаем десктопом до проверки
    isTouchDevice: false,
    isIOS: false,
    isAndroid: false
  });

  useEffect(() => {
    // Проверка наличия window (защита для Inertia/SSR)
    if (typeof window === 'undefined') return;

    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    const touchDevice = 'ontouchstart' in window || 
                       navigator.maxTouchPoints > 0;

    const checkDevice = () => {
      const width = window.innerWidth;
      
      // Соответствие Tailwind Breakpoints: sm: 640, md: 768, lg: 1024
      const isMobileWidth = width < 768;
      const isTabletWidth = width >= 768 && width < 1024;
      const isDesktopWidth = width >= 1024;
      
      setDeviceInfo({
        isMobile: isMobileWidth,
        isTablet: isTabletWidth,
        isDesktop: isDesktopWidth,
        isTouchDevice: touchDevice,
        isIOS,
        isAndroid
      });
    };

    checkDevice();
    
    // Используем пассивный слушатель для лучшей производительности
    window.addEventListener('resize', checkDevice, { passive: true });
    
    return () => {
      window.removeEventListener('resize', checkDevice);
    };
  }, []);

  return deviceInfo;
};
