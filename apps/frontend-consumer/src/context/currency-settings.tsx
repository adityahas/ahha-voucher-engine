import { createContext, useContext, useEffect, useState } from 'react';
import { getCurrencySettings } from '../api/settings';
import { formatCurrency } from '../lib/currency-format';
import {
  DEFAULT_CURRENCY_SETTINGS,
  type CurrencySettings,
} from '../types/currency-settings';

const CurrencySettingsContext = createContext<CurrencySettings>(
  DEFAULT_CURRENCY_SETTINGS,
);

export function CurrencySettingsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, setSettings] = useState(DEFAULT_CURRENCY_SETTINGS);

  useEffect(() => {
    getCurrencySettings()
      .then(setSettings)
      .catch(() => undefined);
  }, []);

  return (
    <CurrencySettingsContext.Provider value={settings}>
      {children}
    </CurrencySettingsContext.Provider>
  );
}

export function useCurrencySettings() {
  return useContext(CurrencySettingsContext);
}

export { formatCurrency };
