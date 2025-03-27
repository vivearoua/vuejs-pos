# API de Transactions pour POS Vue.js

Ce serveur fournit une API REST pour gérer les transactions dans l'application POS Vue.js.

## Installation

```bash
# Installer les dépendances
npm install

# Démarrer le serveur API
npm run server

# Démarrer l'application complète (frontend + API)
npm run dev:all
```

## Endpoints API

### GET /api/transactions

Récupère toutes les transactions enregistrées dans le système.

**Réponse** :
```json
[
  {
    "id": "T001",
    "user_id": "U002",
    "client_id": "C005",
    "type": "sale",
    "items": [...],
    "total_amount": 849.97,
    "discount": 0.00,
    "payment_method": "Credit Card",
    "timestamp": "2025-03-25T15:30:00Z",
    "customer_name": "Emma Carter"
  },
  ...
]
```

### POST /api/newtransaction

Ajoute une nouvelle transaction au système.

**Corps de la requête** :
```json
{
  "id": "T999",
  "user_id": "U002",
  "client_id": "C001",
  "type": "sale",
  "items": [
    {
      "item_type": "phone",
      "item_id": "P002",
      "quantity": 1,
      "unit_price": 599.99
    },
    {
      "item_type": "accessory",
      "item_id": "A003",
      "quantity": 2,
      "unit_price": 29.99
    }
  ],
  "total_amount": 659.97,
  "discount": 10.00,
  "payment_method": "Cash",
  "timestamp": "2025-03-27T05:15:00Z",
  "customer_name": "Alice Brown"
}
```

**Réponse en cas de succès** :
- Code : 201 Created
- Corps : La transaction créée

**Réponses d'erreur** :
- 400 Bad Request : Données de transaction incomplètes
- 409 Conflict : Une transaction avec cet ID existe déjà
- 500 Internal Server Error : Erreur lors de l'ajout de la transaction

## Test avec Postman

1. Ouvrez Postman et créez une nouvelle requête.
2. Configurez la requête pour ajouter une transaction :
   - Méthode : `POST`
   - URL : `http://localhost:3001/api/newtransaction`
   - Headers : 
     - Key: `Content-Type`
     - Value: `application/json`
3. Ajoutez le corps de la requête (exemple ci-dessus).
4. Envoyez la requête et vérifiez la réponse.
5. Pour vérifier que la transaction a été ajoutée, faites une requête GET à `http://localhost:3001/api/transactions`.

## Structure d'une Transaction

### Transaction de Vente
```json
{
  "id": "T001",
  "user_id": "U002",
  "client_id": "C005",
  "type": "sale",
  "items": [
    {
      "item_type": "phone",
      "item_id": "P001",
      "quantity": 1,
      "unit_price": 799.99
    }
  ],
  "total_amount": 799.99,
  "discount": 0.00,
  "payment_method": "Cash",
  "timestamp": "2025-03-25T15:30:00Z",
  "customer_name": "Emma Carter"
}
```

### Transaction de Réparation
```json
{
  "id": "T003",
  "user_id": "U002",
  "client_id": "C002",
  "type": "repair",
  "repair_id": "R002",
  "total_amount": 80.00,
  "discount": 0.00,
  "payment_method": "Cash",
  "timestamp": "2025-03-18T12:30:00Z",
  "customer_name": "Bob Wilson"
}
```
