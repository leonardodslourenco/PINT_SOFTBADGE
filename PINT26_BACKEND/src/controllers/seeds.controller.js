const runSeeds = require('../seeds/index.seeds');
const path = require('path');
const fs = require('fs');
const sequelize = require('../config/database');

const controllersSeeds = {};

// POST /api/seeds/all
controllersSeeds.seedAll = async (req, res) => {
    try {
        await runSeeds();
        return res.status(200).json({ success: true, message: "Todos os seeds executados com sucesso." });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Erro ao executar todos os seeds.", error: error.message });
    }
};

// POST /api/seeds/:entidade
controllersSeeds.seedEntity = async (req, res) => {
    const { entidade } = req.params;
    
    try {
        // Garantir segurança do path
        const safeEntity = path.basename(entidade);
        const seedPath = path.join(__dirname, '..', 'seeds', `${safeEntity}.seed.js`);
        
        if (!fs.existsSync(seedPath)) {
            return res.status(404).json({ success: false, message: `Seed para a entidade '${safeEntity}' não encontrado.` });
        }

        const seedExports = require(seedPath);
        
        // Verifica se é uma função direta (ex: area.seed.js) ou um objecto (ex: utilizador.seed.js)
        let funcToCall = seedExports;
        if (typeof seedExports === 'object' && seedExports !== null) {
            // Se for o utilizador, chamamos a função principal dele
            if (seedExports.seedUtilizador) {
                funcToCall = seedExports.seedUtilizador;
            } else {
                // Tenta chamar a primeira função que encontrar exportada
                funcToCall = Object.values(seedExports).find(val => typeof val === 'function');
            }
        }

        if (typeof funcToCall !== 'function') {
            return res.status(500).json({ success: false, message: "O ficheiro de seed não exporta uma função válida." });
        }

        const transaction = await sequelize.transaction();
        try {
            await funcToCall(transaction);
            await transaction.commit();
            return res.status(200).json({ success: true, message: `Seed '${safeEntity}' executado com sucesso.` });
        } catch (txError) {
            await transaction.rollback();
            throw txError;
        }

    } catch (error) {
        return res.status(500).json({ success: false, message: `Erro ao executar seed '${entidade}'.`, error: error.message });
    }
};

module.exports = controllersSeeds;
