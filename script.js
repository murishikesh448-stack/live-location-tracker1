const asset = (name) => `assets/${name}`;

const temple = {
  name: "Subramaniya Swamy Temple, Tiruchendur",
  lat: 8.49583,
  lng: 78.12917,
};

const mapUrl = "https://www.google.com/maps/search/?api=1&query=Subramaniya%20Swamy%20Temple%20Tiruchendur";
const defaultTrackerApiBase = "https://live-location-tracker1.onrender.com";
const trackerApiBase = getTrackerApiBase();
const chariotLocationApi = `${trackerApiBase}/api/chariot-location`;
const sharingPageBaseUrl = "https://locationsend.netlify.app/";

const sections = [
  {
    id: "home",
    label: "Temple",
    title: "TIRUCHENDUR MURUGAN TEMPLE",
    subtitle: "Murugan shrine by the Bay of Bengal",
    kicker: "Murugan temple on the Bay of Bengal",
    heroText:
      "A sacred Arupadai Veedu shrine dedicated to Murugan, known for its seashore setting, Surasamharam festival, and Tamil temple architecture.",
    image: asset("tiruchendur-main-front.png"),
    color: "rgba(185, 54, 42, 0.72)",
  },
  {
    id: "overview",
    label: "Details",
    title: "Temple Details",
    subtitle: "Deity, location, festivals, and administration",
    kicker: "Essential temple facts",
    heroText:
      "The temple is in Tiruchendur, Thoothukudi district, Tamil Nadu, and is administered by the Hindu Religious and Charitable Endowments Department of the Government of Tamil Nadu.",
    image: asset("tiruchendur-gopuram-blue-sky.png"),
    color: "rgba(217, 154, 38, 0.76)",
  },
  {
    id: "festivals",
    label: "Festivals",
    title: "Major Festivals",
    subtitle: "Vaikasi Visakam, Surasamharam, and Thaipusam",
    kicker: "Festival highlights",
    heroText:
      "Surasamharam, the reenactment of Murugan's victory over Surapadman, is one of the temple's major observances and draws thousands of devotees.",
    image: asset("tiruchendur-festival-alangaram.png"),
    color: "rgba(15, 118, 110, 0.72)",
  },
  {
    id: "chariot",
    label: "Track Car",
    title: "Live Chariot Map",
    subtitle: "Updates from the sharing mobile phone",
    kicker: "Live car tracking",
    heroText:
      "Track the temple car on a Leaflet map when a phone near the chariot shares its GPS location to the website server.",
    image: asset("tiruchendur-festival-alangaram.png"),
    color: "rgba(185, 54, 42, 0.72)",
  },
  {
    id: "architecture",
    label: "Architecture",
    title: "Seashore Architecture",
    subtitle: "Nine-tier gopuram, prakarams, and cave sanctum",
    kicker: "Tamil architecture",
    heroText:
      "The temple complex stands at the eastern end of Tiruchendur near the sea, with a nine-tier gopuram and a sanctum described as being inside a cave.",
    image: asset("tiruchendur-gopuram-close.png"),
    color: "rgba(65, 108, 59, 0.72)",
  },
  {
    id: "mythology",
    label: "Mythology",
    title: "Murugan and Surapadman",
    subtitle: "The legend behind Surasamharam",
    kicker: "Sacred story",
    heroText:
      "Temple tradition connects Tiruchendur with Murugan's battle against Surapadman and the divine vel that ends the asura's tyranny.",
    image: asset("tiruchendur-murugan-alangaram.png"),
    color: "rgba(37, 93, 141, 0.72)",
  },
  {
    id: "location",
    label: "Location",
    title: "Location Guide",
    subtitle: "Coordinates, map, and route helper",
    kicker: "Tiruchendur, Tamil Nadu",
    heroText:
      "Open the map for directions to the temple or use this page's optional location tool to estimate your distance from Tiruchendur.",
    image: asset("tiruchendur-murugan-valli-deivanai.png"),
    color: "rgba(74, 31, 26, 0.72)",
  },
  {
    id: "visitor",
    label: "Help",
    title: "Visitor Help",
    subtitle: "Practical notes for devotees and travellers",
    kicker: "Plan your visit",
    heroText:
      "Keep the seashore location, major festival crowds, ritual bathing customs, and basic emergency contacts in one easy place.",
    image: asset("tiruchendur-gopuram-blue-sky.png"),
    color: "rgba(111, 78, 55, 0.72)",
  },
];

