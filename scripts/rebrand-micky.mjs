import fs from 'fs';
import path from 'path';

const baseDir = 'd:/Abenier/Abenier Bot Logic';
const filesToRebrand = [
  'workflow.json',
  'bdr_output.json'
];

filesToRebrand.forEach(fileName => {
  const filePath = path.join(baseDir, fileName);
  if (!fs.existsSync(filePath)) {
    console.log(`File ${fileName} not found, skipping.`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  // Replace names
  content = content.replace(/TedyTech/g, 'Micky Mobile');
  content = content.replace(/tedytech/g, 'mickymobile');
  content = content.replace(/Bel Mart/g, 'Micky Mobile');
  content = content.replace(/bel-mart/g, 'micky-mobile');
  content = content.replace(/belmart/g, 'mickymobile');

  // Update address
  content = content.replace(/'8\.998702, 38\.786851 \(Bole\)'/g, "'Bole Alemnesh Plaza Ground Floor'");

  // Update credential names
  content = content.replace(/Telegram_TedyTech_Customer/g, 'Telegram_MickyMobile_Customer');
  content = content.replace(/Telegram_TedyTech_Admin/g, 'Telegram_MickyMobile_Admin');

  fs.writeFileSync(filePath, content);
  console.log(`Successfully rebranded ${fileName}`);
});
