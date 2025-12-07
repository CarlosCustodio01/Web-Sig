// ------------------------- Exportação de arquivos -------------------------
const JSZip = require('jszip');
const tokml = require('tokml');
const shpwrite = require('shp-write');

const { buscarPorKey, listarKeys } = require('../services/geojsonService');
const { normalizeProperties, normalizarGeoJSON } = require('../utils/geoUtils');
// ------------------------- Essa parte cuida da exportação KMZ -------------------------
async function exportKMZ(req, res) {
    const { tabela, banco, key } = req.query;

    if (!tabela) return res.status(400).json({ erro: 'Informe ?tabela=' });
    if (!banco) return res.status(400).json({ erro: 'Informe ?banco=' });
    if (!key) return res.status(400).json({ erro: 'Informe ?key=' });

    try {
        const { data: geojson } = await buscarPorKey({ banco, tabela, key });

        console.log("GeoJSON recebido:", geojson);

        const kml = tokml(geojson);
        const zip = new JSZip();

        zip.file(`${key}.kml`, kml);
        const kmz = await zip.generateAsync({ type: "nodebuffer" });

        res.setHeader('Content-Type', 'application/vnd.google-earth.kmz');
        res.setHeader('Content-Disposition', `attachment; filename="${key}.kmz"`);

        res.end(kmz);

    } catch (err) {
        console.error("ERRO AO EXPORTAR KMZ:", err);
        res.status(500).send('Erro ao exportar KMZ');
    }
}

// ------------------------- Essa parte cuida da exportação SHP -------------------------
// ------------------------- Essa parte cuida da exportação SHP -------------------------
async function exportSHP(req, res) {
    const { tabela, banco, key } = req.query;

    if (!tabela) return res.status(400).json({ erro: 'Informe ?tabela=' });
    if (!banco)  return res.status(400).json({ erro: 'Informe ?banco=' });
    if (!key)    return res.status(400).json({ erro: 'Informe ?key=' });

    try {
        // Buscar GeoJSON do cache
        const { data: geojsonOriginal } = await buscarPorKey({ banco, tabela, key });

        if (!geojsonOriginal || !geojsonOriginal.features) {
            return res.status(400).send('GeoJSON inválido ou vazio.');
        }

        // Normalizar atributos e geometrias
        const geojsonLimpo = normalizeProperties(normalizarGeoJSON(geojsonOriginal));

        if (!geojsonLimpo.features.length) {
            return res.status(400).send('GeoJSON vazio. Nada para exportar.');
        }

        // Gerar shapefile ZIP original
        const originalZip = shpwrite.zip(geojsonLimpo);
        const zip = await JSZip.loadAsync(originalZip);

        // Renomear arquivos internos (shp, shx, dbf, prj)
        const renamedZip = new JSZip();
        for (const filename of Object.keys(zip.files)) {
            if (filename.endsWith('/')) continue;

            const file = zip.file(filename);
            if (!file) continue;

            const ext = filename.split('.').pop();
            const newName = `${key}.${ext}`;
            const content = await file.async('nodebuffer');

            renamedZip.file(newName, content);
        }

        // Gerar ZIP final
        const finalZipBuffer = await renamedZip.generateAsync({ type: 'nodebuffer' });

        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${key}.zip"`);

        res.end(finalZipBuffer);

    } catch (err) {
        console.error("ERRO AO EXPORTAR SHP:", err);
        res.status(500).send('Erro ao exportar SHP');
    }
}

// ----------------------------------Exportar KML-----------------------------------
async function exportKML(req, res) {
    const { tabela, banco, key } = req.query;

    if (!tabela) return res.status(400).json({ erro: 'Informe ?tabela=' });
    if (!banco)  return res.status(400).json({ erro: 'Informe ?banco=' });
    if (!key)    return res.status(400).json({ erro: 'Informe ?key=' });

    try {
        const { data: geojson } = await buscarPorKey({ banco, tabela, key });

        const kml = tokml(geojson);

        res.setHeader('Content-Type', 'application/vnd.google-earth.kml+xml');
        res.setHeader('Content-Disposition', `attachment; filename="${key}.kml"`);

        res.end(kml);

    } catch (err) {
        console.error("ERRO AO EXPORTAR KML:", err);
        res.status(500).send('Erro ao exportar KML');
    }
}



//------------------------- Exportar kml em zip -------------------------

