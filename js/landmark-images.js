(function () {
  var IMAGE_DIR = "assets/Landmark_images/";
  var FALLBACK_SRC = IMAGE_DIR + "placeholder.jpeg";

  /**
   * Canonical local filenames for the official Molo landmarks.
   * Remote Firebase Storage URLs are never used at runtime.
   */
  var LANDMARK_IMAGE_MAP = {
    MoloChurch: IMAGE_DIR + "1_Church.jpg",
    MoloMansion: IMAGE_DIR + "2_Mansion.jpg",
    MoloPlaza: IMAGE_DIR + "3_Plaza.jpg",
    MoloPublicMarket: IMAGE_DIR + "4_Market.jpg",
    CaminaBalayNgaBato: IMAGE_DIR + "5_Camina.jpg",
    MoloConvent: IMAGE_DIR + "6_Convent.jpg",
    RosendoMejicaLandmark: IMAGE_DIR + "7_Rosendo.jpg",
    DominicanSistersMotherhouse: IMAGE_DIR + "8_Dominican.jpg",
    MoloCemeteryArch: IMAGE_DIR + "10_Cementary.jpg",
    DonRoqueSansonMansion: IMAGE_DIR + "12_Roque.jpg",
    PlazaLacsonMonument: IMAGE_DIR + "13_Garden.jpg",
    MoloPlazaFountain: IMAGE_DIR + "14_Esplanade.jpg",
    MoloFireStation: IMAGE_DIR + "15_Municipal.jpg",
    AvancenaHouse: IMAGE_DIR + "11_Lazaro.jpg",
    LocsinHouse: FALLBACK_SRC,
    HiligaynonWritersMarker: IMAGE_DIR + "3_Plaza.jpg",
    JalandoniHouse: FALLBACK_SRC
  };

  var KEY_BY_SITE_ID = {
    "site-001": "MoloMansion",
    "site-002": "MoloChurch",
    "site-003": "MoloPlaza",
    "site-004": "MoloPublicMarket",
    "site-005": "CaminaBalayNgaBato",
    "site-006": "MoloConvent",
    "site-007": "RosendoMejicaLandmark",
    "site-008": "DominicanSistersMotherhouse",
    "site-009": "MoloCemeteryArch",
    "site-010": "DonRoqueSansonMansion",
    "site-011": "AvancenaHouse",
    "site-012": "LocsinHouse",
    "site-013": "PlazaLacsonMonument",
    "site-014": "MoloFireStation",
    "site-015": "HiligaynonWritersMarker",
    "site-016": "MoloPlazaFountain",
    "site-017": "JalandoniHouse"
  };

  var ALIAS_TO_KEY = [
    [/molo\s*mansion|yusay|consing/, "MoloMansion"],
    [/st\.?\s*anne|molo\s*church|parish\s*church/, "MoloChurch"],
    [/plaza\s*fountain|distrito\s*plaza\s*fountain/, "MoloPlazaFountain"],
    [/plaza\s*lacson/, "PlazaLacsonMonument"],
    [/molo\s*plaza/, "MoloPlaza"],
    [/public\s*market/, "MoloPublicMarket"],
    [/cami[nñ]a|balay\s*nga\s*bato/, "CaminaBalayNgaBato"],
    [/convent|convento/, "MoloConvent"],
    [/mejica/, "RosendoMejicaLandmark"],
    [/dominican/, "DominicanSistersMotherhouse"],
    [/cemetery/, "MoloCemeteryArch"],
    [/sanson|harp\s*fence/, "DonRoqueSansonMansion"],
    [/avance[nñ]a/, "AvancenaHouse"],
    [/locsin\s*ancestral|locsin\s*house/, "LocsinHouse"],
    [/fire\s*station/, "MoloFireStation"],
    [/hiligaynon|writers\s*guild/, "HiligaynonWritersMarker"],
    [/jalandoni/, "JalandoniHouse"]
  ];

  function normalize(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function isRemoteImageUrl(url) {
    return /^https?:\/\//i.test(String(url || "").trim());
  }

  function landmarkKeyFromSite(site) {
    if (!site) return "";
    if (site.landmark_key && LANDMARK_IMAGE_MAP[site.landmark_key]) return site.landmark_key;
    if (site.site_id && KEY_BY_SITE_ID[site.site_id]) return KEY_BY_SITE_ID[site.site_id];

    var blob = normalize([site.site_id, site.site_name, site.title, site.name].filter(Boolean).join(" "));
    for (var i = 0; i < ALIAS_TO_KEY.length; i += 1) {
      if (ALIAS_TO_KEY[i][0].test(blob)) return ALIAS_TO_KEY[i][1];
    }
    return "";
  }

  function getLocalLandmarkImage(site) {
    var key = landmarkKeyFromSite(site);
    return key ? LANDMARK_IMAGE_MAP[key] : "";
  }

  function resolveLandmarkImage(site) {
    return getLocalLandmarkImage(site) || FALLBACK_SRC;
  }

  function applyLandmarkImage(site) {
    if (!site) return site;
    site.landmark_key = landmarkKeyFromSite(site) || site.landmark_key || "";
    site.localImage = resolveLandmarkImage(site);
    site.image = site.localImage;
    site.image_url = site.localImage;
    return site;
  }

  function bindLandmarkImage(imgEl, site, alt) {
    if (!imgEl) return;
    imgEl.alt = alt || (site && (site.site_name || site.title)) || "Landmark";
    imgEl.onerror = function () {
      this.onerror = null;
      this.src = FALLBACK_SRC;
    };
    imgEl.src = resolveLandmarkImage(site);
  }

  window.BAHANDI_LANDMARK_IMAGES = LANDMARK_IMAGE_MAP;
  window.BAHANDI_LANDMARK_IMAGE_DIR = IMAGE_DIR;
  window.BAHANDI_LANDMARK_FALLBACK = FALLBACK_SRC;
  window.landmarkKeyFromSite = landmarkKeyFromSite;
  window.getLocalLandmarkImage = getLocalLandmarkImage;
  window.resolveLandmarkImage = resolveLandmarkImage;
  window.applyLandmarkImage = applyLandmarkImage;
  window.bindLandmarkImage = bindLandmarkImage;
})();
