const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const Y = require('yjs');
const path = require('path');
const { setupWSConnection, docs, getYDoc, setPersistence } = require(path.join(__dirname, 'node_modules', 'y-websocket', 'bin', 'utils.cjs'));
const { v4: uuidv4 } = require('uuid');
const { initDB, getDocument, saveDocument, listDocuments, createDocument, upsertUser, saveAIGeneration } = require('./database');
const { generateEvaluationTable, generateChangeItems, analyzeFailureModes } = require('./ai-service');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors());
app.use(express.json());

let dbReady = false;

const persistence = {
  bindState: async (docName, ydoc) => {
    try {
      const docRecord = await getDocument(docName);
      if (docRecord && docRecord.ydoc) {
        const update = new Uint8Array(docRecord.ydoc);
        Y.applyUpdate(ydoc, update, 'database-load');
      }
    } catch (err) {
      console.error('Error loading document from DB:', err);
    }
    
    ydoc.on('update', async (update, origin) => {
      if (origin !== 'database-load') {
        try {
          const state = Y.encodeStateAsUpdate(ydoc);
          const name = ydoc.name || docName;
          await saveDocument(docName, name, 'evaluation', Buffer.from(state));
        } catch (err) {
          console.error('Error saving document:', err);
        }
      }
    });
  },
  writeState: async (docName, ydoc) => {
    try {
      const state = Y.encodeStateAsUpdate(ydoc);
      const name = ydoc.name || docName;
      await saveDocument(docName, name, 'evaluation', Buffer.from(state));
    } catch (err) {
      console.error('Error writing document state:', err);
    }
  }
};

setPersistence(persistence);

wss.on('connection', async (ws, req) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const docId = url.searchParams.get('docId');
    const userId = url.searchParams.get('userId');
    const userName = url.searchParams.get('userName');
    const userColor = url.searchParams.get('userColor');

    if (!docId) {
      ws.close();
      return;
    }
    
    setupWSConnection(ws, req, { docName: docId, gc: true });
    
    if (userId && userName) {
      try {
        await upsertUser(userId, userName, '', userColor || '#4f6ef7');
      } catch (err) {
        console.error('Error upserting user:', err);
      }
    }
  } catch (err) {
    console.error('Connection error:', err);
    ws.close();
  }
});

app.get('/api/documents', async (req, res) => {
  try {
    const type = req.query.type || 'evaluation';
    const docList = await listDocuments(type);
    res.json(docList);
  } catch (err) {
    console.error('Error listing documents:', err);
    res.status(500).json({ error: 'Failed to list documents' });
  }
});

app.post('/api/documents', async (req, res) => {
  try {
    const { name, type = 'evaluation', initialData } = req.body;
    const id = uuidv4();
    
    await createDocument(id, name, type);
    
    const ydoc = getYDoc(id, true);
    const yrows = ydoc.getArray('rows');
    const ycolumns = ydoc.getArray('columns');
    const ymeta = ydoc.getMap('meta');
    
    if (initialData) {
      initialData.rows.forEach(row => yrows.push([row]));
      initialData.columns.forEach(col => ycolumns.push([col]));
      ymeta.set('dimensions', initialData.dimensions || []);
      ymeta.set('docName', name);
      ymeta.set('docType', type);
    }
    
    ydoc.name = name;
    
    const state = Y.encodeStateAsUpdate(ydoc);
    await saveDocument(id, name, type, Buffer.from(state));
    
    res.json({ id, name, type });
  } catch (err) {
    console.error('Error creating document:', err);
    res.status(500).json({ error: 'Failed to create document' });
  }
});

app.get('/api/documents/:id', async (req, res) => {
  try {
    const doc = await getDocument(req.params.id);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json({ id: doc.id, name: doc.name, type: doc.type, createdAt: doc.created_at, updatedAt: doc.updated_at });
  } catch (err) {
    console.error('Error getting document:', err);
    res.status(500).json({ error: 'Failed to get document' });
  }
});

app.post('/api/ai/generate-evaluation', async (req, res) => {
  try {
    const { docId, changeCount = 10, createdBy } = req.body;
    
    const changeItems = generateChangeItems(changeCount);
    const evaluationData = generateEvaluationTable(changeItems);
    
    if (docId) {
      try {
        await saveAIGeneration(docId, `生成${changeCount}条评估项`, evaluationData, createdBy || '');
      } catch (dbErr) {
        console.warn('Database save skipped:', dbErr.message);
      }
      
      try {
        const ydoc = getYDoc(docId, true);
        const yrows = ydoc.getArray('rows');
        const ycolumns = ydoc.getArray('columns');
        const ymeta = ydoc.getMap('meta');
        
        yrows.delete(0, yrows.length);
        ycolumns.delete(0, ycolumns.length);
        
        evaluationData.rows.forEach(row => yrows.push([row]));
        evaluationData.columns.forEach(col => ycolumns.push([col]));
        ymeta.set('dimensions', evaluationData.dimensions || []);
      } catch (ydocErr) {
        console.warn('Yjs save skipped:', ydocErr.message);
      }
    }
    
    res.json(evaluationData);
  } catch (err) {
    console.error('Error generating evaluation:', err);
    res.status(500).json({ error: 'Failed to generate evaluation' });
  }
});

app.post('/api/ai/analyze-failure', async (req, res) => {
  try {
    const { changeItem } = req.body;
    const failureModes = analyzeFailureModes(changeItem);
    res.json({ failureModes });
  } catch (err) {
    console.error('Error analyzing failure modes:', err);
    res.status(500).json({ error: 'Failed to analyze failure modes' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', activeDocs: docs.size, dbReady });
});

const PORT = process.env.PORT || 3001;

async function start() {
  try {
    await initDB();
    dbReady = true;
    console.log('Database initialized successfully');
  } catch (err) {
    console.warn('Database init failed (expected if no DB available):', err.message);
    dbReady = false;
  }
  
  server.listen(PORT, () => {
    console.log(`Collaborative table server running on port ${PORT}`);
    console.log(`WebSocket endpoint: ws://localhost:${PORT}`);
    console.log(`API endpoint: http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
  });
}

start().catch(console.error);
