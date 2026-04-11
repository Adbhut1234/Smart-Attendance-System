import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MODELS_DIR = path.join(__dirname, '../public/models');

if (!fs.existsSync(MODELS_DIR)) {
  fs.mkdirSync(MODELS_DIR, { recursive: true });
}

const BASE_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/';

const modelsToDownload = [
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1',
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model-shard1',
  'face_recognition_model-shard2',
  'face_expression_model-weights_manifest.json',
  'face_expression_model-shard1'
];

function downloadFile(filename) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(MODELS_DIR, filename);
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${filename} already exists.`);
      return resolve();
    }

    console.log(`Downloading ${filename}...`);
    const fileStream = fs.createWriteStream(filePath);
    
    https.get(BASE_URL + filename, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to get '${filename}' (${response.statusCode})`));
        return;
      }
      response.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filePath, () => {}); // Delete the file async.
      reject(err);
    });
  });
}

async function fetchAll() {
  console.log('Starting model downloads...');
  for (const file of modelsToDownload) {
    try {
      await downloadFile(file);
    } catch (e) {
      console.error(`❌ Error downloading ${file}:`, e.message);
    }
  }
  console.log('🎉 All essential models downloaded successfully!');
}

fetchAll();
