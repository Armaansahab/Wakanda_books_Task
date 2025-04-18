import React, { useState, useEffect } from 'react';
import NetworkService from '../services/Network';

const NetworkStatus: React.FC = () => {
  const [isOnline, setIsOnline] = useState(NetworkService.isOnline());
  
  useEffect(() => {
    const unsubscribe = NetworkService.addListener((status) => {
      setIsOnline(status);
    });
    
    return unsubscribe;
  }, []);
  
  if (isOnline) {
    return (
      <div className="bg-green-500 px-2 py-1 rounded-md">
        <span className="text-white text-xs">Online (Syncing)</span>
      </div>
    );
  }
  
  return (
    <div className="bg-red-500 px-2 py-1 rounded-md">
      <span className="text-white text-xs">Offline</span>
    </div>
  );
};

export default NetworkStatus;