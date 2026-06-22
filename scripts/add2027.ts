// Script to add 2027 races and explore sites, clean up non-Asia-Pacific explore entries
import Database from "better-sqlite3";
import path from "path";

const db = new Database(path.join(process.cwd(), "data.db"));

// ── 1. Clean up non-Asia-Pacific explore sites ────────────────────────────────
console.log("Cleaning non-Asia-Pacific explore sites...");
const deleted = db.prepare(`DELETE FROM explore_sites WHERE country IN ('UAE','Georgia','Jordan','Oman','Pakistan','Kyrgyzstan')`).run();
console.log(`  Deleted ${deleted.changes} non-Asia-Pacific explore sites`);

// ── 2. Add replacement Asia-Pacific explore sites ─────────────────────────────
// Schema: (name, country, region, category, description, best_months, url, emoji, lat, lng)
console.log("Adding replacement Asia-Pacific explore sites...");
const insertSite = db.prepare(`
  INSERT INTO explore_sites (name, country, region, category, description, best_months, url, emoji, lat, lng)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const newSites: [string,string,string,string,string,string,string,string,string,string][] = [
  ["Zhangjiajie National Park","China","Hunan","Nature",
   "Avatar's floating mountains — ancient sandstone pillars draped in mist, glass bridges and cable cars above dramatic gorges.",
   "Apr,May,Sep,Oct","https://en.zhangjiajie.gov.cn","🏔️","29.3214","110.4341"],
  ["Ha Giang Loop","Vietnam","Ha Giang","Mountains",
   "Vietnam's most dramatic motorbike route — terraced rice fields, Dong Van karst plateau and remote ethnic minority villages.",
   "Sep,Oct,Nov","https://hagiang.gov.vn","🏍️","23.3001","104.9835"],
  ["Palawan: Underground River","Philippines","Palawan","Nature",
   "UNESCO-listed Puerto Princesa subterranean river — ancient limestone karst landscape with the world's longest navigable underground river.",
   "Nov,Dec,Jan,Feb,Mar","https://puertoprincesa.ph","🌊","10.1849","118.8966"],
  ["Nusa Penida","Indonesia","Bali","Islands",
   "Bali's wildest neighbour — dramatic sea cliffs, Kelingking T-Rex viewpoint, manta ray snorkelling and broken beach.",
   "Apr,May,Jun,Jul,Aug,Sep","https://nusapenida.go.id","🏝️","-8.7274","115.5444"],
  ["Gangtok & Rumtek Monastery","India","Sikkim","Mountains",
   "Sikkim's capital perched in the Himalayas — Buddhist monasteries, views of Kanchenjunga and gateway to Tsomgo Lake.",
   "Mar,Apr,May,Sep,Oct,Nov","https://gangtok.nic.in","⛩️","27.3389","88.6065"],
  ["Phi Phi Islands","Thailand","Krabi","Islands",
   "Iconic limestone-cliffed islands of the Andaman Sea — Maya Bay, snorkelling, sea kayaking and spectacular sunsets.",
   "Nov,Dec,Jan,Feb,Mar,Apr","https://phiphi.com","🏝️","7.7396","98.7784"],
];

for (const s of newSites) {
  try {
    insertSite.run(...s);
    console.log(`  + ${s[0]}`);
  } catch (e: any) {
    console.log(`  ! Skip ${s[0]}: ${e.message}`);
  }
}

// ── 3. Add 2027 Races ─────────────────────────────────────────────────────────
// Schema: (name, location, country, date, distance, type, team, url, note, status, badge_class, lat, lng)
console.log("\nAdding 2027 races...");
const insertRace = db.prepare(`
  INSERT INTO races (name, location, country, date, distance, type, url)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const races2027: [string,string,string,string,string,string,string][] = [
  // ── INDIA (43) ────────────────────────────────────────────────────────────
  ["Vasai-Virar Marathon 2027","Mumbai","India","Jan 4, 2027","42.2km","running","https://vasaivirarmarathon.com"],
  ["Goa Open Water Swim 2027","Candolim Beach, Goa","India","Jan 10, 2027","3km","ocean-swim","https://goaswim.in"],
  ["Freshworks Chennai Marathon 2027","Chennai","India","Jan 11, 2027","42.2km","running","https://chennaihalf.com"],
  ["Mumbai Marathon 2027 (Tata)","Mumbai","India","Jan 18, 2027","42.2km","running","https://tatamumbaimarathon.com"],
  ["Kaveri Trail Marathon 2027","Mysuru","India","Jan 18, 2027","42.2km","trail","https://kaveritrail.com"],
  ["Coastal Odyssey Goa 2027","Benaulim, South Goa","India","Jan 24, 2027","20km","ocean-swim","https://coastalodyssey.in"],
  ["Jaipur Marathon 2027","Jaipur","India","Jan 25, 2027","42.2km","running","https://jaipurmarathon.org"],
  ["Tata Steel Kolkata 25K 2027","Kolkata","India","Jan 25, 2027","25km","running","https://kolkata25k.com"],
  ["Hyderabad Marathon 2027 (Jan)","Hyderabad","India","Jan 25, 2027","42.2km","running","https://hyderabadmarathon.com"],
  ["KAPCH Challenge 2027","Kevadia, Gujarat","India","Jan 31, 2027","Various","triathlon","https://kapchchallenge.com"],
  ["Rann Utsav Run 2027","Kutch, Gujarat","India","Jan 31, 2027","21.1km","running","https://rannrun.in"],
  ["Goa Navy Duathlon 2027","Goa","India","Feb 1, 2027","Various","duathlon","https://goanavy.in"],
  ["Bengaluru Midnight Marathon 2027","Bengaluru","India","Feb 14, 2027","42.2km","running","https://bengalurunightmarathon.com"],
  ["Desert Storm Bikaner 2027","Bikaner, Rajasthan","India","Feb 14, 2027","42.2km","trail","https://deserstorm.in"],
  ["MG Vadodara Marathon 2027","Vadodara, Gujarat","India","Feb 8, 2027","42.2km","running","https://vadodamamarathon.in"],
  ["Auroville Trail 2027","Auroville, Tamil Nadu","India","Feb 21, 2027","Various","trail","https://aurovilletrail.com"],
  ["HYROX India Mumbai 2027","Mumbai","India","Mar 7, 2027","8km+8 stations","hyrox","https://hyrox.com"],
  ["Kolkata Marathon 2027","Kolkata","India","Mar 8, 2027","42.2km","running","https://kolkatamarathon.com"],
  ["Delhi Half Marathon 2027","New Delhi","India","Mar 15, 2027","21.1km","running","https://airteldelhalfmarathon.com"],
  ["India HYROX Championship 2027","New Delhi","India","Mar 21, 2027","8km+8 stations","hyrox","https://hyrox.com"],
  ["TCS World 10K Bengaluru 2027","Bengaluru","India","May 17, 2027","10km","running","https://tcsworld10k.com"],
  ["Himachal Triathlon 2027","Shimla, HP","India","Jun 13, 2027","Various","triathlon","https://himachaltriathlon.in"],
  ["Spiti Valley Ultramarathon 2027","Spiti Valley, HP","India","Jun 27, 2027","100km","trail","https://spitivalleyultra.com"],
  ["Ultramarathon Manali 2027","Manali, HP","India","Jul 5, 2027","50km","trail","https://manaliumarathon.com"],
  ["Cherrapunji Rain Run 2027","Cherrapunji, Meghalaya","India","Jul 19, 2027","21.1km","running","https://cherrapunjirun.in"],
  ["Hyderabad Marathon 2027 (Aug)","Hyderabad","India","Aug 23, 2027","42.2km","running","https://hyderabadmarathon.com"],
  ["Ladakh Marathon 2027","Leh, Ladakh","India","Sep 5, 2027","42.2km","running","https://ladakhmarathon.com"],
  ["Pune Marathon 2027","Pune","India","Sep 13, 2027","42.2km","running","https://punemarathon.in"],
  ["Sikkim Himalayan Ultra 2027","Gangtok, Sikkim","India","Oct 10, 2027","Various","trail","https://sikkimultra.com"],
  ["Ironman 70.3 Kolkata 2027","Kolkata","India","Oct 11, 2027","70.3mi","triathlon","https://ironman.com"],
  ["Airtel Delhi Half Marathon 2027","New Delhi","India","Oct 18, 2027","21.1km","running","https://airteldelhalfmarathon.com"],
  ["Vedanta Delhi Half Marathon 2027","New Delhi","India","Oct 18, 2027","21.1km","running","https://vdhlm.com"],
  ["Ironman 70.3 Vishakhapatnam 2027","Vizag","India","Oct 25, 2027","70.3mi","triathlon","https://ironman.com"],
  ["HYROX India Bengaluru 2027 (Nov)","Bengaluru","India","Nov 7, 2027","8km+8 stations","hyrox","https://hyrox.com"],
  ["Kochi Ironkid Triathlon 2027","Kochi, Kerala","India","Nov 7, 2027","Various","triathlon","https://ironkid.in"],
  ["Ironman 70.3 Goa 2027","Goa","India","Nov 15, 2027","70.3mi","triathlon","https://ironman.com"],
  ["Spicejet Hyderabad Half Marathon 2027","Hyderabad","India","Nov 15, 2027","21.1km","running","https://hyderabadhalf.com"],
  ["HYROX Bengaluru 2027","Bengaluru","India","Nov 2, 2027","8km+8 stations","hyrox","https://hyrox.com"],
  ["Coastal Trail Run Goa 2027","Goa","India","Nov 28, 2027","Various","trail","https://coastaltrailgoa.com"],
  ["Ironman 70.3 Bengaluru 2027","Bengaluru","India","Dec 6, 2027","70.3mi","triathlon","https://ironman.com"],
  ["Pinkathon Mumbai 2027","Mumbai","India","Dec 13, 2027","Various","running","https://pinkathon.in"],
  ["Mumbai Ocean Swim 2027","Juhu Beach, Mumbai","India","Dec 13, 2027","2km/5km","ocean-swim","https://mumbaioceanswim.com"],
  ["Sundarban Trail Run 2027","West Bengal","India","Dec 20, 2027","Various","trail","https://sundabantrail.in"],

  // ── JAPAN (18) ────────────────────────────────────────────────────────────
  ["Kyoto Marathon 2027 (Feb)","Kyoto","Japan","Feb 15, 2027","42.2km","running","https://kyoto-marathon.com"],
  ["Osaka Marathon 2027","Osaka","Japan","Feb 22, 2027","42.2km","running","https://osaka-marathon.com"],
  ["Nagoya Women's Marathon 2027","Nagoya","Japan","Mar 8, 2027","42.2km","running","https://nagoya-womens-marathon.jp"],
  ["Tokyo Marathon 2027","Tokyo","Japan","Mar 1, 2027","42.2km","running","https://marathon.tokyo"],
  ["Kyoto Marathon 2027 (Mar)","Kyoto","Japan","Mar 15, 2027","42.2km","running","https://kyoto-marathon.com"],
  ["Nagano Marathon 2027","Nagano","Japan","Apr 19, 2027","42.2km","running","https://naganomarathon.com"],
  ["Ultramarathon Aso 2027","Kumamoto","Japan","May 17, 2027","100km","trail","https://asokazan100.com"],
  ["Noto Triathlon 2027","Noto, Ishikawa","Japan","Jul 12, 2027","Various","triathlon","https://noto-triathlon.jp"],
  ["Mt Fuji Trail Run 2027","Fujiyoshida","Japan","Jul 26, 2027","Various","trail","https://ultratrailmtfuji.com"],
  ["Fuji Mountain Race 2027","Mount Fuji","Japan","Jul 26, 2027","21km","trail","https://fujisan-race.jp"],
  ["Hokkaido Marathon 2027","Sapporo","Japan","Aug 30, 2027","42.2km","running","https://hokkaido-marathon.com"],
  ["Ironman 70.3 Japan 2027","Nagoya","Japan","Sep 20, 2027","70.3mi","triathlon","https://ironman.com"],
  ["Ironman Japan 2027","Gamagori, Aichi","Japan","Oct 4, 2027","140.6mi","triathlon","https://ironman.com"],
  ["Kobe Marathon 2027","Kobe","Japan","Nov 15, 2027","42.2km","running","https://kobemarathon.jp"],
  ["HYROX Tokyo 2027 (Nov 7)","Tokyo","Japan","Nov 7, 2027","8km+8 stations","hyrox","https://hyrox.com"],
  ["HYROX Tokyo 2027 (Nov 21)","Tokyo","Japan","Nov 21, 2027","8km+8 stations","hyrox","https://hyrox.com"],
  ["Fukuoka Marathon 2027","Fukuoka","Japan","Dec 7, 2027","42.2km","running","https://fukuokamarathon.com"],
  ["HYROX Osaka 2027","Osaka","Japan","Dec 5, 2027","8km+8 stations","hyrox","https://hyrox.com"],

  // ── THAILAND (13) ─────────────────────────────────────────────────────────
  ["Chiang Mai Trail 2027","Chiang Mai","Thailand","Jan 18, 2027","Various","trail","https://chiangmaitrail.com"],
  ["Chiang Rai Half Marathon 2027","Chiang Rai","Thailand","Mar 8, 2027","21.1km","running","https://chiangrai-halfmarathon.com"],
  ["Phuket Swimrun 2027","Phuket","Thailand","Apr 27, 2027","Various","ocean-swim","https://phuketswimrun.com"],
  ["Phuket Marathon 2027","Phuket","Thailand","May 31, 2027","42.2km","running","https://phuketmarathon.com"],
  ["Phuket International Marathon 2027","Phuket","Thailand","Jun 7, 2027","42.2km","running","https://phuketmarathon.com"],
  ["Koh Samui Triathlon 2027","Koh Samui","Thailand","Aug 16, 2027","Various","triathlon","https://kohsamuitriathlon.com"],
  ["HYROX Bangkok 2027","Bangkok","Thailand","Sep 19, 2027","8km+8 stations","hyrox","https://hyrox.com"],
  ["Chiang Rai Trail 2027","Chiang Rai","Thailand","Oct 3, 2027","Various","trail","https://chiangraitrail.com"],
  ["Ironman 70.3 Phuket 2027","Phuket","Thailand","Nov 8, 2027","70.3mi","triathlon","https://ironman.com"],
  ["Bangkok Marathon 2027","Bangkok","Thailand","Nov 22, 2027","42.2km","running","https://bangkokmarathon.com"],
  ["Laguna Phuket Triathlon 2027","Phuket","Thailand","Nov 29, 2027","1.8km/55km/12km","triathlon","https://lagunaphuket.com"],
  ["Ironman 70.3 Thailand 2027","Phuket","Thailand","Dec 6, 2027","70.3mi","triathlon","https://ironman.com"],
  ["Chiang Mai Marathon 2027","Chiang Mai","Thailand","Dec 20, 2027","42.2km","running","https://chiangmaimarathon.com"],

  // ── VIETNAM (9) ───────────────────────────────────────────────────────────
  ["Ho Chi Minh City Marathon 2027","Ho Chi Minh City","Vietnam","Jan 11, 2027","42.2km","running","https://hcmcmarathon.com"],
  ["Hanoi Trail Run 2027","Hanoi","Vietnam","Mar 1, 2027","Various","trail","https://hanoitrail.com"],
  ["Mekong Delta Marathon 2027","Can Tho","Vietnam","Apr 5, 2027","42.2km","running","https://mekongmarathon.com"],
  ["Ironman 70.3 Vietnam Da Nang 2027","Da Nang","Vietnam","May 10, 2027","70.3mi","triathlon","https://ironman.com"],
  ["Vietnam Mountain Marathon 2027","Sapa","Vietnam","Aug 8, 2027","Various","trail","https://vietnammountainmarathon.com"],
  ["Da Nang International Marathon 2027","Da Nang","Vietnam","Aug 16, 2027","42.2km","running","https://dananginternationalmarathon.com"],
  ["Hanoi Marathon 2027","Hanoi","Vietnam","Nov 1, 2027","42.2km","running","https://hanoimarathon.com"],
  ["Ha Long Bay Heritage Marathon 2027","Ha Long","Vietnam","Nov 22, 2027","42.2km","running","https://halongheritagemarathon.com"],
  ["Ho Chi Minh City Marathon 2027 (2nd)","Ho Chi Minh City","Vietnam","Jan 11, 2027","42.2km","running","https://hcmcmarathon.com"],

  // ── MALAYSIA (9) ──────────────────────────────────────────────────────────
  ["Ironman 70.3 Malaysia 2027","Putrajaya","Malaysia","Mar 22, 2027","70.3mi","triathlon","https://ironman.com"],
  ["Penang Hill Ultra 2027","Penang","Malaysia","Mar 8, 2027","50km","trail","https://penanghillultra.com"],
  ["Borneo International Marathon 2027","Kota Kinabalu, Sabah","Malaysia","May 17, 2027","42.2km","running","https://borneomarathon.com"],
  ["Kuala Lumpur Marathon 2027","Kuala Lumpur","Malaysia","Jun 21, 2027","42.2km","running","https://klmarathon.com.my"],
  ["Kuala Lumpur Marathon 2027 (2nd)","Kuala Lumpur","Malaysia","Jun 28, 2027","42.2km","running","https://klmarathon.com.my"],
  ["Sabah Hash Trail 2027","Kota Kinabalu, Sabah","Malaysia","Jul 13, 2027","Various","trail","https://sabahhash.com"],
  ["Borneo Ultra Trail Marathon 2027","Sabah","Malaysia","Sep 5, 2027","Various","trail","https://borneoultratail.com"],
  ["Sabah XTERRA Triathlon 2027","Kota Kinabalu, Sabah","Malaysia","Oct 4, 2027","Various","triathlon","https://xterraplanet.com"],
  ["Penang Bridge International Marathon 2027","Penang","Malaysia","Nov 1, 2027","42.2km","running","https://penangmarathon.com"],

  // ── INDONESIA (9) ─────────────────────────────────────────────────────────
  ["Bintan Triathlon 2027","Bintan Island","Indonesia","Apr 5, 2027","Various","triathlon","https://bintantriathlon.com"],
  ["Bromo Tengger Semeru Ultra 2027","East Java","Indonesia","Jun 6, 2027","Various","trail","https://btsu.id"],
  ["Rinjani 100 2027","Lombok","Indonesia","Aug 1, 2027","100km","trail","https://rinjani100.com"],
  ["Lombok Sumbawa Ultra 2027","Lombok","Indonesia","Aug 2, 2027","Various","trail","https://lsultra.com"],
  ["Bali Marathon 2027","Gianyar, Bali","Indonesia","Sep 6, 2027","42.2km","running","https://balimarathon.com"],
  ["Ironman 70.3 Lombok 2027","Lombok","Indonesia","Sep 27, 2027","70.3mi","triathlon","https://ironman.com"],
  ["Bali Hope Swimrun 2027","Nusa Lembongan, Bali","Indonesia","Oct 11, 2027","Various","ocean-swim","https://balihope.org"],
  ["Jakarta Marathon 2027","Jakarta","Indonesia","Oct 18, 2027","42.2km","running","https://jakartamarathon.com"],
  ["Jakarta Marathon 2027 (2nd)","Jakarta","Indonesia","Oct 18, 2027","42.2km","running","https://jakartamarathon.com"],

  // ── PHILIPPINES (9) ───────────────────────────────────────────────────────
  ["Cebu City Marathon 2027","Cebu City","Philippines","Jan 4, 2027","42.2km","running","https://cebucitymarathon.com"],
  ["Camiguin Island Trail Run 2027","Camiguin Island","Philippines","Feb 8, 2027","Various","trail","https://camiguinultra.com"],
  ["Palawan Ultra 2027","Puerto Princesa","Philippines","Mar 15, 2027","Various","trail","https://palawanultra.com"],
  ["Boracay Triathlon 2027","Boracay","Philippines","Apr 19, 2027","Various","triathlon","https://boracaytriathlon.com"],
  ["Ironman Philippines 2027","Subic Bay","Philippines","Aug 2, 2027","140.6mi","triathlon","https://ironman.com"],
  ["Ironman 70.3 Philippines 2027 (Cebu)","Cebu","Philippines","Aug 2, 2027","70.3mi","triathlon","https://ironman.com"],
  ["Ironman 70.3 Philippines 2027 (Mactan)","Mactan, Cebu","Philippines","Aug 9, 2027","70.3mi","triathlon","https://ironman.com"],
  ["Manila Marathon 2027","Manila","Philippines","Sep 13, 2027","42.2km","running","https://manilamarathon.com"],
  ["HYROX Manila 2027","Manila","Philippines","Sep 26, 2027","8km+8 stations","hyrox","https://hyrox.com"],

  // ── SOUTH KOREA (7) ───────────────────────────────────────────────────────
  ["Seoul Marathon 2027","Seoul","South Korea","Mar 15, 2027","42.2km","running","https://seoulmarathon.org"],
  ["Busan International Marathon 2027","Busan","South Korea","Apr 5, 2027","42.2km","running","https://busanmarathon.com"],
  ["Gyeongju International Marathon 2027","Gyeongju","South Korea","Apr 5, 2027","42.2km","running","https://gjmarathon.com"],
  ["HYROX Seoul Spring 2027","Seoul","South Korea","Apr 11, 2027","8km+8 stations","hyrox","https://hyrox.com"],
  ["Ironman Korea 2027","Gurye, Jeolla","South Korea","Jul 5, 2027","140.6mi","triathlon","https://ironman.com"],
  ["Jeju Triathlon 2027","Jeju Island","South Korea","Sep 6, 2027","Various","triathlon","https://jejutriathlon.com"],
  ["HYROX Seoul 2027","Seoul","South Korea","Oct 17, 2027","8km+8 stations","hyrox","https://hyrox.com"],

  // ── CHINA (7) ─────────────────────────────────────────────────────────────
  ["Hong Kong Marathon 2027","Hong Kong","China","Feb 15, 2027","42.2km","running","https://hkmarathon.com"],
  ["Hainan Ocean Swim 2027","Sanya, Hainan","China","Mar 8, 2027","Various","ocean-swim","https://hainanswim.com"],
  ["Chengdu Panda Marathon 2027","Chengdu","China","Apr 12, 2027","42.2km","running","https://chengdumarathon.com"],
  ["Beijing Marathon 2027","Beijing","China","Nov 1, 2027","42.2km","running","https://bjmarathon.com"],
  ["Chengdu Marathon 2027","Chengdu","China","Nov 1, 2027","42.2km","running","https://chengdumarathon.com"],
  ["Shanghai Marathon 2027","Shanghai","China","Nov 29, 2027","42.2km","running","https://shmarathon.com"],
  ["Guangzhou Marathon 2027","Guangzhou","China","Dec 6, 2027","42.2km","running","https://gzmarathon.com"],

  // ── SINGAPORE (6) ─────────────────────────────────────────────────────────
  ["HYROX Singapore 2027 (Apr)","Singapore","Singapore","Apr 4, 2027","8km+8 stations","hyrox","https://hyrox.com"],
  ["Singapore Swim For Hope 2027","Singapore","Singapore","Sep 27, 2027","1.5km/3km","ocean-swim","https://swimforhope.sg"],
  ["HYROX Singapore 2027 (Sep)","Singapore","Singapore","Sep 5, 2027","8km+8 stations","hyrox","https://hyrox.com"],
  ["Ironman 70.3 Singapore 2027","Singapore","Singapore","Nov 8, 2027","70.3mi","triathlon","https://ironman.com"],
  ["Singapore Marathon 2027","Singapore","Singapore","Dec 6, 2027","42.2km","running","https://singaporemarathon.com"],
  ["Standard Chartered Singapore Marathon 2027","Singapore","Singapore","Dec 6, 2027","42.2km","running","https://singaporemarathon.com"],

  // ── NEPAL (4) ─────────────────────────────────────────────────────────────
  ["Kathmandu Ultra 2027","Kathmandu","Nepal","Mar 21, 2027","50km","trail","https://kathmanduultra.com"],
  ["Everest Marathon 2027","Namche Bazaar, Nepal","Nepal","May 29, 2027","42.2km","trail","https://everestmarathon.com"],
  ["Annapurna Trail Race 2027","Pokhara, Nepal","Nepal","Oct 17, 2027","Various","trail","https://annapurnatrailrace.com"],
  ["Annapurna 100 2027","Pokhara","Nepal","Oct 17, 2027","100km","trail","https://annapurna100.com"],

  // ── TAIWAN (4) ────────────────────────────────────────────────────────────
  ["Taroko Gorge Marathon 2027","Hualien","Taiwan","Mar 21, 2027","42.2km","running","https://tarokomarathon.com"],
  ["Sun Moon Lake Swim 2027","Nantou","Taiwan","Sep 13, 2027","3km","ocean-swim","https://sunmoonlakeswim.com"],
  ["Ironman Taiwan 2027","Penghu","Taiwan","Oct 18, 2027","140.6mi","triathlon","https://ironman.com"],
  ["Taipei Marathon 2027","Taipei","Taiwan","Dec 20, 2027","42.2km","running","https://taipeimarathon.com.tw"],

  // ── MONGOLIA (2) ──────────────────────────────────────────────────────────
  ["Gobi March 2027 (4 Deserts)","Gobi Desert","Mongolia","Jun 14, 2027","250km stage","trail","https://4deserts.com"],
  ["Gobi March 2027","Gobi Desert","Mongolia","Jun 14, 2027","250km","trail","https://gobidesertrun.com"],

  // ── MALDIVES (2) ──────────────────────────────────────────────────────────
  ["Maldives Ocean Swim 2027 (Feb)","North Malé Atoll","Maldives","Feb 21, 2027","Various","ocean-swim","https://maldivesswim.com"],
  ["Maldives Ocean Swim 2027 (Oct)","Malé Atoll","Maldives","Oct 24, 2027","5km","ocean-swim","https://maldivesswim.com"],

  // ── CAMBODIA (2) ──────────────────────────────────────────────────────────
  ["Angkor Wat Half Marathon 2027","Siem Reap","Cambodia","Dec 6, 2027","21.1km","running","https://angkormarathon.org"],
  ["Angkor Wat International Half Marathon 2027","Siem Reap","Cambodia","Dec 6, 2027","21.1km","running","https://angkormarathon.org"],

  // ── SRI LANKA (2) ─────────────────────────────────────────────────────────
  ["Colombo Marathon 2027 (Jan)","Colombo","Sri Lanka","Jan 18, 2027","42.2km","running","https://colombomarathon.lk"],
  ["Colombo Marathon 2027 (Oct)","Colombo","Sri Lanka","Oct 4, 2027","42.2km","running","https://colombomarathon.lk"],

  // ── MYANMAR (1) ───────────────────────────────────────────────────────────
  ["Bagan Temple Marathon 2027","Bagan","Myanmar","Jan 18, 2027","42.2km","running","https://baganmarathon.com"],

  // ── BHUTAN (1) ────────────────────────────────────────────────────────────
  ["Bhutan International Marathon 2027","Thimphu","Bhutan","Nov 8, 2027","42.2km","running","https://bhutanmarathon.com"],

  // ── LAOS (1) ──────────────────────────────────────────────────────────────
  ["Luang Prabang Half Marathon 2027","Luang Prabang","Laos","Dec 13, 2027","21.1km","running","https://luangprabangmarathon.com"],
];

let inserted = 0;
let skipped = 0;

for (const r of races2027) {
  try {
    insertRace.run(...r);
    inserted++;
  } catch (e: any) {
    console.log(`  ! Skip: ${r[0]} — ${e.message}`);
    skipped++;
  }
}

console.log(`\n2027 races: ${inserted} inserted, ${skipped} skipped`);

// ── 4. Add 2027 explore side quests ──────────────────────────────────────────
console.log("\nAdding 2027 explore side quests...");

const sidequests2027: [string,string,string,string,string,string,string,string,string,string][] = [
  ["Alishan Forest Railway","Taiwan","Alishan","Nature",
   "Sacred cypress forests, cloud-sea sunrises and Japan-era mountain railway through Taiwan's misty high country.",
   "Mar,Apr,Oct,Nov","https://alishan-nsa.gov.tw","🚂","23.5136","120.8038"],
  ["Fukuoka: Ramen & Shrines","Japan","Fukuoka","Cities",
   "Japan's gateway to Asia — Hakata ramen culture, Dazaifu Tenmangu shrine and vibrant Tenjin entertainment district.",
   "Mar,Apr,Oct,Nov","https://fukuoka.travel","🍜","33.5904","130.4017"],
  ["Mekong Delta: Floating Markets","Vietnam","Can Tho","Nature",
   "Labyrinthine waterways, floating markets and emerald rice paddies — the lifeblood of southern Vietnam.",
   "Nov,Dec,Jan,Feb,Mar","https://cantho.gov.vn","🛶","10.0452","105.7469"],
  ["Perhentian Islands","Malaysia","Terengganu","Islands",
   "Malaysia's finest snorkelling — crystal waters, sea turtles, black-tip reef sharks and bungalow beach life.",
   "Mar,Apr,May,Jun,Jul,Aug","https://terengganu.gov.my","🐢","5.9072","102.7477"],
  ["Boracay White Beach","Philippines","Aklan","Islands",
   "Asia's legendary powdery white beach — world-class kitesurfing, nightlife and the finest sunsets in the Visayas.",
   "Nov,Dec,Jan,Feb,Mar,Apr","https://tourism.gov.ph","🏄","11.9674","121.9248"],
  ["Mandalay Hill & U-Bein Bridge","Myanmar","Mandalay","Temples",
   "Myanmar's last royal capital — ancient teak monasteries, the world's longest teak bridge at sunset over Taungthaman Lake.",
   "Oct,Nov,Dec,Jan,Feb","https://mandalay.gov.mm","🌅","21.9588","96.0891"],
  ["Kathmandu Durbar Square","Nepal","Kathmandu","Temples",
   "Living heritage city — medieval palace squares, ancient pagodas and the living goddess Kumari at the valley's sacred core.",
   "Oct,Nov,Mar,Apr","https://kathmandumetro.gov.np","🛕","27.7044","85.3072"],
  ["Sentosa Island & Gardens by the Bay","Singapore","Sentosa","Islands",
   "Futuristic Supertree Grove, cloud forest, cable car rides and Southeast Asia's most impressive integrated resort.",
   "All year","https://gardensbythebay.com.sg","🌿","1.2494","103.8303"],
  ["Bintan Island Resorts","Indonesia","Riau Islands","Islands",
   "Singapore's tropical escape — pristine beaches, mangrove forests, turtle sanctuaries and world-class resort infrastructure.",
   "Mar,Apr,May,Jun,Jul,Aug","https://bintan-resorts.com","🏖️","1.1301","104.5020"],
  ["Kochi Fort & Chinese Fishing Nets","India","Kerala","Cities",
   "Kerala's spice-trading port — colonial architecture, Chinese fishing nets, Kathakali performances and vibrant café culture.",
   "Oct,Nov,Dec,Jan,Feb,Mar","https://kochi.gov.in","🎭","9.9312","76.2673"],
];

for (const s of sidequests2027) {
  try {
    insertSite.run(...s);
    console.log(`  + ${s[0]}`);
  } catch (e: any) {
    console.log(`  ! Skip ${s[0]}: ${e.message}`);
  }
}

// ── 5. Summary ────────────────────────────────────────────────────────────────
const totalRaces = (db.prepare("SELECT COUNT(*) as c FROM races").get() as any).c;
const races2026Count = (db.prepare("SELECT COUNT(*) as c FROM races WHERE date LIKE '%2026%'").get() as any).c;
const races2027Count = (db.prepare("SELECT COUNT(*) as c FROM races WHERE date LIKE '%2027%'").get() as any).c;
const totalSites = (db.prepare("SELECT COUNT(*) as c FROM explore_sites").get() as any).c;

console.log("\n=== FINAL DB STATE ===");
console.log(`Total races: ${totalRaces}`);
console.log(`  2026: ${races2026Count}`);
console.log(`  2027: ${races2027Count}`);
console.log(`Total explore sites: ${totalSites}`);

const byCountry2027 = db.prepare("SELECT country, COUNT(*) as cnt FROM races WHERE date LIKE '%2027%' GROUP BY country ORDER BY cnt DESC").all() as any[];
console.log("\n2027 races by country:");
for (const row of byCountry2027) {
  console.log(`  ${row.country}: ${row.cnt}`);
}

const byCat = db.prepare("SELECT category, COUNT(*) as cnt FROM explore_sites GROUP BY category ORDER BY cnt DESC").all() as any[];
console.log("\nExplore sites by category:");
for (const row of byCat) {
  console.log(`  ${row.category}: ${row.cnt}`);
}

db.close();
console.log("\nDone!");
