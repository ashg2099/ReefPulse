import chromadb
from sentence_transformers import SentenceTransformer
import requests

# EXPERT KNOWLEDGE

REEF_DOCUMENTS = [
    # Thermal stress & DHW
    {
        "id": "dhw_001",
        "text": "Degree Heating Weeks (DHW) measures accumulated heat stress on coral reefs. DHW of 4°C-weeks causes significant coral bleaching in sensitive species. DHW of 8°C-weeks or higher causes widespread bleaching and coral mortality.",
        "topic": "thermal_stress"
    },
    {
        "id": "dhw_002",
        "text": "Coral bleaching occurs when water temperatures rise 1°C above the maximum monthly mean for extended periods. The bleaching threshold for most Great Barrier Reef corals is approximately 28-29°C during summer months.",
        "topic": "thermal_stress"
    },
    {
        "id": "sst_001",
        "text": "Sea Surface Temperature (SST) anomalies above +1°C above the climatological baseline indicate heat stress conditions. Sustained anomalies are more damaging than brief spikes. Night-time temperatures above the bleaching threshold are particularly damaging as corals get no recovery period.",
        "topic": "thermal_stress"
    },
    # Bleaching alerts
    {
        "id": "baa_001",
        "text": "NOAA Bleaching Alert Area (BAA) levels: 0=No Stress, 1=Bleaching Watch (stress approaching), 2=Bleaching Warning (bleaching likely), 3=Bleaching Alert Level 1 (bleaching expected, some mortality), 4=Bleaching Alert Level 2 (severe bleaching, significant mortality expected).",
        "topic": "bleaching_alerts"
    },
    # GBR overview
    {
        "id": "gbr_001",
        "text": "The Great Barrier Reef spans 2,300 km along the Queensland coast and contains over 2,900 individual reefs. It is the world's largest coral reef system and a UNESCO World Heritage Site. Key regions include the Coral Sea, Cairns section, Whitsundays, and southern GBR.",
        "topic": "gbr_overview"
    },
    # Bleaching history
    {
        "id": "gbr_bleach_001",
        "text": "The Great Barrier Reef experienced mass bleaching events in 1998, 2002, 2016, 2017, 2020, 2022, and 2024. The 2016 and 2017 back-to-back events were the most severe, killing approximately 50% of shallow-water corals in the northern GBR.",
        "topic": "bleaching_history"
    },
    # GBR zones
    {
        "id": "zone_cairns_001",
        "text": "The Cairns section of the Great Barrier Reef (latitude -15° to -18°S) includes popular dive sites such as the Ribbon Reefs and Cod Hole. This northern section was the most severely impacted during the 2016 mass bleaching event, with over 67% of corals bleached in shallow water.",
        "topic": "gbr_zones"
    },
    {
        "id": "zone_whitsundays_001",
        "text": "The Whitsundays section of the GBR (latitude -20° to -22°S) includes fringing reefs around 74 islands. This central section experienced moderate bleaching in 2016-2017 and severe bleaching in 2022. It is a high-traffic tourism zone with significant boat traffic and runoff pressure.",
        "topic": "gbr_zones"
    },
    {
        "id": "zone_cooktown_001",
        "text": "The Cooktown-Lizard Island region (latitude -14° to -16°S) is one of the most remote parts of the GBR. Lizard Island Research Station is a key monitoring hub. The region suffered catastrophic bleaching in 2016 with some reef structures losing over 90% of living coral cover.",
        "topic": "gbr_zones"
    },
    {
        "id": "zone_coral_sea_001",
        "text": "The Coral Sea reefs lie east of the main GBR lagoon in deeper, clearer water. They include Osprey Reef, Holmes Reef, and Flinders Reef. Being more remote and less exposed to terrestrial runoff, Coral Sea reefs generally have better water quality but are still vulnerable to thermal bleaching.",
        "topic": "gbr_zones"
    },
    {
        "id": "zone_southern_001",
        "text": "The southern GBR (latitude -22° to -24°S) around Capricorn-Bunker Group and Lady Elliot Island is cooler and typically escapes the worst bleaching events. Lady Elliot Island is known as the southernmost coral cay on the GBR and has relatively good coral health due to cooler temperatures.",
        "topic": "gbr_zones"
    },
    # Crown-of-thorns starfish
    {
        "id": "cots_001",
        "text": "Crown-of-thorns starfish (Acanthaster planci, COTS) is the second largest cause of coral loss on the Great Barrier Reef after bleaching. A single COTS can consume up to 10 square metres of coral per year. Population outbreaks occur approximately every 15-17 years on the GBR.",
        "topic": "crown_of_thorns"
    },
    {
        "id": "cots_002",
        "text": "COTS outbreaks are triggered by nutrient-rich runoff from agricultural land on the Queensland coast, which boosts survival rates of COTS larvae. Outbreaks typically start on reefs near Cairns and spread southward. GBRMPA runs control programs injecting starfish with ox bile or vinegar.",
        "topic": "crown_of_thorns"
    },
    {
        "id": "cots_003",
        "text": "Current COTS outbreaks (2023-2025) are active in the northern and central GBR. The Eye on the Reef citizen science program and AIMS surveys track COTS densities. A density of more than 1 COTS per 2 hectares is considered an outbreak threshold requiring intervention.",
        "topic": "crown_of_thorns"
    },
    # Water quality
    {
        "id": "wq_001",
        "text": "Water quality is a major stressor on inshore Great Barrier Reef reefs. Excess nutrients (nitrogen and phosphorus) from sugarcane farming and cattle grazing in Queensland catchments cause algal blooms that smother corals and boost COTS larvae survival.",
        "topic": "water_quality"
    },
    {
        "id": "wq_002",
        "text": "The main river catchments affecting GBR water quality are the Burdekin, Fitzroy, Burnett, and Wet Tropics rivers. The Burdekin River is the largest sediment contributor, delivering hundreds of millions of tonnes of sediment to the reef lagoon annually during flood events.",
        "topic": "water_quality"
    },
    {
        "id": "wq_003",
        "text": "Sediment plumes reduce light availability for corals and seagrass. Suspended sediment from floods can reduce photosynthesis by up to 80% in shallow inshore reefs. The GBR Water Quality Protection Plan aims to reduce dissolved inorganic nitrogen loads by 60% by 2025.",
        "topic": "water_quality"
    },
    # Cyclone impacts
    {
        "id": "cyclone_001",
        "text": "Tropical cyclones cause physical destruction of coral reef structures through wave action and storm surge. Category 4-5 cyclones with wave heights exceeding 5 metres can flatten entire reef structures, breaking branching Acropora corals and overturning massive Porites colonies.",
        "topic": "cyclone_impacts"
    },
    {
        "id": "cyclone_002",
        "text": "Major cyclones affecting the GBR include Cyclone Yasi (2011, Category 5), Cyclone Debbie (2017, Category 4), and Cyclone Jasper (2023). Cyclone Debbie caused extensive damage to Whitsundays reefs, destroying up to 75% of coral cover on some reefs between Bowen and the Whitsunday Islands.",
        "topic": "cyclone_impacts"
    },
    {
        "id": "cyclone_003",
        "text": "Post-cyclone reef recovery depends on water temperature, absence of bleaching, and COTS populations. Physical reef framework can begin regenerating within 2-3 years but full community recovery takes 10-20 years. Frequent bleaching events since 2016 have severely compromised recovery capacity.",
        "topic": "cyclone_impacts"
    },
    # GBRMPA zones
    {
        "id": "gbrmpa_001",
        "text": "The Great Barrier Reef Marine Park covers 344,400 km² and is managed by the Great Barrier Reef Marine Park Authority (GBRMPA). The park is divided into zones with different levels of protection. Green zones (no-take) cover approximately 33% of the park.",
        "topic": "management_zones"
    },
    {
        "id": "gbrmpa_002",
        "text": "GBRMPA zoning categories: Marine National Park (Green) zones prohibit extractive activities. Habitat Protection zones allow limited fishing. Conservation Park zones allow some recreational fishing. General Use zones allow most activities including trawling. No-take zones have highest coral health outcomes.",
        "topic": "management_zones"
    },
    {
        "id": "gbrmpa_003",
        "text": "The 2004 rezoning of the Great Barrier Reef Marine Park increased no-take areas from 4.5% to 33.3%. Scientific assessments show significantly higher fish biomass and coral health inside no-take green zones compared to fished areas. The rezoning is considered one of the most successful marine conservation actions globally.",
        "topic": "management_zones"
    },
    # Species heat tolerances
    {
        "id": "species_001",
        "text": "Acropora corals (branching, table, and staghorn forms) are the most thermally sensitive GBR species. They bleach at temperatures just 0.5-1°C above the local bleaching threshold and suffer the highest mortality rates. Acropora provide critical habitat structure for reef fish.",
        "topic": "species"
    },
    {
        "id": "species_002",
        "text": "Massive Porites corals are among the most thermally tolerant GBR species, surviving temperatures up to 2°C above bleaching thresholds. They grow slowly (5-10mm per year) but can live for hundreds of years and serve as coral bleaching temperature archives through their skeletal records.",
        "topic": "species"
    },
    {
        "id": "species_003",
        "text": "Montipora corals are moderately sensitive to thermal stress, bleaching at temperatures 1-1.5°C above thresholds. Favites (brain corals) and Platygyra (maze corals) show intermediate heat tolerance. Turbinaria and Galaxea species show above-average thermal resilience.",
        "topic": "species"
    },
    {
        "id": "species_004",
        "text": "Symbiodiniaceae (zooxanthellae) are the photosynthetic algae living in coral tissue. Heat stress causes corals to expel zooxanthellae, causing bleaching. Different Symbiodiniaceae clades have different heat tolerances — Clade D (Durusdinium) is more heat tolerant than Clade C (Cladocopium), which dominates GBR corals.",
        "topic": "species"
    },
    {
        "id": "species_005",
        "text": "Soft corals (Alcyonacea) generally bleach less severely than hard corals (Scleractinia) but contribute less to reef structure. Gorgonian sea fans are sensitive to temperature and current changes. Halimeda (green algae) can dominate recovering reefs after bleaching events.",
        "topic": "species"
    },
    {
        "id": "species_006",
        "text": "Coral trout (Plectropomus leopardus) and humphead Maori wrasse (Cheilinus undulatus) are keystone fish species on the GBR. Both are heavily targeted by fishing and are indicators of reef health. Their abundance is significantly higher inside no-take marine national park zones.",
        "topic": "species"
    },
    # Monitoring programs
    {
        "id": "monitor_001",
        "text": "The AIMS Long-Term Monitoring Program (LTMP) has tracked coral cover, fish populations, and COTS densities across the GBR since 1985. It surveys approximately 100 reefs annually using manta tow and underwater visual census methods. LTMP data shows average GBR coral cover declined from ~28% in 1985 to ~14% by 2022.",
        "topic": "monitoring"
    },
    {
        "id": "monitor_002",
        "text": "Eye on the Reef is GBRMPA's citizen science program allowing tourists, dive operators, and community members to report reef health observations. Data collected includes bleaching severity, COTS sightings, coral damage, and marine wildlife encounters. Over 200,000 surveys have been submitted since 2007.",
        "topic": "monitoring"
    },
    {
        "id": "monitor_003",
        "text": "NOAA Coral Reef Watch provides near-real-time satellite monitoring of thermal stress globally at 5km resolution. Products include SST, SST anomaly, Hotspot, Degree Heating Weeks, and Bleaching Alert Area. Data is updated daily and freely available via ERDDAP API.",
        "topic": "monitoring"
    },
    {
        "id": "monitor_004",
        "text": "The eReefs project provides high-resolution hydrodynamic and biogeochemical modelling of the GBR lagoon at 1km and 4km resolution. It models water temperature, salinity, nutrients, sediment, and chlorophyll in near-real-time. Run by AIMS, CSIRO, BOM, and GBRMPA as a collaboration.",
        "topic": "monitoring"
    },
    # Recovery & climate
    {
        "id": "recovery_001",
        "text": "Coral recovery after bleaching takes 10-15 years under ideal conditions. Recovery requires SST returning to normal, absence of additional stressors like COTS, good water quality, and no subsequent bleaching events. Frequent bleaching events since 2016 have prevented full recovery across large GBR sections.",
        "topic": "reef_recovery"
    },
    {
        "id": "climate_001",
        "text": "Under current climate trajectories, annual bleaching events on the Great Barrier Reef are projected to occur by 2035-2040. A 1.5°C global temperature increase reduces suitable reef habitat by 70-90%. At 2°C warming, 99% of reefs globally face annual bleaching conditions.",
        "topic": "climate_projections"
    },
    {
        "id": "wave_001",
        "text": "Wave energy affects coral reef recovery and resilience. Moderate wave action (0.5-1.5m) oxygenates water and reduces localised heat stress. Extreme wave events (>3m) from cyclones can cause physical damage to coral structures, breaking branches and overturning massive corals.",
        "topic": "physical_stress"
    },
]

