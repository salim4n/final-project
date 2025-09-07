# Guide Complet : Server-Sent Events (SSE)

## Table des Matières
1. [Introduction](#introduction)
2. [Concepts Fondamentaux](#concepts-fondamentaux)
3. [Protocole SSE](#protocole-sse)
4. [Implémentation Côté Serveur](#implémentation-côté-serveur)
5. [Implémentation Côté Client](#implémentation-côté-client)
6. [Comparaison avec Autres Technologies](#comparaison-avec-autres-technologies)
7. [Cas d'Usage Pratiques](#cas-dusage-pratiques)
8. [Bonnes Pratiques](#bonnes-pratiques)
9. [Limitations et Solutions](#limitations-et-solutions)

## Introduction

Server-Sent Events (SSE) est une technologie web standardisée qui permet à un serveur d'envoyer des données en temps réel vers un client web de manière unidirectionnelle. Contrairement aux requêtes HTTP classiques, SSE maintient une connexion persistante permettant au serveur de "pousser" des données vers le navigateur.

### Avantages Clés
- **Simplicité** : API native `EventSource` dans les navigateurs
- **Reconnexion automatique** : Gestion native des déconnexions
- **Léger** : Protocole basé sur HTTP, pas de overhead
- **Compatible** : Fonctionne avec les proxies/CDN existants
- **Structuré** : Format d'événements standardisé

## Concepts Fondamentaux

### Architecture
```
Client (Navigateur)     Serveur
     |                    |
     |-- GET /events ---->|
     |                    |
     |<-- event: data1 ---|
     |<-- event: data2 ---|
     |<-- event: data3 ---|
     |        ...         |
```

### Caractéristiques
- **Unidirectionnel** : Serveur → Client uniquement
- **Persistant** : Connexion maintenue ouverte
- **Événementiel** : Messages structurés avec types
- **Résilient** : Reconnexion automatique en cas de coupure

## Protocole SSE

### Format des Messages
```
event: message-type
data: contenu du message
id: identifiant-unique
retry: 3000

```

### Champs Disponibles
- **`event:`** Type d'événement (optionnel, défaut: "message")
- **`data:`** Contenu du message (peut être multi-lignes)
- **`id:`** Identifiant pour la reprise de connexion
- **`retry:`** Délai de reconnexion en millisecondes
- **Ligne vide** : Marque la fin d'un événement

### Exemple de Flux
```
event: user-connected
data: {"userId": 123, "name": "Alice"}
id: 1

event: message
data: Bonjour tout le monde !
id: 2

event: user-disconnected
data: {"userId": 123}
id: 3

```

## Implémentation Côté Serveur

### Avec Hono (Node.js/TypeScript)
```typescript
import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'

const app = new Hono()

app.get('/events', async (c) => {
  return streamSSE(c, async (stream) => {
    // Envoyer un événement de connexion
    await stream.writeSSE({
      event: 'connected',
      data: JSON.stringify({ timestamp: Date.now() })
    })

    // Simulation de données en temps réel
    const interval = setInterval(async () => {
      await stream.writeSSE({
        event: 'update',
        data: JSON.stringify({ 
          time: new Date().toISOString(),
          value: Math.random()
        }),
        id: Date.now().toString()
      })
    }, 1000)

    // Nettoyage à la déconnexion
    stream.onAbort(() => {
      clearInterval(interval)
    })
  })
})
```

### Headers HTTP Requis
```typescript
// Headers automatiquement gérés par streamSSE :
{
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive',
  'Access-Control-Allow-Origin': '*'
}
```

### Streaming LLM avec SSE
```typescript
app.get('/chat-stream', async (c) => {
  const query = c.req.query('q') ?? 'Hello'
  
  return streamSSE(c, async (stream) => {
    for await (const token of streamLLM(query)) {
      await stream.writeSSE({
        event: 'token',
        data: token
      })
    }
    
    await stream.writeSSE({
      event: 'done',
      data: ''
    })
  })
})
```

## Implémentation Côté Client

### API EventSource Basique
```javascript
// Connexion à un flux SSE
const eventSource = new EventSource('/events')

// Écouter tous les événements (type par défaut)
eventSource.onmessage = function(event) {
  console.log('Message reçu:', event.data)
}

// Écouter des événements spécifiques
eventSource.addEventListener('update', function(event) {
  const data = JSON.parse(event.data)
  console.log('Update:', data)
})

// Gestion des erreurs et reconnexions
eventSource.onerror = function(event) {
  console.log('Erreur SSE:', event)
  // La reconnexion est automatique
}

// Fermer la connexion
eventSource.close()
```

### Exemple Complet : Chat en Temps Réel
```html
<!DOCTYPE html>
<html>
<head>
  <title>Chat SSE</title>
</head>
<body>
  <div id="messages"></div>
  <input id="messageInput" placeholder="Tapez votre message...">
  <button onclick="sendMessage()">Envoyer</button>

  <script>
    const messagesDiv = document.getElementById('messages')
    const messageInput = document.getElementById('messageInput')

    // Connexion SSE pour recevoir les messages
    const eventSource = new EventSource('/chat-events')

    eventSource.addEventListener('message', function(event) {
      const message = JSON.parse(event.data)
      const messageElement = document.createElement('div')
      messageElement.textContent = `${message.user}: ${message.text}`
      messagesDiv.appendChild(messageElement)
    })

    eventSource.addEventListener('user-joined', function(event) {
      const data = JSON.parse(event.data)
      const notif = document.createElement('div')
      notif.textContent = `${data.user} a rejoint le chat`
      notif.style.color = 'green'
      messagesDiv.appendChild(notif)
    })

    // Envoyer un message (HTTP POST séparé)
    function sendMessage() {
      const message = messageInput.value
      if (message.trim()) {
        fetch('/send-message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message })
        })
        messageInput.value = ''
      }
    }

    messageInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') sendMessage()
    })
  </script>
</body>
</html>
```

### Gestion Avancée des Événements
```javascript
class SSEManager {
  constructor(url) {
    this.url = url
    this.eventSource = null
    this.listeners = new Map()
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
  }

  connect() {
    this.eventSource = new EventSource(this.url)
    
    this.eventSource.onopen = () => {
      console.log('Connexion SSE établie')
      this.reconnectAttempts = 0
    }

    this.eventSource.onerror = (event) => {
      console.error('Erreur SSE:', event)
      
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++
        setTimeout(() => this.connect(), 1000 * this.reconnectAttempts)
      }
    }

    // Ajouter tous les listeners enregistrés
    for (const [eventType, callback] of this.listeners) {
      this.eventSource.addEventListener(eventType, callback)
    }
  }

  on(eventType, callback) {
    this.listeners.set(eventType, callback)
    if (this.eventSource) {
      this.eventSource.addEventListener(eventType, callback)
    }
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
    }
  }
}

// Utilisation
const sse = new SSEManager('/events')
sse.on('update', (event) => {
  console.log('Update reçu:', JSON.parse(event.data))
})
sse.connect()
```

## Comparaison avec Autres Technologies

### SSE vs WebSocket

| Aspect | SSE | WebSocket |
|--------|-----|-----------|
| **Direction** | Unidirectionnel (S→C) | Bidirectionnel |
| **Protocole** | HTTP | WS (upgrade HTTP) |
| **Reconnexion** | Automatique | Manuelle |
| **Complexité** | Simple | Plus complexe |
| **Overhead** | Faible | Très faible |
| **Cas d'usage** | Notifications, streaming | Chat, jeux temps réel |

### SSE vs HTTP Chunked

| Aspect | SSE | HTTP Chunked |
|--------|-----|--------------|
| **Format** | Structuré (event/data) | Libre |
| **API Client** | EventSource native | ReadableStream |
| **Reconnexion** | Automatique | Manuelle |
| **Types d'événements** | Oui | Non |
| **Compatibilité** | Excellente | Bonne |

### Quand Utiliser Quoi ?

**Utilisez SSE pour :**
- Notifications push
- Streaming de données (logs, métriques)
- Mises à jour d'interface en temps réel
- Streaming LLM/IA
- Flux de données unidirectionnels

**Utilisez WebSocket pour :**
- Chat bidirectionnel
- Jeux multijoueurs
- Collaboration temps réel (éditeurs)
- Applications nécessitant faible latence

**Utilisez HTTP Chunked pour :**
- APIs de streaming personnalisées
- Clients non-navigateur
- Contrôle total du format

## Cas d'Usage Pratiques

### 1. Streaming LLM/IA
```typescript
app.get('/ai-stream', async (c) => {
  const prompt = c.req.query('prompt')
  
  return streamSSE(c, async (stream) => {
    await stream.writeSSE({
      event: 'start',
      data: JSON.stringify({ prompt })
    })

    for await (const token of generateAIResponse(prompt)) {
      await stream.writeSSE({
        event: 'token',
        data: token
      })
    }

    await stream.writeSSE({
      event: 'complete',
      data: ''
    })
  })
})
```

### 2. Monitoring en Temps Réel
```typescript
app.get('/metrics-stream', async (c) => {
  return streamSSE(c, async (stream) => {
    const interval = setInterval(async () => {
      const metrics = await getSystemMetrics()
      
      await stream.writeSSE({
        event: 'metrics',
        data: JSON.stringify({
          cpu: metrics.cpu,
          memory: metrics.memory,
          timestamp: Date.now()
        })
      })
    }, 1000)

    stream.onAbort(() => clearInterval(interval))
  })
})
```

### 3. Notifications Push
```typescript
// Gestionnaire de notifications
class NotificationManager {
  private clients = new Set<SSEStream>()

  addClient(stream: SSEStream) {
    this.clients.add(stream)
    stream.onAbort(() => this.clients.delete(stream))
  }

  async broadcast(notification: Notification) {
    const deadClients = new Set<SSEStream>()
    
    for (const client of this.clients) {
      try {
        await client.writeSSE({
          event: 'notification',
          data: JSON.stringify(notification)
        })
      } catch (error) {
        deadClients.add(client)
      }
    }

    // Nettoyer les clients déconnectés
    for (const client of deadClients) {
      this.clients.delete(client)
    }
  }
}

const notificationManager = new NotificationManager()

app.get('/notifications', async (c) => {
  return streamSSE(c, async (stream) => {
    notificationManager.addClient(stream)
    
    await stream.writeSSE({
      event: 'connected',
      data: JSON.stringify({ clientId: generateId() })
    })
  })
})
```

## Bonnes Pratiques

### Côté Serveur
```typescript
// 1. Gestion propre des déconnexions
app.get('/events', async (c) => {
  return streamSSE(c, async (stream) => {
    const cleanup = setupResourcesForClient()
    
    stream.onAbort(() => {
      cleanup()
      console.log('Client déconnecté')
    })
  })
})

// 2. Limitation du nombre de clients
const MAX_CLIENTS = 1000
const clients = new Set()

app.get('/events', async (c) => {
  if (clients.size >= MAX_CLIENTS) {
    return c.text('Trop de connexions', 503)
  }
  
  return streamSSE(c, async (stream) => {
    clients.add(stream)
    stream.onAbort(() => clients.delete(stream))
  })
})

// 3. Heartbeat pour détecter les connexions mortes
app.get('/events', async (c) => {
  return streamSSE(c, async (stream) => {
    const heartbeat = setInterval(async () => {
      try {
        await stream.writeSSE({
          event: 'heartbeat',
          data: Date.now().toString()
        })
      } catch (error) {
        clearInterval(heartbeat)
      }
    }, 30000)

    stream.onAbort(() => clearInterval(heartbeat))
  })
})
```

### Côté Client
```javascript
// 1. Gestion robuste des erreurs
class RobustSSE {
  constructor(url, options = {}) {
    this.url = url
    this.options = options
    this.reconnectDelay = options.reconnectDelay || 1000
    this.maxReconnectDelay = options.maxReconnectDelay || 30000
    this.currentDelay = this.reconnectDelay
  }

  connect() {
    this.eventSource = new EventSource(this.url)
    
    this.eventSource.onopen = () => {
      console.log('Connexion établie')
      this.currentDelay = this.reconnectDelay // Reset delay
    }

    this.eventSource.onerror = (event) => {
      console.error('Erreur de connexion')
      this.eventSource.close()
      
      // Reconnexion avec backoff exponentiel
      setTimeout(() => {
        this.connect()
        this.currentDelay = Math.min(
          this.currentDelay * 2, 
          this.maxReconnectDelay
        )
      }, this.currentDelay)
    }
  }
}

// 2. Gestion de la visibilité de la page
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    eventSource.close()
  } else {
    eventSource = new EventSource('/events')
    setupEventListeners()
  }
})
```

## Limitations et Solutions

### Limitations Navigateur
- **Limite de connexions** : ~6 connexions simultanées par domaine
- **Solution** : Utiliser des sous-domaines ou multiplexer les événements

### Limitations Réseau
- **Proxies/Firewalls** : Peuvent fermer les connexions longues
- **Solution** : Heartbeat régulier et reconnexion

### Gestion Mémoire
```typescript
// Éviter les fuites mémoire
const clients = new WeakSet() // Utiliser WeakSet quand possible

// Nettoyer les ressources
stream.onAbort(() => {
  clearInterval(intervals)
  closeDatabase()
  releaseResources()
})
```

### Performance
```typescript
// Éviter de spammer les événements
const throttle = (fn, delay) => {
  let timeoutId
  return (...args) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}

const sendUpdate = throttle(async (data) => {
  await stream.writeSSE({
    event: 'update',
    data: JSON.stringify(data)
  })
}, 100) // Max 10 updates/seconde
```

## Conclusion

Server-Sent Events offre une solution élégante et simple pour le streaming de données en temps réel du serveur vers le client. Sa simplicité d'implémentation, sa robustesse native et sa compatibilité avec l'infrastructure web existante en font un choix excellent pour de nombreux cas d'usage.

**Points clés à retenir :**
- SSE est idéal pour les flux unidirectionnels serveur → client
- L'API EventSource gère automatiquement la reconnexion
- Le format structuré permet une gestion fine des types d'événements
- Excellent pour le streaming LLM, notifications, et monitoring
- Plus simple que WebSocket pour les cas d'usage appropriés

Pour des besoins bidirectionnels ou de très faible latence, considérez WebSocket. Pour le streaming de données simples, SSE est souvent le meilleur choix.
