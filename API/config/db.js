const { Pool } = require('pg');

// Mapeia os bancos disponíveis
const dbConfigs = {
    Dados_Jacarei: {
        user: 'felipe',
        host: 'localhost',
        database: 'Dados_Jacarei',
        password: 'carlosfelipe',
        port: 5432,
    },
    assentamento_pa_egidio_brunetto: {
        user: 'felipe',
        host: 'Localhost',
        database: 'assentamento_pa_egidio_brunetto',
        password: 'carlosfelipe',
        port: 5432,
    },
    Sitio_Ecologico: {
        user: 'felipe',
        host: 'Localhost',
        database: 'sitio_ecologico',
        password: 'carlosfelipe',
        port: 5432,
    },
};

// Cria os pools dinamicamente
const pools = {};
for (const nome in dbConfigs) {
    pools[nome] = new Pool(dbConfigs[nome]);
}

module.exports = pools;
