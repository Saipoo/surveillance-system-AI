import * as XLSX from 'xlsx';

export const exportToExcel = (data: any[], sheetName: string, fileName: string) => {
  if (data.length === 0) {
    console.warn("No data to export.");
    return;
  }
  
  try {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Auto-size columns based on content
    const objectMaxLength: number[] = [];
    data.forEach(item => {
      Object.keys(item).forEach((key, i) => {
        const len = item[key] ? String(item[key]).length : 0;
        objectMaxLength[i] = Math.max(objectMaxLength[i] || 0, len);
      });
    });
    
    // Header length
    Object.keys(data[0]).forEach((key, i) => {
        objectMaxLength[i] = Math.max(objectMaxLength[i], String(key).length);
    });

    worksheet["!cols"] = objectMaxLength.map(width => ({ wch: width + 2 }));

    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  } catch (error) {
    console.error("Error exporting to Excel:", error);
  }
};
