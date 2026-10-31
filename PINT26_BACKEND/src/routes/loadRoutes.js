const fs = require('fs');
const path = require('path');

module.exports = (app) => {

  const routesPath = __dirname;

  fs.readdirSync(routesPath).forEach(file => {

    if (file !== 'loadRoutes.js' && file.endsWith('.route.js')) {

      const route = require(path.join(routesPath, file));

      // Remove ".route.js" para criar o endpoint base
      const routeName = file.replace('.route.js', '');

      app.use(`/${routeName}`, route);

    }

  });

};