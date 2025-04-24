import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Créer le dossier logs s'il n'existe pas
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Fonction pour obtenir la date formatée
const getFormattedDate = () => {
  const now = new Date();
  return now.toISOString();
};

// Fonction pour obtenir le nom du fichier de log du jour
const getLogFileName = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}.log`;
};

// Chemin du fichier de log
const logFilePath = path.join(logsDir, getLogFileName());

// Buffer pour stocker les messages de log
let logBuffer = [];
let isWriting = false;

// Fonction pour écrire dans le fichier de log
const writeToLog = (level, message, data = null) => {
  const timestamp = getFormattedDate();
  let logMessage = `[${timestamp}] ${level}: ${message}`;
  
  if (data) {
    if (typeof data === 'object') {
      logMessage += `\nData: ${JSON.stringify(data, null, 2)}`;
    } else {
      logMessage += `\nData: ${data}`;
    }
  }
  
  logMessage += '\n--------------------------------------------------\n';
  
  // Ajouter au buffer au lieu d'écrire immédiatement
  logBuffer.push(logMessage);
  
  // Afficher également dans la console
  console.log(logMessage);
};

// Fonction pour vider le buffer et écrire dans le fichier
const flushLogBuffer = () => {
  if (logBuffer.length === 0 || isWriting) return;
  
  isWriting = true;
  const bufferToWrite = logBuffer.join('');
  logBuffer = [];
  
  try {
    fs.appendFileSync(logFilePath, bufferToWrite);
    // Log de confirmation dans la console et dans le fichier
    const msg = `[LOGGER] Flush effectué dans : ${logFilePath}\n`;
    console.log(msg);
    try {
      fs.appendFileSync(logFilePath, msg);
    } catch (e) {/* ignore */}
  } catch (error) {
    console.error('Erreur lors de l\'écriture dans le fichier de log:', error);
  } finally {
    isWriting = false;
  }
};

// Fonctions de log par niveau
const logger = {
  info: (message, data) => writeToLog('INFO', message, data),
  warn: (message, data) => writeToLog('WARN', message, data),
  error: (message, data) => writeToLog('ERROR', message, data),
  flush: () => flushLogBuffer(),
  api: (req, res, next) => {
    // Middleware pour logger les requêtes API
    const start = Date.now();
    
    // Enregistrer la requête
    writeToLog('API', `${req.method} ${req.url}`, {
      headers: req.headers,
      body: req.body,
      params: req.params,
      query: req.query
    });
    
    // Intercepter la réponse
    const originalSend = res.send;
    res.send = function(body) {
      const duration = Date.now() - start;
      
      // Enregistrer la réponse
      writeToLog('API_RESPONSE', `${req.method} ${req.url} - Status: ${res.statusCode} - Duration: ${duration}ms`, 
        typeof body === 'string' ? body : JSON.parse(body));
      
      // Écrire dans le fichier uniquement après une action utilisateur
      if (req.method !== 'GET') {
        flushLogBuffer();
      }
      
      return originalSend.call(this, body);
    };
    
    next();
  }
};

export default logger;