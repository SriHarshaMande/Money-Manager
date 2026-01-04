
import { Transaction } from '../types';

export interface FuelLogPoint {
  date: string;
  mileage: number;
  liters: number;
  pricePerLiter: number;
  odometer: number;
}

export interface FuelAnalysisResult {
  avgMileage: number;
  avgCostPerKm: number;
  totalKmTracked: number;
  efficiencySummary: string;
  logPoints: FuelLogPoint[];
}

export const calculateFuelStats = (transactions: Transaction[]): FuelAnalysisResult | null => {
  // Filter and sort transactions that likely contain fuel data
  const fuelT = transactions
    .filter(t => t.type === 'expense' && (
      t.note.toLowerCase().includes('l') || 
      t.note.toLowerCase().includes('km') || 
      t.note.toLowerCase().includes('@')
    ))
    .map(t => {
      const note = t.note;
      // Regex patterns
      const literMatch = note.match(/(\d+\.?\d*)\s*[lL]/);
      const odometerMatch = note.match(/(\d+)\s*[kK][mM]/);
      const priceMatch = note.match(/@\s*(\d+\.?\d*)/);

      return {
        date: t.date,
        amount: t.amount,
        liters: literMatch ? parseFloat(literMatch[1]) : 0,
        odometer: odometerMatch ? parseInt(odometerMatch[1], 10) : 0,
        pricePerLiter: priceMatch ? parseFloat(priceMatch[1]) : (literMatch ? t.amount / parseFloat(literMatch[1]) : 0)
      };
    })
    .filter(item => item.odometer > 0)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (fuelT.length < 2) return null;

  const logPoints: FuelLogPoint[] = [];
  let totalKm = 0;
  let totalLiters = 0;
  let totalCost = 0;

  for (let i = 1; i < fuelT.length; i++) {
    const prev = fuelT[i - 1];
    const curr = fuelT[i];
    
    const diffKm = curr.odometer - prev.odometer;
    if (diffKm <= 0) continue;

    const mileage = diffKm / curr.liters;
    
    logPoints.push({
      date: curr.date,
      mileage: isFinite(mileage) ? mileage : 0,
      liters: curr.liters,
      pricePerLiter: curr.pricePerLiter,
      odometer: curr.odometer
    });

    totalKm += diffKm;
    totalLiters += curr.liters;
    totalCost += curr.amount;
  }

  const avgMileage = totalLiters > 0 ? totalKm / totalLiters : 0;
  const avgCostPerKm = totalKm > 0 ? totalCost / totalKm : 0;

  let efficiencySummary = "Data looks stable.";
  if (avgMileage > 18) efficiencySummary = "Excellent efficiency! Keep maintaining your vehicle.";
  else if (avgMileage > 12) efficiencySummary = "Average efficiency. Your driving style is standard.";
  else efficiencySummary = "Low efficiency. Consider a engine check-up or checking tire pressure.";

  return {
    avgMileage,
    avgCostPerKm,
    totalKmTracked: totalKm,
    efficiencySummary,
    logPoints
  };
};

export const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(val);
};
