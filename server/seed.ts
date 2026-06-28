import { db } from "./storage.js";
import { races, raceDates } from "../shared/schema.js";

export type RaceDateEntry = {
  eventDate: string;   // YYYY-MM-DD, day=1 placeholder when precision is "month"
  precision: string;   // exact | month
  confidence: string;  // confirmed | predicted
  isPrimary: boolean;
};

export type RaceSeed = {
  name: string;
  location: string;
  country: string;
  date: string;
  distance: string;
  distanceLabel: string;
  type: string;
  venue?: string | null;
  brand?: string | null;
  team: string;
  url: string;
  note: string;
  status: string;
  dates?: string;  // JSON: [{date, status}] — legacy, kept for backward compat
  lat?: string;
  lng?: string;
  dateEntries?: RaceDateEntry[];
};

export async function seedRaces() {
  const data = [
    // India
    { name: "Freshworks Chennai Marathon", location: "Chennai", country: "India", date: "Jan 12, 2026", distance: "42.2km", type: "running", badgeClass: "badge-run", url: "https://chennaithon.com", team: "", note: "", status: "active", lat: "13.0827", lng: "80.2707" },
    { name: "Mumbai Marathon (Tata)", location: "Mumbai", country: "India", date: "Jan 19, 2026", distance: "42.2km", type: "running", badgeClass: "badge-run", url: "https://tatamumbaimarathon.procam.in", team: "", note: "", status: "active", lat: "18.9388", lng: "72.8354" },
    { name: "Coastal Odyssey Goa (20K Sea Swim)", location: "Benaulim, South Goa", country: "India", date: "Jan 25, 2026", distance: "20km", type: "ocean-swim", badgeClass: "badge-swim", url: "https://coastalodyssey.in", team: "", note: "", status: "active", lat: "15.2993", lng: "73.9180" },
    { name: "KAPCH Challenge", location: "Kevadia, Gujarat", country: "India", date: "Feb 1, 2026", distance: "Various", type: "triathlon", badgeClass: "badge-tri", url: "", team: "", note: "", status: "active", lat: "21.8381", lng: "73.7189" },
    { name: "Goa Navy Duathlon", location: "Goa", country: "India", date: "Feb 2, 2026", distance: "Various", type: "duathlon", badgeClass: "badge-tri", url: "", team: "", note: "", status: "active", lat: "15.4909", lng: "73.8278" },
    { name: "MG Vadodara Marathon", location: "Vadodara, Gujarat", country: "India", date: "Feb 9, 2026", distance: "42.2km", type: "running", badgeClass: "badge-run", url: "https://mgvadodaramarathon.com", team: "", note: "", status: "active", lat: "22.3072", lng: "73.1812" },
    { name: "Bengaluru Midnight Marathon", location: "Bengaluru", country: "India", date: "Feb 15, 2026", distance: "42.2km", type: "running", badgeClass: "badge-run", url: "", team: "", note: "", status: "active", lat: "12.9716", lng: "77.5946" },
    { name: "Auroville Trail", location: "Auroville, Tamil Nadu", country: "India", date: "Feb 22, 2026", distance: "Various", type: "trail", badgeClass: "badge-trail", url: "", team: "", note: "", status: "active", lat: "12.0049", lng: "79.8106" },
    { name: "HYROX India Mumbai", location: "Mumbai", country: "India", date: "Mar 1, 2026", distance: "8km+8 stations", type: "hyrox", badgeClass: "badge-hyrox", url: "https://hyrox.com", team: "", note: "", status: "active", lat: "19.0760", lng: "72.8777" },
    { name: "Kolkata Marathon", location: "Kolkata", country: "India", date: "Mar 9, 2026", distance: "42.2km", type: "running", badgeClass: "badge-run", url: "", team: "", note: "", status: "active", lat: "22.5726", lng: "88.3639" },
    { name: "Delhi Half Marathon", location: "New Delhi", country: "India", date: "Mar 16, 2026", distance: "21.1km", type: "running", badgeClass: "badge-run", url: "", team: "", note: "", status: "active", lat: "28.6139", lng: "77.2090" },
    { name: "Ironman 70.3 Goa", location: "Goa", country: "India", date: "Nov 16, 2026", distance: "70.3mi", type: "triathlon", badgeClass: "badge-tri", url: "https://ironman.com", team: "", note: "", status: "active", lat: "15.2993", lng: "73.9180" },
    { name: "Ironman 70.3 Bengaluru", location: "Bengaluru", country: "India", date: "Dec 7, 2026", distance: "70.3mi", type: "triathlon", badgeClass: "badge-tri", url: "https://ironman.com", team: "", note: "", status: "active", lat: "12.9716", lng: "77.5946" },
    // Thailand
    { name: "Laguna Phuket Triathlon", location: "Phuket", country: "Thailand", date: "Nov 30, 2026", distance: "1.8km/55km/12km", type: "triathlon", badgeClass: "badge-tri", url: "https://lagunaphuket.com/triathlon", team: "", note: "", status: "active", lat: "7.9519", lng: "98.2978" },
    { name: "Ironman 70.3 Thailand", location: "Phuket", country: "Thailand", date: "Dec 7, 2026", distance: "70.3mi", type: "triathlon", badgeClass: "badge-tri", url: "https://ironman.com", team: "", note: "", status: "active", lat: "7.9519", lng: "98.2978" },
    { name: "Phuket King's Cup Regatta", location: "Phuket", country: "Thailand", date: "Dec 2, 2026", distance: "Various", type: "adventure", badgeClass: "badge-adv", url: "", team: "", note: "", status: "active", lat: "7.8804", lng: "98.3923" },
    { name: "Bangkok Marathon", location: "Bangkok", country: "Thailand", date: "Nov 23, 2026", distance: "42.2km", type: "running", badgeClass: "badge-run", url: "", team: "", note: "", status: "active", lat: "13.7563", lng: "100.5018" },
    { name: "Chiang Mai Marathon", location: "Chiang Mai", country: "Thailand", date: "Dec 21, 2026", distance: "42.2km", type: "running", badgeClass: "badge-run", url: "", team: "", note: "", status: "active", lat: "18.7883", lng: "98.9853" },
    { name: "Koh Samui Triathlon", location: "Koh Samui", country: "Thailand", date: "Aug 17, 2026", distance: "Various", type: "triathlon", badgeClass: "badge-tri", url: "", team: "", note: "", status: "active", lat: "9.5120", lng: "100.0136" },
    { name: "HYROX Bangkok", location: "Bangkok", country: "Thailand", date: "Sep 20, 2026", distance: "8km+8 stations", type: "hyrox", badgeClass: "badge-hyrox", url: "https://hyrox.com", team: "", note: "", status: "active", lat: "13.7563", lng: "100.5018" },
    // Japan
    { name: "Tokyo Marathon", location: "Tokyo", country: "Japan", date: "Mar 2, 2026", distance: "42.2km", type: "running", badgeClass: "badge-run", url: "https://marathon.tokyo", team: "", note: "", status: "active", lat: "35.6762", lng: "139.6503" },
    { name: "Osaka Marathon", location: "Osaka", country: "Japan", date: "Feb 23, 2026", distance: "42.2km", type: "running", badgeClass: "badge-run", url: "", team: "", note: "", status: "active", lat: "34.6937", lng: "135.5023" },
    { name: "Kyoto Marathon", location: "Kyoto", country: "Japan", date: "Feb 16, 2026", distance: "42.2km", type: "running", badgeClass: "badge-run", url: "", team: "", note: "", status: "active", lat: "35.0116", lng: "135.7681" },
    { name: "Ironman 70.3 Japan", location: "Nagoya", country: "Japan", date: "Sep 21, 2026", distance: "70.3mi", type: "triathlon", badgeClass: "badge-tri", url: "https://ironman.com", team: "", note: "", status: "active", lat: "35.1815", lng: "136.9066" },
    { name: "HYROX Tokyo", location: "Tokyo", country: "Japan", date: "Nov 8, 2026", distance: "8km+8 stations", type: "hyrox", badgeClass: "badge-hyrox", url: "https://hyrox.com", team: "", note: "", status: "active", lat: "35.6762", lng: "139.6503" },
    { name: "Noto Triathlon", location: "Noto, Ishikawa", country: "Japan", date: "Jul 13, 2026", distance: "Various", type: "triathlon", badgeClass: "badge-tri", url: "", team: "", note: "", status: "active", lat: "37.3060", lng: "136.7645" },
    // Vietnam
    { name: "Ho Chi Minh City Marathon", location: "Ho Chi Minh City", country: "Vietnam", date: "Jan 12, 2026", distance: "42.2km", type: "running", badgeClass: "badge-run", url: "", team: "", note: "", status: "active", lat: "10.8231", lng: "106.6297" },
    { name: "Hanoi Marathon", location: "Hanoi", country: "Vietnam", date: "Nov 2, 2026", distance: "42.2km", type: "running", badgeClass: "badge-run", url: "", team: "", note: "", status: "active", lat: "21.0285", lng: "105.8542" },
    { name: "Vietnam Mountain Marathon", location: "Sapa", country: "Vietnam", date: "Aug 9, 2026", distance: "Various", type: "trail", badgeClass: "badge-trail", url: "https://vietnammountainmarathon.com", team: "", note: "", status: "active", lat: "22.3364", lng: "103.8438" },
    { name: "Da Nang International Marathon", location: "Da Nang", country: "Vietnam", date: "Aug 17, 2026", distance: "42.2km", type: "running", badgeClass: "badge-run", url: "", team: "", note: "", status: "active", lat: "16.0544", lng: "108.2022" },
    // Philippines
    { name: "Ironman Philippines", location: "Subic Bay", country: "Philippines", date: "Aug 3, 2026", distance: "140.6mi", type: "triathlon", badgeClass: "badge-tri", url: "https://ironman.com", team: "", note: "", status: "active", lat: "14.7942", lng: "120.2719" },
    { name: "Ironman 70.3 Philippines", location: "Mactan, Cebu", country: "Philippines", date: "Aug 10, 2026", distance: "70.3mi", type: "triathlon", badgeClass: "badge-tri", url: "https://ironman.com", team: "", note: "", status: "active", lat: "10.3157", lng: "123.9070" },
    { name: "Manila Marathon", location: "Manila", country: "Philippines", date: "Sep 14, 2026", distance: "42.2km", type: "running", badgeClass: "badge-run", url: "", team: "", note: "", status: "active", lat: "14.5995", lng: "120.9842" },
    // Sri Lanka
    { name: "Colombo Marathon", location: "Colombo", country: "Sri Lanka", date: "Oct 5, 2026", distance: "42.2km", type: "running", badgeClass: "badge-run", url: "", team: "", note: "", status: "active", lat: "6.9271", lng: "79.8612" },
    // Malaysia
    { name: "Ironman 70.3 Malaysia", location: "Putrajaya", country: "Malaysia", date: "Mar 23, 2026", distance: "70.3mi", type: "triathlon", badgeClass: "badge-tri", url: "https://ironman.com", team: "", note: "", status: "active", lat: "2.9264", lng: "101.6964" },
    { name: "Kuala Lumpur Marathon", location: "Kuala Lumpur", country: "Malaysia", date: "Jun 29, 2026", distance: "42.2km", type: "running", badgeClass: "badge-run", url: "", team: "", note: "", status: "active", lat: "3.1390", lng: "101.6869" },
    { name: "Penang Bridge International Marathon", location: "Penang", country: "Malaysia", date: "Nov 2, 2026", distance: "42.2km", type: "running", badgeClass: "badge-run", url: "", team: "", note: "", status: "active", lat: "5.4164", lng: "100.3327" },
    { name: "Borneo International Marathon", location: "Kota Kinabalu, Sabah", country: "Malaysia", date: "May 18, 2026", distance: "42.2km", type: "running", badgeClass: "badge-run", url: "", team: "", note: "", status: "active", lat: "5.9804", lng: "116.0735" },
    // Singapore
    { name: "Ironman 70.3 Singapore", location: "Singapore", country: "Singapore", date: "Nov 9, 2026", distance: "70.3mi", type: "triathlon", badgeClass: "badge-tri", url: "https://ironman.com", team: "", note: "", status: "active", lat: "1.3521", lng: "103.8198" },
    { name: "Singapore Marathon", location: "Singapore", country: "Singapore", date: "Dec 7, 2026", distance: "42.2km", type: "running", badgeClass: "badge-run", url: "", team: "", note: "", status: "active", lat: "1.3521", lng: "103.8198" },
    { name: "HYROX Singapore", location: "Singapore", country: "Singapore", date: "Sep 6, 2026", distance: "8km+8 stations", type: "hyrox", badgeClass: "badge-hyrox", url: "https://hyrox.com", team: "", note: "", status: "active", lat: "1.3521", lng: "103.8198" },
    // South Korea
    { name: "Seoul Marathon", location: "Seoul", country: "South Korea", date: "Mar 16, 2026", distance: "42.2km", type: "running", badgeClass: "badge-run", url: "", team: "", note: "", status: "active", lat: "37.5665", lng: "126.9780" },
    { name: "Jeju Triathlon", location: "Jeju Island", country: "South Korea", date: "Sep 7, 2026", distance: "Various", type: "triathlon", badgeClass: "badge-tri", url: "", team: "", note: "", status: "active", lat: "33.4996", lng: "126.5312" },
    { name: "HYROX Seoul", location: "Seoul", country: "South Korea", date: "Oct 18, 2026", distance: "8km+8 stations", type: "hyrox", badgeClass: "badge-hyrox", url: "https://hyrox.com", team: "", note: "", status: "active", lat: "37.5665", lng: "126.9780" },
    // China
    { name: "Shanghai Marathon", location: "Shanghai", country: "China", date: "Nov 30, 2026", distance: "42.2km", type: "running", badgeClass: "badge-run", url: "", team: "", note: "", status: "active", lat: "31.2304", lng: "121.4737" },
    { name: "Beijing Marathon", location: "Beijing", country: "China", date: "Nov 2, 2026", distance: "42.2km", type: "running", badgeClass: "badge-run", url: "", note: "", team: "", status: "active", lat: "39.9042", lng: "116.4074" },
    { name: "Hong Kong Marathon", location: "Hong Kong", country: "China", date: "Feb 16, 2026", distance: "42.2km", type: "running", badgeClass: "badge-run", url: "", team: "", note: "", status: "active", lat: "22.3193", lng: "114.1694" },
    // Taiwan
    { name: "Ironman Taiwan", location: "Penghu", country: "Taiwan", date: "Oct 19, 2026", distance: "140.6mi", type: "triathlon", badgeClass: "badge-tri", url: "https://ironman.com", team: "", note: "", status: "active", lat: "23.5711", lng: "119.5793" },
    { name: "Taipei Marathon", location: "Taipei", country: "Taiwan", date: "Dec 21, 2026", distance: "42.2km", type: "running", badgeClass: "badge-run", url: "", team: "", note: "", status: "active", lat: "25.0330", lng: "121.5654" },
    // Indonesia
    { name: "Bali Marathon", location: "Gianyar, Bali", country: "Indonesia", date: "Sep 7, 2026", distance: "42.2km", type: "running", badgeClass: "badge-run", url: "https://balimarathon.com", team: "", note: "", status: "active", lat: "-8.3405", lng: "115.0920" },
    { name: "Ironman 70.3 Lombok", location: "Lombok", country: "Indonesia", date: "Sep 28, 2026", distance: "70.3mi", type: "triathlon", badgeClass: "badge-tri", url: "https://ironman.com", team: "", note: "", status: "active", lat: "-8.6529", lng: "116.3242" },
    { name: "Bali Hope Swimrun", location: "Nusa Lembongan, Bali", country: "Indonesia", date: "Oct 12, 2026", distance: "Various", type: "ocean-swim", badgeClass: "badge-swim", url: "", team: "", note: "", status: "active", lat: "-8.6674", lng: "115.4526" },
    { name: "Jakarta Marathon", location: "Jakarta", country: "Indonesia", date: "Oct 19, 2026", distance: "42.2km", type: "running", badgeClass: "badge-run", url: "", team: "", note: "", status: "active", lat: "-6.2088", lng: "106.8456" },
    // Nepal
    { name: "Everest Marathon", location: "Namche Bazaar, Nepal", country: "Nepal", date: "May 29, 2026", distance: "42.2km", type: "trail", badgeClass: "badge-trail", url: "https://everestmarathon.com", team: "", note: "", status: "active", lat: "27.8069", lng: "86.7144" },
    // Maldives
    { name: "Maldives Ocean Swim", location: "Malé Atoll", country: "Maldives", date: "Oct 25, 2026", distance: "5km", type: "ocean-swim", badgeClass: "badge-swim", url: "", team: "", note: "", status: "active", lat: "4.1755", lng: "73.5093" },
    // Cambodia
    { name: "Angkor Wat Half Marathon", location: "Siem Reap", country: "Cambodia", date: "Dec 7, 2026", distance: "21.1km", type: "running", badgeClass: "badge-run", url: "https://angkorwathalf.com", team: "", note: "", status: "active", lat: "13.4125", lng: "103.8670" },
    // Myanmar
    { name: "Bagan Temple Marathon", location: "Bagan", country: "Myanmar", date: "Jan 19, 2026", distance: "42.2km", type: "running", badgeClass: "badge-run", url: "https://baganmarathon.com", team: "", note: "", status: "active", lat: "21.1717", lng: "94.8585" },
    // Mongolia
    { name: "Gobi March (4 Deserts)", location: "Gobi Desert", country: "Mongolia", date: "Jun 15, 2026", distance: "250km stage", type: "trail", badgeClass: "badge-trail", url: "https://4deserts.com", team: "", note: "", status: "active", lat: "43.0000", lng: "105.0000" },
    // Bhutan
    { name: "Bhutan International Marathon", location: "Thimphu", country: "Bhutan", date: "Nov 9, 2026", distance: "42.2km", type: "running", badgeClass: "badge-run", url: "", team: "", note: "", status: "active", lat: "27.4728", lng: "89.6393" },
    // Kyrgyzstan removed
    // Georgia
    // Kazakhstan
    // Azerbaijan
    // Jordan
    // Oman
    // UAE
    // Israel
    // Laos
    { name: "Luang Prabang Half Marathon", location: "Luang Prabang", country: "Laos", date: "Dec 14, 2026", distance: "21.1km", type: "running", badgeClass: "badge-run", url: "", team: "", note: "", status: "active", lat: "19.8845", lng: "102.1348" },
    // Brunei
    // Pakistan
    // Bangladesh
    // Additional India events
    { name: "Tata Consultancy Services World 10K", location: "Bengaluru", country: "India", date: "May 18, 2026", distance: "10km", type: "running", badgeClass: "badge-run", url: "", team: "", note: "", status: "active", lat: "12.9716", lng: "77.5946" },
    { name: "Ladakh Marathon", location: "Leh, Ladakh", country: "India", date: "Sep 6, 2026", distance: "42.2km", type: "running", badgeClass: "badge-run", url: "https://ladakhmarathon.com", team: "", note: "", status: "active", lat: "34.1526", lng: "77.5771" },
    { name: "Spiti Valley Ultramarathon", location: "Spiti Valley, HP", country: "India", date: "Jun 28, 2026", distance: "100km", type: "trail", badgeClass: "badge-trail", url: "", team: "", note: "", status: "active", lat: "32.2432", lng: "78.0339" },
    { name: "Kaveri Trail Marathon", location: "Mysuru", country: "India", date: "Jan 19, 2026", distance: "42.2km", type: "trail", badgeClass: "badge-trail", url: "", team: "", note: "", status: "active", lat: "12.2958", lng: "76.6394" },
    { name: "Coastal Trail Run Goa", location: "Goa", country: "India", date: "Nov 29, 2026", distance: "Various", type: "trail", badgeClass: "badge-trail", url: "", team: "", note: "", status: "active", lat: "15.2993", lng: "73.9180" },
    { name: "Pinkathon Mumbai", location: "Mumbai", country: "India", date: "Dec 14, 2026", distance: "Various", type: "running", badgeClass: "badge-run", url: "", team: "", note: "", status: "active", lat: "19.0760", lng: "72.8777" },
    { name: "Ultramarathon Manali", location: "Manali, HP", country: "India", date: "Jul 6, 2026", distance: "50km", type: "trail", badgeClass: "badge-trail", url: "", team: "", note: "", status: "active", lat: "32.2396", lng: "77.1887" },
    { name: "Rann Utsav Run", location: "Kutch, Gujarat", country: "India", date: "Feb 1, 2026", distance: "21.1km", type: "running", badgeClass: "badge-run", url: "", team: "", note: "", status: "active", lat: "23.7337", lng: "70.8022" },
    { name: "Hyderabad Marathon", location: "Hyderabad", country: "India", date: "Aug 24, 2026", distance: "42.2km", type: "running", badgeClass: "badge-run", url: "", team: "", note: "", status: "active", lat: "17.3850", lng: "78.4867" },
    { name: "Pune Marathon", location: "Pune", country: "India", date: "Sep 14, 2026", distance: "42.2km", type: "running", badgeClass: "badge-run", url: "", team: "", note: "", status: "active", lat: "18.5204", lng: "73.8567" },
    { name: "HYROX Bengaluru", location: "Bengaluru", country: "India", date: "Nov 1, 2026", distance: "8km+8 stations", type: "hyrox", badgeClass: "badge-hyrox", url: "https://hyrox.com", team: "", note: "", status: "active", lat: "12.9716", lng: "77.5946" },
    { name: "Ironman 70.3 Kolkata", location: "Kolkata", country: "India", date: "Oct 12, 2026", distance: "70.3mi", type: "triathlon", badgeClass: "badge-tri", url: "https://ironman.com", team: "", note: "", status: "active", lat: "22.5726", lng: "88.3639" },
    // Additional Japan
    { name: "HYROX Osaka", location: "Osaka", country: "Japan", date: "Dec 6, 2026", distance: "8km+8 stations", type: "hyrox", badgeClass: "badge-hyrox", url: "https://hyrox.com", team: "", note: "", status: "active", lat: "34.6937", lng: "135.5023" },
    { name: "Nagano Marathon", location: "Nagano", country: "Japan", date: "Apr 20, 2026", distance: "42.2km", type: "running", badgeClass: "badge-run", url: "", team: "", note: "", status: "active", lat: "36.6486", lng: "138.1948" },
    { name: "Mt Fuji Trail Run", location: "Fujiyoshida", country: "Japan", date: "Jul 27, 2026", distance: "Various", type: "trail", badgeClass: "badge-trail", url: "", team: "", note: "", status: "active", lat: "35.4722", lng: "138.7436" },
    // Additional Thailand
    { name: "Phuket International Marathon", location: "Phuket", country: "Thailand", date: "Jun 8, 2026", distance: "42.2km", type: "running", badgeClass: "badge-run", url: "", team: "", note: "", status: "active", lat: "7.9519", lng: "98.2978" },
    { name: "Chiang Rai Half Marathon", location: "Chiang Rai", country: "Thailand", date: "Mar 9, 2026", distance: "21.1km", type: "running", badgeClass: "badge-run", url: "", team: "", note: "", status: "active", lat: "19.9105", lng: "99.8406" },
    // Additional Vietnam
    { name: "Mekong Delta Marathon", location: "Can Tho", country: "Vietnam", date: "Apr 6, 2026", distance: "42.2km", type: "running", badgeClass: "badge-run", url: "", team: "", note: "", status: "active", lat: "10.0341", lng: "105.7837" },
    { name: "Ha Long Bay Heritage Marathon", location: "Ha Long", country: "Vietnam", date: "Nov 23, 2026", distance: "42.2km", type: "running", badgeClass: "badge-run", url: "", team: "", note: "", status: "active", lat: "20.9101", lng: "107.1839" },
    // Additional Philippines
    { name: "Cebu City Marathon", location: "Cebu City", country: "Philippines", date: "Jan 5, 2026", distance: "42.2km", type: "running", badgeClass: "badge-run", url: "", team: "", note: "", status: "active", lat: "10.3157", lng: "123.8854" },
    // Additional Malaysia
    { name: "Sabah XTERRA Triathlon", location: "Kota Kinabalu, Sabah", country: "Malaysia", date: "Oct 5, 2026", distance: "Various", type: "triathlon", badgeClass: "badge-tri", url: "", team: "", note: "", status: "active", lat: "5.9804", lng: "116.0735" },
    // Additional Singapore
    { name: "Singapore Swim For Hope", location: "Singapore", country: "Singapore", date: "Sep 28, 2026", distance: "1.5km/3km", type: "ocean-swim", badgeClass: "badge-swim", url: "", team: "", note: "", status: "active", lat: "1.2560", lng: "103.8198" },
    // Additional S Korea
    { name: "Busan International Marathon", location: "Busan", country: "South Korea", date: "Apr 6, 2026", distance: "42.2km", type: "running", badgeClass: "badge-run", url: "", team: "", note: "", status: "active", lat: "35.1796", lng: "129.0756" },
    // Additional Indonesia
    { name: "Lombok Sumbawa Ultra", location: "Lombok", country: "Indonesia", date: "Aug 3, 2026", distance: "Various", type: "trail", badgeClass: "badge-trail", url: "", team: "", note: "", status: "active", lat: "-8.6529", lng: "116.3242" },
    // Additional Taiwan
    { name: "Sun Moon Lake Swim", location: "Nantou", country: "Taiwan", date: "Sep 14, 2026", distance: "3km", type: "ocean-swim", badgeClass: "badge-swim", url: "", team: "", note: "", status: "active", lat: "23.8656", lng: "120.9163" },
    // Additional UAE
    // Additional Oman
    // Additional China
    { name: "Guangzhou Marathon", location: "Guangzhou", country: "China", date: "Dec 7, 2026", distance: "42.2km", type: "running", badgeClass: "badge-run", url: "", team: "", note: "", status: "active", lat: "23.1291", lng: "113.2644" },
    { name: "Chengdu Marathon", location: "Chengdu", country: "China", date: "Nov 2, 2026", distance: "42.2km", type: "running", badgeClass: "badge-run", url: "", team: "", note: "", status: "active", lat: "30.5728", lng: "104.0668" },
    // Nepal extras
    { name: "Annapurna Trail Race", location: "Pokhara, Nepal", country: "Nepal", date: "Oct 18, 2026", distance: "Various", type: "trail", badgeClass: "badge-trail", url: "", team: "", note: "", status: "active", lat: "28.2096", lng: "83.9856" },
    // Additional India
    { name: "Sikkim Himalayan Ultra", location: "Gangtok, Sikkim", country: "India", date: "Oct 11, 2026", distance: "Various", type: "trail", badgeClass: "badge-trail", url: "", team: "", note: "", status: "active", lat: "27.3314", lng: "88.6138" },
    { name: "Kochi Ironkid Triathlon", location: "Kochi, Kerala", country: "India", date: "Nov 8, 2026", distance: "Various", type: "triathlon", badgeClass: "badge-tri", url: "", team: "", note: "", status: "active", lat: "9.9312", lng: "76.2673" },
    { name: "Jaipur Marathon", location: "Jaipur", country: "India", date: "Jan 26, 2026", distance: "42.2km", type: "running", badgeClass: "badge-run", url: "", team: "", note: "", status: "active", lat: "26.9124", lng: "75.7873" },
    { name: "Cherrapunji Rain Run", location: "Cherrapunji, Meghalaya", country: "India", date: "Jul 20, 2026", distance: "21.1km", type: "running", badgeClass: "badge-run", url: "", team: "", note: "", status: "active", lat: "25.2840", lng: "91.7264" },
    { name: "Desert Storm Bikaner", location: "Bikaner, Rajasthan", country: "India", date: "Feb 15, 2026", distance: "42.2km", type: "trail", badgeClass: "badge-trail", url: "", team: "", note: "", status: "active", lat: "28.0229", lng: "73.3119" },
    { name: "Sundarban Trail Run", location: "West Bengal", country: "India", date: "Dec 21, 2026", distance: "Various", type: "trail", badgeClass: "badge-trail", url: "", team: "", note: "", status: "active", lat: "21.9497", lng: "88.8980" },
    { name: "Mumbai Ocean Swim", location: "Juhu Beach, Mumbai", country: "India", date: "Dec 14, 2026", distance: "2km/5km", type: "ocean-swim", badgeClass: "badge-swim", url: "", team: "", note: "", status: "active", lat: "19.0948", lng: "72.8258" },
    { name: "Goa Open Water Swim", location: "Candolim Beach, Goa", country: "India", date: "Jan 11, 2026", distance: "3km", type: "ocean-swim", badgeClass: "badge-swim", url: "", team: "", note: "", status: "active", lat: "15.5188", lng: "73.7645" },
    { name: "India HYROX Championship", location: "New Delhi", country: "India", date: "Mar 22, 2026", distance: "8km+8 stations", type: "hyrox", badgeClass: "badge-hyrox", url: "https://hyrox.com", team: "", note: "", status: "active", lat: "28.6139", lng: "77.2090" },
    { name: "Himachal Triathlon", location: "Shimla, HP", country: "India", date: "Jun 14, 2026", distance: "Various", type: "triathlon", badgeClass: "badge-tri", url: "", team: "", note: "", status: "active", lat: "31.1048", lng: "77.1734" },
  ];

  for (const race of data) {
    await db.insert(races).values(race);
  }
  console.log(`Seeded ${data.length} races`);
}

