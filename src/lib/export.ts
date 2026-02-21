import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import type { MemberSummary } from './calculations';

export function exportToPdf(summaries: MemberSummary[], monthKey: string, mealRate: number) {
  const doc = new jsPDF({ orientation: 'landscape' });
  
  doc.setFontSize(16);
  doc.text(`Meal Report - ${monthKey}`, 14, 20);
  doc.setFontSize(10);
  doc.text(`Meal Rate: ${mealRate.toFixed(2)} TK`, 14, 28);

  autoTable(doc, {
    startY: 34,
    head: [['Member', 'Opening', 'Meal Units', 'Meal Cost', 'Extra Share', 'Total Cost', 'Paid', 'Net', 'Closing']],
    body: summaries.map(s => [
      s.fullName,
      s.openingBalance.toFixed(2),
      s.mealUnits.toFixed(2),
      s.mealCost.toFixed(2),
      s.extraShare.toFixed(2),
      s.totalCost.toFixed(2),
      s.paid.toFixed(2),
      s.thisMonthNet.toFixed(2),
      s.closingBalance.toFixed(2),
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [41, 50, 65] },
  });

  doc.save(`meal-report-${monthKey}.pdf`);
}

export function exportToExcel(summaries: MemberSummary[], monthKey: string, mealRate: number) {
  const data = summaries.map(s => ({
    'Member': s.fullName,
    'Opening Balance': s.openingBalance,
    'Meal Units': s.mealUnits,
    'Meal Cost': s.mealCost,
    'Extra Share': s.extraShare,
    'Total Cost': s.totalCost,
    'Paid': s.paid,
    'Net': s.thisMonthNet,
    'Closing Balance': s.closingBalance,
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, monthKey);
  XLSX.writeFile(wb, `meal-report-${monthKey}.xlsx`);
}
