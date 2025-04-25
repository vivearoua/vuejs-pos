import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './logger.js';

// Configuration
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3001;
const storeFilePath = path.join(__dirname, '..', 'src', 'data', 'store.json');
const clientsDbPath = path.join(__dirname, '..', 'src', 'data', 'clientsdb.json');
const productsDbPath = path.join(__dirname, '..', 'src', 'data', 'productsdb.json');

// Initialiser l'application Express
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Middleware de journalisation des API
app.use(logger.api);

// Endpoint pour récupérer tous les clients
app.get('/api/clients', (req, res) => {
  try {
    const clientsData = JSON.parse(fs.readFileSync(clientsDbPath, 'utf8'));
    res.json(clientsData.clients);
  } catch (error) {
    console.error('Erreur lors de la lecture de clientsdb.json:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des clients' });
  }
});

// Endpoint pour mettre à jour les clients
app.post('/api/updateclients', (req, res) => {
  try {
    const { data } = req.body;
    
    if (!data || !Array.isArray(data)) {
      return res.status(400).json({ error: 'Format de données invalide' });
    }
    
    // Lire le fichier actuel
    const clientsData = JSON.parse(fs.readFileSync(clientsDbPath, 'utf8'));
    
    // Mettre à jour les clients
    clientsData.clients = data;
    
    // Écrire les données mises à jour
    fs.writeFileSync(clientsDbPath, JSON.stringify(clientsData, null, 2), 'utf8');
    
    res.json({ success: true, message: 'Clients mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de clientsdb.json:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la mise à jour des clients' });
  }
});

// Endpoint pour mettre à jour les produits
app.post('/api/updateproducts', (req, res) => {
  try {
    const { data } = req.body;
    
    if (!data || !data.phones || !data.accessories) {
      return res.status(400).json({ error: 'Format de données invalide' });
    }
    
    // Lire le fichier actuel
    const productsData = JSON.parse(fs.readFileSync(productsDbPath, 'utf8'));
    
    // Mettre à jour les produits
    productsData.phones = data.phones;
    productsData.accessories = data.accessories;
    
    // Écrire les données mises à jour
    fs.writeFileSync(productsDbPath, JSON.stringify(productsData, null, 2), 'utf8');
    
    logger.info('Produits mis à jour dans productsdb.json', {
      phones: data.phones.length,
      accessories: data.accessories.length
    });
    
    res.json({ success: true, message: 'Produits mis à jour avec succès' });
  } catch (error) {
    logger.error('Erreur lors de la mise à jour de productsdb.json:', error);
    console.error('Erreur lors de la mise à jour de productsdb.json:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la mise à jour des produits' });
  }
});

// Endpoint pour ajouter des points de fidélité à un client
app.post('/api/loyalty/add-points', (req, res) => {
  try {
    const { clientId, points, description, transactionId } = req.body;
    
    // Lire le fichier clients
    const dataPath = path.join(__dirname, '../src/data/clientsdb.json');
    const data = fs.readFileSync(dataPath, 'utf8');
    const clientsData = JSON.parse(data);
    
    // Trouver le client
    const clientIndex = clientsData.clients.findIndex(client => client.id === clientId);
    if (clientIndex === -1) {
      return res.status(404).json({ error: 'Client non trouvé' });
    }
    
    const client = clientsData.clients[clientIndex];
    
    // Ajouter les points
    client.loyalty_points = (client.loyalty_points || 0) + points;
    
    // Ajouter à l'historique
    if (!client.loyalty_history) {
      client.loyalty_history = [];
    }
    
    client.loyalty_history.push({
      date: new Date().toISOString(),
      type: 'earn',
      points_change: points,
      transaction_id: transactionId,
      description: description || 'Ajout de points de fidélité'
    });
    
    // Vérifier et mettre à jour le niveau si nécessaire
    const newLevel = determineNewLoyaltyLevel(client.loyalty_points);
    if (newLevel !== client.loyalty_level) {
      const previousLevel = client.loyalty_level;
      client.loyalty_level = newLevel;
      
      client.loyalty_history.push({
        date: new Date().toISOString(),
        type: 'level_change',
        points_change: 0,
        description: `Passage au niveau ${newLevel}`,
        previous_level: previousLevel,
        new_level: newLevel
      });
    }
    
    // Sauvegarder les modifications
    fs.writeFileSync(dataPath, JSON.stringify(clientsData, null, 2), 'utf8');
    
    res.json({ 
      success: true, 
      client: client 
    });
  } catch (error) {
    console.error('Erreur lors de l\'ajout de points de fidélité:', error);
    res.status(500).json({ error: 'Erreur lors de l\'ajout de points de fidélité' });
  }
});