// Additional races to reach 168 total
export async function seedAdditionalRaces() {
  const additional = [
    // India (more)
    { name: "Tata Steel Kolkata 25K", location: "Kolkata", country: "India", date: "Jan 26, 2026", distance: "25km", type: "running", badgeClass: "badge-run", url: "", team: "", note: "", status: "active", lat: "22.5726", lng: "88.3639" },
    { name: "Hyderabad Marathon", location: "Hyderabad", country: "India", date: "Jan 26, 2026", distance: "42.2km", type: "running", badgeClass: "badge-run", url: "", team: "", note: "", status: "active", lat: "17.3850", lng: "78.4867" },
    { name: "Airtel Delhi Half Marathon", location: "New Delhi", country: "India", date: "Oct 19, 2026", distance: "21.1km", type: "running", badgeClass: "badge-run", url: "", team: "", note: "", status: "active", lat: "28.6139", lng: "77.2090" },
    { name: "Vedanta Delhi Half Marathon", location: "New Delhi", country: "India", date: "Oct 19, 2026", distance: "21.1km", type: "running", badgeClass: "badge-run", url: "", team: "", note: "", status: "active", lat: "28.6139", lng: "77.2090" },
    { name: "HYROX India Bengaluru", location: "Bengaluru", country: "India", date: "Nov 8, 2026", distance: "8km+8 stations", type: "hyrox", badgeClass: "badge-hyrox", url: "https://hyrox.com", team: "", note: "", status: "active", lat: "12.9716", lng: "77.5946" },
    { name: "Spicejet Hyderabad Half Marathon", location: "Hyderabad", country: "India", date: "Nov 16, 2026", distance: "21.1km", type: "running", badgeClass: "badge-run", url: "", team: "", note: "", status: "active", lat: "17.3850", lng: "78.4867" },
    { name: "Vasai-Virar Marathon", location: "Mumbai", country: "India", date: "Jan 5, 2026", distance: "42.2km", type: "running", badgeClass: "badge-run", url: "", team: "", note: "", status: "active", lat: "19.0760", lng: "72.8777" },
    { name: "Ironman 70.3 India Vishakhapatnam", location: "Vizag", country: "India", date: "Oct 26, 2026", distance: "70.3mi", type: "triathlon", badgeClass: "badge-tri", url: "https://ironman.com", team: "", note: "", status: "active", lat: "17.6868", lng: "83.2185" },
    // Japan (more)
    { name: "Kyoto Marathon", location: "Kyoto", country: "Japan", date: "Mar 16, 2026", distance: "42.2km", type: "running", badgeClass: "badge-run", url: "", team: "", note: "", status: "active", lat: "35.0116", lng: "135.7681" },
    { name: "Nagoya Women's Marathon", location: "Nagoya", country: "Japan", date: "Mar 9, 2026", distance: "42.2km", type: "running", badgeClass: "badge-run", url: "", team: "", note: "", status: "active", lat: "35.1815", lng: "136.9066" },
    { name: "Hokkaido Marathon", location: "Sapporo", country: "Japan", date: "Aug 31, 2026", distance: "42.2km", type: "running", badgeClass: "badge-run", url: "", team: "", note: "", status: "active", lat: "43.0618", lng: "141.3545" },
    { name: "Ironman Japan", location: "Gamagori, Aichi", country: "Japan", date: "Oct 5, 2026", distance: "140.6mi", type: "triathlon", badgeClass: "badge-tri", url: "https://ironman.com", team: "", note: "", status: "active", lat: "34.8282", lng: "137.2222" },
    { name: "HYROX Tokyo", location: "Tokyo", country: "Japan", date: "Nov 22, 2026", distance: "8km+8 stations", type: "hyrox", badgeClass: "badge-hyrox", url: "https://hyrox.com", team: "", note: "", status: "active", lat: "35.6762", lng: "139.6503" },
    { name: "Fuji Mountain Race", location: "Mount Fuji", country: "Japan", date: "Jul 27, 2026", distance: "21km", type: "trail", badgeClass: "badge-trail", url: "", team: "", note: "", status: "active", lat: "35.3606", lng: "138.7274" },
    { name: "Ultramarathon Aso", location: "Kumamoto", country: "Japan", date: "May 18, 2026", distance: "100km", type: "trail", badgeClass: "badge-trail", url: "", team: "", note: "", status: "active", lat: "32.8031", lng: "130.9975" },
    // Thailand (more)
    { name: "Phuket Marathon", location: "Phuket", country: "Thailand", date: "Jun 1, 2026", distance: "42.2km", type: "running", badgeClass: "badge-run", url: "", team: "", note: "", status: "active", lat: "7.8804", lng: "98.3923" },
    { name: "Chiang Rai Trail", location: "Chiang Rai", country: "Thailand", date: "Oct 4, 2026", distance: "Various", type: "trail", badgeClass: "badge-trail", url: "", team: "", note: "", status: "active", lat: "19.9105", lng: "99.8406" },
    { name: "Ironman 70.3 Phuket", location: "Phuket", country: "Thailand", date: "Nov 9, 2026", distance: "70.3mi", type: "triathlon", badgeClass: "badge-tri", url: "https://ironman.com", team: "", note: "", status: "active", lat: "7.9519", lng: "98.2978" },
    // Vietnam (more)
    { name: "Vietnam Mountain Marathon", location: "Sapa", country: "Vietnam", date: "Aug 9, 2026", distance: "Various", type: "trail", badgeClass: "badge-trail", url: "https://vietnammountainmarathon.com", team: "", note: "", status: "active", lat: "22.3364", lng: "103.8438" },
    { name: "Ho Chi Minh City Marathon", location: "Ho Chi Minh City", country: "Vietnam", date: "Jan 12, 2026", distance: "42.2km", type: "running", badgeClass: "badge-run", url: "", team: "", note: "", status: "active", lat: "10.8231", lng: "106.6297" },
    { name: "Da Nang International Marathon", location: "Da Nang", country: "Vietnam", date: "Aug 17, 2026", distance: "42.2km", type: "running", badgeClass: "badge-run", url: "", team: "", note: "", status: "active", lat: "16.0544", lng: "108.2022" },
    { name: "Ironman 70.3 Vietnam Da Nang", location: "Da Nang", country: "Vietnam", date: "May 11, 2026", distance: "70.3mi", type: "triathlon", badgeClass: "badge-tri", url: "https://ironman.com", team: "", note: "", status: "active", lat: "16.0544", lng: "108.2022" },
    // South Korea (more)
    { name: "Gyeongju International Marathon", location: "Gyeongju", country: "South Korea", date: "Apr 6, 2026", distance: "42.2km", type: "running", badgeClass: "badge-run", url: "", team: "", note: "", status: "active", lat: "35.8562", lng: "129.2247" },
    { name: "HYROX Seoul Spring", location: "Seoul", country: "South Korea", date: "Apr 12, 2026", distance: "8km+8 stations", type: "hyrox", badgeClass: "badge-hyrox", url: "https://hyrox.com", team: "", note: "", status: "active", lat: "37.5665", lng: "126.9780" },
    { name: "Ironman Korea", location: "Gurye, Jeolla", country: "South Korea", date: "Jul 6, 2026", distance: "140.6mi", type: "triathlon", badgeClass: "badge-tri", url: "https://ironman.com", team: "", note: "", status: "active", lat: "35.2060", lng: "127.4621" },
    // Philippines (more)
    { name: "Cebu City Marathon", location: "Cebu City", country: "Philippines", date: "Jan 5, 2026", distance: "42.2km", type: "running", badgeClass: "badge-run", url: "", team: "", note: "", status: "active", lat: "10.3157", lng: "123.8854" },
    { name: "Ironman 70.3 Philippines", location: "Cebu", country: "Philippines", date: "Aug 3, 2026", distance: "70.3mi", type: "triathlon", badgeClass: "badge-tri", url: "https://ironman.com", team: "", note: "", status: "active", lat: "10.3157", lng: "123.8854" },
    { name: "HYROX Manila", location: "Manila", country: "Philippines", date: "Sep 27, 2026", distance: "8km+8 stations", type: "hyrox", badgeClass: "badge-hyrox", url: "https://hyrox.com", team: "", note: "", status: "active", lat: "14.5995", lng: "120.9842" },
    // Malaysia (more)
    { name: "Kuala Lumpur Marathon", location: "Kuala Lumpur", country: "Malaysia", date: "Jun 22, 2026", distance: "42.2km", type: "running", badgeClass: "badge-run", url: "", team: "", note: "", status: "active", lat: "3.1390", lng: "101.6869" },
    { name: "Ironman 70.3 Putrajaya", location: "Putrajaya", country: "Malaysia", date: "Nov 2, 2026", distance: "70.3mi", type: "triathlon", badgeClass: "badge-tri", url: "https://ironman.com", team: "", note: "", status: "active", lat: "2.9264", lng: "101.6964" },
    { name: "Borneo Ultra Trail Marathon", location: "Sabah", country: "Malaysia", date: "Sep 6, 2026", distance: "Various", type: "trail", badgeClass: "badge-trail", url: "", team: "", note: "", status: "active", lat: "5.9788", lng: "116.0753" },
    // Singapore (more)
    { name: "Standard Chartered Singapore Marathon", location: "Singapore", country: "Singapore", date: "Dec 7, 2026", distance: "42.2km", type: "running", badgeClass: "badge-run", url: "", team: "", note: "", status: "active", lat: "1.3521", lng: "103.8198" },
    { name: "HYROX Singapore", location: "Singapore", country: "Singapore", date: "Apr 5, 2026", distance: "8km+8 stations", type: "hyrox", badgeClass: "badge-hyrox", url: "https://hyrox.com", team: "", note: "", status: "active", lat: "1.3521", lng: "103.8198" },
    // Indonesia (more)
    { name: "Bromo Tengger Semeru Ultra", location: "East Java", country: "Indonesia", date: "Jun 7, 2026", distance: "Various", type: "trail", badgeClass: "badge-trail", url: "", team: "", note: "", status: "active", lat: "-7.9425", lng: "112.9531" },
    { name: "Rinjani 100", location: "Lombok", country: "Indonesia", date: "Aug 2, 2026", distance: "100km", type: "trail", badgeClass: "badge-trail", url: "", team: "", note: "", status: "active", lat: "-8.4095", lng: "116.4648" },
    { name: "Jakarta Marathon", location: "Jakarta", country: "Indonesia", date: "Oct 19, 2026", distance: "42.2km", type: "running", badgeClass: "badge-run", url: "", team: "", note: "", status: "active", lat: "-6.2088", lng: "106.8456" },
    // Nepal
    { name: "Annapurna 100", location: "Pokhara", country: "Nepal", date: "Oct 18, 2026", distance: "100km", type: "trail", badgeClass: "badge-trail", url: "https://annapurna100.com", team: "", note: "", status: "active", lat: "28.2096", lng: "83.9856" },
    { name: "Kathmandu Ultra", location: "Kathmandu", country: "Nepal", date: "Mar 22, 2026", distance: "50km", type: "trail", badgeClass: "badge-trail", url: "", team: "", note: "", status: "active", lat: "27.7172", lng: "85.3240" },
    // Sri Lanka
    { name: "Colombo Marathon", location: "Colombo", country: "Sri Lanka", date: "Jan 19, 2026", distance: "42.2km", type: "running", badgeClass: "badge-run", url: "", team: "", note: "", status: "active", lat: "6.9271", lng: "79.8612" },
    // Taiwan (more)
    { name: "Taroko Gorge Marathon", location: "Hualien", country: "Taiwan", date: "Mar 22, 2026", distance: "42.2km", type: "running", badgeClass: "badge-run", url: "", team: "", note: "", status: "active", lat: "24.1477", lng: "121.6740" },
    // China (more)
    { name: "Chengdu Panda Marathon", location: "Chengdu", country: "China", date: "Apr 13, 2026", distance: "42.2km", type: "running", badgeClass: "badge-run", url: "", team: "", note: "", status: "active", lat: "30.5728", lng: "104.0668" },
    { name: "Hainan Ocean Swim", location: "Sanya, Hainan", country: "China", date: "Mar 9, 2026", distance: "Various", type: "ocean-swim", badgeClass: "badge-swim", url: "", team: "", note: "", status: "active", lat: "18.2528", lng: "109.5119" },
    // Cambodia
    { name: "Angkor Wat International Half Marathon", location: "Siem Reap", country: "Cambodia", date: "Dec 7, 2026", distance: "21.1km", type: "running", badgeClass: "badge-run", url: "", team: "", note: "", status: "active", lat: "13.3633", lng: "103.8560" },
    // Mongolia
    { name: "Gobi March", location: "Gobi Desert", country: "Mongolia", date: "Jun 15, 2026", distance: "250km", type: "trail", badgeClass: "badge-trail", url: "https://4deserts.com", team: "", note: "", status: "active", lat: "44.5000", lng: "102.5000" },
    // Georgia
    // Kyrgyzstan removed
    // UAE
    // Jordan
    // Pakistan
    // Oman
    // Maldives
    { name: "Maldives Ocean Swim", location: "North Malé Atoll", country: "Maldives", date: "Feb 22, 2026", distance: "Various", type: "ocean-swim", badgeClass: "badge-swim", url: "", team: "", note: "", status: "active", lat: "4.1755", lng: "73.5093" },
  ];

  const count = additional.length;
  for (const r of additional) {
    try {
      await db.insert(races).values(r as any);
    } catch {}
  }
  console.log(`[seed] inserted up to ${count} additional races`);
}

