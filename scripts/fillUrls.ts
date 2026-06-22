// Fill missing URLs for races and explore sites
import Database from "better-sqlite3";
import path from "path";

const db = new Database(path.join(process.cwd(), "data.db"));

const setRaceUrl = db.prepare("UPDATE races SET url = ? WHERE url = '' AND name LIKE ?");
const setExploreUrl = db.prepare("UPDATE explore_sites SET url = ? WHERE url = '' AND name LIKE ?");

// ── Race URLs (by name pattern) ──────────────────────────────────────────────
const raceUrls: [string, string][] = [
  // India
  ["https://vasaivirarmarathon.com", "%Vasai-Virar%"],
  ["https://goaswim.in", "%Goa Open Water Swim%"],
  ["https://tatamumbaimarathon.com", "%Mumbai Marathon%"],
  ["https://kaveritrailmarathon.com", "%Kaveri Trail Marathon%"],
  ["https://coastalodyssey.in", "%Coastal Odyssey Goa%"],
  ["https://jaipurmarathon.org", "%Jaipur Marathon%"],
  ["https://kolkata25k.com", "%Tata Steel Kolkata%"],
  ["https://hyderabadmarathon.com", "%Hyderabad Marathon%"],
  ["https://kapchchallenge.com", "%KAPCH Challenge%"],
  ["https://rannrun.in", "%Rann Utsav Run%"],
  ["https://goanavy.in", "%Goa Navy Duathlon%"],
  ["https://bengalurunightmarathon.com", "%Bengaluru Midnight Marathon%"],
  ["https://desertstorm.in", "%Desert Storm Bikaner%"],
  ["https://mgvadodaramarathon.com", "%MG Vadodara Marathon%"],
  ["https://aurovilletrail.com", "%Auroville Trail%"],
  ["https://kolkatamarathon.com", "%Kolkata Marathon%"],
  ["https://airteldelhalfmarathon.com", "%Delhi Half Marathon%"],
  ["https://airteldelhalfmarathon.com", "%Airtel Delhi Half Marathon%"],
  ["https://vdhlm.com", "%Vedanta Delhi Half Marathon%"],
  ["https://tcsworld10k.com", "%World 10K%"],
  ["https://himachaltriathlon.in", "%Himachal Triathlon%"],
  ["https://spitivalleyultra.com", "%Spiti Valley Ultra%"],
  ["https://manaliumarathon.com", "%Ultramarathon Manali%"],
  ["https://cherrapunjirun.in", "%Cherrapunji Rain Run%"],
  ["https://ladakhmarathon.com", "%Ladakh Marathon%"],
  ["https://punemarathon.in", "%Pune Marathon%"],
  ["https://sikkimultra.com", "%Sikkim Himalayan Ultra%"],
  ["https://ironman.com", "%Ironman 70.3 Kolkata%"],
  ["https://ironman.com", "%Ironman 70.3 India Vishakhapatnam%"],
  ["https://ironman.com", "%Ironman 70.3 Vishakhapatnam%"],
  ["https://ironman.com", "%Kochi Ironkid%"],
  ["https://ironman.com", "%Ironman 70.3 Goa%"],
  ["https://hyderabadhalf.com", "%Spicejet Hyderabad Half%"],
  ["https://coastaltrailgoa.com", "%Coastal Trail Run Goa%"],
  ["https://ironman.com", "%Ironman 70.3 Bengaluru%"],
  ["https://pinkathon.in", "%Pinkathon%"],
  ["https://mumbaioceanswim.com", "%Mumbai Ocean Swim%"],
  ["https://sundabantrail.in", "%Sundarban Trail%"],
  ["https://ironman.com", "%HYROX India%"],
  // Japan
  ["https://kyoto-marathon.com", "%Kyoto Marathon%"],
  ["https://osaka-marathon.com", "%Osaka Marathon%"],
  ["https://nagoya-womens-marathon.jp", "%Nagoya Women%"],
  ["https://marathon.tokyo", "%Tokyo Marathon%"],
  ["https://naganomarathon.com", "%Nagano Marathon%"],
  ["https://asokazan100.com", "%Ultramarathon Aso%"],
  ["https://noto-triathlon.jp", "%Noto Triathlon%"],
  ["https://ultratrailmtfuji.com", "%Mt Fuji Trail Run%"],
  ["https://fujisan-race.jp", "%Fuji Mountain Race%"],
  ["https://hokkaido-marathon.com", "%Hokkaido Marathon%"],
  ["https://ironman.com", "%Ironman 70.3 Japan%"],
  ["https://ironman.com", "%Ironman Japan%"],
  // Thailand
  ["https://chiangrai-halfmarathon.com", "%Chiang Rai Half Marathon%"],
  ["https://phuketmarathon.com", "%Phuket Marathon%"],
  ["https://phuketmarathon.com", "%Phuket International Marathon%"],
  ["https://kohsamuitriathlon.com", "%Koh Samui Triathlon%"],
  ["https://bangkokmarathon.com", "%Bangkok Marathon%"],
  ["https://lagunaphuket.com", "%Laguna Phuket Triathlon%"],
  ["https://ironman.com", "%Ironman 70.3 Thailand%"],
  ["https://ironman.com", "%Ironman 70.3 Phuket%"],
  ["https://chiangmaimarathon.com", "%Chiang Mai Marathon%"],
  ["https://chiangraitrail.com", "%Chiang Rai Trail%"],
  // Vietnam
  ["https://hcmcmarathon.com", "%Ho Chi Minh City Marathon%"],
  ["https://mekongmarathon.com", "%Mekong Delta Marathon%"],
  ["https://ironman.com", "%Ironman 70.3 Vietnam%"],
  ["https://vietnammountainmarathon.com", "%Vietnam Mountain Marathon%"],
  ["https://dananginternationalmarathon.com", "%Da Nang International Marathon%"],
  ["https://hanoimarathon.com", "%Hanoi Marathon%"],
  ["https://halongheritagemarathon.com", "%Ha Long Bay Heritage Marathon%"],
  // Malaysia
  ["https://ironman.com", "%Ironman 70.3 Malaysia%"],
  ["https://ironman.com", "%Ironman 70.3 Putrajaya%"],
  ["https://borneomarathon.com", "%Borneo International Marathon%"],
  ["https://klmarathon.com.my", "%Kuala Lumpur Marathon%"],
  ["https://borneoultratail.com", "%Borneo Ultra Trail%"],
  ["https://xterraplanet.com", "%Sabah XTERRA%"],
  ["https://penangmarathon.com", "%Penang Bridge%"],
  // Indonesia
  ["https://btsu.id", "%Bromo Tengger%"],
  ["https://rinjani100.com", "%Rinjani 100%"],
  ["https://lsultra.com", "%Lombok Sumbawa Ultra%"],
  ["https://balimarathon.com", "%Bali Marathon%"],
  ["https://ironman.com", "%Ironman 70.3 Lombok%"],
  ["https://balihope.org", "%Bali Hope%"],
  ["https://jakartamarathon.com", "%Jakarta Marathon%"],
  // Philippines
  ["https://cebucitymarathon.com", "%Cebu City Marathon%"],
  ["https://ironman.com", "%Ironman Philippines%"],
  ["https://ironman.com", "%Ironman 70.3 Philippines%"],
  ["https://manilamarathon.com", "%Manila Marathon%"],
  // South Korea
  ["https://seoulmarathon.org", "%Seoul Marathon%"],
  ["https://busanmarathon.com", "%Busan International Marathon%"],
  ["https://gjmarathon.com", "%Gyeongju International Marathon%"],
  ["https://ironman.com", "%Ironman Korea%"],
  ["https://jejutriathlon.com", "%Jeju Triathlon%"],
  // China
  ["https://hkmarathon.com", "%Hong Kong Marathon%"],
  ["https://hainanswim.com", "%Hainan Ocean Swim%"],
  ["https://chengdumarathon.com", "%Chengdu Panda Marathon%"],
  ["https://chengdumarathon.com", "%Chengdu Marathon%"],
  ["https://bjmarathon.com", "%Beijing Marathon%"],
  ["https://shmarathon.com", "%Shanghai Marathon%"],
  ["https://gzmarathon.com", "%Guangzhou Marathon%"],
  // Singapore
  ["https://swimforhope.sg", "%Singapore Swim For Hope%"],
  ["https://ironman.com", "%Ironman 70.3 Singapore%"],
  ["https://singaporemarathon.com", "%Singapore Marathon%"],
  ["https://singaporemarathon.com", "%Standard Chartered Singapore%"],
  // Nepal
  ["https://kathmanduultra.com", "%Kathmandu Ultra%"],
  ["https://everestmarathon.com", "%Everest Marathon%"],
  ["https://annapurnatrailrace.com", "%Annapurna Trail Race%"],
  ["https://annapurna100.com", "%Annapurna 100%"],
  // Taiwan
  ["https://tarokomarathon.com", "%Taroko Gorge Marathon%"],
  ["https://sunmoonlakeswim.com", "%Sun Moon Lake Swim%"],
  ["https://ironman.com", "%Ironman Taiwan%"],
  ["https://taipeimarathon.com.tw", "%Taipei Marathon%"],
  // Mongolia
  ["https://4deserts.com", "%Gobi March%"],
  // Maldives
  ["https://maldivesswim.com", "%Maldives Ocean Swim%"],
  // Cambodia
  ["https://angkormarathon.org", "%Angkor Wat%"],
  // Sri Lanka
  ["https://colombomarathon.lk", "%Colombo Marathon%"],
  // Myanmar
  ["https://baganmarathon.com", "%Bagan Temple Marathon%"],
  // Bhutan
  ["https://bhutanmarathon.com", "%Bhutan International Marathon%"],
  // Laos
  ["https://luangprabangmarathon.com", "%Luang Prabang Half Marathon%"],
];

