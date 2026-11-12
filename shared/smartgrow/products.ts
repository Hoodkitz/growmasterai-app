/**
 * Zubehör- und Dünger-Empfehlungen von Grow-Marken (Recherche: agy, geprüft). Links sind Amazon-Suchen,
 * Preise grobe Richtwerte. Keine Samen, keine Konsumartikel.
 */
export type GrowProduct = {
  category: string;
  name: string;
  purpose: string;
  searchTerm: string;
  brand: string;
  priceRange: string;
  /** geprüfte Amazon-Produktnummer -> direkter Produktlink */
  asin?: string;
};

export const GROW_PRODUCTS: GrowProduct[] = [
  {
    category: "Dünger Erde",
    name: "BioBizz Indoor Try-Pack (Bio-Grow, Bio-Bloom, Top-Max)",
    purpose:
      "Organisches Grunddünger-Set für die Wachstums- und Blütephase auf Erde, das das Bodenleben aktiviert und das Aroma fördert.",
    searchTerm: "BioBizz Indoor Pack Dünger Set 3x250ml",
    brand: "BioBizz",
    priceRange: "ca. 13–18 €",
  },
  {
    category: "Dünger Erde",
    name: "Canna Terra Vega & Terra Flores",
    purpose:
      "Mineralischer Komplettdünger speziell für vorgedüngte und nährstoffarme Erden zur direkten Nährstoffaufnahme in Wuchs und Blüte.",
    searchTerm: "Canna Terra Vega Terra Flores 1L Set",
    brand: "Canna",
    priceRange: "ca. 24–32 €",
  },
  {
    category: "Dünger Erde",
    name: "Plagron Alga Grow & Alga Bloom",
    purpose:
      "Auf Meeresalgen basierender organischer Grunddünger für den Erdanbau, der gesunde Pflanzen und kompakte Blüten unterstützt.",
    searchTerm: "Plagron Alga Grow Alga Bloom 1L",
    brand: "Plagron",
    priceRange: "ca. 25–35 €",
  },
  {
    category: "Dünger Coco/Hydro",
    name: "Canna Coco A & B",
    purpose:
      "Zweikomponenten-Mineraldünger mit optimal abgestimmten Huminsäuren und Fulvinsäuren für den Anbau auf Kokossubstraten.",
    searchTerm: "Canna Coco A und B 2x1L",
    brand: "Canna",
    priceRange: "ca. 22–29 €",
  },
  {
    category: "Dünger Coco/Hydro",
    name: "Advanced Nutrients pH Perfect Sensi Coco Grow & Bloom",
    purpose:
      "Hochpräziser Zweikomponenten-Dünger für Kokos und Hydroponik, der den pH-Wert der Nährlösung automatisch im Idealbereich stabilisiert.",
    searchTerm: "Advanced Nutrients pH Perfect Sensi Coco A+B 1L",
    brand: "Advanced Nutrients",
    priceRange: "ca. 35–48 €",
  },
  {
    category: "Dünger Coco/Hydro",
    name: "Athena Pro Line Core, Grow & Bloom",
    purpose:
      "Vollständig wasserlöslicher Salz-Mineraldünger für professionelle Hydro- und Bewässerungssysteme ohne Sedimentbildung.",
    searchTerm: "Athena Pro Line Grow Bloom Core",
    brand: "Athena",
    priceRange: "ca. 65–95 €",
  },
  {
    category: "Cal-Mag",
    name: "BioBizz CalMag",
    purpose:
      "Organisch zertifiziertes Calcium-Magnesium-Präparat zum Ausgleich von weichem Leitungswasser und erhöhtem Bedarf unter LED-Beleuchtung.",
    searchTerm: "BioBizz CalMag 1L",
    brand: "BioBizz",
    priceRange: "ca. 14–20 €",
  },
  {
    category: "Cal-Mag",
    name: "Canna CalMag Agent",
    purpose:
      "Konzentrierter Zusatz zur Anhebung des EC-Grundwerts von weichem Wasser und zur Vorbeugung von Calcium- und Magnesiummangel.",
    searchTerm: "Canna CalMag Agent 1L",
    brand: "Canna",
    priceRange: "ca. 16–23 €",
  },
  {
    category: "Cal-Mag",
    name: "Advanced Nutrients Sensi Cal-Mag Xtra",
    purpose:
      "Ergänzungsdünger mit chelatisiertem Calcium, Magnesium, Eisen und Aminosäuren zur schnellen Behebung von Mangelerscheinungen.",
    searchTerm: "Advanced Nutrients Sensi Cal Mag Xtra 1L",
    brand: "Advanced Nutrients",
    priceRange: "ca. 24–32 €",
  },
  {
    category: "pH-Regulatoren",
    name: "BioBizz Bio pH- & Bio pH+",
    purpose:
      "Organische pH-Korrektoren auf Zitronensäure- bzw. Huminsäurebasis, die das mikrobielle Bodenleben im Gießwasser nicht schädigen.",
    searchTerm: "BioBizz Bio pH Minus Plus 500ml",
    brand: "BioBizz",
    priceRange: "ca. 10–16 €",
  },
  {
    category: "pH-Regulatoren",
    name: "Canna pH- Pro Wuchs / Blüte",
    purpose:
      "Auf Salpetersäure bzw. Phosphorsäure basierende Regulatoren zur stabilen pH-Wert-Senkung in Hydro-, Coco- und Erdsystemen.",
    searchTerm: "Canna pH Minus 1L",
    brand: "Canna",
    priceRange: "ca. 12–18 €",
  },
  {
    category: "pH-Regulatoren",
    name: "Plagron Lemon Kick & Calcium Kick",
    purpose:
      "Biologischer pH-Senker und Bodenkalk-Regulator zur natürlichen Einstellung des Säuregehalts in Wasser und Substrat.",
    searchTerm: "Plagron Lemon Kick 500ml",
    brand: "Plagron",
    priceRange: "ca. 10–15 €",
  },
  {
    category: "Wurzelstimulator",
    name: "Canna Rhizotonic",
    purpose:
      "Kraftvoller, algenbasierter Wurzelstimulator für explosionsartiges Wurzelwachstum bei Stecklingen und nach dem Umtopfen.",
    searchTerm: "Canna Rhizotonic 1L",
    brand: "Canna",
    priceRange: "ca. 35–45 €",
  },
  {
    category: "Wurzelstimulator",
    name: "BioBizz Root-Juice",
    purpose:
      "Rein pflanzlicher Wurzelbooster aus Huminsäuren und Meeresalgen für eine kräftige Wurzelzone im biologischen Anbau.",
    searchTerm: "BioBizz Root Juice 500ml",
    brand: "BioBizz",
    priceRange: "ca. 18–26 €",
  },
  {
    category: "Wurzelstimulator",
    name: "Plagron Power Roots",
    purpose:
      "Organischer Wurzelstimulator zur Förderung verzweigter Feinwurzeln und höherer Widerstandskraft in den ersten Lebenswochen.",
    searchTerm: "Plagron Power Roots 500ml",
    brand: "Plagron",
    priceRange: "ca. 20–28 €",
  },
  {
    category: "Wurzelstimulator",
    name: "Root!t First Feed & Rooting Gel",
    purpose:
      "Speziell für Stecklinge und Keimlinge abgestimmte Bewurzelungshilfe für schnelles Anwachsen in Anzuchtwürfeln.",
    searchTerm: "Root!t Rooting Gel First Feed",
    brand: "Root!t",
    priceRange: "ca. 10–16 €",
  },
  {
    category: "pH-Messgerät",
    name: "Bluelab pH Pen",
    purpose:
      "Wasserdichtes Premium-pH-Handmessgerät mit Doppel-Referenzelektrode und Temperaturkompensation für präzise Nährlösungskontrolle.",
    searchTerm: "Bluelab pH Pen Messgerät",
    brand: "Bluelab",
    priceRange: "ca. 95–125 €",
  },
  {
    category: "pH-Messgerät",
    name: "Apera Instruments PH20 / PH60",
    purpose:
      "Zuverlässiges digitales pH-Taschenmessgerät mit hoher Genauigkeit und wechselbarer Sonde (PH60) für den täglichen Gießeinsatz.",
    searchTerm: "Apera Instruments PH20 pH Messgerät",
    brand: "Apera",
    priceRange: "ca. 50–85 €",
  },
  {
    category: "pH-Messgerät",
    name: "Milwaukee pH600 / pH55 Pro",
    purpose:
      "Robustes Einsteiger- und Fortgeschrittenen-Messgerät zur schnellen Überprüfung des Säuregrads im Gießwasser.",
    searchTerm: "Milwaukee pH55 Pro pH Messgerät",
    brand: "Milwaukee",
    priceRange: "ca. 35–65 €",
  },
  {
    category: "EC-Messgerät",
    name: "Bluelab Truncheon Nutrient Meter",
    purpose:
      "Legendärer, nahezu unverwüstlicher EC-Messstab mit LED-Skala, der ohne Kalibrierung den Salzgehalt beim Umrühren anzeigt.",
    searchTerm: "Bluelab Truncheon EC Messstab",
    brand: "Bluelab",
    priceRange: "ca. 105–135 €",
  },
  {
    category: "EC-Messgerät",
    name: "Apera Instruments EC20 / EC60",
    purpose:
      "Präzises Leitfähigkeitsmessgerät mit Platin-Elektrode zur exakten Bestimmung der Düngerkonzentration im Gießwasser.",
    searchTerm: "Apera Instruments EC20 EC Messgerät",
    brand: "Apera",
    priceRange: "ca. 50–80 €",
  },
  {
    category: "EC-Messgerät",
    name: "Hanna Instruments HI98304 DiST 4",
    purpose:
      "Kompakter EC-Tester in Laborqualität mit automatischer Temperaturkompensation für Hydroponik und Düngerlösungen.",
    searchTerm: "Hanna Instruments HI98304 EC Messgerät",
    brand: "Hanna",
    priceRange: "ca. 60–80 €",
  },
  {
    category: "Kombi-Messgerät",
    name: "Apera Instruments PC60 (pH/EC/TDS/Salinität/Temp)",
    purpose:
      "Multifunktions-Taschenmessgerät zur gleichzeitigen Messung von pH-Wert, Leitfähigkeit und Temperatur mit austauschbarer Sonde.",
    searchTerm: "Apera Instruments PC60 Multi Parameter",
    brand: "Apera",
    priceRange: "ca. 135–160 €",
  },
  {
    category: "Kombi-Messgerät",
    name: "Bluelab Combo Meter / Guardian Monitor",
    purpose:
      "Professionelles Messsystem mit separaten pH- und EC/Temperatur-Sonden für mobile oder kontinuierliche Tanküberwachung.",
    searchTerm: "Bluelab Combo Meter pH EC Temperatur",
    brand: "Bluelab",
    priceRange: "ca. 230–320 €",
  },
  {
    category: "Kombi-Messgerät",
    name: "Hanna Instruments HI98129 / HI98130 GroLine",
    purpose:
      "Wasserdichter Kombi-Tester speziell für Gärtner zur schnellen Kontrolle von pH, EC/TDS und Wassertemperatur in einem Gerät.",
    searchTerm: "Hanna Instruments GroLine pH EC Kombi",
    brand: "Hanna",
    priceRange: "ca. 165–210 €",
  },
  {
    category: "Thermo-Hygrometer/Datenlogger",
    name: "Inkbird IBS-TH2 / IBS-TH3 Bluetooth/WiFi Thermo-Hygrometer",
    purpose:
      "Smarter Klimadatenlogger mit App-Anbindung und VPD-Diagrammen zur lückenlosen Überwachung von Temperatur und Luftfeuchte im Zelt.",
    searchTerm: "Inkbird IBS-TH2 Plus Bluetooth Thermometer Hygrometer",
    brand: "Inkbird",
    priceRange: "ca. 20–35 €",
  },
  {
    category: "Thermo-Hygrometer/Datenlogger",
    name: "Garden Highpro Prohygro Medium / Premium (mit Fernfühler)",
    purpose:
      "Digitales Min/Max-Thermo-Hygrometer mit externer Kabelsonde zum Ablesen der Klimawerte auf Pflanzenspitzenhöhe von außen.",
    searchTerm: "Garden Highpro Prohygro Thermometer Hygrometer Sonde",
    brand: "Garden Highpro",
    priceRange: "ca. 12–18 €",
  },
  {
    category: "Thermo-Hygrometer/Datenlogger",
    name: "AC Infinity Terrabloom / Cloudcom Thermo-Hygrometer",
    purpose:
      "Präzises Klimamessgerät mit großem Display, VPD-Anzeige und Hintergrundbeleuchtung für das schnelle Kontrollieren im Growraum.",
    searchTerm: "AC Infinity Thermometer Hygrometer VPD",
    brand: "AC Infinity",
    priceRange: "ca. 20–35 €",
  },
  {
    category: "CO2-Sensor",
    name: "Inkbird IAM-T1 / PTH-9C CO2-Monitor (NDIR)",
    purpose:
      "Präziser NDIR-CO2-Datenlogger mit Temperatur- und Luftfeuchtigkeitsanzeige zur Kontrolle des Kohlendioxidgehalts im Anbauraum.",
    searchTerm: "Inkbird CO2 Messgerät IAM-T1 NDIR",
    brand: "Inkbird",
    priceRange: "ca. 50–85 €",
  },
  {
    category: "CO2-Sensor",
    name: "Inkbird ICC-500T Digitaler CO2-Controller",
    purpose:
      "Steckerfertiger CO2-Regler mit separater NDIR-Sensoreinheit zum automatischen Schalten von CO2-Ventilen oder Abluftanlagen.",
    searchTerm: "Inkbird ICC-500T CO2 Controller",
    brand: "Inkbird",
    priceRange: "ca. 110–145 €",
  },
  {
    category: "CO2-Sensor",
    name: "Trolmaster MBS-S8 CO2-Sensor für Hydro-X",
    purpose:
      "Professionelles NDIR-Sensormodul zur Integration in das Trolmaster Klimasteuerungssystem für exakte CO2-Begasung.",
    searchTerm: "Trolmaster MBS-S8 CO2 Sensor",
    brand: "Trolmaster",
    priceRange: "ca. 170–220 €",
  },
  {
    category: "Abluft-Set mit Aktivkohlefilter",
    name: "AC Infinity Cloudline Pro T4 / T6 Komplettset mit AKF",
    purpose:
      "Extrem leises EC-Abluftsystem inklusive australischem Aktivkohlefilter, Flexschlauch und Smart-Controller für geruchsfreien Betrieb.",
    searchTerm: "AC Infinity Cloudline Pro T6 Abluft Set Aktivkohlefilter",
    brand: "AC Infinity",
    priceRange: "ca. 220–340 €",
  },
  {
    category: "Abluft-Set mit Aktivkohlefilter",
    name: "Prima Klima PK125-TC / EC-TC mit Eco Line Aktivkohlefilter",
    purpose:
      "Bewährter Rohrventilator mit integrierter Temperatur- und Drehzahlregelung kombiniert mit einem langlebigen Prima Klima Aktivkohlefilter.",
    searchTerm: "Prima Klima PK125 TC Abluftset Aktivkohlefilter",
    brand: "Prima Klima",
    priceRange: "ca. 140–230 €",
  },
  {
    category: "Abluft-Set mit Aktivkohlefilter",
    name: 'Mars Hydro / Spider Farmer 4" / 6" Inline Fan Combo mit AKF',
    purpose:
      "Komplettes Lüftungsset mit drehzahlgeregeltem Rohrventilator und Aktivkohlefilter zur zuverlässigen Wärme- und Geruchsabfuhr.",
    searchTerm: "Spider Farmer 6 Inch Inline Fan Aktivkohlefilter Set",
    brand: "Spider Farmer",
    priceRange: "ca. 130–200 €",
  },
  {
    category: "Umluftventilator",
    name: "AC Infinity Cloudray S6 Gen 2 Oszillierender Clip-Ventilator",
    purpose:
      "Speziell für Growzelte entwickelter EC-Clipventilator mit 10 Stufen, automatischer Oszillation und natürlichem Windmodus gegen Schimmelbildung.",
    searchTerm: "AC Infinity Cloudray S6 Clip Ventilator",
    brand: "AC Infinity",
    priceRange: "ca. 60–80 €",
  },
  {
    category: "Umluftventilator",
    name: "Secret Jardin Monkey Fan 16W / 20W Oszillierend",
    purpose:
      "Praktischer Klemmventilator zur direkten Montage an Zeltstangen (16–21 mm) für gleichmäßige Luftzirkulation im Blätterdach.",
    searchTerm: "Secret Jardin Monkey Fan 20W oszillierend",
    brand: "Secret Jardin",
    priceRange: "ca. 25–38 €",
  },
  {
    category: "Umluftventilator",
    name: "Garden Highpro Profan Clipfan 5W / 12W",
    purpose:
      "Sparsamer und leiser Magnetmotor-Clipventilator für kleine bis mittlere Growboxen zur Stärkung der Pflanzenstängel.",
    searchTerm: "Garden Highpro Profan Clipventilator",
    brand: "Garden Highpro",
    priceRange: "ca. 15–25 €",
  },
  {
    category: "LED-Lampe 100–300 W",
    name: "Spider Farmer SF1000 / SE3000 EVO (100–300 W)",
    purpose:
      "Vollspektrum-LED mit hocheffizienten Samsung-Dioden für gleichmäßige Ausleuchtung von 60x60 cm bis 100x100 cm Anbaufläche.",
    searchTerm: "Spider Farmer SE3000 300W LED Grow Lampe",
    brand: "Spider Farmer",
    priceRange: "ca. 110–290 €",
  },
  {
    category: "LED-Lampe 100–300 W",
    name: "Mars Hydro TS 1000 (150 W) / FC-E 3000 (300 W)",
    purpose:
      "Dimmbares LED-Growlight mit hoher Photonenausbeute (PPFD) für kompaktes Wachstum und dichte Blüten auf kleiner bis mittlerer Fläche.",
    searchTerm: "Mars Hydro FC-E 3000 300W LED Grow Light",
    brand: "Mars Hydro",
    priceRange: "ca. 115–270 €",
  },
  {
    category: "LED-Lampe 100–300 W",
    name: "Lumatek ATS 200W Pro / ATS 300W Pro",
    purpose:
      "Passiv gekühlte Premium-LED für quadratische Growzelte (80x80 bis 100x100 cm) mit homogener Lichtverteilung und langer Lebensdauer.",
    searchTerm: "Lumatek ATS 300W Pro LED",
    brand: "Lumatek",
    priceRange: "ca. 260–390 €",
  },
  {
    category: "LED-Lampe 400–700 W",
    name: "Lumatek Zeus 465W Pro 2.9 / Zeus 600W Pro 2.9",
    purpose:
      "Hochleistungs-Bar-LED der Oberklasse mit bis zu 2,9 µmol/J Effizienz für maximale Ausleuchtung von 120x120 cm bis 150x150 cm Zelten.",
    searchTerm: "Lumatek Zeus 600W Pro 2.9 LED",
    brand: "Lumatek",
    priceRange: "ca. 550–850 €",
  },
  {
    category: "LED-Lampe 400–700 W",
    name: "Spider Farmer SE5000 (480 W) / SE7000 (730 W)",
    purpose:
      "Leistungsstarke Streifen-LED für große Growzelte mit abnehmbarem Treiber und exzellenter Tiefenwirkung bis in untere Blütenbereiche.",
    searchTerm: "Spider Farmer SE5000 480W LED Grow Light",
    brand: "Spider Farmer",
    priceRange: "ca. 380–620 €",
  },
  {
    category: "LED-Lampe 400–700 W",
    name: "Mars Hydro FC 4800 (480 W) / FC 6500 EVO (730 W)",
    purpose:
      "Professionelles Bar-LED-System mit Samsung LM301H EVO Chips und Smart-App-Steuerung für höchste Erträge auf 120x120 cm und mehr.",
    searchTerm: "Mars Hydro FC 4800 EVO LED Grow Lampe",
    brand: "Mars Hydro",
    priceRange: "ca. 370–590 €",
  },
  {
    category: "Growzelt 60x60/80x80/120x120",
    name: "AC Infinity Cloudlab 722 (60x60) / 733 (90x90) / 844 (120x120)",
    purpose:
      "Extrem stabiles Premium-Growzelt mit 2000D Mylar-Gewebe, 22 mm Stahlstangen und integrierten Montageplatten für Controller.",
    searchTerm: "AC Infinity Cloudlab Growzelt 120x120",
    brand: "AC Infinity",
    priceRange: "ca. 120–240 €",
  },
  {
    category: "Growzelt 60x60/80x80/120x120",
    name: "Secret Jardin Dark Room / Hydro Shoot (60x60, 80x80, 120x120)",
    purpose:
      "Lichtdichte Pflanzzelte mit hochreflektierender Mylar-Innenbeschichtung und wasserdichtem Einlegeboden für alle gängigen Raumgrößen.",
    searchTerm: "Secret Jardin Hydro Shoot 80x80 Growbox",
    brand: "Secret Jardin",
    priceRange: "ca. 65–180 €",
  },
  {
    category: "Growzelt 60x60/80x80/120x120",
    name: "Mars Hydro / Spider Farmer Grow Tent 60x60 / 80x80 / 120x120 cm",
    purpose:
      "Robuste Growbox mit 1680D Oxford-Stoff, stabilen Metall-Eckverbindern und Sichtfenster zur Kontrolle ohne Klimaverlust.",
    searchTerm: "Mars Hydro Growzelt 80x80x160 cm 1680D",
    brand: "Mars Hydro",
    priceRange: "ca. 75–165 €",
  },
  {
    category: "Bewässerungs-/Autopot-System",
    name: "AutoPot 1Pot / Easy2Grow Komplettsystem (4x 15L / 8,5L mit 47L Tank)",
    purpose:
      "Stromloses, schwerkraftbasiertes Bewässerungssystem mit AQUAvalve5-Ventil, das Pflanzen bedarfsgerecht von unten versorgt.",
    searchTerm: "AutoPot 4 Pot System 15L mit 47L Tank",
    brand: "AutoPot",
    priceRange: "ca. 115–165 €",
  },
  {
    category: "Bewässerungs-/Autopot-System",
    name: "AC Infinity Selbstbewässernde Stofftopf-Basen (4er-Pack)",
    purpose:
      "Kapillares Docht-Untersetzersystem für Stofftöpfe bis 19 Liter zur automatischen Wasser- und Nährstoffversorgung über mehrere Tage.",
    searchTerm: "AC Infinity Self-Watering Fabric Pot Base 4-Pack",
    brand: "AC Infinity",
    priceRange: "ca. 65–85 €",
  },
  {
    category: "Bewässerungs-/Autopot-System",
    name: "Spider Farmer Automatisches Tropfbewässerungssystem / Self-Watering System",
    purpose:
      "Komplettes Tropf- bzw. Schwerkraftbewässerungsset mit Falt-Wassertank zur zuverlässigen Urlaubs- und Alltagsbewässerung im Zelt.",
    searchTerm: "Spider Farmer Drip Irrigation Kit Bewässerungssystem",
    brand: "Spider Farmer",
    priceRange: "ca. 55–110 €",
  },
  {
    category: "Dosierpumpe/Peristaltik",
    name: "Bluelab PeriPod M3 / L3 & pH Controller Dosierpumpe",
    purpose:
      "Hochpräzise Schlauchpumpe zur vollautomatischen Nachdosierung von pH-Regulatoren und Mehrkomponenten-Düngern im Nährstofftank.",
    searchTerm: "Bluelab PeriPod Dosierpumpe",
    brand: "Bluelab",
    priceRange: "ca. 350–550 €",
  },
  {
    category: "Dosierpumpe/Peristaltik",
    name: "Milwaukee MP810 Peristaltische Dosierpumpe",
    purpose:
      "Kompakte Schlauchdosierpumpe zur Kombination mit pH- oder EC-Controllern für konstante Wasserwerte in Hydroponik-Anlagen.",
    searchTerm: "Milwaukee MP810 Dosierpumpe",
    brand: "Milwaukee",
    priceRange: "ca. 95–130 €",
  },
  {
    category: "Dosierpumpe/Peristaltik",
    name: "AC Infinity Peristaltische Dosierpumpe",
    purpose:
      "Programmierbare UIS-kompatible Peristaltikpumpe zur exakten Milliliter-Dosierung von Flüssigdüngern und pH-Korrektoren.",
    searchTerm: "AC Infinity Peristaltic Dosing Pump",
    brand: "AC Infinity",
    priceRange: "ca. 70–110 €",
  },
  {
    category: "Luftbefeuchter/Entfeuchter",
    name: "AC Infinity Cloudforge T3 / T7 Pflanzen-Luftbefeuchter mit VPD-Steuerung",
    purpose:
      "Spezieller Grow-Luftbefeuchter mit externem Sensor und Verlängerungsschlauch zur exakten Feuchtigkeits- und VPD-Regelung in der Wachstumsphase.",
    searchTerm: "AC Infinity Cloudforge T3 Luftbefeuchter",
    brand: "AC Infinity",
    priceRange: "ca. 65–135 €",
  },
  {
    category: "Luftbefeuchter/Entfeuchter",
    name: "Spider Farmer Luftentfeuchter / Luftbefeuchter mit Hygrostat-Steuerung",
    purpose:
      "Leistungsstarker Entfeuchter mit Ablaufschlauch und Zielwert-Automatik zum Schutz vor Blütenfäule in der späten Blütephase.",
    searchTerm: "Spider Farmer Dehumidifier Luftentfeuchter Grow",
    brand: "Spider Farmer",
    priceRange: "ca. 160–260 €",
  },
  {
    category: "Luftbefeuchter/Entfeuchter",
    name: "Inkbird IHC-200 WiFi Hygrostat + Ultraschall-Luftbefeuchter",
    purpose:
      "Steckdosen-Feuchtigkeitsregler mit präzisem Sensor zum automatischen Ein- und Ausschalten von Be- und Entfeuchtern im Growraum.",
    searchTerm: "Inkbird IHC-200 WiFi Luftfeuchtigkeitsregler",
    brand: "Inkbird",
    priceRange: "ca. 40–55 €",
  },
  {
    category: "Lupe/Juwelierlupe für Trichome",
    name: "Carson MicroBrite Plus 60x–120x LED-Taschenmikroskop",
    purpose:
      "Kompaktes Auflichtmikroskop mit heller LED-Beleuchtung zur glasklaren Bestimmung des Reifegrads der Trichome (klar, milchig, bernsteinfarben).",
    searchTerm: "Carson MicroBrite Plus 60x-120x LED Taschenmikroskop",
    brand: "Carson",
    priceRange: "ca. 15–22 €",
  },
  {
    category: "Lupe/Juwelierlupe für Trichome",
    name: "Garden Highpro Lumagny LED-Mikroskop 60x–100x",
    purpose:
      "Handliches Grow-Taschenmikroskop zur schnellen Erntezeitpunkt-Kontrolle und Früherkennung von Schädlingen auf Blättern.",
    searchTerm: "Garden Highpro Lumagny Mikroskop 60x-100x",
    brand: "Garden Highpro",
    priceRange: "ca. 12–18 €",
  },
  {
    category: "Lupe/Juwelierlupe für Trichome",
    name: "AC Infinity Juwelierlupe 30x & 60x mit Dual-LED",
    purpose:
      "Zusammenklappbare Präzisionslupe aus Aluminium mit zwei Vergrößerungsstufen und integriertem LED-Licht für die Trichom-Inspektion.",
    searchTerm: "Juwelierlupe 30x 60x LED Trichome",
    brand: "AC Infinity",
    priceRange: "ca. 12–20 €",
  },
  {
    category: "Trocknungsnetz",
    name: "AC Infinity Hängendes Trocknungsnetz (4/6 Etagen, Ø 60 cm)",
    purpose:
      "Atmungsaktives Mehrkammer-Trockennetz mit Reißverschlüssen und Tragetasche zur schonenden und gleichmäßigen Erntetrocknung direkt im Growzelt.",
    searchTerm: "AC Infinity Drying Rack Trocknungsnetz 60cm",
    brand: "AC Infinity",
    priceRange: "ca. 25–40 €",
  },
  {
    category: "Trocknungsnetz",
    name: "Garden Highpro Prodry Trocknungsnetz (4/6 Etagen, Ø 55/75 cm)",
    purpose:
      "Faltbares Hängenetz mit Klickverschlüssen zur platzsparenden Lufttrocknung von Blüten bei optimaler Rundum-Luftzirkulation.",
    searchTerm: "Garden Highpro Prodry Trockennetz",
    brand: "Garden Highpro",
    priceRange: "ca. 18–32 €",
  },
  {
    category: "Trocknungsnetz",
    name: "Secret Jardin DryIt 45 / DryIt 90 Trocknungsnetz",
    purpose:
      "Modulares Trockennetz in verschiedenen Durchmessern für kleine und große Zelte mit erhöhtem Rand gegen Herausfallen des Ernteguts.",
    searchTerm: "Secret Jardin DryIt Trocknungsnetz",
    brand: "Secret Jardin",
    priceRange: "ca. 16–35 €",
  },
  {
    category: "Curing-Gläser/Feuchtigkeits-Packs (Boveda/Integra)",
    name: "Boveda 62% / 58% Zwei-Wege-Feuchtigkeitsregulierung (Größe 8 / 67)",
    purpose:
      "Patentierte Salzlösungs-Packs, die die relative Luftfeuchtigkeit im Curing-Glas konstant auf 58 % oder 62 % halten und Terpene schützen.",
    searchTerm: "Boveda 62 Prozent Size 8 10er Pack",
    brand: "Boveda",
    priceRange: "ca. 14–25 €",
  },
  {
    category: "Curing-Gläser/Feuchtigkeits-Packs (Boveda/Integra)",
    name: "Integra Boost 62% / 55% 2-Wege-Feuchtigkeitspacks mit Indikatorkarte",
    purpose:
      "Salzfreie Feuchtigkeitsregulatoren inklusive praktischer Farbindikatorkarte für die sichere Fermentierung und Langzeitlagerung.",
    searchTerm: "Integra Boost 62% 8g Feuchtigkeitsregler",
    brand: "Integra",
    priceRange: "ca. 12–22 €",
  },
  {
    category: "Curing-Gläser/Feuchtigkeits-Packs (Boveda/Integra)",
    name: "Violettglas (Miron) / Luftdichte Curing-Gläser mit Mini-Hygrometer",
    purpose:
      "UV-geschützte bzw. luftdicht verschließbare Aufbewahrungsgläser für den kontrollierten Chlorophyll-Abbau während der Reifung (Curing).",
    searchTerm: "Miron Violettglas Aufbewahrungsglas Curing Hygrometer",
    brand: "Miron",
    priceRange: "ca. 18–35 €",
  },
  {
    category: "Gelbtafeln",
    name: "Neudorff Gelb-Sticker / Gelbtafeln gegen Trauermücken",
    purpose:
      "Insektizidfreie Klebefallen zum frühzeitigen Erkennen und Abfangen von erwachsenen Trauermücken und geflügelten Blattläusen.",
    searchTerm: "Neudorff Gelb-Sticker Gelbtafeln Trauermücken",
    brand: "Neudorff",
    priceRange: "ca. 6–12 €",
  },
  {
    category: "Gelbtafeln",
    name: "COMPO Gelb-Sticker / Biologische Klebefallen",
    purpose:
      "Geruchlose und wasserfeste Leimtafeln zum Einstecken in Pflanztöpfe für das Schädlingsmonitoring im Indoor-Garten.",
    searchTerm: "COMPO Gelb-Sticker Klebefallen Trauermücken",
    brand: "COMPO",
    priceRange: "ca. 6–11 €",
  },
  {
    category: "Gelbtafeln",
    name: "Schacht / Aeroxon Gelbtafeln & Blautafeln Kombi-Set",
    purpose:
      "Doppelseitig beleimte Farbtafeln zur gleichzeitigen Bekämpfung und Überwachung von Trauermücken (Gelb) und Thripsen (Blau).",
    searchTerm: "Gelbtafeln Blautafeln Set Trauermücken Thripse",
    brand: "Schacht",
    priceRange: "ca. 8–15 €",
  },
  {
    category: "Neemöl/Nützlinge",
    name: "Plagron Mighty Neem / Kaltgepresstes Neemöl mit Emulgator",
    purpose:
      "Pflanzliches Schutzkonzentrat zur Blatt- und Gießanwendung, das die Fraß- und Fortpflanzungsaktivität von Spinnmilben, Thripsen und Trauermücken stoppt.",
    searchTerm: "Neemöl mit Emulgator kaltgepresst Pflanzen",
    brand: "Plagron",
    priceRange: "ca. 14–22 €",
  },
  {
    category: "Neemöl/Nützlinge",
    name: "Nemabest / Steinernema feltiae SF-Nematoden gegen Trauermücken",
    purpose:
      "Mikroskopisch kleine Nützlinge zum Eingießen ins Substrat, die Trauermückenlarven im Boden biologisch und rückstandsfrei abtöten.",
    searchTerm: "SF Nematoden Steinernema feltiae Trauermücken",
    brand: "Nemabest",
    priceRange: "ca. 12–20 €",
  },
  {
    category: "Neemöl/Nützlinge",
    name: "BioBizz Leaf-Coat",
    purpose:
      "Gebrauchsfertiges, organisches Blattspray aus natürlichem Latex, das eine atmungsaktive Schutzschicht gegen Schädlinge und Mehltau bildet.",
    searchTerm: "BioBizz Leaf Coat 500ml",
    brand: "BioBizz",
    priceRange: "ca. 13–19 €",
  },
  {
    category: "Smart-Controller (AC Infinity Controller 69, Trolmaster)",
    name: "AC Infinity Controller 69 Pro / Controller 69 Pro+",
    purpose:
      "Smarter 4- bzw. 8-Port-Klimacontroller mit WiFi/Bluetooth-App zur automatischen Steuerung von Lüftung, Licht und Luftfeuchte nach Temperatur und VPD.",
    searchTerm: "AC Infinity Controller 69 Pro WiFi",
    brand: "AC Infinity",
    priceRange: "ca. 100–170 €",
  },
  {
    category: "Smart-Controller (AC Infinity Controller 69, Trolmaster)",
    name: "Trolmaster Hydro-X (HCS-1 / HCS-2) Umwelt-Controller-System",
    purpose:
      "Modulares Profi-Steuerungssystem für die zentrale Automatisierung von LED-Beleuchtung, Temperatur, Luftfeuchtigkeit, CO2 und Bewässerung.",
    searchTerm: "Trolmaster Hydro-X HCS-1 Controller",
    brand: "Trolmaster",
    priceRange: "ca. 450–650 €",
  },
  {
    category: "Smart-Controller (AC Infinity Controller 69, Trolmaster)",
    name: "Spider Farmer GGS Smart Controller Kit",
    purpose:
      "App-gesteuerter Klimaregler mit präzisen Sensoren zur automatisierten Zeit-, Temperatur- und VPD-Steuerung von Lampen und Lüftern.",
    searchTerm: "Spider Farmer GGS Controller Kit Smart Grow",
    brand: "Spider Farmer",
    priceRange: "ca. 95–145 €",
  },
];

export const PRODUCT_CATEGORIES: string[] = [
  ...new Set(GROW_PRODUCTS.map((p) => p.category)),
];