// Derive badgeClass from type + venue. Running/swimming no longer have separate "trail"/
// "ocean-swim" type values — venue carries that distinction now — so badge selection
// needs both.
export function typeToBadge(type: string, venue: string | null | undefined, name = ""): string {
  const n = name.toLowerCase();
  // OCR: Spartan and DEKA are branded — get their own badge
  if (type === "ocr" && (n.includes("spartan") || n.includes("deka"))) return "badge-spartan";
  if (type === "running") return venue === "trail" ? "badge-run-trail" : "badge-run";
  const map: Record<string, string> = {
    triathlon: "badge-tri",
    swimming:  "badge-swim",
    swimrun:   "badge-swimrun",
    hyrox:     "badge-hyrox",
    ocr:       "badge-ocr",
    xenom:     "badge-xenom",
  };
  return map[type] ?? "badge-run";
}

// Strip venue suffixes from distanceLabel (e.g. "5K · Ocean" → "5K")
// Venue info now lives in the Sport column condition tag.
function cleanDistanceLabel(dl: string): string {
  if (!dl) return dl;
  return dl.replace(/\s*[·•]\s*(Ocean|Lake|River|Trail|Road|Multi|Coast)$/i, "").trim();
}

// ── syncAllRaces — upserts the full canonical race list from seedData.ts ──
// Checks by name before inserting to prevent duplicates.
export async function syncAllRaces() {
  const { ALL_SEED_RACES } = await import("./seedData.js");
  // Build set of existing race names for fast lookup
  const existing = new Set((await db.select().from(races)).map((r: any) => r.name));
  let added = 0;
  for (const r of ALL_SEED_RACES) {
    if (existing.has(r.name)) continue; // skip already present
    try {
      const { dateEntries, ...raceFields } = r as RaceSeed;
      const entry = {
        ...raceFields,
        badgeClass: typeToBadge(r.type ?? "", r.venue, r.name ?? ""),
        distanceLabel: cleanDistanceLabel(r.distanceLabel ?? ""),
        dates: r.dates ?? JSON.stringify([{date: r.date ?? "", status: r.status ?? "active"}]),
      };
      const [inserted] = await db.insert(races).values(entry as any).returning();
      existing.add(r.name);
      added++;
      if (inserted && dateEntries?.length) {
        await db.insert(raceDates).values(
          dateEntries.map(d => ({
            raceId: inserted.id,
            eventDate: d.eventDate,
            precision: d.precision,
            confidence: d.confidence,
            isPrimary: d.isPrimary,
          }))
        );
      }
    } catch {}
  }
  console.log(`[seed] syncAllRaces: ${added} races added (${ALL_SEED_RACES.length} total in seed)`);
}