// Endpoint pour utiliser des points de fidélité
app.post('/api/loyalty/redeem-points', (req, res) => {
  try {
    const { clientId, points, description } = req.body;
    
    // Lire le fichier clients
    const dataPath = path.join(__dirname, '../src/data/clientsdb.json');
    const data = fs.readFileSync(dataPath, 'utf8');
    const clientsData = JSON.parse(data);
    
    // Trouver le client
    const clientIndex = clientsData.clients.findIndex(client => client.id === clientId);
    if (clientIndex === -1) {
      return res.status(404).json({ error: 'Client non trouvé' });
    }
    
    const client = clientsData.clients[clientIndex];
    
    // Vérifier si le client a assez de points
    if (!client.loyalty_points || client.loyalty_points < points) {
      return res.status(400).json({ error: 'Points de fidélité insuffisants' });
    }
    
    // Déduire les points
    client.loyalty_points -= points;
    
    // Ajouter à l'historique
    if (!client.loyalty_history) {
      client.loyalty_history = [];
    }
    
    client.loyalty_history.push({
      date: new Date().toISOString(),
      type: 'redeem',
      points_change: -points,
      description: description || 'Utilisation de points de fidélité'
    });
    
    // Vérifier et mettre à jour le niveau si nécessaire
    const newLevel = determineNewLoyaltyLevel(client.loyalty_points);
    if (newLevel !== client.loyalty_level) {
      const previousLevel = client.loyalty_level;
      client.loyalty_level = newLevel;
      
      client.loyalty_history.push({
        date: new Date().toISOString(),
        type: 'level_change',
        points_change: 0,
        description: `Passage au niveau ${newLevel}`,
        previous_level: previousLevel,
        new_level: newLevel
      });
    }
    
    // Sauvegarder les modifications
    fs.writeFileSync(dataPath, JSON.stringify(clientsData, null, 2), 'utf8');
    
    res.json({ 
      success: true, 
      client: client 
    });
  } catch (error) {
    console.error('Erreur lors de l\'utilisation de points de fidélité:', error);
    res.status(500).json({ error: 'Erreur lors de l\'utilisation de points de fidélité' });
  }
});

