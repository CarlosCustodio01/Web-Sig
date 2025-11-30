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
            const sidebar = document.getElementById("mySidebar");
            const btn = document.querySelector(".openbtn");

            if (sidebar.style.width === "250px") {
                // FECHAR
                sidebar.style.width = "0";
                btn.classList.remove("menu-open");
            } else {
                // ABRIR
                ajustarSidebar();
                sidebar.style.width = "250px";
                btn.classList.add("menu-open");
            }
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
            maxZoom: 22,      // permite zoom maior no mapa (mas depende dos tiles)
            zoomSnap: 0.25,   // permite passos fracionários se desejar
            zoomDelta: 0.25
        }).setView([-23.0818420,-45.8220342], 18);
        

        // OpenStreetMap (mantém como camada base)
        const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            maxNativeZoom: 19,
            attribution: '© OpenStreetMap',
            detectRetina: false
        });

        // Tentar criar camadas Google (requer Google Maps JS carregado e plugin GoogleMutant)
        let googleSatLayer = null;
        let googleHybridLayer = null;
        if (window.google && L.GridLayer && L.gridLayer && typeof L.gridLayer.googleMutant === 'function') {
            try {
                // satélite puro
                googleSatLayer = L.gridLayer.googleMutant({
                    type: 'satellite',
                    maxZoom: 21
                });
                // hybrid (satélite + rótulos)
                googleHybridLayer = L.gridLayer.googleMutant({
                    type: 'hybrid',
                    maxZoom: 21
                });
            } catch (err) {
                console.warn('GoogleMutant disponível, mas falha ao criar camadas Google:', err);
                googleSatLayer = null;
                googleHybridLayer = null;
            }
        }

        // Fallback (ESRI WorldImagery) caso Google não esteja disponível
        const esriLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles © Esri'
        });

        // Adiciona controle de camadas base (OSM como padrão)
        const baseLayers = { "OpenStreetMap": osmLayer };
        if (googleSatLayer) baseLayers["Google Satellite"] = googleSatLayer;
        if (googleHybridLayer) baseLayers["Google Hybrid"] = googleHybridLayer;
        baseLayers["ESRI WorldImagery"] = esriLayer;

        // adiciona o controle e define OSM como camada inicial
        L.control.layers(baseLayers, null, { collapsed: false, position: 'topright' }).addTo(map);
        osmLayer.addTo(map);
 
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
        const geojsonUrlPerimetro = 'http://localhost:5000/geojson?banco=Sitio_Ecologico&tabela=collection_geojson_cache&key=perimetro';

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
        function loadGeoJSON(name, url, lineStyle = null, paneName = null) {
            if (!url) {
                console.error("URL inválida para", name);
                return;
            }

            fetch(url)
                .then(r => r.json())
                .then(data => {
                    const options = {
                        // se foi fornecido paneName, aplicamos ao layer inteiro
                        pane: paneName || undefined,

                        // ⭐ Estilo: aplica corretamente para linhas e polígonos
                        style: feature => {
                            const t = feature.geometry && feature.geometry.type ? feature.geometry.type : '';
                            // linhas
                            if (t === "LineString" || t === "MultiLineString") {
                                return lineStyle || {};
                            }
                            // polígonos (aplica stroke; mantém fill conforme style)
                            if (t === "Polygon" || t === "MultiPolygon") {
                                // se foi passado um lineStyle, usamos sua cor/peso e desativamos fill por padrão
                                if (lineStyle) {
                                    return Object.assign({ fill: false }, lineStyle);
                                }
                                return { color: '#ff3b3b', weight: 3, fill: false };
                            }
                            return {};
                        },

                        // ⭐ Estilo dos pontos (marrom) - colocados no pane de pontos
                        pointToLayer: (feature, latlng) => {
                            // cria circleMarker no pane de pontos independentemente do pane do layer
                            return L.circleMarker(latlng, {
                                radius: 2,
                                fillColor: "#8B4513",   // marrom
                                color: "none",
                                weight: 0,
                                fillOpacity: 1,
                                pane: 'pointsPane'
                            });
                        }

                    };

                    layers[name] = L.geoJSON(data, options).addTo(map);
                })
                .catch(err => {
                    console.error(`Erro carregando GeoJSON "${name}" de ${url}:`, err);
                });
        }

        // carregar perímetro com estilo tracejado vermelho (pane menor)
        loadGeoJSON("perimetro", geojsonUrlPerimetro, PerimetroStyle, 'perimeterPane');

        // ✅ CARREGAR PONTOS (ficam marrons automaticamente) - pane de pontos (acima)
        loadGeoJSON("pontos_cafe", geojsonUrlPontos, null, 'pointsPane');

        // ✅ CARREGAR LINHAS (ficam VERDES) - pane de linhas (abaixo dos pontos)
        loadGeoJSON("linhas_cafe", geojsonUrlLinhas, LinhaPlantioStyle, 'linesPane');

        // chaves/URLs corretas
        loadGeoJSON("linhas", geojsonUrl1, LinhaPlantioStyle);
        loadGeoJSON("cafe", geojsonUrl2, CafeStyle);