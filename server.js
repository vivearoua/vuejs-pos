import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Chemins des fichiers de données
const PRODUCTS_FILE = path.join(__dirname, 'src/data/productsdb.json');
const CLIENTS_FILE = path.join(__dirname, 'src/data/clientsdb.json');
const STORE_FILE = path.join(__dirname, 'src/data/store.json');

// Fonction utilitaire pour lire un fichier JSON
const readJsonFile = (filePath) => {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Erreur lors de la lecture du fichier ${filePath}:`, error);
    return null;
  }
};

// Fonction utilitaire pour écrire dans un fichier JSON
const writeJsonFile = (filePath, data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`Erreur lors de l'écriture dans le fichier ${filePath}:`, error);
    return false;
  }
};

// Endpoint pour récupérer tous les produits
app.get('/api/products', (req, res) => {
  const products = readJsonFile(PRODUCTS_FILE);
  if (products) {
    res.json(products);
  } else {
    res.status(500).json({ error: 'Erreur lors de la récupération des produits' });
  }
});

// Endpoint pour mettre à jour les produits
app.post('/api/updateproducts', (req, res) => {
  const { phones, accessories } = req.body;
  
  if (!phones || !accessories) {
    return res.status(400).json({ error: 'Données de produits invalides' });
  }
  
  const products = { phones, accessories };
  
  if (writeJsonFile(PRODUCTS_FILE, products)) {
    res.json({ success: true, message: 'Produits mis à jour avec succès' });
  } else {
    res.status(500).json({ error: 'Erreur lors de la mise à jour des produits' });
  }
});

// Endpoint pour récupérer tous les clients
app.get('/api/clients', (req, res) => {
  const clients = readJsonFile(CLIENTS_FILE);
  if (clients) {
    res.json(clients);
  } else {
    res.status(500).json({ error: 'Erreur lors de la récupération des clients' });
  }
});

// Endpoint pour mettre à jour les clients
app.post('/api/updateclients', (req, res) => {
  const clients = req.body;
  
  if (!Array.isArray(clients)) {
    return res.status(400).json({ error: 'Données de clients invalides' });
  }
  
  if (writeJsonFile(CLIENTS_FILE, clients)) {
    res.json({ success: true, message: 'Clients mis à jour avec succès' });
  } else {
    res.status(500).json({ error: 'Erreur lors de la mise à jour des clients' });
  }
});

// Endpoint pour récupérer les données du magasin
app.get('/api/store', (req, res) => {
  const store = readJsonFile(STORE_FILE);
  if (store) {
    res.json(store);
  } else {
    res.status(500).json({ error: 'Erreur lors de la récupération des données du magasin' });
  }
});

// Endpoint pour mettre à jour les données du magasin
app.post('/api/updatestore', (req, res) => {
  const storeData = req.body;
  
  if (!storeData) {
    return res.status(400).json({ error: 'Données du magasin invalides' });
  }
  
  if (writeJsonFile(STORE_FILE, storeData)) {
    res.json({ success: true, message: 'Données du magasin mises à jour avec succès' });
  } else {
    res.status(500).json({ error: 'Erreur lors de la mise à jour des données du magasin' });
  }
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
