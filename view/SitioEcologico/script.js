let iframeAtivo = false;


console.log("Google:", window.google);
console.log("Mutant:", L.gridLayer && L.gridLayer.googleMutant);



function ajustarSidebar() {
            const cabecalho = document.getElementById("cabecalho");
            const sidebar = document.getElementById("mySidebar");

            // Altura real do cabeçalho
            const alturaCabecalho = cabecalho.offsetHeight;

            // Aplica dinamicamente
            sidebar.style.top = alturaCabecalho + "px";
            sidebar.style.height = `calc(100% - ${alturaCabecalho}px)`;
        }

        function toggleNav() {
            if (iframeAtivo) return; // 🚫 bloqueia menu

            const sidebar = document.getElementById("mySidebar");
            const btn = document.querySelector(".openbtn");

            if (sidebar.style.width === "250px") {
                sidebar.style.width = "0";
                btn.classList.remove("menu-open");

                document.body.classList.remove("no-bounce");
                document.documentElement.classList.remove("no-bounce");

            } else {
                ajustarSidebar();
                sidebar.style.width = "250px";
                btn.classList.add("menu-open");

                document.body.classList.add("no-bounce");
                document.documentElement.classList.add("no-bounce");
            }

            ajustarAlturaMapa();
            setTimeout(() => map.invalidateSize(), 150);
        }

        /* ✅ Rolagem da galeria */
        const gallery = document.querySelector('.gallery');
        const scrollAmount = 100;

        function scrollUp() {
            gallery.scrollBy({
                top: -scrollAmount,
                behavior: 'smooth'
            });
        }

        function scrollDown() {
            gallery.scrollBy({
                top: scrollAmount,
                behavior: 'smooth'
            });
        }

        function abrirGaleriaMobile() {
            const botoes = document.querySelector('.botao-menu-mobile');
            const galeria = document.querySelector('.gallery-container');

            // Esconde botões e mostra galeria
            botoes.classList.add('hidden');
            galeria.classList.add('mobile-active', 'show-back-button');
        }

        function voltarMenu() {
            const botoes = document.querySelector('.botao-menu-mobile');
            const galeria = document.querySelector('.gallery-container');

            // Volta ao menu normal
            botoes.classList.remove('hidden');
            galeria.classList.remove('mobile-active', 'show-back-button');
        }

        // Recalcula caso a tela mude de tamanho
        window.addEventListener("resize", ajustarSidebar);
        window.addEventListener("load", ajustarSidebar);





        // Inicializa o mapa
        const map = L.map('map', {
            zoomControl: false,
            zoomAnimation: true,
            fadeAnimation: true,
            markerZoomAnimation: true,
            maxZoom: 23,
            zoomSnap: 0.25,
            zoomDelta: 0.25
        }).setView([-23.0818420,-45.8220342], 18);

        



        // =====================
        // BOTÃO: CENTRALIZAR MAPA
        // =====================

        // Defina sua coordenada padrão aqui:
        const defaultCenter = [-23.0818420, -45.8220342];
        const defaultZoom = 18;

        // Criar botão customizado igual aos botões de zoom
        const ResetViewControl = L.Control.extend({
            options: { position: 'bottomright' },

            onAdd: function () {
                const container = L.DomUtil.create('div', 'leaflet-control-custom leaflet-bar');

                container.innerHTML = `
                    <span style="
                        display:flex;
                        align-items:center;
                        justify-content:center;
                        width:100%;
                        height:100%;
                        font-size:18px;
                        line-height:1;
                    ">⌕</span>
                `;

                // Evita que clique/scroll passem para o mapa
                L.DomEvent.disableClickPropagation(container);

                container.onclick = function () {
                    map.setView(defaultCenter, defaultZoom);
                };

                return container;
            }
        });

        // Adicionar botão ao mapa
        map.addControl(new ResetViewControl());
        

        // OpenStreetMap (mantém como camada base)
        const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            maxNativeZoom: 19,
            attribution: '© OpenStreetMap',
            detectRetina: false
        });

        // Google Satélite (sem API Key, sem Mutant)
        
        // Google Satélite
        const googleSatLayer = L.tileLayer(
            'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
            {
                maxNativeZoom: 20,   // tile real
                maxZoom: 23,         // zoom permitido
                attribution: 'Map data © Google'
            }
        );

        // Google Híbrido
        const googleHybridLayer = L.tileLayer(
            'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
            {
                maxNativeZoom: 20,   // tile real
                maxZoom: 23,         // zoom permitido (esticado)
                attribution: 'Map data © Google'
            }
        );


       

        // Fallback (ESRI WorldImagery) caso Google não esteja disponível
        const esriLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles © Esri'
        });

        // Adiciona controle de camadas base (OSM como padrão)
            const baseLayers = {
            "OpenStreetMap": osmLayer,
            "Google Satélite": googleSatLayer,
            "Google Híbrido": googleHybridLayer,
            "ESRI WorldImagery": esriLayer
        };


        // adiciona o controle e define OSM como camada inicial
        googleHybridLayer.addTo(map);
 
        L.control.zoom({ position: 'bottomright' }).addTo(map);
 
        // ==== CRIAR PANES PARA CONTROLAR ORDENAÇÃO DE CAMADAS ====
        // linhas abaixo dos pontos = zIndex menor para 'linesPane'
        map.createPane('perimeterPane');
        map.getPane('perimeterPane').style.zIndex = 380;

        map.createPane('linesPane');
        map.getPane('linesPane').style.zIndex = 400;

        map.createPane('pointsPane');
        map.getPane('pointsPane').style.zIndex = 500;

        

        function ajustarAlturaMapa() {
            const header = document.getElementById("cabecalho");
            const altura = header.offsetHeight;
            document.documentElement.style.setProperty('--altura-header', altura + "px");

            // garantir que o Leaflet recalcule o tamanho após mudança de layout
            if (typeof map !== 'undefined') {
                // pequeno delay garante que o layout do DOM esteja estabilizado
                setTimeout(() => map.invalidateSize(), 200);
            }
        }

        window.addEventListener("load", ajustarAlturaMapa);
        window.addEventListener("resize", ajustarAlturaMapa);

        const layers = {};

        // 🎨 ESTILOS
        const LinhaPlantioStyle = { 
            color: '#4DB411',  // VERDE sólido (6 dígitos)
            weight: 6,
            opacity: 1,
            dashArray: null
        };

        const CafeStyle = {
            color: '#A0522D',
            weight: 3,
            opacity: 0.9
        };


        // URLS DOS SEUS GEOJSON (AJUSTE SE PRECISAR)
        const geojsonUrlPontos = 'http://localhost:5000/geojson?banco=Sitio_Ecologico&tabela=collection_geojson_cache&key=pontos_cafe';
        const geojsonUrlLinhas = 'http://localhost:5000/geojson?banco=Sitio_Ecologico&tabela=collection_geojson_cache&key=linhas_plantio';
        const geojsonUrlPerimetro ='http://localhost:5000/geojson?banco=Sitio_Ecologico&tabela=collection_geojson_cache&key=perimetro';

        // estilo específico para perímetro (tracejado vermelho)
        const PerimetroStyle = {
            color: '#ff3b3b',
            weight: 3,
            opacity: 1,
            dashArray: '8 6',
            fill: false
        };

        // 📌 FUNÇÃO PRINCIPAL PARA CARREGAR GEOJSON
        // agora aceita paneName (string) para controlar z-order
        function loadGeoJSON(name, url, lineStyle = null, paneName = null, useCluster = false) {
            if (!url) {
                console.error("URL inválida para", name);
                return;
            }

            fetch(url)
                .then(r => r.json())
                .then(data => {
                    const targetPane = paneName || 'pointsPane';
                    const options = {
                        pane: paneName || undefined,
                        style: feature => {
                            const t = feature.geometry && feature.geometry.type ? feature.geometry.type : '';
                            if (t === "LineString" || t === "MultiLineString") {
                                return lineStyle || {};
                            }
                            if (t === "Polygon" || t === "MultiPolygon") {
                                if (lineStyle) {
                                    return Object.assign({ fill: false }, lineStyle);
                                }
                                return { color: '#ff3b3b', weight: 3, fill: false };
                            }
                            return {};
                        },
                        pointToLayer: (feature, latlng) => {
                            const title = (feature.properties && (feature.properties.ponto || feature.properties.nome)) || '';
                            const iconHtml = `<div class="ponto-cafe-icon" title="${title}"></div>`;
                            const icon = L.divIcon({
                                className: "ponto-cafe",
                                html: iconHtml,
                                iconSize: [18, 18]
                            });
                            return L.marker(latlng, { icon, pane: targetPane });
                        },
                    };

                    // Cria o layer GeoJSON (sem adicionar ainda ao mapa)
                    const geoLayer = L.geoJSON(data, {
                        ...options,
                        onEachFeature: function (feature, layer) {
                            if (name === "pontos_cafe") {
                                const p = feature.properties || {};
                                const popup = `
                                <div style="font-family: 'Poppins', sans-serif; font-size: 13px; padding: 10px 12px; border-radius: 10px; background: white; color: #333; box-shadow: 0 2px 10px rgba(0,0,0,0.15); border: 1px solid rgba(0,0,0,0.08); min-width: 180px;">
                                    <h4 style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: rgb(92,118,22); padding-bottom: 5px;">Ponto de Café</h4>
                                    <div><b>Ponto:</b> ${p.ponto ?? "-"}</div>
                                    <div><b>Tipo:</b> ${p.tipo ?? "-"}</div>
                                    <div><b>Norte:</b> ${p.norte ?? "-"}</div>
                                    <div><b>Leste:</b> ${p.leste ?? "-"}</div>
                                    <div><b>Elevação:</b> ${p.elevação ?? "-"}</div>
                                </div>
                                `;

                                layer.bindPopup(popup);
                                return;
                            }

                            if (name === "linhas_cafe") {
                                const p = feature.properties || {};
                                const popup = `
                                <div style="font-family: 'Poppins', sans-serif; font-size: 13px; padding: 10px 12px; border-radius: 10px; background: white; color: #333; box-shadow: 0 2px 10px rgba(0,0,0,0.15); border: 1px solid rgba(0,0,0,0.08); min-width: 180px;">
                                    <h4 style="margin: 0 0 8px 0; font-size: 15px; font-weight: 600; color: #4DB411; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Linha de Plantio</h4>
                                    <div><b>Quantidade:</b> ${p.quant ?? "-"}</div>
                                    <div><b>Tipo:</b> ${p.tipo ?? "-"}</div>
                                </div>
                                `;

                                layer.bindPopup(popup);
                                return;
                            }

                            if (name === "perimetro") {
                                const p = feature.properties || {};
                                const popup = `
                                <div style="font-family: 'Poppins', sans-serif; font-size: 13px; padding: 10px 12px; border-radius: 10px; background: white; color: #333; box-shadow: 0 2px 10px rgba(0,0,0,0.15); border: 1px solid rgba(0,0,0,0.08); min-width: 180px;">
                                    <h4 style="margin: 0 0 8px 0; font-size: 15px; font-weight: 600; color: #ff3b3b; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Perímetro</h4>
                                    <div><b>Sítio:</b> ${p.sitio ?? "-"}</div>
                                    <div><b>Área (ha):</b> ${p["area(ha)"] ?? "-"}</div>
                                </div>
                                `;

                                layer.bindPopup(popup);
                                return;
                            }
                        }
                    });

                    // Se solicitado, crie um MarkerClusterGroup com chunkedLoading (melhora performance)
                    if (useCluster && name === "pontos_cafe") {
                        const cluster = L.markerClusterGroup({
                            chunkedLoading: true,
                            chunkProgress: (processed, total, elapsed) => {
                                if (elapsed > 1000) {
                                    console.log(`Cluster progresso: ${processed}/${total}`);
                                }
                            },
                            removeOutsideVisibleBounds: true,
                            maxClusterRadius: 20,
                            // Permitir "spiderfy" quando não der para dar mais zoom
                            spiderfyOnMaxZoom: true,
                            // Desabilita agrupamento a partir deste nível (assim não agrupa tanto quando estiver perto)
                            disableClusteringAtZoom: 24,
                            showCoverageOnHover: false,
                            // opcional: mantém cluster pequeno e com contador
                            iconCreateFunction: function (cluster) {
                                const count = cluster.getChildCount();
                                const html = `<div class="ponto-cafe-icon cluster">${count}</div>`;
                                return L.divIcon({
                                    html,
                                    className: 'ponto-cafe-cluster',
                                    iconSize: [28, 28]
                                });
                            }
                        });

                        // adicionar marcadores individuais ao cluster (preserva ícone)
                        geoLayer.eachLayer(function (layer) {
                            if (layer instanceof L.Marker) {
                                cluster.addLayer(layer);
                            }
                        });

                        cluster.addTo(map);
                        layers[name] = cluster;
                    } else {
                        // padrão: adiciona diretamente ao mapa
                        geoLayer.addTo(map);
                        layers[name] = geoLayer;
                    }
                })
                .catch(err => {
                    console.error(`Erro carregando GeoJSON "${name}" de ${url}:`, err);
                });
        }

        // carregar perímetro com estilo tracejado vermelho (pane menor)
        loadGeoJSON("perimetro", geojsonUrlPerimetro, PerimetroStyle, 'perimeterPane');

        // ✅ CARREGAR PONTOS usando cluster (melhora performance)
        loadGeoJSON("pontos_cafe", geojsonUrlPontos, null, 'pointsPane', true);

        // ✅ CARREGAR LINHAS (ficam VERDES) - pane de linhas (abaixo dos pontos)
        loadGeoJSON("linhas_cafe", geojsonUrlLinhas, LinhaPlantioStyle, 'linesPane');












        function limparBases() {
            map.removeLayer(osmLayer);
            map.removeLayer(googleSatLayer);
            map.removeLayer(googleHybridLayer);
            map.removeLayer(esriLayer);
        }

        function aplicarMapaBase(valor) {
            limparBases();

            if (valor === "osm") osmLayer.addTo(map);
            if (valor === "google_sat") googleSatLayer.addTo(map);
            if (valor === "google_hyb") googleHybridLayer.addTo(map);
            if (valor === "esri") esriLayer.addTo(map);
        }

        document.querySelectorAll("input[name='basemap']").forEach(radio => {
            radio.addEventListener("change", () => {
                aplicarMapaBase(radio.value);
            });
        });


       function toggleMenuUnico() {
            const box = document.getElementById("boxMenuUnico");

            if (box.style.display === "block") {
                box.style.display = "none";
            } else {
                box.style.display = "block";
            }
        }

        function toggleLayer(nome) {
            const layer = layers[nome];

            if (!layer) {
                console.warn("Camada não encontrada:", nome);
                return;
            }

            if (map.hasLayer(layer)) {
                map.removeLayer(layer);
            } else {
                map.addLayer(layer);
            }
        }


