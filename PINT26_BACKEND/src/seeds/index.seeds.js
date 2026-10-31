const fs = require('fs');
const path = require('path');
const sequelize = require('../config/database');
const seedTraducaoConteudo = require('./traducao_conteudo.seed');
const seedLearningPath = require('./learning_path.seed');
const seedPerfil = require('./perfil.seed');
const { seedUtilizador, updateUtilizadorArea, updateUtilizadorServiceLine } = require('./utilizador.seed');
const seedServiceLine = require('./service_line.seed');
const seedArea = require('./area.seed');
const seedPerfilUtilizador = require('./perfil_utilizador.seed');
const seedNivelArea = require('./nivel_area.seed');
const seedBadge = require('./badge.seed');
const seedRequisitoBadge = require('./requisito_badge.seed');
const seedCompetencia = require('./competencia.seed');
const seedCompetenciaBadge = require('./competencia_badge.seed');
const seedEstadoCandidatura = require('./estado_candidatura.seed');
const seedTipoAcaoCandidatura = require('./tipo_acao.seed');
const seedCandidaturaBadge = require('./candidatura_badge.seed');
const seedAcaoCandidatura = require('./acao_candidatura.seed');
const seedEvidenciaCandidatura = require('./evidencia_candidatura.seed');
const seedBadgeAtribuido = require('./badge_atribuido.seed');
const seedRenovacaoBadge = require('./renovacao_badge.seed');
const seedEvidenciaRenovacao = require('./evidencia_renovacao.seed');
const seedCertificado = require('./certificado.seed');
const seedCategoriaMiniforum = require('./categoria_miniforum.seed');
const seedTipoNotificacao = require('./tipo_notificacao.seed');
const seedPostagemMiniforum = require('./postagem_miniforum.seed');
const seedPoliticaRGPD = require('./politica_rgpd.seed');
const seedTipoMarco = require('./tipo_marco.seed');
const seedConfiguracaoMarco = require('./configuracao_marco.seed');
const seedUtilizadorMarco = require('./utilizador_marco.seed');
const seedTipoBadgeEspecial = require('./tipo_badge_especial.seed');
const seedEstadoCandidaturaEspecial = require('./estado_candidatura_especial.seed');
const seedConquistaEspecial = require('./conquista_especial.seed');
const seedConfiguracaoBadgeEspecial = require('./configuracao_badge_especial.seed');
const seedCandidaturaEspecial = require('./candidatura_especial.seed');
const seedConquistaAtribuida = require('./conquista_atribuida.seed');
const seedTipoObjetivo = require('./tipo_objetivo.seed');

