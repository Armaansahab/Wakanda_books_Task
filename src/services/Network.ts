type NetworkListener = (isConnected: boolean) => void;

class NetworkService {
  listeners: NetworkListener[] = [];
  isConnected = navigator.onLine;

  constructor() {
    window.addEventListener('online', () => {
      this.isConnected = true;
      this.notifyListeners();
      console.log('Network status changed: Online');
    });

    window.addEventListener('offline', () => {
      this.isConnected = false;
      this.notifyListeners();
      console.log('Network status changed: Offline');
    });
  }

  addListener(callback: NetworkListener) {
    this.listeners.push(callback);
    callback(this.isConnected);
    
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  notifyListeners() {
    this.listeners.forEach(listener => listener(this.isConnected));
  }

  isOnline() {
    return this.isConnected;
  }
}

export default new NetworkService();