let activeIndex = 0;
let autoTimer = null;
let chariotMap = null;
let chariotMarker = null;
let templeMarker = null;
let chariotPollTimer = null;
const intervalMs = 9000;
const chariotPollMs = 4000;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const posterTrack = document.querySelector("#posterTrack");
const contentStage = document.querySelector("#contentStage");
const heroImage = document.querySelector("#heroImage");
const heroKicker = document.querySelector("#heroKicker");
const heroText = document.querySelector("#heroText");
const bannerProgress = document.querySelector("#bannerProgress");

function getTrackerApiBase() {
  const params = new URLSearchParams(window.location.search);
  const apiFromUrl = params.get("api");

  if (apiFromUrl) {
    const cleanApi = apiFromUrl.replace(/\/$/, "");
    localStorage.setItem("trackerApiBase", cleanApi);
    return cleanApi;
  }

  return (localStorage.getItem("trackerApiBase") || defaultTrackerApiBase).replace(/\/$/, "");
}

function getSharingPageUrl() {
  const url = new URL(sharingPageBaseUrl);
  if (trackerApiBase) {
    url.searchParams.set("api", trackerApiBase);
  }
  return url.toString();
}
function renderPosterTabs() {
  posterTrack.innerHTML = sections
    .map(
      (section, index) => `
        <button
          class="poster-tab"
          type="button"
          role="tab"
          aria-selected="${index === activeIndex}"
          aria-controls="contentStage"
          data-index="${index}"
          style="--poster-image: url('${section.image}'); --poster-color: ${section.color};"
        >
          <span class="poster-copy">
            <span class="poster-label">${section.label}</span>
            <span class="poster-title">${section.title}</span>
            <span class="poster-subtitle">${section.subtitle}</span>
          </span>
        </button>
      `
    )
    .join("");
}

function getInitialSectionIndex() {
  const params = new URLSearchParams(window.location.search);
  const requestedView = params.get("view") || window.location.hash.replace("#", "");
  const requestedIndex = sections.findIndex((section) => section.id === requestedView);
  return requestedIndex === -1 ? 0 : requestedIndex;
}

function setActive(index, triggeredByUser = false, updateContent = triggeredByUser) {
  activeIndex = (index + sections.length) % sections.length;
  const section = sections[activeIndex];

  if (updateContent) {
    clearChariotPolling();
  }
  heroImage.src = section.image;
  heroKicker.textContent = section.kicker;
  heroText.textContent = section.heroText;
  if (updateContent) {
    contentStage.innerHTML = renderView(section.id);
  }

  document.querySelectorAll(".poster-tab").forEach((tab, tabIndex) => {
    const selected = tabIndex === activeIndex;
    tab.setAttribute("aria-selected", String(selected));
    if (selected) {
      tab.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", inline: "center", block: "nearest" });
    }
  });

  if (updateContent) {
    initLocationTool();
    initChariotMap();
  }
  restartProgress();

  if (triggeredByUser) {
    window.history.replaceState(null, "", `#${section.id}`);
    restartAuto();
    contentStage.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }
}

function renderView(id) {
  const renderers = {
    home: renderHome,
    overview: renderOverview,
    festivals: renderFestivals,
    chariot: renderChariot,
    architecture: renderArchitecture,
    mythology: renderMythology,
    location: renderLocation,
    visitor: renderVisitor,
  };

  return renderers[id]();
}