/* ===========================
    DROPDOWN DO DOWNLOAD
=========================== */

function toggleDropdown() {
    const menu = document.getElementById("dropdown-menu");
    const boxLegenda = document.getElementById("boxMenuUnico"); 
    const btnLegenda = document.getElementById("btnMenuUnico");

    const abrir = !menu.classList.contains("show");

    // Abre/fecha o menu de download
    menu.classList.toggle("show");

    if (abrir) {
        // 🔥 Abrindo → esconde legenda e botão
        if (boxLegenda) boxLegenda.style.display = "none";
        if (btnLegenda) btnLegenda.style.display = "none";
    } else {
        // 🔥 Fechando → mostra o botão novamente
        if (btnLegenda) btnLegenda.style.display = "block";
    }
}

function baixarArquivo(arquivo) {
    // ajuste a pasta caso necessário
    window.location.href = "Downloads/" + arquivo;
}

// Fechar dropdown ao clicar fora
document.addEventListener("click", function(e) {
    const dropdown = document.querySelector(".dropdown");
    const menu = document.getElementById("dropdown-menu");
    const btnLegenda = document.getElementById("btnMenuUnico");

    // clicou fora do download
    if (!dropdown.contains(e.target)) {
        menu.classList.remove("show");

        // 🔥 mostra o botão LEGENDA de novo
        if (btnLegenda) btnLegenda.style.display = "block";
    }
});