async function runSeeds() {
    const transaction = await sequelize.transaction();
    try {
        console.log("Executando seeds...");

        // 1. Traduções (sem dependências)
        await seedTraducaoConteudo(transaction);

        // 2. Learning Path (depende de traducao_conteudo)
        await seedLearningPath(transaction);

        // 3. Perfil (sem dependências externas)
        await seedPerfil(transaction);

        // 4. Utilizador FASE 1 — inserir com id_area = null
        //    (utilizador precisa existir antes de service_line por causa do id_sl_lider)
        await seedUtilizador(transaction);

        // 5. Service Line (depende de learning_path e utilizador/SLL)
        await seedServiceLine(transaction);

        // 6. Area (depende de service_line)
        await seedArea(transaction);

        // 7. Utilizador FASE 2 — agora que as áreas e service lines existem, atualizar id_area e id_sl
        await updateUtilizadorArea(transaction);
        await updateUtilizadorServiceLine(transaction);

        // 8. Perfil Utilizador (depende de utilizador e perfil)
        await seedPerfilUtilizador(transaction);

        // 9. Nível Área (depende de area e traducao_conteudo)
        await seedNivelArea(transaction);

        // 10. Badge (depende de nivel_area e traducao_conteudo)
        await seedBadge(transaction);

        // 11. Requisito Badge (depende de badge e traducao_conteudo)
        await seedRequisitoBadge(transaction);

        //12. Competencia (depende de traducao_conteudo)
        await seedCompetencia(transaction);

        //13. Competencia-Badge (depende de competencia e badge)
        await seedCompetenciaBadge(transaction);

        //14. Estado Candidatura (depende de traducao_conteudo)
        await seedEstadoCandidatura(transaction);

        //15. Tipo Ação Candidatura (depende de traducao_conteudo)
        await seedTipoAcaoCandidatura(transaction);

        //16. Candidatura Badge (depende de utilizador, badge e estado_candidatura)
        await seedCandidaturaBadge(transaction);

        //17. Ação na Candidatura (depende de candidatura, tipo_acao_candidatura e traducao_conteudo)
        await seedAcaoCandidatura(transaction);

        //18. Evidência Candidatura (depende de candidatura e requisito_nivel)
        await seedEvidenciaCandidatura(transaction);

        //19. Badge Atribuído (depende de utilizador, candidatura e badge)
        await seedBadgeAtribuido(transaction);

        // 19.1. Renovação de Badge (depende de candidatura e utilizador)
        await seedRenovacaoBadge(transaction);

        // 19.2. Evidência de Renovação de Badge (depende de renovacao_badge e requisito)
        await seedEvidenciaRenovacao(transaction);

        // 19.5. Certificados (depende de candidatura e utilizador)
        await seedCertificado(transaction);

        //20. Categoria MiniFórum (depende de traducao_conteudo)
        await seedCategoriaMiniforum(transaction);

        //21. Tipo Notificação (depende de traducao_conteudo)
        await seedTipoNotificacao(transaction);

        //22. Postagem MiniFórum (depende de utilizador, categoria_miniforum e traducao_conteudo)
        await seedPostagemMiniforum(transaction);

        // 23. Política RGPD
        await seedPoliticaRGPD(transaction);

        // 24. Tipos de Marcos e Configurações de Marcos (Milestones)
        await seedTipoMarco(transaction);
        await seedConfiguracaoMarco(transaction);
        await seedUtilizadorMarco(transaction);

        // 25. Badges de Conquistas Especiais (Requisito 14)
        await seedTipoBadgeEspecial(transaction);
        await seedEstadoCandidaturaEspecial(transaction);
        await seedConquistaEspecial(transaction);
        await seedConfiguracaoBadgeEspecial(transaction);
        await seedCandidaturaEspecial(transaction);
        await seedConquistaAtribuida(transaction);

        // 26. Tipos de Objetivo (Subsistema Objetivo)
        await seedTipoObjetivo(transaction);

        // Ajustar sequências do PostgreSQL para evitar erro de duplicado de chave primária 
        // ao tentar criar novos registos, uma vez que as seeds possuem IDs explícitos.
        if (sequelize.options.dialect === 'postgres') {
            await sequelize.query(`
                DO $$
                DECLARE
                    t record;
                BEGIN
                    FOR t IN
                        SELECT c.table_name, c.column_name 
                        FROM information_schema.columns c
                        WHERE c.table_schema = 'public' 
                          AND c.column_default LIKE 'nextval(%' 
                    LOOP
                        EXECUTE 'SELECT setval(pg_get_serial_sequence(''' || t.table_name || ''', ''' || t.column_name || '''), COALESCE(MAX(' || quote_ident(t.column_name) || '), 1) ) FROM ' || quote_ident(t.table_name);
                    END LOOP;
                END$$;
            `, { transaction });
            console.log("Sequências auto-increment do PostgreSQL ajustadas.");
        }

        await transaction.commit();

        // Copiar todas as imagens dos seeds de avatar para a pasta de uploads de avatares
        const avatarSeedDir = path.join(__dirname, 'avatar');
        const avatarUploadDir = path.join(__dirname, '..', 'uploads', 'avatars');
        
        if (fs.existsSync(avatarSeedDir)) {
            if (!fs.existsSync(avatarUploadDir)) {
                fs.mkdirSync(avatarUploadDir, { recursive: true });
            }
            const avatarFiles = fs.readdirSync(avatarSeedDir);
            for (const file of avatarFiles) {
                fs.copyFileSync(
                    path.join(avatarSeedDir, file),
                    path.join(avatarUploadDir, file)
                );
            }
            console.log("Todas as imagens de avatar (Seeds) copiadas para uploads com sucesso.");
        }

        // Copiar todas as imagens dos seeds de badges para a pasta de uploads de badges
        const badgeSeedDir = path.join(__dirname, 'logo_badges');
        const badgeUploadDir = path.join(__dirname, '..', 'uploads', 'logo_badges');
        
        if (fs.existsSync(badgeSeedDir)) {
            if (!fs.existsSync(badgeUploadDir)) {
                fs.mkdirSync(badgeUploadDir, { recursive: true });
            }
            const badgeFiles = fs.readdirSync(badgeSeedDir);
            for (const file of badgeFiles) {
                fs.copyFileSync(
                    path.join(badgeSeedDir, file),
                    path.join(badgeUploadDir, file)
                );
            }
            console.log("Todas as imagens de badges (Seeds) copiadas para uploads com sucesso.");
        }

        // Copiar todos os ficheiros PDF de certificados das seeds para a pasta de uploads
        const certSeedDir = path.join(__dirname, 'certificados');
        const certUploadDir = path.join(__dirname, '..', 'uploads', 'docs', 'certificados');
        
        if (fs.existsSync(certSeedDir)) {
            if (!fs.existsSync(certUploadDir)) {
                fs.mkdirSync(certUploadDir, { recursive: true });
            }
            
            // Função recursiva simples para copiar diretórios e ficheiros de certificados
            const copyDirRecursive = (src, dest) => {
                if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
                const items = fs.readdirSync(src);
                for (const item of items) {
                    const srcPath = path.join(src, item);
                    const destPath = path.join(dest, item);
                    if (fs.lstatSync(srcPath).isDirectory()) {
                        copyDirRecursive(srcPath, destPath);
                    } else {
                        fs.copyFileSync(srcPath, destPath);
                    }
                }
            };
            copyDirRecursive(certSeedDir, certUploadDir);
            console.log("Todos os PDFs de certificados (Seeds) copiados para uploads com sucesso.");
        }

        // Copiar todas as imagens dos seeds de badges especiais para a pasta de uploads
        const especialSeedDir = path.join(__dirname, 'logo_especial');
        const especialUploadDir = path.join(__dirname, '..', 'uploads', 'logo_especial');
        
        if (fs.existsSync(especialSeedDir)) {
            if (!fs.existsSync(especialUploadDir)) {
                fs.mkdirSync(especialUploadDir, { recursive: true });
            }
            const especialFiles = fs.readdirSync(especialSeedDir);
            for (const file of especialFiles) {
                fs.copyFileSync(
                    path.join(especialSeedDir, file),
                    path.join(especialUploadDir, file)
                );
            }
            console.log("Todas as imagens de badges especiais (Seeds) copiadas para uploads com sucesso.");
        }

        // Copiar todos os ficheiros de evidências das seeds para a pasta de uploads/evidences
        const evidencesSeedDir = path.join(__dirname, 'evidences');
        const evidencesUploadDir = path.join(__dirname, '..', 'uploads', 'evidences');

        if (fs.existsSync(evidencesSeedDir)) {
            const copyDirRecursive = (src, dest) => {
                if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
                const items = fs.readdirSync(src);
                for (const item of items) {
                    if (item.startsWith('~$')) continue;
                    const srcPath = path.join(src, item);
                    const destPath = path.join(dest, item);
                    if (fs.lstatSync(srcPath).isDirectory()) {
                        copyDirRecursive(srcPath, destPath);
                    } else {
                        fs.copyFileSync(srcPath, destPath);
                    }
                }
            };
            copyDirRecursive(evidencesSeedDir, evidencesUploadDir);
            console.log("Todas as evidências (Seeds) copiadas para uploads/evidences com sucesso.");
        }

        console.log("Seeds concluídos");
    } catch (error) {
        await transaction.rollback();
        console.error("Erro ao executar seeds:", error);
        throw error;
    }
}

module.exports = runSeeds;

if (require.main === module) {
    runSeeds().then(() => {
        console.log("Seeds finalizados com sucesso.");
        process.exit(0);
    }).catch(err => {
        console.error("Erro fatal ao rodar seeds:", err);
        process.exit(1);
    });
}