function renderHome() {
  return `
    <div class="view">
      <div class="view-hero">
        <div>
          <span class="section-kicker">Sacred seashore shrine</span>
          <h2>One of Murugan's foremost sacred temples.</h2>
          <p>
            Subramaniya Swamy Temple at Tiruchendur is dedicated to Murugan and belongs to the revered Six Abodes of Murugan.
            The temple sits on the shore of the Bay of Bengal at the eastern end of Tiruchendur town.
          </p>
          <div class="button-row">
            <button class="action-button" type="button" data-view-link="overview">Temple Details</button>
            <button class="action-button track-card-button" type="button" data-view-link="chariot">Track Car</button>
          </div>
        </div>
        <img class="feature-image" src="${asset("tiruchendur-gopuram-blue-sky.png")}" alt="Tiruchendur temple gopuram" />
      </div>

      <div class="stat-grid">
        ${infoCard("Murugan", "Main deity of the temple")}
        ${infoCard("Arupadai Veedu", "One of the Six Abodes of Murugan")}
        ${infoCard("Live Tracker", "Open the large Track Car button to see the chariot position")}
        ${infoCard("Bay of Bengal", "Temple complex stands near the seashore")}
      </div>

      <div class="split-band">
        <div class="guide-card">
          <h3>Sacred Identity</h3>
          <p>The shrine is also listed among the Vaippu Sthalams sung by the Tamil Shaivite saint Appar.</p>
        </div>
        <div class="guide-card">
          <h3>Car Tracking</h3>
          <p>Open the sharing page on the phone with the chariot; this website will poll the latest coordinates and move the map marker.</p>
        </div>
      </div>
    </div>
  `;
}

function renderOverview() {
  return `
    <div class="view">
      <div class="view-hero">
        <div>
          <span class="section-kicker">Temple details</span>
          <h2>Key facts for the Tiruchendur shrine.</h2>
          <p>
            The temple is a Hindu shrine in Tiruchendur, Thoothukudi district, Tamil Nadu, India. It is dedicated to Murugan and is maintained by the Hindu Religious and Charitable Endowments Department, Government of Tamil Nadu.
          </p>
        </div>
        <img class="feature-image" src="${asset("tiruchendur-murugan-seashore.png")}" alt="Murugan at Tiruchendur seashore temple" />
      </div>
      <div class="guide-grid">
        ${guideCard("Affiliation", "Hinduism, with Murugan worship at the center of the temple tradition.")}
        ${guideCard("Festivals", "Vaikasi Visakam, Surasamharam, and Thaipusam are major observances associated with the temple.")}
        ${guideCard("Administration", "The temple is maintained by the HR and CE Department of the Government of Tamil Nadu.")}
      </div>
    </div>
  `;
}

function renderFestivals() {
  return `
    <div class="view">
      <div class="view-hero">
        <div>
          <span class="section-kicker">Festival highlights</span>
          <h2>Surasamharam is the defining festival moment.</h2>
          <p>
            A reenactment of Murugan's victory over Surapadman is a major Tiruchendur festival and draws thousands of devotees. The temple is also associated with Vaikasi Visakam and Thaipusam.
          </p>
        </div>
        <img class="feature-image" src="${asset("tiruchendur-festival-alangaram.png")}" alt="Tiruchendur festival alangaram" />
      </div>
      <div class="timeline">
        ${festivalItem("Vaikasi", "Visakam", "Celebrates Murugan and remains one of the major festivals listed for the temple.")}
        ${festivalItem("Sura", "Samharam", "Reenacts the victory of Murugan over the asura Surapadman and attracts large crowds.", true)}
        ${festivalItem("Thai", "Pusam", "A major Murugan observance connected with devotion, vows, and temple worship.")}
      </div>
    </div>
  `;
}

function renderChariot() {
  return `
    <div class="view">
      <div class="view-hero tracker-hero">
        <div>
          <span class="section-kicker">Live chariot location</span>
          <h2>Map marker updates from another mobile phone.</h2>
          <p>
            Open the sharing page on the phone travelling with the chariot and start sharing. This map can use a public HTTPS tracker server, so both phones do not need to be on the same Wi-Fi.
          </p>
          <div class="button-row">
            <button class="action-button" id="refreshChariotLocation" type="button">Refresh Marker</button>
          </div>
          <div id="chariotStatus" class="location-result is-visible" role="status">Waiting for chariot location from the sharing phone...</div>
        </div>
        <div class="tracker-map-wrap">
          <div id="chariotMap" class="tracker-map" aria-label="Live chariot map"></div>
        </div>
      </div>
      <div class="guide-grid">
        ${guideCard("Phone on Chariot", "The sharing phone uses browser GPS and sends latitude, longitude, accuracy, and time to the server.")}
        ${guideCard("Public Server", "Deploy server.js on an HTTPS host. The map reads the latest coordinate from /api/chariot-location.")}
        ${guideCard("Different Networks", "Use the public site URL or add ?api=https://your-tracker-domain.com when the API is hosted separately.")}
      </div>
    </div>
  `;
}

