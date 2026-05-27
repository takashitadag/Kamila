export default async function handler(req, res){

  const nemovitosti = [

    {
      id: "29967",
      title: "Pronájem útulného bytu 2+kk",
      description: "Přízemní nezařízený byt vhodný pro jednotlivce nebo pár.",
      longDescription: "Moderní útulný byt 2+kk v klidné části Olomouce. Nemovitost nabízí příjemné bydlení s dobrou dostupností do centra města.",
      price: "14 000 Kč / měsíc",
      city: "Olomouc",
      street: "Kpt. Nálepky",
      district: "Olomouc",
      estateType: "Byt",
      type: "Pronájem",
      usableArea: "48 m²",
      floor: "Přízemí",
      condition: "Velmi dobrý",
      energyClass: "C",
      image: "/images/IMG_1006.png",
      gallery: [
        "/images/IMG_1006.png",
        "/images/IMG_1007.png",
        "/images/IMG_1010.png"
      ]
    },

    {
      id: "30001",
      title: "Stylový byt 3+1",
      description: "Byt s lodžií a garáží.",
      longDescription: "Prostorný byt vhodný pro rodinu. Součástí je lodžie, sklep a garážové stání.",
      price: "17 200 Kč / měsíc",
      city: "Šternberk",
      street: "Dolní Žleb",
      district: "Olomouc",
      estateType: "Byt",
      type: "Pronájem",
      usableArea: "76 m²",
      floor: "2. patro",
      condition: "Po rekonstrukci",
      energyClass: "D",
      image: "/images/IMG_1007.png",
      gallery: [
        "/images/IMG_1007.png",
        "/images/IMG_1006.png"
      ]
    },

    {
      id: "30002",
      title: "Komerční prostory",
      description: "Reprezentativní kanceláře v centru.",
      longDescription: "Exkluzivní komerční prostory vhodné pro kanceláře nebo showroom v centru Olomouce.",
      price: "150 000 Kč / měsíc",
      city: "Olomouc",
      street: "Centrum",
      district: "Olomouc",
      estateType: "Komerce",
      type: "Pronájem",
      usableArea: "320 m²",
      floor: "1. NP",
      condition: "Luxusní",
      energyClass: "B",
      image: "/images/IMG_1008.jpeg",
      gallery: [
        "/images/IMG_1008.jpeg",
        "/images/IMG_1013.png"
      ]
    },

    {
      id: "30003",
      title: "Pronájem RD 4+kk",
      description: "Rodinný dům s pozemkem a garáží.",
      longDescription: "Moderní rodinný dům s prostornou zahradou a garáží v klidné lokalitě.",
      price: "24 000 Kč / měsíc",
      city: "Moravičany",
      street: "",
      district: "Šumperk",
      estateType: "Dům",
      type: "Pronájem",
      usableArea: "183 m²",
      floor: "Patrový dům",
      condition: "Novostavba",
      energyClass: "B",
      image: "/images/IMG_1009.png",
      gallery: [
        "/images/IMG_1009.png",
        "/images/IMG_1014.png"
      ]
    },

    {
      id: "30004",
      title: "Byt 2+1 po rekonstrukci",
      description: "Moderní byt po rekonstrukci v oblíbené části města.",
      longDescription: "Světlý zrekonstruovaný byt s moderní kuchyní a výbornou občanskou vybaveností.",
      price: "16 000 Kč / měsíc",
      city: "Olomouc",
      street: "Neředín",
      district: "Olomouc",
      estateType: "Byt",
      type: "Pronájem",
      usableArea: "63 m²",
      floor: "3. patro",
      condition: "Po rekonstrukci",
      energyClass: "C",
      image: "/images/IMG_1010.png",
      gallery: [
        "/images/IMG_1010.png",
        "/images/IMG_1007.png"
      ]
    },

    {
      id: "30005",
      title: "Pozemek pro bydlení",
      description: "Rovinatý pozemek vhodný pro bydlení nebo investici.",
      longDescription: "Stavební pozemek v krásné lokalitě Podolí u Bouzova vhodný pro rodinný dům.",
      price: "580 Kč / m²",
      city: "Podolí u Bouzova",
      street: "",
      district: "Olomouc",
      estateType: "Pozemek",
      type: "Prodej",
      usableArea: "1240 m²",
      floor: "-",
      condition: "Stavební",
      energyClass: "-",
      image: "/images/IMG_1014.png",
      gallery: [
        "/images/IMG_1014.png",
        "/images/IMG_1013.png"
      ]
    }

  ];

  const { id } = req.query;

  if(id){
    const detail = nemovitosti.find(item => item.id === id);

    if(!detail){
      return res.status(404).json({
        error: "Nemovitost nebyla nalezena"
      });
    }

    return res.status(200).json(detail);
  }

  return res.status(200).json(nemovitosti);
}