function ajustarDropdownDegrade() {
    const btn = document.getElementById("btnDownload");
    const menu = document.getElementById("dropdown-menu");

    if (!btn || !menu) return;

    // posição do botão em relação ao viewport
    const rect = btn.getBoundingClientRect();

    // deslocamento horizontal no degradê
    const posX = rect.left;

    // aplica a posição no degradê
    menu.style.backgroundPositionX = `-${posX}px`;
}

window.addEventListener("resize", ajustarDropdownDegrade);
window.addEventListener("load", ajustarDropdownDegrade);

function abrirPagina(pagina) {
    const conteudo = document.getElementById("conteudo");
    const mapa = document.getElementById("map");

    mapa.style.display = "none";
    conteudo.style.display = "block";

    const btnLegenda = document.getElementById("btnMenuUnico");
    const boxLegenda = document.getElementById("boxMenuUnico");

    if (btnLegenda) {
        btnLegenda.style.display = "none";
        btnLegenda.classList.add("legenda-oculta");
    }

    if (boxLegenda) {
        boxLegenda.style.display = "none";
        boxLegenda.classList.add("legenda-oculta");
    }

    conteudo.innerHTML = `
        <iframe src="${pagina}" style="width:100%; height:100%; border:none;"></iframe>
    `;

    // 🔥 MOSTRA O BOTÃO DE VOLTAR
    document.getElementById("btnVoltarMapa").style.display = "block";

    iframeAtivo = true;

    // desabilita o botão de menu
    const btnMenu = document.querySelector(".openbtn");
    btnMenu.style.display = "none";

    // fecha o menu se estiver aberto
    document.getElementById("mySidebar").style.width = "0";
    btnMenu.classList.remove("menu-open");
}