async function exportAllKML(req, res) {
    const { tabela, banco } = req.query;

    if (!tabela) return res.status(400).json({ erro: 'Informe ?tabela=' });
    if (!banco)  return res.status(400).json({ erro: 'Informe ?banco=' });

    try {
        const keys = await listarKeys(banco, tabela);
        const zip = new JSZip();

        for (const key of keys) {
            const { data: geojson } = await buscarPorKey({ banco, tabela, key });

            const kml = tokml(geojson);
            zip.file(`${key}.kml`, kml);
        }

        const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', 'attachment; filename="todas_camadas_kml.zip"');

        res.end(zipBuffer);

    } catch (err) {
        console.error("ERRO AO EXPORTAR MULTI ZIP:", err);
        res.status(500).send('Erro ao exportar ZIP múltiplo');
    }
}

//------------------------- Exportação de SHP em ZIP -------------------------

async function exportAllSHP(req, res) {
    const { tabela, banco } = req.query;

    if (!tabela) return res.status(400).json({ erro: 'Informe ?tabela=' });
    if (!banco)  return res.status(400).json({ erro: 'Informe ?banco=' });

    try {
        const keys = await listarKeys(banco, tabela);
        const finalZip = new JSZip();

        for (const key of keys) {
            const { data: geojsonOriginal } = await buscarPorKey({ banco, tabela, key });

            if (!geojsonOriginal || !geojsonOriginal.features?.length) continue;

            const geojson = normalizeProperties(normalizarGeoJSON(geojsonOriginal));

            // Gera ZIP original do SHP
            const shpZip = shpwrite.zip(geojson);
            const shpFiles = await JSZip.loadAsync(shpZip);

            // Copia cada arquivo do shapefile renomeando para o key
            for (const filename of Object.keys(shpFiles.files)) {
                if (filename.endsWith("/")) continue;

                const ext = filename.split(".").pop();
                const newName = `${key}.${ext}`;
                const content = await shpFiles.file(filename).async("nodebuffer");

                finalZip.file(newName, content);
            }
        }

        // ZIP final
        const result = await finalZip.generateAsync({ type: "nodebuffer" });

        res.setHeader("Content-Type", "application/zip");
        res.setHeader("Content-Disposition", "attachment; filename=\"todas_camadas_shp.zip\"");

        res.end(result);

    } catch (err) {
        console.error("ERRO AO EXPORTAR ALL SHP:", err);
        res.status(500).send("Erro ao exportar SHP múltiplo");
    }
}


// -------------------------------- Exportaçõa de tudo em um zip ----------------------------------

async function exportAllInOne(req, res) {
    const { tabela, banco } = req.query;

    if (!tabela) return res.status(400).json({ erro: 'Informe ?tabela=' });
    if (!banco)  return res.status(400).json({ erro: 'Informe ?banco=' });

    try {
        const JSZip = require("jszip");
        const zipFinal = new JSZip();

        // 1️⃣ Chamar a função interna que gera TODOS os KML
        const { exportAllKML } = require("./exportController");
        const zipKML = await gerarZipInterno(exportAllKML, req);

        // 2️⃣ Chamar a função interna que gera TODOS os SHP
        const { exportAllSHP } = require("./exportController");
        const zipSHP = await gerarZipInterno(exportAllSHP, req);

        // Colocar no ZIP final
        zipFinal.file("todos_kml.zip", zipKML);
        zipFinal.file("todos_shp.zip", zipSHP);

        const finalZip = await zipFinal.generateAsync({ type: "nodebuffer" });

        res.setHeader("Content-Type", "application/zip");
        res.setHeader("Content-Disposition", 'attachment; filename="Dados_Unidos.zip"');

        res.end(finalZip);

    } catch (err) {
        console.error("ERRO AO EXPORTAR ALL_IN_ONE:", err);
        res.status(500).send("Erro ao exportar tudo-em-um");
    }
}

function gerarZipInterno(exportFunc, reqOriginal) {
    return new Promise((resolve, reject) => {
        // simular req/res internos
        const fakeReq = { query: reqOriginal.query };
        const fakeRes = {
            _data: [],
            setHeader: () => {},
            write: (chunk) => fakeRes._data.push(chunk),
            end: (chunk) => {
                if (chunk) fakeRes._data.push(chunk);
                resolve(Buffer.concat(fakeRes._data));
            }
        };

        // chamar a função exportadora
        exportFunc(fakeReq, fakeRes).catch(reject);
    });
}

module.exports = {
    exportKMZ,
    exportSHP,
    exportKML,
    exportAllKML,
    exportAllSHP,
    exportAllInOne
};