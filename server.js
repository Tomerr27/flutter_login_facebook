const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Ruta principal - Hola Mundo
app.get('/', (req, res) => {
    res.send('¡Hola Mundo!');
});

// Ruta adicional para probar
app.get('/api', (req, res) => {
    res.json({ mensaje: 'Hola Mundo desde API', status: 'success' });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
    console.log(`Hola Mundo disponible en: http://localhost:${PORT}/`);
});
