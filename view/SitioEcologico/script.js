
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

            // 🔥 Garante que o mapa e o layout se ajustem
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

    // Esconde o mapa e mostra o container
    mapa.style.display = "none";
    conteudo.style.display = "block";

    conteudo.innerHTML = `
        <iframe src="${pagina}" style="width:100%; height:100%; border:none;"></iframe>
    `;
}