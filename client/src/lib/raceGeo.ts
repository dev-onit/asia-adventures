// Fallback geo coordinates for countries and cities
export const CITY_GEO: Record<string, [number, number]> = {
  // India
  "Chennai": [13.0827, 80.2707],
  "Mumbai": [19.0760, 72.8777],
  "Goa": [15.2993, 73.9180],
  "Bengaluru": [12.9716, 77.5946],
  "Bangalore": [12.9716, 77.5946],
  "New Delhi": [28.6139, 77.2090],
  "Delhi": [28.6139, 77.2090],
  "Kolkata": [22.5726, 88.3639],
  "Hyderabad": [17.3850, 78.4867],
  "Pune": [18.5204, 73.8567],
  "Jaipur": [26.9124, 75.7873],
  "Leh": [34.1526, 77.5771],
  "Mysuru": [12.2958, 76.6394],
  "Mysore": [12.2958, 76.6394],
  "Kochi": [9.9312, 76.2673],
  "Shimla": [31.1048, 77.1734],
  "Manali": [32.2396, 77.1887],
  "Gangtok": [27.3314, 88.6138],
  "Bikaner": [28.0229, 73.3119],
  "Juhu Beach": [19.0948, 72.8258],
  "Kevadia": [21.8381, 73.7189],
  "Vadodara": [22.3072, 73.1812],
  "Auroville": [12.0049, 79.8106],
  "Cherrapunji": [25.2840, 91.7264],
  "Candolim": [15.5188, 73.7645],
  "Benaulim": [15.2993, 73.9180],
  // Japan
  "Tokyo": [35.6762, 139.6503],
  "Osaka": [34.6937, 135.5023],
  "Kyoto": [35.0116, 135.7681],
  "Nagoya": [35.1815, 136.9066],
  "Nagano": [36.6486, 138.1948],
  "Noto": [37.3060, 136.7645],
  "Fujiyoshida": [35.4722, 138.7436],
  "Sapporo": [43.0618, 141.3545],
  // Thailand
  "Bangkok": [13.7563, 100.5018],
  "Phuket": [7.9519, 98.2978],
  "Chiang Mai": [18.7883, 98.9853],
  "Chiang Rai": [19.9105, 99.8406],
  "Koh Samui": [9.5120, 100.0136],
  "Pai": [19.3578, 98.4420],
  // Vietnam
  "Ho Chi Minh City": [10.8231, 106.6297],
  "Hanoi": [21.0285, 105.8542],
  "Sapa": [22.3364, 103.8438],
  "Da Nang": [16.0544, 108.2022],
  "Can Tho": [10.0341, 105.7837],
  "Ha Long": [20.9101, 107.1839],
  "Halong": [20.9101, 107.1839],
  "Hoi An": [15.8801, 108.3380],
  "Phu Quoc": [10.2898, 103.9840],
  "Phú Quốc": [10.2898, 103.9840],
  // Philippines
  "Manila": [14.5995, 120.9842],
  "Cebu City": [10.3157, 123.8854],
  "Subic Bay": [14.7942, 120.2719],
  "Mactan": [10.3157, 123.9070],
  "El Nido": [11.1784, 119.3973],
  "Banaue": [16.9187, 121.0607],
  // Indonesia
  "Bali": [-8.3405, 115.0920],
  "Gianyar": [-8.3405, 115.0920],
  "Lombok": [-8.6529, 116.3242],
  "Nusa Lembongan": [-8.6674, 115.4526],
  "Jakarta": [-6.2088, 106.8456],
  "Komodo": [-8.5500, 119.4900],
  "Raja Ampat": [-0.2300, 130.5220],
  "Gili Islands": [-8.3535, 116.0387],
  // Nepal
  "Namche Bazaar": [27.8069, 86.7144],
  "Kathmandu": [27.7172, 85.3240],
  "Pokhara": [28.2096, 83.9856],
  // Sri Lanka
  "Colombo": [6.9271, 79.8612],
  "Sigiriya": [7.9570, 80.7603],
  // Malaysia
  "Kuala Lumpur": [3.1390, 101.6869],
  "Putrajaya": [2.9264, 101.6964],
  "Penang": [5.4164, 100.3327],
  "Kota Kinabalu": [5.9804, 116.0735],
  "George Town": [5.4164, 100.3327],
  // Singapore
  "Singapore": [1.3521, 103.8198],
  // South Korea
  "Seoul": [37.5665, 126.9780],
  "Busan": [35.1796, 129.0756],
  "Jeju": [33.4996, 126.5312],
  "Jeju Island": [33.4996, 126.5312],
  // China
  "Shanghai": [31.2304, 121.4737],
  "Beijing": [39.9042, 116.4074],
  "Hong Kong": [22.3193, 114.1694],
  "Guangzhou": [23.1291, 113.2644],
  "Chengdu": [30.5728, 104.0668],
  // Taiwan
  "Taipei": [25.0330, 121.5654],
  "Penghu": [23.5711, 119.5793],
  "Nantou": [23.8656, 120.9163],
  // Maldives
  "Malé": [4.1755, 73.5093],
  "Male": [4.1755, 73.5093],
  // Cambodia
  "Siem Reap": [13.4125, 103.8670],
  "Angkor Wat": [13.4125, 103.8670],
  // Myanmar
  "Bagan": [21.1717, 94.8585],
  // Mongolia
  "Ulaanbaatar": [47.8864, 106.9057],
  "Gobi Desert": [43.0000, 105.0000],
  // Bhutan
  "Thimphu": [27.4728, 89.6393],
  "Paro": [27.4331, 89.4197],
  // Kyrgyzstan
  "Bishkek": [42.8746, 74.5698],
  // Georgia
  "Tbilisi": [41.6938, 44.8015],
  // Kazakhstan
  "Almaty": [43.2220, 76.8512],
  // Azerbaijan
  "Baku": [40.4093, 49.8671],
  // Jordan
  "Wadi Rum": [29.5832, 35.4200],
  "Petra": [30.3285, 35.4444],
  // Oman
  "Muscat": [23.5880, 58.3829],
  // UAE
  "Dubai": [25.2048, 55.2708],
  "Abu Dhabi": [24.4539, 54.3773],
  "Ras Al Khaimah": [25.7895, 55.9432],
  // Israel
  "Tel Aviv": [32.0853, 34.7818],
  // Laos
  "Luang Prabang": [19.8845, 102.1348],
  // Brunei
  "Bandar Seri Begawan": [4.9031, 114.9398],
  // Pakistan
  "Lahore": [31.5204, 74.3587],
  "Hunza": [36.3167, 74.6500],
  // Bangladesh
  "Dhaka": [23.8103, 90.4125],
  // New Zealand
  "Taupō": [-38.6857, 176.0702],
  "Auckland": [-36.8485, 174.7633],
  "Rotorua": [-38.1368, 176.2497],
  "Queenstown": [-45.0312, 168.6626],
  "Wānaka": [-44.7032, 169.1322],
  "Wanaka": [-44.7032, 169.1322],
  "Arrowtown": [-44.9393, 168.8304],
  "Otago": [-45.0312, 168.6626],
};