# WIKIPEDIA PAGES TO FETCH

WIKIPEDIA_PAGES = [
    "Coral_bleaching",
    "Great_Barrier_Reef",
    "Crown-of-thorns_starfish",
    "Coral_reef",
    "Ocean_acidification",
    "Great_Barrier_Reef_Marine_Park",
    "Acropora",
    "Zooxanthellae",
]

def fetch_wikipedia_text(page_title: str) -> str:
    url = "https://en.wikipedia.org/w/api.php"
    params = {
        "action": "query",
        "titles": page_title.replace("_", " "),
        "prop": "extracts",
        "explaintext": True,
        "format": "json"
    }
    headers = {
        "User-Agent": "ReefPulse/1.0 (reef health monitoring research; contact: ashg2099@outlook.com)"
    }
    response = requests.get(url, params=params, headers=headers, timeout=15)
    if response.status_code != 200:
        print(f"  Warning: could not fetch {page_title} (status {response.status_code})")
        return ""

    pages = response.json()["query"]["pages"]
    page = next(iter(pages.values()))
    return page.get("extract", "")

def chunk_text(text: str, words_per_chunk: int = 60) -> list[str]:
    words = text.split()
    chunks = []
    for i in range(0, len(words), words_per_chunk):
        chunk = " ".join(words[i:i + words_per_chunk])
        if len(chunk) > 50:
            chunks.append(chunk)
    return chunks

