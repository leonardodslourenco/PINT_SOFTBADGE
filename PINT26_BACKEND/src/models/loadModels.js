const fs = require('fs');
const path = require('path');

const modelsPath = __dirname;

fs.readdirSync(modelsPath)
  .filter(file =>
    file.endsWith('.model.js')
  )
  .forEach(file => {
    require(path.join(modelsPath, file));
  });

console.log("Models carregados com sucesso");