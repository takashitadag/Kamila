import { XMLParser } from "fast-xml-parser";

function toArray(value){
  if(!value) return [];
  return Array.isArray(value) ? value : [value];
}

function clean(value){
  if(value === undefined || value === null) return "";

  if(typeof value === "object"){
    if(value["#text"]) return String(value["#text"]).trim();
    if(value.text) return String(value.text).trim();
  }

  return String(value).trim();
}

function getCodebookValue(value){
  return clean(value);
}

function getPhotos(item){
  const photos = toArray(item?.fotky?.fotka);

  return photos
    .map(photo => {
      if(typeof photo === "string") return photo;

      return clean(
        photo?.url ||
        photo?.URL ||
        photo
      );
    })
    .filter(Boolean);
}

function getMainPhoto(item){
  const photos = toArray(item?.fotky?.fotka);

  const main = photos.find(photo => {
    return clean(photo?.hlavni).toLowerCase() === "ano";
  });

  if(main){
    return clean(main.url || main.URL || main);
  }

  const allPhotos = getPhotos(item);
  return allPhotos[0] || "";
}

function formatPrice(cena){
  if(!cena) return "Cena u makléře";

  const note = clean(cena.poznamka);
  const amount = clean(cena.castka);
  const unit = clean(cena.jednotka);

  if(!amount && note) return note;
  if(!amount) return "Cena u makléře";

  const number = Number(amount);
  const formatted = Number.isNaN(number)
    ? amount
    : number.toLocaleString("cs-CZ");

  return unit
    ? `${formatted} Kč / ${unit}`
    : `${formatted} Kč`;
}

function mapXmlProperty(item){
  const adresa = item.adresa || {};
  const cena = item.cena || {};

  const city = clean(adresa.obec_nazev);
  const street = clean(adresa.ulice_nazev);

  return {
    id: clean(item.id_nabidka),
    externalUrl: clean(item.url),

    title: clean(item.nadpis_nemovitosti),
    description: clean(item.popis_nemovitosti),
    longDescription: clean(item.popis_nemovitosti),

    price: formatPrice(cena),

    city,
    street,
    district: clean(adresa.okres_nazev),
    region: clean(adresa.kraj_nazev),

    estateType: getCodebookValue(item.typ_nemovitosti),
    type: getCodebookValue(item.typ_nabidky),

    usableArea: clean(item.usable_area || item.floor_area || item.total_area),
    plotArea: clean(item.plot_area),
    floor: clean(item.floor_number),
    condition: getCodebookValue(item.building_condition),
    energyClass: getCodebookValue(item.energy_efficiency_rating),

    image: getMainPhoto(item),
    gallery: getPhotos(item),

    source: "poski"
  };
}

const fallbackData = [
  {
    id: "test-1",
    title: "Testovací nabídka",
    description: "Toto je pouze testovací nabídka. Po vložení XML feedu se zde zobrazí reálné nemovitosti z Poski.",
    longDescription: "Tato položka slouží pouze pro otestování webu. Jakmile bude ve Vercelu vložena skutečná hodnota POSKI_XML_URL, API začne automaticky načítat reálná data a fotografie přímo z exportu.",
    price: "Cena u makléře",
    city: "Olomouc",
    street: "",
    district: "Olomouc",
    region: "Olomoucký kraj",
    estateType: "Byt",
    type: "Pronájem",
    usableArea: "—",
    plotArea: "—",
    floor: "—",
    condition: "—",
    energyClass: "—",
    image: "",
    gallery: [],
    source: "fallback"
  }
];

export default async function handler(req, res){
  const FEED_URL = process.env.POSKI_XML_URL;
  const { id } = req.query;

  try{
    if(FEED_URL && !FEED_URL.includes("example.com")){
      const response = await fetch(FEED_URL);

      if(!response.ok){
        throw new Error(`Feed vrátil status ${response.status}`);
      }

      const xml = await response.text();

      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "",
        trimValues: true
      });

      const data = parser.parse(xml);

      const errors = toArray(data?.export?.chyba);

      if(errors.length){
        return res.status(500).json({
          error: true,
          source: "poski",
          message: "Poski export vrátil chybu.",
          details: errors.map(clean)
        });
      }

      const rawProperties = toArray(data?.export?.nabidky?.nabidka);

      const properties = rawProperties
        .map(mapXmlProperty)
        .filter(item => item.id && item.title);

      if(id){
        const detail = properties.find(item => String(item.id) === String(id));

        if(!detail){
          return res.status(404).json({
            error: true,
            message: "Nemovitost nebyla nalezena."
          });
        }

        return res.status(200).json(detail);
      }

      return res.status(200).json(properties);
    }

    if(id){
      const detail = fallbackData.find(item => String(item.id) === String(id));

      if(!detail){
        return res.status(404).json({
          error: true,
          message: "Testovací nemovitost nebyla nalezena."
        });
      }

      return res.status(200).json(detail);
    }

    return res.status(200).json(fallbackData);

  }catch(error){
    return res.status(200).json({
      error: true,
      source: "fallback",
      message: "XML feed zatím není dostupný. Web je technicky připravený na Poski export.",
      detail: error.message,
      items: fallbackData
    });
  }
}