# BUILD FULL KNOWLEDGE BASE 

def build_knowledge_base():
    print("Loading embedding model...")
    model = SentenceTransformer("all-MiniLM-L6-v2")

    print("Connecting to ChromaDB...")
    client = chromadb.PersistentClient(path="./chroma_db")

    try:
        client.delete_collection("reef_knowledge")
        print("Cleared existing collection")
    except Exception:
        pass

    collection = client.create_collection("reef_knowledge")

    all_ids, all_texts, all_metadatas = [], [], []

    # Add hardcoded expert docs
    for doc in REEF_DOCUMENTS:
        all_ids.append(doc["id"])
        all_texts.append(doc["text"])
        all_metadatas.append({"topic": doc["topic"], "source": "expert"})

    print(f"Added {len(REEF_DOCUMENTS)} expert documents")

    # Add Wikipedia chunks
    wiki_count = 0
    for page in WIKIPEDIA_PAGES:
        print(f"Fetching Wikipedia: {page}")
        text = fetch_wikipedia_text(page)
        if not text:
            continue
        chunks = chunk_text(text)
        for i, chunk in enumerate(chunks):
            all_ids.append(f"wiki_{page.lower()}_{i}")
            all_texts.append(chunk)
            all_metadatas.append({"topic": "wikipedia", "source": page})
            wiki_count += 1
        print(f"  → {len(chunks)} chunks")

    print(f"\nEmbedding {len(all_texts)} total documents...")
    embeddings = model.encode(all_texts, show_progress_bar=True).tolist()

    collection.add(
        ids=all_ids,
        documents=all_texts,
        embeddings=embeddings,
        metadatas=all_metadatas
    )

    print(f"\n✅ Knowledge base complete:")
    print(f"   Expert documents : {len(REEF_DOCUMENTS)}")
    print(f"   Wikipedia chunks : {wiki_count}")
    print(f"   Total            : {len(all_texts)}")

if __name__ == "__main__":
    build_knowledge_base()