export const COUNTRY_GEO: Record<string, [number, number]> = {
  "India": [20.5937, 78.9629],
  "Japan": [36.2048, 138.2529],
  "Thailand": [15.8700, 100.9925],
  "Vietnam": [14.0583, 108.2772],
  "Philippines": [12.8797, 121.7740],
  "Indonesia": [-0.7893, 113.9213],
  "Nepal": [28.3949, 84.1240],
  "Sri Lanka": [7.8731, 80.7718],
  "Malaysia": [4.2105, 101.9758],
  "Singapore": [1.3521, 103.8198],
  "South Korea": [35.9078, 127.7669],
  "China": [35.8617, 104.1954],
  "Taiwan": [23.6978, 120.9605],
  "Maldives": [3.2028, 73.2207],
  "Cambodia": [12.5657, 104.9910],
  "Myanmar": [21.9162, 95.9560],
  "Mongolia": [46.8625, 103.8467],
  "Bhutan": [27.5142, 90.4336],
  "Kyrgyzstan": [41.2044, 74.7661],
  "Georgia": [42.3154, 43.3569],
  "Kazakhstan": [48.0196, 66.9237],
  "Azerbaijan": [40.1431, 47.5769],
  "Jordan": [30.5852, 36.2384],
  "Oman": [21.4735, 55.9754],
  "UAE": [23.4241, 53.8478],
  "Israel": [31.0461, 34.8516],
  "Laos": [19.8563, 102.4955],
  "Brunei": [4.5353, 114.7277],
  "Pakistan": [30.3753, 69.3451],
  "Bangladesh": [23.6850, 90.3563],
  "New Zealand": [-40.9006, 174.8860],
};

