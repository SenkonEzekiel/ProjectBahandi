(function () {
  /**
   * Parses coordinates from strings, arrays, or objects (including Firestore GeoPoints).
   */
  function parseCoordinates(data) {
    var raw = data.Coordinates || data.coordinates || data.Coord || data.coords;

    // Handle GeoPoint or object format { latitude, longitude }
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      var objLat = raw.latitude || raw.lat || raw._lat;
      var objLng = raw.longitude || raw.lng || raw._long;
      if (objLat !== undefined && objLng !== undefined) {
        return [Number(objLat), Number(objLng)];
      }
    }

    var strVal = "";
    if (Array.isArray(raw)) {
      strVal = raw.join(" ");
    } else if (typeof raw === "string") {
      strVal = raw;
    } else {
      var sepLat = data.Latitude || data.latitude || data.lat;
      var sepLng = data.Longitude || data.longitude || data.lng;
      if (sepLat && sepLng) {
        strVal = sepLat + " " + sepLng;
      }
    }

    if (!strVal) return [0, 0];

    var matches = strVal.match(/-?\d+(\.\d+)?/g);
    if (matches && matches.length >= 2) {
      var lat = parseFloat(matches[0]);
      var lng = parseFloat(matches[1]);

      if (strVal.includes("S") && lat > 0) lat = -lat;
      if (strVal.includes("W") && lng > 0) lng = -lng;

      return [lat, lng];
    }

    return [0, 0];
  }

  function normalizeCategory(cat) {
    if (typeof cat === "string" && cat.trim().length > 0) return cat;
    if (cat && typeof cat === "object" && cat.name) return cat.name;
    return "Cultural Site";
  }

  function toSiteModel(docId, data) {
    var rawId = data.site_id || data.siteId;
    var siteId = rawId ? rawId : "firestore-" + docId.replace(/\s+/g, "-").toLowerCase();
    var coords = parseCoordinates(data);

    return {
      site_id: siteId,
      site_name: data.Title || data.site_name || data.name || docId,
      district: data.District || data.district || "Molo",
      category: normalizeCategory(data.Category || data.category),
      location: data.Location || data.location || "Molo, Iloilo City",
      coordinates: coords,
      opening_hours: data.Opening_Hours || data.opening_hours || data.openingHours || "N/A",
      description: data.Description || data.description || data.desc || "",
      fun_facts: data["Fun Facts"] || data.fun_facts || data.funFacts || "",
      funFactDeck: data.funFactDeck || data.fun_fact_deck || null,
      image: data.Image || data.image || "assets/images/MoloFront.jpg"
    };
  }

  function hasValidCoordinates(site) {
    if (!site || !Array.isArray(site.coordinates) || site.coordinates.length < 2) {
      return false;
    }

    var lat = Number(site.coordinates[0]);
    var lng = Number(site.coordinates[1]);

    return (
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180 &&
      (lat !== 0 || lng !== 0)
    );
  }

  window.fetchSitesFromFirestore = async function () {
    var db = window.getBahandiFirestoreDb ? window.getBahandiFirestoreDb() : null;

    if (!db && window.firebase) {
      db = window.firebase.firestore();
    }

    if (!db) {
      console.error("Firestore database connection missing.");
      return null;
    }

    try {
      console.log("Fetching documents from 'cultural_sites'...");
      var snapshot = await db.collection("cultural_sites").get();

      if (snapshot && !snapshot.empty) {
        var sites = [];
        snapshot.forEach(function (doc) {
          var data = doc.data() || {};
          var site = toSiteModel(doc.id, data);

          if (hasValidCoordinates(site)) {
            sites.push(site);
          } else {
            console.warn("⚠️ Skipped document '" + doc.id + "' due to invalid coordinates:", data);
          }
        });

        console.log("✅ Loaded " + sites.length + " sites from Firestore.");
        return sites;
      } else {
        console.warn("'cultural_sites' collection is empty.");
      }
    } catch (err) {
      console.error("Failed to query 'cultural_sites' collection:", err);
    }

    return null;
  };

  window.fetchSiteByIdFromFirestore = async function (siteId) {
    var db = window.getBahandiFirestoreDb ? window.getBahandiFirestoreDb() : null;
    if (!db && window.firebase) {
      db = window.firebase.firestore();
    }
    if (!db || !siteId) return null;

    try {
      var doc = await db.collection("cultural_sites").doc(siteId).get();
      if (doc && doc.exists) {
        return toSiteModel(doc.id, doc.data() || {});
      }
    } catch (err) {
      console.error("Error fetching site by ID:", err);
    }

    return null;
  };
})();