// Endpoint pour mettre à jour le niveau de fidélité d'un client
app.post('/api/loyalty/update-level', (req, res) => {
  try {
    const { clientId, level } = req.body;
    
    // Vérifier que le niveau est valide
    const validLevels = ['standard', 'silver', 'gold', 'platinum'];
    if (!validLevels.includes(level)) {
      return res.status(400).json({ error: 'Niveau de fidélité invalide' });
    }
    
    // Lire le fichier clients
    const dataPath = path.join(__dirname, '../src/data/clientsdb.json');
    const data = fs.readFileSync(dataPath, 'utf8');
    const clientsData = JSON.parse(data);
    
    // Trouver le client
    const clientIndex = clientsData.clients.findIndex(client => client.id === clientId);
    if (clientIndex === -1) {
      return res.status(404).json({ error: 'Client non trouvé' });
    }
    
    const client = clientsData.clients[clientIndex];
    const previousLevel = client.loyalty_level;
    
    // Mettre à jour le niveau
    client.loyalty_level = level;
    
    // Ajouter à l'historique
    if (!client.loyalty_history) {
      client.loyalty_history = [];
    }
    
    client.loyalty_history.push({
      date: new Date().toISOString(),
      type: 'level_change',
      points_change: 0,
      description: `Passage au niveau ${level}`,
      previous_level: previousLevel,
      new_level: level
    });
    
    // Sauvegarder les modifications
    fs.writeFileSync(dataPath, JSON.stringify(clientsData, null, 2), 'utf8');
    
    res.json({ 
      success: true, 
      client: client 
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du niveau de fidélité:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du niveau de fidélité' });
  }
});

// Fonction pour déterminer le niveau de fidélité en fonction des points
function determineNewLoyaltyLevel(points) {
  if (points >= 750) return 'platinum';
  if (points >= 400) return 'gold';
  if (points >= 200) return 'silver';
  return 'standard';
}

// Route pour récupérer toutes les transactions
app.get('/api/transactions', (req, res) => {
  try {
    // Lire le fichier store.json
    const storeData = JSON.parse(fs.readFileSync(storeFilePath, 'utf8'));
    
    // Renvoyer les transactions
    res.json(storeData.transactions);
  } catch (error) {
    logger.error('Erreur lors de la récupération des transactions', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des transactions' });
  }
});

// Route pour récupérer tous les produits
app.get('/api/products', (req, res) => {
  try {
    // Lire le fichier productsdb.json
    const productsData = JSON.parse(fs.readFileSync(productsDbPath, 'utf8'));
    
    // Renvoyer les produits
    res.json({
      phones: productsData.phones,
      accessories: productsData.accessories
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération des produits', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des produits' });
  }
});

// Fonction pour valider une transaction de type "sale"
const validateSaleTransaction = (transaction) => {
  // Vérifier les champs obligatoires pour une transaction de vente
  if (!transaction.id || !transaction.user_id || !transaction.client_id || 
      !transaction.type || transaction.type !== 'sale' || 
      !transaction.items || !Array.isArray(transaction.items) || 
      !transaction.total_amount || !transaction.payment_method || 
      !transaction.timestamp || !transaction.customer_name) {
    return false;
  }

  // Vérifier que chaque item a les champs requis
  for (const item of transaction.items) {
    if (!item.item_type || !item.item_id || 
        item.quantity === undefined || item.unit_price === undefined) {
      return false;
    }
  }

  return true;
};

// Fonction pour valider une transaction de type "repair"
const validateRepairTransaction = (transaction) => {
  // Vérifier les champs obligatoires pour une transaction de réparation
  if (!transaction.id || !transaction.user_id || !transaction.client_id || 
      !transaction.type || transaction.type !== 'repair' || 
      !transaction.repair_id || !transaction.total_amount || 
      !transaction.payment_method || !transaction.timestamp || 
      !transaction.customer_name) {
    return false;
  }

  return true;
};

// Route pour ajouter une nouvelle transaction
app.post('/api/newtransaction', (req, res) => {
  try {
    logger.info('Requête reçue pour ajouter une transaction', req.body);
    
    // Lire le fichier store.json pour les transactions
    const storeData = JSON.parse(fs.readFileSync(storeFilePath, 'utf8'));
    
    // Lire le fichier productsdb.json pour les produits
    const productsData = JSON.parse(fs.readFileSync(productsDbPath, 'utf8'));
    
    // Récupérer les données de la transaction depuis la requête
    let transaction = req.body;
    
    // Vérifier que la transaction existe et a un type
    if (!transaction || typeof transaction !== 'object') {
      logger.warn('Données de transaction manquantes ou invalides', transaction);
      return res.status(400).json({ 
        error: 'Données de transaction manquantes ou invalides',
        received: transaction
      });
    }

    // Vérifier le type de transaction et valider en conséquence
    let isValid = false;
    if (transaction.type === 'sale') {
      isValid = validateSaleTransaction(transaction);
    } else if (transaction.type === 'repair') {
      isValid = validateRepairTransaction(transaction);
    } else {
      logger.warn('Type de transaction non reconnu ou manquant', { 
        received_type: transaction.type,
        expected_types: ['sale', 'repair']
      });
      return res.status(400).json({ 
        error: 'Type de transaction non reconnu ou manquant',
        received_type: transaction.type,
        expected_types: ['sale', 'repair']
      });
    }
    
    if (!isValid) {
      logger.warn('Données de transaction invalides ou incomplètes', transaction);
      return res.status(400).json({ 
        error: 'Données de transaction invalides ou incomplètes',
        format_attendu: {
          sale: {
            id: "T001",
            user_id: "U002",
            client_id: "C001",
            type: "sale",
            items: [
              {
                item_type: "phone",
                item_id: "P001",
                quantity: 1,
                unit_price: 799.99
              }
            ],
            total_amount: 799.99,
            discount: 0,
            payment_method: "Cash",
            timestamp: "2023-01-01T12:00:00Z",
            customer_name: "John Doe"
          },
          repair: {
            id: "T002",
            user_id: "U002",
            client_id: "C001",
            type: "repair",
            repair_id: "R001",
            total_amount: 150,
            discount: 0,
            payment_method: "Credit Card",
            timestamp: "2023-01-02T14:30:00Z",
            customer_name: "John Doe"
          }
        },
        transaction_reçue: transaction
      });
    }
    
    // Vérifier si l'ID de transaction existe déjà pour éviter les doublons
    const existingTransaction = storeData.transactions.find(t => t.id === transaction.id);
    if (existingTransaction) {
      logger.warn('Transaction avec ID existant', { id: transaction.id });
      return res.status(409).json({ 
        error: 'Une transaction avec cet ID existe déjà',
        existing_id: transaction.id
      });
    }
    
    logger.info('Transaction validée, ajout à store.json', transaction);
    
    // Mettre à jour le stock pour les transactions de type 'sale'
    if (transaction.type === 'sale' && Array.isArray(transaction.items)) {
      logger.info('Mise à jour du stock pour la transaction', { id: transaction.id });
      
      // Pour chaque article vendu, diminuer le stock
      transaction.items.forEach(item => {
        const { item_type, item_id, quantity } = item;
        // Initialiser productArray AVANT toute utilisation
        let productArray = [];
        if (item_type === 'phone') {
          productArray = productsData.phones;
        } else if (item_type === 'accessory') {
          productArray = productsData.accessories;
        }
        // Maintenant, productArray est bien initialisé
        if (productArray && productArray.length > 0) {
          const productIndex = productArray.findIndex(p => p.id === item_id);
          if (productIndex !== -1) {
            const product = productArray[productIndex];
            logger.info('Stock AVANT vente', {
              product_id: item_id,
              product_type: item_type,
              stock_avant: product.stock,
              quantity_vendue: quantity
            });
            // Vérifier que le stock est suffisant
            if (product.stock < quantity) {
              logger.warn('Stock insuffisant pour le produit', {
                product_id: item_id,
                product_type: item_type,
                available: product.stock,
                requested: quantity
              });
              // Mettre à jour avec le stock disponible
              productArray[productIndex].stock = 0;
            } else {
              // Diminuer le stock
              productArray[productIndex].stock -= quantity;
              logger.info('Stock APRES vente', {
                product_id: item_id,
                product_type: item_type,
                nouveau_stock: productArray[productIndex].stock
              });
            }
            logger.info('Stock mis à jour pour le produit', {
              product_id: item_id,
              product_type: item_type,
              new_stock: productArray[productIndex].stock
            });
          } else {
            logger.warn('Produit non trouvé dans le stock', {
              product_id: item_id,
              product_type: item_type
            });
          }
        }
      });
    }
// Ajouter la transaction aux données existantes
    storeData.transactions.push(transaction);
    // Écrire les données mises à jour dans le fichier store.json pour les transactions
    fs.writeFileSync(storeFilePath, JSON.stringify(storeData, null, 2));
    
    // Écrire les données mises à jour dans le fichier productsdb.json pour les produits
    fs.writeFileSync(productsDbPath, JSON.stringify(productsData, null, 2));
    logger.info('Transaction ajoutée avec succès', { id: transaction.id });
    // Forcer l'écriture des logs dans le fichier
    logger.flush();
    res.status(201).json({ 
      message: 'Transaction ajoutée avec succès',
      transaction: transaction
    });
  } catch (error) {
    logger.error('Erreur lors de l\'ajout de la transaction', error);
    // Forcer l'écriture des logs dans le fichier en cas d'erreur
    logger.flush();
    res.status(500).json({ 
      error: 'Erreur serveur lors de l\'ajout de la transaction',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});
// Route pour mettre à jour des sections spécifiques du fichier store.json
app.post('/api/updatestore', (req, res) => {
  try {
    logger.info('Requête reçue pour mettre à jour store.json', req.body);
    
    // Vérifier que les données requises sont présentes
    const { type, data } = req.body;
    
    if (!type || !data) {
      logger.warn('Données de mise à jour manquantes ou invalides', req.body);
      return res.status(400).json({ 
        error: 'Données de mise à jour manquantes ou invalides',
        required: { type: 'string', data: 'array or object' },
        received: req.body
      });
    }
    
    // Vérifier que le type est valide
    const validTypes = ['clients', 'phones', 'accessories', 'users', 'repairs'];
    if (!validTypes.includes(type)) {
      logger.warn('Type de mise à jour non reconnu', { 
        received_type: type,
        valid_types: validTypes
      });
      return res.status(400).json({ 
        error: 'Type de mise à jour non reconnu',
        received_type: type,
        valid_types: validTypes
      });
    }
    
    // Lire le fichier store.json
    const storeData = JSON.parse(fs.readFileSync(storeFilePath, 'utf8'));
    
    // Mettre à jour la section spécifiée
    storeData[type] = data;
    
    // Écrire les données mises à jour dans le fichier
    fs.writeFileSync(storeFilePath, JSON.stringify(storeData, null, 2));
    
    logger.info(`Section "${type}" de store.json mise à jour avec succès`);
    
    res.status(200).json({ 
      message: `Section "${type}" de store.json mise à jour avec succès`,
      updated_type: type,
      count: Array.isArray(data) ? data.length : 1
    });
  } catch (error) {
    logger.error('Erreur lors de la mise à jour de store.json', error);
    
    // Forcer l'écriture des logs dans le fichier en cas d'erreur
    logger.flush();
    
    res.status(500).json({ 
      error: 'Erreur serveur lors de la mise à jour de store.json',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Démarrer le serveur
app.listen(PORT, () => {
  logger.info(`Serveur démarré sur le port ${PORT}`);
  console.log(`Serveur démarré sur le port ${PORT}`);
});