function renderArchitecture() {
  return `
    <div class="view">
      <div class="view-hero">
        <div>
          <span class="section-kicker">Architecture</span>
          <h2>A compact seashore complex with a tall nine-tier gopuram.</h2>
          <p>
            The complex measures about 91 m north to south and 65 m east to west. Its nine-tier gopuram rises about 157 ft, and the main entrance faces south into the first of two prakarams.
          </p>
        </div>
        <img class="feature-image" src="${asset("tiruchendur-gopuram-close.png")}" alt="Tiruchendur temple gopuram close view" />
      </div>
      <div class="gallery-grid">
        ${galleryCard("Nine-Tier Gopuram", "A 157 ft tower gate is a major landmark of the temple.", asset("tiruchendur-gopuram-blue-sky.png"))}
        ${galleryCard("Cave Sanctum", "The inner sanctum is described as being inside a cave, with Murugan as a saintly child.", asset("tiruchendur-murugan-seashore.png"))}
        ${galleryCard("Nali Kinaru", "A sacred freshwater well lies about 100 m south of the temple.", asset("tiruchendur-murugan-valli-deivanai.png"))}
      </div>
    </div>
  `;
}

function renderMythology() {
  return `
    <div class="view">
      <div class="view-hero">
        <div>
          <span class="section-kicker">Mythology</span>
          <h2>The Surapadman story gives the shrine its festival power.</h2>
          <p>
            In the temple tradition, Murugan battles Surapadman at Tiruchendur. When Surapadman takes the form of a great mango tree, Murugan splits it with the vel; the halves become the peacock and rooster.
          </p>
        </div>
        <img class="feature-image" src="${asset("tiruchendur-murugan-alangaram.png")}" alt="Murugan alangaram" />
      </div>
      <div class="guide-grid">
        ${guideCard("The Vel", "Murugan's divine spear is central to the story of victory over Surapadman.")}
        ${guideCard("Peacock", "After Surapadman is defeated, the peacock becomes Murugan's vahana.")}
        ${guideCard("Rooster", "The rooster becomes the emblem on Murugan's pennant.")}
      </div>
    </div>
  `;
}

function renderLocation() {
  return `
    <div class="view">
      <div class="view-hero">
        <div>
          <span class="section-kicker">Location and route</span>
          <h2>Tiruchendur, Thoothukudi district, Tamil Nadu.</h2>
          <p>
            The temple coordinates are approximately 8.49583 N, 78.12917 E. Use the map link for directions or the optional device location tool for an approximate distance estimate.
          </p>
          <div class="button-row">
            <button id="locateMe" class="action-button" type="button">Use My Location</button>
            <a class="action-link is-alt" href="${mapUrl}" target="_blank" rel="noreferrer">Open in Maps</a>
          </div>
          <div id="locationResult" class="location-result" role="status"></div>
        </div>
        <div class="parking-map">
          <img src="${asset("tiruchendur-gopuram-blue-sky.png")}" alt="Tiruchendur temple gopuram" />
        </div>
      </div>
      <div class="guide-grid">
        ${guideCard("Seashore Visit", "Plan for sun, salt air, and heavier crowds around festival days.")}
        ${guideCard("Ritual Bathing", "Many devotees bathe in the sea and then use the Nali Kinaru freshwater well.")}
        ${guideCard("Crowd Planning", "Surasamharam and major Murugan festivals can bring thousands of visitors.")}
      </div>
    </div>
  `;
}

function renderVisitor() {
  return `
    <div class="view">
      <div class="view-hero">
        <div>
          <span class="section-kicker">Visitor help</span>
          <h2>Simple support points for devotees and travellers.</h2>
          <p>Keep essentials visible: emergency numbers, map access, water, footwear planning, and crowd-aware movement during major festivals.</p>
        </div>
        <img class="feature-image" src="${asset("tiruchendur-murugan-valli-deivanai.png")}" alt="Murugan with Valli and Deivanai" />
      </div>
      <div class="contact-grid">
        ${contactCard("Emergency", "112", "National emergency response")}
        ${contactCard("Ambulance", "108", "Medical emergency service")}
        ${contactCard("Temple Area", "Tiruchendur", "Use local police or temple volunteer directions during peak crowds")}
        ${contactCard("Map", "Open", "Use Google Maps for current routes and traffic")}
      </div>
      <div class="button-row">
        <a class="action-link" href="${mapUrl}" target="_blank" rel="noreferrer">Open Temple Map</a>
        <button class="action-button track-card-button" type="button" data-view-link="chariot">Track Car</button>
      </div>
    </div>
  `;
}

