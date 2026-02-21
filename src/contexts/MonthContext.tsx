import React, { createContext, useContext, useState } from 'react';
import { format } from 'date-fns';

interface MonthContextType {
  monthKey: string;
  setMonthKey: (key: string) => void;
}

const MonthContext = createContext<MonthContextType>({
  monthKey: format(new Date(), 'yyyy-MM'),
  setMonthKey: () => {},
});

export const useMonth = () => useContext(MonthContext);

export const MonthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [monthKey, setMonthKey] = useState(format(new Date(), 'yyyy-MM'));

  return (
    <MonthContext.Provider value={{ monthKey, setMonthKey }}>
      {children}
    </MonthContext.Provider>
  );
};