function voltarParaMapa() {
    const conteudo = document.getElementById("conteudo");
    const mapa = document.getElementById("map");

    // mostra o mapa
    mapa.style.display = "block";

    // esconde e limpa o iframe
    conteudo.style.display = "none";
    conteudo.innerHTML = "";

    // volta legenda e botão
    const btnLegenda = document.getElementById("btnMenuUnico");
    const boxLegenda = document.getElementById("boxMenuUnico");

    if (btnLegenda) {
        btnLegenda.style.display = "block";
        btnLegenda.classList.remove("legenda-oculta");
    }

    if (boxLegenda) {
        boxLegenda.style.display = "none"; 
        boxLegenda.classList.remove("legenda-oculta");
    }

    // 🔥 ESCONDE O BOTÃO DE VOLTAR
    document.getElementById("btnVoltarMapa").style.display = "none";

    iframeAtivo = false;

    // reabilita botão de menu
    const btnMenu = document.querySelector(".openbtn");
    btnMenu.style.display = "block";

    // recalcular mapa
    setTimeout(() => map.invalidateSize(), 200);
}

function toggleDropdownMobile() {
    const menu = document.getElementById("dropdown-mobile-menu");

    if (menu.style.display === "block") {
        menu.style.display = "none";
    } else {
        menu.style.display = "block";
    }
}

function toggleDownload() {
    const box = document.getElementById("download-content");
    box.style.display = box.style.display === "block" ? "none" : "block";
}

function baixarArquivo(tipo) {
    const banco = "Sitio_Ecologico";  // ajuste se precisar
    const tabela = "collection_geojson_cache";

    if (tipo === "todas") {
        window.location.href = `http://localhost:5000/export/all_in_one?banco=${banco}&tabela=${tabela}`;
    }
    if (tipo === "kmz") {
        window.location.href = `http://localhost:5000/export/all_zip?banco=${banco}&tabela=${tabela}`;
    }
    if (tipo === "shp") {
        window.location.href = `http://localhost:5000/export/all_shp?banco=${banco}&tabela=${tabela}`;
    }
    }