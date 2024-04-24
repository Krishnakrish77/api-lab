const express = require('express');
const bodyParser = require('body-parser')
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const swagger = require('./swagger');

let data = [];
let counter = 1;

app.use(express.json());
// Serve Swagger UI at /api-docs endpoint
app.use('/swagger', swagger.serveSwaggerUI, swagger.setupSwaggerUI);

app.get('/home', (req, res) => {
    // Serve Home Page
    res.writeHead(200, {  
        'Content-Type': 'text/html'  
    });  
    fs.createReadStream('app/static/index.html').pipe(res);
});

// Configure HTTP routes
/**
 * @swagger
 * tags:
 *   - name: Data
 *     description: Dummy APIs
 */
/**
 * @swagger
 * /api/v1/data:
 *   get:
 *     summary: Get Data
 *     tags: [Data]
 *     description: Retrieve data
 *     responses:
 *       200:
 *         description: Successful response
 */
app.get('/api/v1/data', (req, res) => {
  // Implement your GET API logic here
  res.json({ message: 'Hello World!!! GET API Endpoint', data: data });
});

/**
 * @swagger
 * /api/v1/data:
 *   post:
 *     summary: Create Data
 *     tags: [Data]
 *     description: Create new data
 *     parameters:
 *      - name: data
 *        in: body
 *        description: Data to be added
 *        type: object
 *        properties:
 *          value:
 *              type: string
 *              required: true
 *     responses:
 *       200:
 *         description: Successful response
 */
app.post('/api/v1/data', (req, res) => {
  // Implement your POST API logic here
  data.push({ id: counter, value: req.body.value});
  res.json({ id: counter, message: 'POST API Endpoint. Data created successfully!' });
  counter++;
});

/**
 * @swagger
 * /api/v1/data/{id}:
 *   put:
 *     summary: Update Data
 *     tags: [Data]
 *     description: Update data
 *     parameters:
 *       - name: id
 *         in: path
 *         description: id of the resource to be updated
 *         required: true
 *       - name: data
 *         in: body
 *         description: Data to be updated
 *         type: object
 *         properties:
 *           value:
 *              type: string
 *              required: true
 *     responses:
 *       200:
 *         description: The resource is updated
 *       404:
 *         description: The resource cannot be found
 */
app.put('/api/v1/data/:id', (req, res) => {
    // Find index of item with given id
    const id = parseInt(req.params.id);
    const index = data.findIndex(item => item.id === id);

    if (index !== -1) {
        data[index] = { id: id, value: req.body.value};
        res.status(200).json({ message: "Data is updated successfully!"})
    } else {
        res.status(404).json({ error: 'Data not found' });
    }
  });
  
/**
 * @swagger
 * /api/v1/data/{id}:
 *   patch:
 *     summary: Patch Data
 *     tags: [Data]
 *     description: Patch data
 *     parameters:
 *       - name: id
 *         in: path
 *         description: id of the resource to be patched
 *         required: true
 *       - name: data
 *         in: body
 *         description: Data to be patched
 *         type: object
 *         properties:
 *           value:
 *              type: string
 *              required: true
 *     responses:
 *       200:
 *         description: The resource is patched
 *       404:
 *         description: The resource cannot be found
 */
app.patch('/api/v1/data/:id', (req, res) => {
    // Find index of item with given id
    const id = parseInt(req.params.id);
    const index = data.findIndex(item => item.id === id);

    if (index !== -1) {
        // Remove item from array
        data[index]["value"] = req.body.value;
        res.status(200).json({ message: "Data patched successfully!"})
    } else {
        res.status(404).json({ error: 'Data not found' });
    }
});

/**
 * @swagger
 * /api/v1/data/{id}:
 *   delete:
 *     summary: Delete Data
 *     tags: [Data]
 *     description: delete data
 *     parameters:
 *         - name: id
 *           in: path
 *           description: id of the resource to be deleted
 *           required: true
 *     responses:
 *       204:
 *         description: Resource is deleted successfully
 *       404:
 *         description: Resource can not be found
 */
app.delete('/api/v1/data/:id', (req, res) => {
    // Find index of item with given id
    const id = parseInt(req.params.id);
    const index = data.findIndex(item => item.id === id);

    if (index !== -1) {
        // Remove item from array
        data.splice(index, 1);
        res.status(204).send(); // No content response
    } else {
        res.status(404).json({ error: 'Data not found' });
    }
    });

// Live Cricket Score API
// Function to fetch current matches from the API
const fetchMatches = async () => {
    const response = await fetch('https://api.cricapi.com/v1/currentMatches?apikey=4621c2f4-c22d-424d-8a98-9e40efe46172&offset=0');
    const data = await response.json();
    if(data.status == 'success'){
        return data.data;
    }
    else {
        return data;
    }
  };
  
  // Function to send current matches to connected clients
  const sendMatches = async () => {
    const matches = await fetchMatches();
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(matches));
      }
    });
  };

// Configure WebSocket
wss.on('connection', (ws) => {
  console.log('WebSocket connection established');

  // Send initial data to the client
  sendMatches();

  // Handle client refresh request
  ws.on('message', async message => {
    if (message == 'refresh') {
      await sendMatches();
    }
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });
});

// Set up polling interval to fetch and send matches every 30 seconds
setInterval(sendMatches, 60000);

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
