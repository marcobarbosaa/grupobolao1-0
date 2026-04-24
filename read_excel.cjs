const xlsx = require('xlsx');
const fs = require('fs');

const workbook = xlsx.readFile('nba_carreira.xlsx');
const result = {};

workbook.SheetNames.forEach(sheetName => {
  const sheet = workbook.Sheets[sheetName];
  result[sheetName] = xlsx.utils.sheet_to_json(sheet);
});

fs.writeFileSync('excel_data.json', JSON.stringify(result, null, 2));
console.log('Successfully wrote to excel_data.json');
