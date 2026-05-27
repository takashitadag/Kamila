import { XMLParser } from "fast-xml-parser";

function toArray(value){
  if(!value) return [];
  return Array.isArray(value) ? value : [value];
}

function clean(value){
  if(value === undefined || value === null) return "";
  if(typeof value === "object" && value["#text"]) return String(value["#text"]).trim();
  return String(value).trim();
}

function getCodebookValue(value){
  if(!value) return { text: "", key: "" };

  if(typeof value === "object"){
    return {
      text: clean(value["#text"] || value.value || ""),
      key: clean(value.klic || "")
    };
  }

  return {
    text: clean(value),
    key: ""
  };
}

function boolValue(value){
  const v = clean(value).toLowerCase();
  return v === "ano" || v === "true" || v === "1";
}

function formatPrice(price){
  if(!price) return "Cena u makléře";

  const amount = clean(price.castka);
  const note = clean(price.poznamka);
  const currency = getCodebookValue(price.mena).text || "CZK";
  const unit = getCodebookValue(price.jednotka).text;

  if(!amount && note) return note;
  if(!amount) return "Cena u makléře";

  const formatted = Number(amount).toLocaleString("cs-CZ");

  if(unit){
    return `${formatted} ${currency} / ${unit}`;
  }

  return `${formatted} ${currency}`;
}

function getPhotos(item){
  const photos = toArray(item.fotky?.fotka);

  const mapped = photos
    .map(photo => {
      if(typeof photo === "string"){
        return {
          url: photo,
          main: false,
          order: 999,
          description: ""
        };
      }

      return {
        url: clean(photo.url || photo["#text"]),
        main: boolValue(photo.hlavni),
        order: Number(clean(photo.poradi)) || 999,
        description: clean(photo.popis)
      };
    })
    .filter(photo => photo.url)
    .sort((a,b) => a.order - b.order);

  return mapped;
}

export default async function handler(req, res){
  try{
    const XML_URL = process.env.POSKI_XML_URL;

    if(!XML_URL){
      return res.status(500).json({
        error: "Chybí POSKI_XML_URL. Vlož XML adresu do Environment Variables na Vercelu."
      });
    }

    const response = await fetch(XML_URL);

    if(!response.ok){
      return res.status(500).json({
        error: "Nepodařilo se načíst XML feed z Poski.",
        status: response.status
      });
    }

    const xml = await response.text();

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "",
      textNodeName: "#text"
    });

    const parsed = parser.parse(xml);
    const exportData = parsed.export || {};

    if(exportData.chyba){
      return res.status(500).json({
        error: "XML export vrátil chybu.",
        detail: exportData.chyba
      });
    }

    const rawOffers = toArray(exportData.nabidky?.nabidka);

    const offers = rawOffers.map(item => {
      const photos = getPhotos(item);
      const mainPhoto = photos.find(photo => photo.main) || photos[0];

      const propertyType = getCodebookValue(item.typ_nemovitosti);
      const offerType = getCodebookValue(item.typ_nabidky);
      const status = getCodebookValue(item.stav);
      const energy = getCodebookValue(item.energy_efficiency_rating);

      const address = item.adresa || {};
      const fullAddress = item["adresa-uplna"] || {};

      return {
        id: clean(item.id_nabidka),
        branchId: clean(item.id_pobocka),
        brokerId: clean(item.id_makler),

        title: clean(item.nadpis_nemovitosti),
        description: clean(item.popis_nemovitosti),
        evidenceNumber: clean(item.cislo_nabidky),
        url: clean(item.url),

        propertyType: propertyType.text,
        propertyTypeKey: propertyType.key,

        offerType: offerType.text,
        offerTypeKey: offerType.key,

        status: status.text,
        statusKey: status.key,

        isReserved: boolValue(item.rezervovano),
        isExclusive: boolValue(item.exkluzivni_nabidka),

        price: formatPrice(item.cena),
        priceRaw: clean(item.cena?.castka),
        priceNote: clean(item.cena?.poznamka),
        priceCurrency: getCodebookValue(item.cena?.mena).text || "CZK",
        priceUnit: getCodebookValue(item.cena?.jednotka).text,

        city: clean(address.obec_nazev),
        street: clean(address.ulice_nazev),
        district: clean(address.okres_nazev),
        region: clean(address.kraj_nazev),
        zip: clean(address.psc),
        gpsLat: clean(address.gps_lat),
        gpsLng: clean(address.gps_lng),

        fullAddress: {
          city: clean(fullAddress.obec_nazev),
          street: clean(fullAddress.ulice_nazev),
          houseNumber: clean(fullAddress.cisdom),
          orientationNumber: clean(fullAddress.cisor),
          zip: clean(fullAddress.psc)
        },

        flatKind: getCodebookValue(item.flat_kind).text,
        houseKind: getCodebookValue(item.house_kind).text,
        estateKind: getCodebookValue(item.estate_kind).text,
        officeKind: getCodebookValue(item.office_kind).text,

        ownership: getCodebookValue(item.ownership).text,
        buildingType: getCodebookValue(item.building_type).text,
        buildingCondition: getCodebookValue(item.building_condition).text,
        objectLocation: getCodebookValue(item.object_location).text,

        usableArea: clean(item.usable_area),
        buildingArea: clean(item.building_area),
        plotArea: clean(item.plot_area),
        totalArea: clean(item.total_area),
        floorArea: clean(item.floor_area),
        floorNumber: clean(item.floor_number),
        floors: clean(item.floors),

        balconyArea: clean(item.balcony_area),
        balconyCount: clean(item.balcony_count),
        loggieArea: clean(item.loggie_area),
        loggieCount: clean(item.loggie_count),
        terraceArea: clean(item.terrace_area),
        terraceCount: clean(item.terrace_count),
        garageArea: clean(item.garage_area),
        garageCount: clean(item.garage_count),
        cellarArea: clean(item.cellar_area),
        cellarCount: clean(item.cellar_count),

        energy: energy.text,
        energyKey: energy.key,
        costOfLiving: clean(item.cost_of_living),

        videoYoutube: clean(item.video_youtube),
        matterportUrl: clean(item.matterport_url),

        photos,
        images: photos.map(photo => photo.url),
        mainImage: mainPhoto?.url || "images/placeholder.jpg",

        created: clean(item.created),
        updated: clean(item.updated),

        reference: item.reference || null,
        errors: toArray(item.chyby?.chyba)
      };
    });

    const activeOffers = offers.filter(offer =>
      offer.statusKey === "20" ||
      offer.status.toLowerCase().includes("aktiv")
    );

    const reservedOffers = offers.filter(offer =>
      offer.statusKey === "30" ||
      offer.isReserved
    );

    const soldOffers = offers.filter(offer =>
      offer.statusKey === "40" ||
      offer.status.toLowerCase().includes("prodan")
    );

    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");

    return res.status(200).json({
      count: offers.length,
      activeCount: activeOffers.length,
      reservedCount: reservedOffers.length,
      soldCount: soldOffers.length,
      offers,
      activeOffers,
      reservedOffers,
      soldOffers
    });

  }catch(error){
    return res.status(500).json({
      error: "Chyba při zpracování XML feedu.",
      detail: error.message
    });
  }
}