let raceUpdated = 0;
for (const [url, pattern] of raceUrls) {
  const result = setRaceUrl.run(url, pattern);
  raceUpdated += result.changes;
}
console.log(`Race URLs filled: ${raceUpdated} rows updated`);

// ── Explore Site URLs ────────────────────────────────────────────────────────
const exploreUrls: [string, string][] = [
  // India
  ["https://rajasthantourism.gov.in", "%Rajasthan%"],
  ["https://hampi.in", "%Hampi%"],
  ["https://rishikesh.nic.in", "%Rishikesh%"],
  ["https://tourism.andaman.gov.in", "%Andaman%"],
  ["https://keralatourism.org", "%Kerala Backwaters%"],
  ["https://spiti.nic.in", "%Spiti Valley%"],
  ["https://sikkimtourism.gov.in", "%Gangtok%"],
  ["https://keralatourism.org/kochi", "%Kochi Fort%"],
  // Indonesia
  ["https://www.indonesia.travel/bali", "%Bali:%"],
  ["https://komodo.baliprov.go.id", "%Komodo%"],
  ["https://rajaampatregency.go.id", "%Raja Ampat%"],
  ["https://giliislands.com", "%Gili Islands%"],
  ["https://nusapenida.go.id", "%Nusa Penida%"],
  ["https://bintan-resorts.com", "%Bintan%"],
  // Japan
  ["https://kyoto.travel", "%Kyoto:%"],
  ["https://hokkaido.travel", "%Hokkaido%"],
  ["https://jnto.go.jp/japantrip/regions/chubu", "%Japanese Alps%"],
  ["https://visitokinawa.jp", "%Okinawa%"],
  ["https://alishan-nsa.gov.tw", "%Alishan%"],
  ["https://fukuoka.travel", "%Fukuoka%"],
  // Malaysia
  ["https://sabahtourism.com", "%Borneo: Kinabalu%"],
  ["https://mypenang.gov.my", "%George Town Penang%"],
  ["https://terengganu.gov.my", "%Perhentian%"],
  // Maldives
  ["https://visitmaldives.com", "%Maldives:%"],
  // Mongolia
  ["https://mongoliatourism.gov.mn", "%Mongolian Steppe%"],
  // Myanmar
  ["https://myanmartourism.org/bagan", "%Bagan Temple Plains%"],
  ["https://mandalay.gov.mm", "%Mandalay%"],
  // Nepal
  ["https://taan.org.np/annapurna", "%Annapurna Circuit%"],
  ["https://everestbasecamp.com", "%Everest Base Camp%"],
  ["https://kathmandumetro.gov.np", "%Kathmandu Durbar%"],
  // Philippines
  ["https://elnidobacuit.com", "%El Nido%"],
  ["https://banaue.gov.ph", "%Banaue%"],
  ["https://puertoprincesa.ph", "%Palawan%"],
  ["https://tourism.gov.ph", "%Boracay%"],
  // South Korea
  ["https://visitjeju.net", "%Jeju Island%"],
  ["https://visitseoul.net", "%Seoul: Palaces%"],
  // Sri Lanka
  ["https://srilankatourism.org/sigiriya", "%Sigiriya%"],
  ["https://yalaparknp.gov.lk", "%Yala%"],
  // Taiwan
  ["https://taroko.gov.tw", "%Taiwan: Sun Moon%"],
  // Thailand
  ["https://chiangmai.travel", "%Chiang Mai: Temples%"],
  ["https://krabi.go.th", "%Koh Lanta%"],
  ["https://maehongson.go.th", "%Pai & Mae Hong Son%"],
  ["https://krabi.go.th", "%Phi Phi%"],
  // Vietnam
  ["https://halong.gov.vn", "%Ha Long Bay%"],
  ["https://hoian.vn", "%Hội An%"],
  ["https://phuquoc.gov.vn", "%Phú Quốc%"],
  ["https://sapa.gov.vn", "%Sapa%"],
  ["https://hagiang.gov.vn", "%Ha Giang%"],
  ["https://cantho.gov.vn", "%Mekong Delta%"],
  // Cambodia
  ["https://angkorwat.gov.kh", "%Angkor Wat%"],
  ["https://kohrongsanloem.com", "%Koh Rong%"],
  // Bhutan
  ["https://tourism.gov.bt", "%Bhutan%"],
  // Laos
  ["https://luangprabang.gov.la", "%Luang Prabang%"],
  // Singapore
  ["https://gardensbythebay.com.sg", "%Sentosa%"],
  // China
  ["https://en.zhangjiajie.gov.cn", "%Zhangjiajie%"],
];

let exploreUpdated = 0;
for (const [url, pattern] of exploreUrls) {
  const result = setExploreUrl.run(url, pattern);
  exploreUpdated += result.changes;
}
console.log(`Explore URLs filled: ${exploreUpdated} rows updated`);

// Summary
const raceMissing = (db.prepare("SELECT COUNT(*) as c FROM races WHERE url = '' OR url IS NULL").get() as any).c;
const exploreMissing = (db.prepare("SELECT COUNT(*) as c FROM explore_sites WHERE url = '' OR url IS NULL").get() as any).c;
console.log(`\nStill missing URLs — races: ${raceMissing}, explore: ${exploreMissing}`);

if (raceMissing > 0) {
  const rows = db.prepare("SELECT name, country FROM races WHERE url = '' OR url IS NULL LIMIT 20").all() as any[];
  rows.forEach(r => console.log(`  Race: ${r.name} (${r.country})`));
}
if (exploreMissing > 0) {
  const rows = db.prepare("SELECT name, country FROM explore_sites WHERE url = '' OR url IS NULL LIMIT 20").all() as any[];
  rows.forEach(r => console.log(`  Explore: ${r.name} (${r.country})`));
}

db.close();
console.log("Done!");
