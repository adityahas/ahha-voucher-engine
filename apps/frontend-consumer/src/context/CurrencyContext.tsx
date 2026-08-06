import React, { createContext, useContext } from 'react';
import {
  DEFAULT_CURRENCY_SETTINGS,
  type CurrencySettings,
} from '../types/currency-settings';

const CurrencyContext = createContext<CurrencySettings>(
  DEFAULT_CURRENCY_SETTINGS,
);

export const CurrencyProvider: React.FC<{
  settings: CurrencySettings;
  children: React.ReactNode;
}> = ({ settings, children }) => (
  <CurrencyContext.Provider value={settings}>
    {children}
  </CurrencyContext.Provider>
);

export const useCurrencySettings = (): CurrencySettings => {
  return useContext(CurrencyContext);
};
