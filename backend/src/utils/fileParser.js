import fs from 'fs';
import mammoth from 'mammoth';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdfParseLib = require('pdf-parse');

// âœ… FIX Gá»C
const pdfParse =
  typeof pdfParseLib === 'function'
    ? pdfParseLib
    : pdfParseLib.pdfParse || pdfParseLib.default;

if (typeof pdfParse !== 'function') {
  throw new Error('pdf-parse load failed: not a function');
}

export const extractTextFromFile = async (file) => {
  const filePath = file.path;
  const fileType = file.mimetype;

  try {
    let text = '';

    // ===== PDF =====
    if (fileType === 'application/pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      text = data.text;
    }

    // ===== DOCX =====
    else if (
      fileType ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      const result = await mammoth.extractRawText({ path: filePath });
      text = result.value;
    }

    // ===== TXT =====
    else if (fileType === 'text/plain') {
      text = fs.readFileSync(filePath, 'utf8');
    }

    else {
      throw new Error('Äá»‹nh dáº¡ng file khÃ´ng Ä‘Æ°á»£c há»— trá»£');
    }

    // Cleanup
    fs.existsSync(filePath) && fs.unlinkSync(filePath);

    if (!text.trim()) {
      throw new Error('File rá»—ng hoáº·c khÃ´ng Ä‘á»c Ä‘Æ°á»£c ná»™i dung');
    }

    return text.slice(0, 20000);

  } catch (err) {
    fs.existsSync(filePath) && fs.unlinkSync(filePath);
    console.error('File Parser Error:', err);
    throw err;
  }
};