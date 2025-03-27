import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Chemin vers le fichier store.json
const storeFilePath = path.join(__dirname, '..', 'src', 'data', 'store.json');

// Route pour récupérer toutes les transactions
app.get('/api/transactions', (req, res) => {
  try {
    const storeData = JSON.parse(fs.readFileSync(storeFilePath, 'utf8'));
    res.json(storeData.transactions || []);
  } catch (error) {
    console.error('Erreur lors de la récupération des transactions:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des transactions' });
  }
});

// Route pour ajouter une nouvelle transaction
app.post('/api/newtransaction', (req, res) => {
  try {
    // Lire le fichier store.json
    const storeData = JSON.parse(fs.readFileSync(storeFilePath, 'utf8'));
    
    // Récupérer les données de la transaction depuis la requête
    const transaction = req.body;
    
    // Vérifier que les données requises sont présentes
    if (!transaction.id || !transaction.user_id || !transaction.client_id || !transaction.type) {
      return res.status(400).json({ error: 'Données de transaction incomplètes' });
    }
    
    // Vérifier si l'ID de transaction existe déjà
    const existingTransaction = storeData.transactions.find(t => t.id === transaction.id);
    if (existingTransaction) {
      return res.status(409).json({ error: 'Une transaction avec cet ID existe déjà' });
    }
    
    // Ajouter la transaction à la liste des transactions
    storeData.transactions.push(transaction);
    
    // Écrire les données mises à jour dans le fichier
    fs.writeFileSync(storeFilePath, JSON.stringify(storeData, null, 2), 'utf8');
    
    // Répondre avec la transaction ajoutée
    res.status(201).json(transaction);
  } catch (error) {
    console.error('Erreur lors de l\'ajout de la transaction:', error);
    res.status(500).json({ error: 'Erreur lors de l\'ajout de la transaction' });
  }
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
