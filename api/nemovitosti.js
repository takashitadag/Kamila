import { XMLParser } from "fast-xml-parser";

function toArray(value){
  if(!value) return [];
  return Array.isArray(value) ? value : [value];
}

function clean(value){
  if(value === undefined || value === null) return "";
  if(typeof value === "object" && value["#text"]){
    return String(value["#text"]).trim();
  }
  return String(value).trim();
}

export default async function handler(req, res){

  const FEED_URL = process.env.POSKI_XML_URL;

  try{

    // ====== POKUS O XML IMPORT ======

    if(FEED_URL){

      const response = await fetch(FEED_URL);

      if(response.ok){

        const xml = await response.text();

        const parser = new XMLParser({
          ignoreAttributes:false,
          attributeNamePrefix:""
        });

        const data = parser.parse(xml);

        const nabidky =
          toArray(data?.export?.nabidky?.nabidka);

        const result = nabidky.map(item => {

          const cena = item.cena || {};
          const adresa = item.adresa || {};

          const fotky = toArray(
            item?.fotky?.fotka
          );

          const hlavniFotka =
            fotky.find(f => clean(f.hlavni) === "ano")
            || fotky[0];

          return {

            id: clean(item.id_nabidka),

            title:
              clean(item.nadpis_nemovitosti),

            description:
              clean(item.popis_nemovitosti),

            price:
              clean(cena.castka),

            priceNote:
              clean(cena.poznamka),

            city:
              clean(adresa.obec_nazev),

            district:
              clean(adresa.okres_nazev),

            street:
              clean(adresa.ulice_nazev),

            type:
              clean(item.typ_nabidky),

            estateType:
              clean(item.typ_nemovitosti),

            image:
              hlavniFotka?.url
                || hlavniFotka
                || "",

            url:
              clean(item.url)
          };

        });

        return res.status(200).json(result);

      }

    }

    // ====== FALLBACK DATA ======

    return res.status(200).json([

      {
        id:"29967",
        title:"Pronájem útulného bytu 2+kk",
        description:"Přízemní nezařízený byt vhodný pro jednotlivce nebo pár.",
        price:"14000",
        city:"Olomouc",
        district:"Olomouc",
        street:"Kpt. Nálepky",
        type:"Pronájem",
        estateType:"Byt",
        image:"/images/IMG_1006.png",
        url:"#"
      },

      {
        id:"30001",
        title:"Stylový byt 3+1",
        description:"Byt s lodžií a garáží.",
        price:"17200",
        city:"Šternberk",
        district:"Olomouc",
        street:"Dolní Žleb",
        type:"Pronájem",
        estateType:"Byt",
        image:"/images/IMG_1007.png",
        url:"#"
      },

      {
        id:"30002",
        title:"Komerční prostory",
        description:"Reprezentativní kanceláře v centru.",
        price:"150000",
        city:"Olomouc",
        district:"Olomouc",
        street:"Centrum",
        type:"Pronájem",
        estateType:"Komerce",
        image:"/images/IMG_1008.jpeg",
        url:"#"
      }

    ]);

  }catch(error){

    return res.status(200).json([
      {
        error:true,
        message:"Fallback režim aktivní"
      }
    ]);

  }

}