export function getCoords(race: { lat?: string | null; lng?: string | null; location: string; country: string }): [number, number] | null {
  if (race.lat && race.lng) {
    const lat = parseFloat(race.lat);
    const lng = parseFloat(race.lng);
    if (!isNaN(lat) && !isNaN(lng)) return [lat, lng];
  }
  // Try city match
  const city = race.location.split(",")[0].trim();
  if (CITY_GEO[city]) return CITY_GEO[city];
  if (CITY_GEO[race.location]) return CITY_GEO[race.location];
  // Fall back to country
  if (COUNTRY_GEO[race.country]) return COUNTRY_GEO[race.country];
  return null;
}

export const COUNTRY_WEATHER: Record<string, { flag: string; best: string }> = {
  "India": { flag: "🇮🇳", best: "Oct–Mar" },
  "Japan": { flag: "🇯🇵", best: "Mar–May, Oct–Nov" },
  "Thailand": { flag: "🇹🇭", best: "Nov–Feb" },
  "Vietnam": { flag: "🇻🇳", best: "Nov–Apr" },
  "Philippines": { flag: "🇵🇭", best: "Dec–May" },
  "Indonesia": { flag: "🇮🇩", best: "May–Sep" },
  "Nepal": { flag: "🇳🇵", best: "Oct–Nov, Mar–May" },
  "Sri Lanka": { flag: "🇱🇰", best: "Dec–Mar" },
  "Malaysia": { flag: "🇲🇾", best: "Mar–Oct" },
  "Singapore": { flag: "🇸🇬", best: "Feb–Apr" },
  "South Korea": { flag: "🇰🇷", best: "Apr–Jun, Sep–Oct" },
  "China": { flag: "🇨🇳", best: "Apr–Jun, Sep–Oct" },
  "Taiwan": { flag: "🇹🇼", best: "Oct–Mar" },
  "Maldives": { flag: "🇲🇻", best: "Nov–Apr" },
  "Cambodia": { flag: "🇰🇭", best: "Nov–Mar" },
  "Myanmar": { flag: "🇲🇲", best: "Nov–Feb" },
  "Mongolia": { flag: "🇲🇳", best: "Jun–Aug" },
  "Bhutan": { flag: "🇧🇹", best: "Mar–May, Sep–Nov" },
  "Kyrgyzstan": { flag: "🇰🇬", best: "Jun–Sep" },
  "Georgia": { flag: "🇬🇪", best: "May–Oct" },
  "Kazakhstan": { flag: "🇰🇿", best: "May–Sep" },
  "Azerbaijan": { flag: "🇦🇿", best: "Apr–Jun, Sep–Oct" },
  "Jordan": { flag: "🇯🇴", best: "Mar–May, Sep–Nov" },
  "Oman": { flag: "🇴🇲", best: "Oct–Mar" },
  "UAE": { flag: "🇦🇪", best: "Nov–Mar" },
  "Israel": { flag: "🇮🇱", best: "Mar–May, Sep–Nov" },
  "Laos": { flag: "🇱🇦", best: "Nov–Feb" },
  "Brunei": { flag: "🇧🇳", best: "Mar–Oct" },
  "Pakistan": { flag: "🇵🇰", best: "Mar–May, Sep–Nov" },
  "Bangladesh": { flag: "🇧🇩", best: "Nov–Feb" },
  "New Zealand": { flag: "🇳🇿", best: "Nov–Apr" },
};
