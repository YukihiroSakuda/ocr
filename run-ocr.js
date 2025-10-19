const path = require('path');
const fs = require('fs');
const { createWorker } = require('./renderer/node_modules/tesseract.js');

(async () => {
  const imgPath = path.join(process.env.APPDATA, 'screenshot-ocr-app', 'images', process.argv[2]);
  const worker = await createWorker(undefined, undefined, {
    workerPath: path.join(__dirname, 'renderer', 'public', 'tesseract', 'worker.min.js'),
    corePath: path.join(__dirname, 'renderer', 'public', 'tesseract'),
    langPath: path.join(__dirname, 'renderer', 'public', 'tessdata')
  });
  await worker.load();
  await worker.loadLanguage('jpn+eng');
  await worker.initialize('jpn+eng');
  const { data } = await worker.recognize(imgPath);
  console.log(data.text.slice(0, 200));
  await worker.terminate();
})();
