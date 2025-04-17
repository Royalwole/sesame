import { useState } from 'react';
import { FiRefreshCw, FiAlertTriangle, FiDatabase, FiCheckCircle } from 'react-icons/fi';
import { useDatabaseConnection } from '../../contexts/DatabaseContext';
import { fetchJSON } from '../../lib/fetchUtils';

export default function DatabaseReconnector() {
  const { isConnected, connectionError, lastChecked, checkConnection } = useDatabaseConnection();
  const [reconnecting, setReconnecting] = useState(false);
  const [result, setResult] = useState(null);
  
  // Format time ago
  const getTimeAgo = (timestamp) => {
    if (!timestamp) return 'never';
    
    const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);
    
    if (seconds < 60) return `${seconds} seconds ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    return `${Math.floor(seconds / 3600)} hours ago`;
  };
  
  // Handle reconnection
  const handleReconnect = async () => {
    setReconnecting(true);
    setResult(null);
    
    try {
      const data = await fetchJSON('/api/debug/db-reconnect', {
        method: 'POST'
      });
      
      setResult(data);
      
      // Update connection status in context
      setTimeout(() => checkConnection(), 500);
      
    } catch (error) {
      setResult({
        success: false,
        error: error.message,
        clientError: true
      });
    } finally {
      setReconnecting(false);
    }
  };
  
  return (
    <div className="bg-white rounded-md shadow-sm p-4 border">
      <h3 className="font-medium text-gray-900 mb-3">Database Connection</h3>
      
      <div className="flex items-center mb-3">
        <div className={`p-2 rounded-full ${isConnected ? 'bg-green-100' : 'bg-red-100'} mr-3`}>
          {isConnected ? (
            <FiCheckCircle className="text-green-600 h-5 w-5" />
          ) : (
            <FiAlertTriangle className="text-red-600 h-5 w-5" />
          )}
        </div>
        
        <div>
          <p className={`font-medium ${isConnected ? 'text-green-700' : 'text-red-700'}`}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </p>
          <p className="text-xs text-gray-500">
            Last checked: {getTimeAgo(lastChecked)}
          </p>
        </div>
      </div>
      
      {connectionError && (
        <div className="mb-3 p-2 bg-red-50 rounded-md text-sm text-red-700">
          {connectionError}
        </div>
      )}
      
      <div className="flex space-x-2">
        <button
          onClick={checkConnection}
          className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm flex items-center"
        >
          <FiDatabase className="mr-1.5" />
          Check Status
        </button>
        
        <button
          onClick={handleReconnect}
          disabled={reconnecting}
          className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm flex items-center disabled:opacity-50"
        >
          <FiRefreshCw className={`mr-1.5 ${reconnecting ? 'animate-spin' : ''}`} />
          {reconnecting ? 'Reconnecting...' : 'Force Reconnect'}
        </button>
      </div>
      
      {result && (
        <div className={`mt-3 p-3 rounded-md text-sm ${result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          <p className="font-medium">{result.success ? 'Reconnection Complete' : 'Reconnection Failed'}</p>
          <p>{result.message || result.error}</p>
          
          {result.result && (
            <div className="mt-1">
              <div>Status: {result.result.currentState}</div>
              {result.result.reconnected && (
                <div className="text-green-600 font-medium">Successfully reconnected!</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