function festivalItem(month, title, copy, main = false) {
  return `
    <article class="timeline-item ${main ? "is-main" : ""}">
      <div class="date-box">
        <strong>${month}</strong>
        <span>Festival</span>
      </div>
      <div class="timeline-copy">
        <h3>${title}</h3>
        <p>${copy}</p>
      </div>
      <span class="pill">${main ? "Major" : "Sacred"}</span>
    </article>
  `;
}

function infoCard(value, label) {
  return `
    <article class="info-card">
      <b>${value}</b>
      <span>${label}</span>
    </article>
  `;
}

function guideCard(title, copy) {
  return `
    <article class="guide-card">
      <h3>${title}</h3>
      <p>${copy}</p>
    </article>
  `;
}

function galleryCard(title, copy, image) {
  return `
    <article class="gallery-card">
      <img src="${image}" alt="${title}" />
      <div>
        <h3>${title}</h3>
        <p>${copy}</p>
      </div>
    </article>
  `;
}

function contactCard(title, value, copy) {
  return `
    <article class="contact-card">
      <h3>${title}</h3>
      <strong>${value}</strong>
      <span>${copy}</span>
    </article>
  `;
}

function initChariotMap() {
  const mapElement = document.querySelector("#chariotMap");
  const refreshButton = document.querySelector("#refreshChariotLocation");
  const status = document.querySelector("#chariotStatus");

  if (!mapElement) {
    return;
  }

  if (!window.L) {
    showTrackerStatus("Leaflet did not load. Check the internet connection for map tiles and scripts.", true);
    return;
  }

  chariotMap = L.map(mapElement, { scrollWheelZoom: false }).setView([temple.lat, temple.lng], 16);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  }).addTo(chariotMap);

  templeMarker = L.marker([temple.lat, temple.lng]).addTo(chariotMap).bindPopup("Tiruchendur Murugan Temple");
  chariotMarker = L.marker([temple.lat, temple.lng], { icon: createChariotIcon() })
    .addTo(chariotMap)
    .bindPopup("Waiting for chariot GPS...");

  setTimeout(() => chariotMap.invalidateSize(), 50);

  refreshButton?.addEventListener("click", () => fetchChariotLocation(true));
  fetchChariotLocation(true);
  chariotPollTimer = window.setInterval(() => fetchChariotLocation(false), chariotPollMs);

  function showTrackerStatus(message, isError = false) {
    if (!status) {
      return;
    }
    status.textContent = message;
    status.classList.toggle("is-error", isError);
  }
}

function createChariotIcon() {
  return L.divIcon({
    className: "chariot-map-icon",
    html: '<img src="assets/vel-marker.png" alt="" />',
    iconSize: [64, 64],
    iconAnchor: [32, 32],
    popupAnchor: [0, -30],
  });
}

async function fetchChariotLocation(showLoading) {
  const status = document.querySelector("#chariotStatus");

  if (!chariotMap || !chariotMarker) {
    return;
  }

  if (showLoading && status) {
    status.textContent = "Checking for the latest chariot location...";
    status.classList.remove("is-error");
  }

  try {
    const response = await fetch(chariotLocationApi, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("No tracker server response");
    }

    const data = await response.json();
    if (!data || !data.hasLocation) {
      if (status) {
        status.textContent = "Please wait, location will be shared soon.";
      }
      return;
    }

    const latLng = [data.lat, data.lng];
    chariotMarker.setLatLng(latLng);
    chariotMarker.setPopupContent(`Chariot location<br>Accuracy: ${Math.round(data.accuracy || 0)} m`);
    chariotMap.setView(latLng, Math.max(chariotMap.getZoom(), 16), { animate: !reduceMotion });

    if (status) {
      status.classList.remove("is-error");
      status.textContent = `Last update: ${formatTrackerTime(data.updatedAt)} | Accuracy: ${Math.round(data.accuracy || 0)} m`;
    }
  } catch (error) {
    if (status) {
      status.classList.add("is-error");
      status.textContent = "Tracker server is not reachable. Use a public HTTPS server URL, for example ?api=https://your-tracker-domain.com";
    }
  }
}

