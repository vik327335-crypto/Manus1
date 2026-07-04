import { useState, useEffect, useCallback } from 'react';

interface DashboardConfig {
  selectedStrategy?: string;
  selectedMetric?: string;
  dateRange?: {
    from: string;
    to: string;
  };
  chartType?: 'line' | 'bar' | 'radar' | 'scatter';
  savedAt?: number;
}

const CONFIG_KEY = 'canslim_dashboard_config';
const CONFIG_VERSION = 1;

export function useDashboardConfig() {
  const [config, setConfig] = useState<DashboardConfig | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load config from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CONFIG_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Validate version and structure
        if (parsed.version === CONFIG_VERSION) {
          setConfig(parsed.config);
        }
      }
    } catch (error) {
      console.error('Failed to load dashboard config:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save config to localStorage
  const saveConfig = useCallback((newConfig: DashboardConfig) => {
    try {
      const toStore = {
        version: CONFIG_VERSION,
        config: {
          ...newConfig,
          savedAt: Date.now(),
        },
      };
      localStorage.setItem(CONFIG_KEY, JSON.stringify(toStore));
      setConfig(newConfig);
    } catch (error) {
      console.error('Failed to save dashboard config:', error);
    }
  }, []);

  // Update specific config property
  const updateConfig = useCallback((updates: Partial<DashboardConfig>) => {
    setConfig((prev) => {
      const newConfig = { ...prev, ...updates };
      saveConfig(newConfig);
      return newConfig;
    });
  }, [saveConfig]);

  // Clear config
  const clearConfig = useCallback(() => {
    try {
      localStorage.removeItem(CONFIG_KEY);
      setConfig(null);
    } catch (error) {
      console.error('Failed to clear dashboard config:', error);
    }
  }, []);

  // Export config as JSON
  const exportConfig = useCallback(() => {
    if (!config) return null;
    return JSON.stringify(config, null, 2);
  }, [config]);

  // Import config from JSON
  const importConfig = useCallback((jsonString: string) => {
    try {
      const imported = JSON.parse(jsonString);
      saveConfig(imported);
      return true;
    } catch (error) {
      console.error('Failed to import dashboard config:', error);
      return false;
    }
  }, [saveConfig]);

  return {
    config,
    isLoaded,
    saveConfig,
    updateConfig,
    clearConfig,
    exportConfig,
    importConfig,
  };
}
