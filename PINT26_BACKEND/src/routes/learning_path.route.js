const express = require('express');
const routerLearningPath = express.Router();
const controllerLearningPath = require('../controllers/learning_path.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { PERFIS, autorizarPerfis } = require('../middlewares/permissao.middleware');

routerLearningPath.use(authMiddleware);

routerLearningPath.post('/', autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL]), controllerLearningPath.createLearningPath);
routerLearningPath.get('/', controllerLearningPath.listLearningPath);
routerLearningPath.get('/:id', controllerLearningPath.detailLearningPath);
routerLearningPath.put('/:id', autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL]), controllerLearningPath.updateLearningPath);
routerLearningPath.patch('/:id/status', autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL]), controllerLearningPath.updateStatusLearningPath);
routerLearningPath.delete('/:id', autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL]), controllerLearningPath.deleteLearningPath);

module.exports = routerLearningPath;