function clearChariotPolling() {
  if (chariotPollTimer) {
    window.clearInterval(chariotPollTimer);
    chariotPollTimer = null;
  }
  chariotMap = null;
  chariotMarker = null;
  templeMarker = null;
}

function formatTrackerTime(value) {
  if (!value) {
    return "unknown";
  }
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function startAuto() {
  if (reduceMotion) {
    return;
  }
  stopAuto();
  autoTimer = window.setInterval(() => setActive(activeIndex + 1, false, false), intervalMs);
  restartProgress();
}

function stopAuto() {
  if (autoTimer) {
    window.clearInterval(autoTimer);
    autoTimer = null;
  }
}

function restartAuto() {
  stopAuto();
  startAuto();
}

function restartProgress() {
  bannerProgress.classList.remove("is-running");
  void bannerProgress.offsetWidth;
  if (!reduceMotion) {
    bannerProgress.classList.add("is-running");
  }
}

function initLocationTool() {
  const button = document.querySelector("#locateMe");
  const result = document.querySelector("#locationResult");

  if (!button || !result) {
    return;
  }

  button.addEventListener("click", () => {
    if (!navigator.geolocation) {
      showLocationResult(result, "This browser does not support location access.");
      return;
    }

    button.disabled = true;
    button.textContent = "Finding Location";
    showLocationResult(result, "Waiting for your browser permission...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const distance = distanceKm(latitude, longitude, temple.lat, temple.lng).toFixed(1);
        const routeUrl = `https://www.google.com/maps/dir/?api=1&origin=${latitude},${longitude}&destination=${encodeURIComponent(
          temple.name
        )}&travelmode=driving`;

        showLocationResult(
          result,
          `You are approximately ${distance} km from Subramaniya Swamy Temple, Tiruchendur. <a href="${routeUrl}" target="_blank" rel="noreferrer">Open route in Maps</a>.`
        );
        button.disabled = false;
        button.textContent = "Refresh Location";
      },
      (error) => {
        const message =
          error.code === error.PERMISSION_DENIED
            ? "Location permission was not allowed. You can still open the temple map manually."
            : "Could not read this device location. Try again near an open area.";
        showLocationResult(result, message);
        button.disabled = false;
        button.textContent = "Use My Location";
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  });
}

function showLocationResult(result, html) {
  result.innerHTML = html;
  result.classList.add("is-visible");
}

function distanceKm(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const deltaLat = toRad(lat2 - lat1);
  const deltaLon = toRad(lon2 - lon1);
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

document.addEventListener("click", (event) => {
  const link = event.target.closest("[data-view-link]");
  if (!link) {
    return;
  }

  const targetIndex = sections.findIndex((section) => section.id === link.dataset.viewLink);
  if (targetIndex !== -1) {
    event.preventDefault();
    setActive(targetIndex, true, true);
  }
});

posterTrack.addEventListener("click", (event) => {
  const tab = event.target.closest(".poster-tab");
  if (tab) {
    setActive(Number(tab.dataset.index), false, false);
  }
});

document.querySelector("#previousPoster").addEventListener("click", () => setActive(activeIndex - 1, false, false));
document.querySelector("#nextPoster").addEventListener("click", () => setActive(activeIndex + 1, false, false));

posterTrack.addEventListener("mouseenter", stopAuto);
posterTrack.addEventListener("mouseleave", startAuto);
posterTrack.addEventListener("focusin", stopAuto);
posterTrack.addEventListener("focusout", startAuto);

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    stopAuto();
  } else {
    startAuto();
  }
});

renderPosterTabs();
setActive(getInitialSectionIndex(), false, true);
startAuto();

window.addEventListener("hashchange", () => {
  const targetIndex = sections.findIndex((section) => section.id === window.location.hash.replace("#", ""));
  if (targetIndex !== -1) {
    setActive(targetIndex, true, true);
  }
});










function hideSplashScreen() {
  const splash = document.querySelector("#splashScreen");
  if (!splash) {
    return;
  }
  window.setTimeout(() => splash.classList.add("is-hidden"), 900);
}

window.addEventListener("load", hideSplashScreen);
window.setTimeout(hideSplashScreen, 2400);




