-- =============================================
-- 2027 RACE EXPANSION — June 2026
-- Adding New Zealand + more Asia 2027 confirmed + predicted
-- =============================================

-- =============================================
-- FIX: SEOUL MARATHON 2027 correct date
-- Confirmed: Mar 21, 2027 (from seoul-marathon.com, run2gather.com)
-- =============================================
UPDATE races SET date = 'Mar 21, 2027', note = 'Confirmed date from seoul-marathon.com' WHERE id = 278;

-- =============================================
-- FIX: Add Ironman Vietnam 2027 (full distance - new from 2026 debut)
-- Already have 70.3, now also add full distance
-- =============================================

-- Add full Ironman Vietnam 2027 predicted
INSERT OR IGNORE INTO races (name, location, country, date, distance, type, team, url, note, status)
VALUES (
  'Ironman Vietnam 2027',
  'Da Nang, Vietnam',
  'Vietnam',
  'May 2027',
  '140.6mi',
  'triathlon',
  '',
  'https://www.ironman.com/races/im-vietnam',
  'Full distance Ironman Vietnam — debut in 2026 (May 10). Predicted 2027 continuation.',
  'watchlist'
);

-- =============================================
-- ADD: HYROX CHIBA 2026 (Japan — missed)
-- Confirmed: Aug 7-9, 2026 at Makuhari Messe, Chiba
-- =============================================
INSERT OR IGNORE INTO races (name, location, country, date, distance, type, team, url, note, status)
VALUES (
  'HYROX Chiba',
  'Makuhari Messe, Chiba, Japan',
  'Japan',
  'Aug 7, 2026',
  '8km+8 stations',
  'hyrox',
  '',
  'https://hyrox.com',
  'Confirmed Aug 7-9, 2026, Makuhari Messe, Chiba. New Japan city for HYROX.',
  'active'
);

-- ADD: HYROX Chiba 2027 predicted
INSERT OR IGNORE INTO races (name, location, country, date, distance, type, team, url, note, status)
VALUES (
  'HYROX Chiba 2027',
  'Makuhari Messe, Chiba, Japan',
  'Japan',
  'Aug 2027',
  '8km+8 stations',
  'hyrox',
  '',
  'https://hyrox.com',
  'Predicted from 2026 HYROX Chiba (Aug 7-9). Exact date TBC.',
  'watchlist'
);

-- =============================================
-- ADD: HYROX Jakarta 2026 (missed)
-- Confirmed: Jun 27-28, 2026
-- =============================================
INSERT OR IGNORE INTO races (name, location, country, date, distance, type, team, url, note, status)
VALUES (
  'HYROX Jakarta',
  'Jakarta, Indonesia',
  'Indonesia',
  'Jun 27, 2026',
  '8km+8 stations',
  'hyrox',
  '',
  'https://hyrox.com',
  'Confirmed Jun 27-28, 2026, Jakarta. Confirmed via hyroxmap.xyz and redbull.com.',
  'active'
);

-- ADD: HYROX Jakarta 2027 predicted
INSERT OR IGNORE INTO races (name, location, country, date, distance, type, team, url, note, status)
VALUES (
  'HYROX Jakarta 2027',
  'Jakarta, Indonesia',
  'Indonesia',
  'Jun 2027',
  '8km+8 stations',
  'hyrox',
  '',
  'https://hyrox.com',
  'Predicted from 2026 HYROX Jakarta (Jun 27-28). Exact date TBC.',
  'watchlist'
);

-- =============================================
-- ADD: DAEGU MARATHON (Korea) — missed from original DB
-- 2026: Feb 22, 2026 (confirmed from official site)
-- 2027: Feb 28, 2027 predicted (4th Sunday of Feb)
-- =============================================
INSERT OR IGNORE INTO races (name, location, country, date, distance, type, team, url, note, status)
VALUES (
  'Daegu Marathon',
  'Daegu Stadium, Daegu',
  'South Korea',
  'Feb 22, 2026',
  '42.2km',
  'running',
  '',
  'https://daegumarathon.daegu.go.kr',
  'AIMS certified World Athletics label marathon. 40,000 runners.',
  'active'
);

INSERT OR IGNORE INTO races (name, location, country, date, distance, type, team, url, note, status)
VALUES (
  'Daegu Marathon 2027',
  'Daegu Stadium, Daegu',
  'South Korea',
  'Feb 28, 2027',
  '42.2km',
  'running',
  '',
  'https://daegumarathon.daegu.go.kr',
  'Predicted Feb 28 2027 (4th Sunday of Feb). 2026 was Feb 22.',
  'watchlist'
);

-- =============================================
-- ADD: JTBC Seoul Marathon (Korea) — Korea's big autumn marathon
-- 2026: Nov 1, 2026 (confirmed aims-worldrunning.org)
-- 2027: Nov 2027 predicted
-- =============================================
INSERT OR IGNORE INTO races (name, location, country, date, distance, type, team, url, note, status)
VALUES (
  'JTBC Seoul Marathon',
  'Sangam World Cup Park, Seoul',
  'South Korea',
  'Nov 1, 2026',
  '42.2km',
  'running',
  '',
  'https://marathon.jtbc.com',
  'Major Seoul autumn marathon. Full + Half + 10K. Confirmed Nov 1, 2026.',
  'active'
);

INSERT OR IGNORE INTO races (name, location, country, date, distance, type, team, url, note, status)
VALUES (
  'JTBC Seoul Marathon 2027',
  'Sangam World Cup Park, Seoul',
  'South Korea',
  'Nov 2027',
  '42.2km',
  'running',
  '',
  'https://marathon.jtbc.com',
  'Predicted Nov 2027 from 2026 (Nov 1). Exact date TBC.',
  'watchlist'
);

-- =============================================
-- ADD: SCENIC HALF MARATHON KRABI
-- 2026: Sep 11-12, 2026 (confirmed aims-worldrunning.org + katarabeachclubkrabi.com)
-- 2027: Sep 2027 predicted
-- =============================================
INSERT OR IGNORE INTO races (name, location, country, date, distance, type, team, url, note, status)
VALUES (
  'Scenic Half Marathon Krabi',
  'Ao Nang, Krabi',
  'Thailand',
  'Sep 12, 2026',
  '21.1km',
  'running',
  '',
  'https://www.scenicmarathon.com',
  'AIMS certified. Limestone cliffs + Andaman Sea course. Sep 11-12, 2026.',
  'active'
);

INSERT OR IGNORE INTO races (name, location, country, date, distance, type, team, url, note, status)
VALUES (
  'Scenic Half Marathon Krabi 2027',
  'Ao Nang, Krabi',
  'Thailand',
  'Sep 2027',
  '21.1km',
  'running',
  '',
  'https://www.scenicmarathon.com',
  'Predicted Sep 2027 from 2026 (Sep 11-12). Exact date TBC.',
  'watchlist'
);

-- =============================================
-- ADD: ANGKOR TRAIL (Ultra Trail Angkor — Cambodia)
-- 2027: Jan 23, 2027 confirmed (finishers.com + worldsmarathons.com)
-- =============================================
INSERT OR IGNORE INTO races (name, location, country, date, distance, type, team, url, note, status)
VALUES (
  'Ultra Trail Angkor 2027',
  'Siem Reap, Cambodia',
  'Cambodia',
  'Jan 23, 2027',
  '100km/64km/42km/21km',
  'trail',
  '',
  'https://ultratrail-angkor.com',
  'Confirmed Jan 23, 2027. Multiple distances 10-100km through Angkor temples.',
  'active'
);

-- ADD: Angkor Empire Marathon (different event from Angkor Trail)
-- 2026: Aug 1-2 (confirmed checkpointspot.asia)
INSERT OR IGNORE INTO races (name, location, country, date, distance, type, team, url, note, status)
VALUES (
  'Angkor Empire Marathon',
  'Siem Reap, Cambodia',
  'Cambodia',
  'Aug 1, 2026',
  '42.2km/21.1km/10km',
  'running',
  '',
  'https://kh.checkpointspot.asia/event/aem2026',
  'Royal Angkor Resort venue. Full, Half, 10km + Fun Run. Confirmed Aug 1-2, 2026.',
  'active'
);

INSERT OR IGNORE INTO races (name, location, country, date, distance, type, team, url, note, status)
VALUES (
  'Angkor Empire Marathon 2027',
  'Siem Reap, Cambodia',
  'Cambodia',
  'Aug 2027',
  '42.2km/21.1km/10km',
  'running',
  '',
  'https://kh.checkpointspot.asia',
  'Predicted Aug 2027 from 2026 (Aug 1-2). Exact date TBC.',
  'watchlist'
);

-- =============================================
-- ADD: OCEAN SWIM / SWIMRUN KRABI
-- Oceanman Krabi: Mar 28-29, 2026 confirmed
-- =============================================
INSERT OR IGNORE INTO races (name, location, country, date, distance, type, team, url, note, status)
VALUES (
  'Oceanman Krabi',
  'Dusit Thani Krabi Beach Resort, Krabi',
  'Thailand',
  'Mar 28, 2026',
  '1km/5km/10km',
  'ocean-swim',
  '',
  'https://worldsmarathons.com/marathon/oceanman-krabi',
  'Open water ocean swim. Multiple distances. Confirmed Mar 28-29, 2026.',
  'active'
);

INSERT OR IGNORE INTO races (name, location, country, date, distance, type, team, url, note, status)
VALUES (
  'Oceanman Krabi 2027',
  'Krabi, Thailand',
  'Thailand',
  'Mar 2027',
  '1km/5km/10km',
  'ocean-swim',
  '',
  'https://worldsmarathons.com/marathon/oceanman-krabi',
  'Predicted Mar 2027 from 2026 (Mar 28-29). Exact date TBC.',
  'watchlist'
);

-- =============================================
-- ADD: NEW ZEALAND RACES
-- =============================================

-- Ironman New Zealand + 70.3 2027 (confirmed Mar 6, 2027 — nzrunning.co.nz, ironman.com)
INSERT OR IGNORE INTO races (name, location, country, date, distance, type, team, url, note, status)
VALUES (
  'Ironman New Zealand',
  'Taupō, New Zealand',
  'New Zealand',
  'Mar 6, 2027',
  '140.6mi',
  'triathlon',
  '',
  'https://www.ironman.com/races/im-new-zealand',
  'Confirmed Mar 6, 2027 at Lake Taupō. 3.8km swim + 180km bike + 42.2km run.',
  'active'
);

INSERT OR IGNORE INTO races (name, location, country, date, distance, type, team, url, note, status)
VALUES (
  'Ironman 70.3 New Zealand',
  'Taupō, New Zealand',
  'New Zealand',
  'Mar 6, 2027',
  '70.3mi',
  'triathlon',
  '',
  'https://www.ironman.com/races/im703-new-zealand',
  'Confirmed Mar 6, 2027 at Lake Taupō. Runs same weekend as full Ironman NZ.',
  'active'
);

-- Tarawera Ultra-Trail by UTMB — confirmed Feb 13-15, 2027 (utmb.world, nzrunning.co.nz)
INSERT OR IGNORE INTO races (name, location, country, date, distance, type, team, url, note, status)
VALUES (
  'Tarawera Ultra-Trail by UTMB',
  'Rotorua, New Zealand',
  'New Zealand',
  'Feb 13, 2027',
  '14km/23km/102km/163km',
  'trail',
  '',
  'https://utmb.world',
  'UTMB World Series. Feb 13-15, 2027. Rotorua lakefront. Multi-distance trail.',
  'active'
);

-- Auckland Marathon — Nov 1, 2026 predicted → Nov 2027
INSERT OR IGNORE INTO races (name, location, country, date, distance, type, team, url, note, status)
VALUES (
  'Runaway Auckland Marathon',
  'Auckland, New Zealand',
  'New Zealand',
  'Nov 1, 2026',
  '42.2km/21.1km',
  'running',
  '',
  'https://www.aucklandmarathon.co.nz',
  'Confirmed Nov 1, 2026. Devonport to Victoria Park. Major NZ marathon.',
  'active'
);

INSERT OR IGNORE INTO races (name, location, country, date, distance, type, team, url, note, status)
VALUES (
  'Runaway Auckland Marathon 2027',
  'Auckland, New Zealand',
  'New Zealand',
  'Nov 2027',
  '42.2km/21.1km',
  'running',
  '',
  'https://www.aucklandmarathon.co.nz',
  'Predicted Nov 2027. 2026 was Nov 1. Exact date TBC.',
  'watchlist'
);

-- Queenstown Marathon — Nov 14, 2026 (confirmed)
INSERT OR IGNORE INTO races (name, location, country, date, distance, type, team, url, note, status)
VALUES (
  'Queenstown Marathon',
  'Arrowtown to Queenstown, Otago',
  'New Zealand',
  'Nov 14, 2026',
  '42.2km/21.1km/10km',
  'running',
  '',
  'https://www.queenstown-marathon.co.nz',
  'Confirmed Nov 14, 2026. Iconic course through Central Otago wine country.',
  'active'
);

INSERT OR IGNORE INTO races (name, location, country, date, distance, type, team, url, note, status)
VALUES (
  'Queenstown Marathon 2027',
  'Arrowtown to Queenstown, Otago',
  'New Zealand',
  'Nov 2027',
  '42.2km/21.1km/10km',
  'running',
  '',
  'https://www.queenstown-marathon.co.nz',
  'Predicted Nov 2027 from 2026 (Nov 14). Exact date TBC.',
  'watchlist'
);

-- Motatapu (Otago trail race) — Mar 6, 2027 confirmed
INSERT OR IGNORE INTO races (name, location, country, date, distance, type, team, url, note, status)
VALUES (
  'Motatapu Trail Race 2027',
  'Arrowtown to Wanaka, Otago',
  'New Zealand',
  'Mar 6, 2027',
  '53km/15km',
  'trail',
  '',
  'https://www.motatapu.com',
  'Confirmed Mar 6, 2027. Point-to-point trail through high country station.',
  'active'
);

-- Challenge Wanaka Half Triathlon — Feb 20, 2027 (confirmed running.life)
INSERT OR IGNORE INTO races (name, location, country, date, distance, type, team, url, note, status)
VALUES (
  'Challenge Wanaka Half Triathlon 2027',
  'Wānaka, Otago',
  'New Zealand',
  'Feb 20, 2027',
  '70.3mi',
  'triathlon',
  '',
  'https://www.challengewanaka.com',
  'Confirmed Feb 20, 2027. Half-distance triathlon in scenic Wanaka.',
  'active'
);

-- =============================================
-- ADD: UTMB / TRAIL 2027 CONFIRMED RACES
-- =============================================

-- Vietnam Highlands Trail by UTMB — Jan 8-10, 2027 (confirmed utmb.world May 2026)
INSERT OR IGNORE INTO races (name, location, country, date, distance, type, team, url, note, status)
VALUES (
  'Vietnam Highlands Trail by UTMB 2027',
  'Da Lat, Lam Dong, Vietnam',
  'Vietnam',
  'Jan 8, 2027',
  '5km/10km/20km/50km/100km',
  'trail',
  '',
  'https://vietnamhighlands.utmb.world',
  'Confirmed Jan 8-10, 2027. New UTMB World Series debut. Da Lat highlands — 4 peaks.',
  'active'
);

-- Ultra Trail Chiang Mai 2027 — Jan 8-10, 2027 (confirmed worldsmarathons.com)
INSERT OR IGNORE INTO races (name, location, country, date, distance, type, team, url, note, status)
VALUES (
  'Ultra Trail Chiang Mai 2027',
  'Chiang Dao, Chiang Mai, Thailand',
  'Thailand',
  'Jan 8, 2027',
  '16km/40km/76km/103km/200km',
  'trail',
  '',
  'https://www.utcm.run',
  'Confirmed Jan 8-10, 2027. ITRA certified, UTMB Index. Asia Trail Master event.',
  'active'
);

-- Amazean Jungle Thailand by UTMB — Feb 2027 (confirmed finishers.com)
INSERT OR IGNORE INTO races (name, location, country, date, distance, type, team, url, note, status)
VALUES (
  'Amazean Jungle Thailand by UTMB 2027',
  'Betong, Southern Thailand',
  'Thailand',
  'Feb 2027',
  '15km/28km/55km/102km/147km',
  'trail',
  '',
  'https://utmb.world',
  'UTMB World Series. Feb 2027 (exact date TBC). Jungle trail race in southernmost Thailand.',
  'watchlist'
);

-- Xtrail Kenting by UTMB 2027 — Mar 6-7, 2027 (confirmed xtrail.utmb.world)
INSERT OR IGNORE INTO races (name, location, country, date, distance, type, team, url, note, status)
VALUES (
  'Xtrail Kenting by UTMB 2027',
  'Kenting National Park, Taiwan',
  'Taiwan',
  'Mar 6, 2027',
  '10km/25km/50km/100km',
  'trail',
  '',
  'https://xtrail.utmb.world',
  'Confirmed Mar 6-7, 2027. Hengchun Peninsula. 100K, 50K, 25K, 10K distances.',
  'active'
);

-- Chiang Mai Thailand by UTMB (Hoka) — Nov/Dec 2026 confirmed
INSERT OR IGNORE INTO races (name, location, country, date, distance, type, team, url, note, status)
VALUES (
  'Hoka Chiang Mai by UTMB',
  'Chiang Mai, Thailand',
  'Thailand',
  'Nov 27, 2026',
  '17km/39km/56km/96km/168km',
  'trail',
  '',
  'https://utmb.world',
  'UTMB World Series Asia-Pacific Major. Nov 27–Dec 6, 2026. Confirmed.',
  'active'
);

-- =============================================
-- ADD: CHINA MARATHONS 2027 (confirmed from finishers.com)
-- =============================================

-- Xiamen Marathon 2027 — Jan 2027 (early Jan)
INSERT OR IGNORE INTO races (name, location, country, date, distance, type, team, url, note, status)
VALUES (
  'Xiamen Marathon 2027',
  'Xiamen, Fujian, China',
  'China',
  'Jan 2027',
  '42.2km',
  'running',
  '',
  'https://marathontours.com/en-us/events/xiamen-marathon/',
  'Major Chinese marathon. 2026 was Jan 11. Predicted Jan 2027. Exact date TBC.',
  'watchlist'
);

-- Chongqing Marathon 2027 — Jan 2027
INSERT OR IGNORE INTO races (name, location, country, date, distance, type, team, url, note, status)
VALUES (
  'Chongqing Marathon 2027',
  'Chongqing, China',
  'China',
  'Jan 2027',
  '42.2km',
  'running',
  '',
  'https://www.finishers.com',
  'Predicted Jan 2027 from 2026 pattern. Exact date TBC.',
  'watchlist'
);

-- Wuhan Marathon 2027 — Mar 2027
INSERT OR IGNORE INTO races (name, location, country, date, distance, type, team, url, note, status)
VALUES (
  'Wuhan Marathon 2027',
  'Wuhan, Hubei, China',
  'China',
  'Mar 2027',
  '42.2km',
  'running',
  '',
  'https://www.finishers.com',
  'Confirmed Mar 2027 on finishers.com China calendar. Exact date TBC.',
  'watchlist'
);

-- Great Wall of China Marathon 2027 — May 1, 2027 (worldsmarathons.com confirmed)
INSERT OR IGNORE INTO races (name, location, country, date, distance, type, team, url, note, status)
VALUES (
  'Great Wall of China Marathon 2027',
  'Huangyaguan, Beijing, China',
  'China',
  'May 1, 2027',
  '42.2km/21.1km/10km/5km',
  'running',
  '',
  'https://worldsmarathons.com/marathon/great-wall-of-china-marathon',
  'Confirmed May 1, 2027. Iconic race over 5,164 steps of the Great Wall.',
  'active'
);

-- Qingdao Marathon 2027 — Apr 2027
INSERT OR IGNORE INTO races (name, location, country, date, distance, type, team, url, note, status)
VALUES (
  'Qingdao Marathon 2027',
  'Qingdao, Shandong, China',
  'China',
  'Apr 2027',
  '42.2km/21.1km',
  'running',
  '',
  'https://www.finishers.com',
  'Predicted Apr 2027 from prior year pattern. Coastal city marathon. Exact date TBC.',
  'watchlist'
);

-- Hangzhou Marathon 2027 — Nov 2027 (historic Nov pattern)
INSERT OR IGNORE INTO races (name, location, country, date, distance, type, team, url, note, status)
VALUES (
  'Hangzhou International Marathon 2027',
  'Hangzhou, Zhejiang, China',
  'China',
  'Nov 2027',
  '42.2km',
  'running',
  '',
  'https://www.finishers.com',
  'Historic Nov race, running since 1987. Predicted Nov 2027. Exact date TBC.',
  'watchlist'
);

-- =============================================
-- ADD: KOREA ADDITIONAL RACES 2027
-- =============================================

-- JTBC Seoul Marathon 2027 already added above

-- Gyeongju Marathon 2027 — Oct 2027 (2026: Oct 17)
UPDATE races SET date = 'Oct 17, 2026', note = 'Confirmed Oct 17, 2026 from aims-worldrunning.org' WHERE name = 'Gyeongju International Marathon';
INSERT OR IGNORE INTO races (name, location, country, date, distance, type, team, url, note, status)
SELECT 'Gyeongju International Marathon 2027', 'Gyeongju, North Gyeongsang', 'South Korea', 'Oct 2027', '42.2km', 'running', '', 'https://www.gyeongju-marathon.or.kr', 'Historic AIMS-certified marathon. 2026 was Oct 17. Predicted Oct 2027.', 'watchlist'
WHERE NOT EXISTS (SELECT 1 FROM races WHERE name = 'Gyeongju International Marathon 2027');

-- Jeju International Marathon 2027 — Jun 2027 predicted
INSERT OR IGNORE INTO races (name, location, country, date, distance, type, team, url, note, status)
VALUES (
  'Jeju International Marathon 2027',
  'Jeju Island, South Korea',
  'South Korea',
  'Jun 2027',
  '10km',
  'running',
  '',
  'https://www.jejumarathon.com',
  'Annual Jeju tourism marathon. 2026 was Jun 7. Predicted Jun 2027. Exact date TBC.',
  'watchlist'
);

-- =============================================
-- ADD: VIETNAM EXTRA RACES 2027
-- =============================================

-- VnExpress Marathon Danang International 2027 — already in DB as Da Nang International Marathon 2027
-- Da Nang International Marathon 2027 already in DB at Aug 16

-- Techcombank Hanoi International Marathon 2027 — Oct 2027
INSERT OR IGNORE INTO races (name, location, country, date, distance, type, team, url, note, status)
VALUES (
  'Techcombank Hanoi International Marathon 2027',
  'Hanoi, Vietnam',
  'Vietnam',
  'Oct 2027',
  '42.2km/21.1km/10km/5km',
  'running',
  '',
  'https://www.hanoiinternationalmarathon.com',
  'Major Hanoi marathon. 2026 was Oct 3-4. Predicted Oct 2027. Exact date TBC.',
  'watchlist'
);

-- Vietnam Highlands Trail UTMB already added above
-- Vietnam Trail Marathon 2027 — Jan 16, 2027 (Asia Trail Master)
INSERT OR IGNORE INTO races (name, location, country, date, distance, type, team, url, note, status)
VALUES (
  'Vietnam Trail Marathon 2027',
  'Vietnam',
  'Vietnam',
  'Jan 16, 2027',
  '70km',
  'trail',
  '',
  'https://www.asiatrailmaster.com',
  'Asia Trail Master Series. Confirmed Jan 16, 2027.',
  'active'
);

-- =============================================
-- ADD: THAILAND EXTRA RACES 2027
-- =============================================

-- Ultra Trail Chiang Mai UTMB already added above

-- Chiang Mai Sri Lanna Triathlon 2027 — Jan 13-17, 2027 confirmed
INSERT OR IGNORE INTO races (name, location, country, date, distance, type, team, url, note, status)
VALUES (
  'Chiang Mai Sri Lanna Triathlon 2027',
  'Sri Lanna, Chiang Mai, Thailand',
  'Thailand',
  'Jan 13, 2027',
  'Various',
  'triathlon',
  '',
  'https://www.triathlon-thailand.de',
  'Confirmed Jan 13-17, 2027. Lake triathlon in Chiang Mai.',
  'active'
);

-- Krabi runs already added (Scenic Half + Oceanman)

-- Amazean Jungle already added

-- =============================================
-- ADD: JAPAN EXTRA RACES 2027
-- =============================================

-- Fukuoka Marathon 2027 already in DB at Dec 7
-- Kobe Marathon 2027 already in DB at Nov 15

-- Osaka Marathon 2027 already fixed to Feb 28

-- Dalian International Marathon 2027 — Apr 2027
INSERT OR IGNORE INTO races (name, location, country, date, distance, type, team, url, note, status)
VALUES (
  'Dalian International Marathon 2027',
  'Dalian, Liaoning, China',
  'China',
  'Apr 2027',
  '42.2km/21.1km',
  'running',
  '',
  'https://www.finishers.com',
  'Major Chinese coastal marathon, running since 1987. Predicted Apr 2027. Exact date TBC.',
  'watchlist'
);

-- =============================================
-- ADD: MALAYSIA EXTRA RACES 2027
-- =============================================

-- Ironman 70.3 Desaru Coast 2027 — May 2027 predicted (2026: May 25)
INSERT OR IGNORE INTO races (name, location, country, date, distance, type, team, url, note, status)
VALUES (
  'Ironman 70.3 Desaru Coast 2027',
  'Desaru Coast, Johor, Malaysia',
  'Malaysia',
  'May 2027',
  '70.3mi',
  'triathlon',
  '',
  'https://www.ironman.com/races/im703-desaru-coast',
  'Predicted May 2027 from 2026 (May 25). Ironman 70.3 at luxury resort in Johor.',
  'watchlist'
);

-- Malaysia Ultra-Trail by UTMB — Sep 11-13, 2026 (confirmed utmb.world)
INSERT OR IGNORE INTO races (name, location, country, date, distance, type, team, url, note, status)
VALUES (
  'Malaysia Ultra-Trail by UTMB',
  'Taiping, Perak, Malaysia',
  'Malaysia',
  'Sep 11, 2026',
  '14km/26km/54km/98km',
  'trail',
  '',
  'https://utmb.world',
  'UTMB World Series. Confirmed Sep 11-13, 2026, Taiping Perak.',
  'active'
);

INSERT OR IGNORE INTO races (name, location, country, date, distance, type, team, url, note, status)
VALUES (
  'Malaysia Ultra-Trail by UTMB 2027',
  'Taiping, Perak, Malaysia',
  'Malaysia',
  'Sep 2027',
  '14km/26km/54km/98km',
  'trail',
  '',
  'https://utmb.world',
  'UTMB World Series. Predicted Sep 2027 from 2026 (Sep 11-13). Exact date TBC.',
  'watchlist'
);

-- =============================================
-- ADD: IRONMAN SUBIC BAY PHILIPPINES 2027 predicted
-- 2026: Jun 7 (confirmed). Predicted Jun 2027
-- =============================================
INSERT OR IGNORE INTO races (name, location, country, date, distance, type, team, url, note, status)
VALUES (
  'Ironman Philippines Subic Bay 2027',
  'Subic Bay, Philippines',
  'Philippines',
  'Jun 2027',
  '140.6mi',
  'triathlon',
  '',
  'https://www.ironman.com/races/im-philippines',
  'Predicted Jun 2027 from 2026 (Jun 7, Subic Bay). Exact date TBC.',
  'watchlist'
);

-- =============================================
-- ADD: IRONMAN 70.3 SUBIC BAY PHILIPPINES 2027
-- Already have: Ironman 70.3 Philippines (Clark) and (Cebu) and Mactan
-- Subic Bay 70.3 also runs same day as full — add 2027 version
-- =============================================
INSERT OR IGNORE INTO races (name, location, country, date, distance, type, team, url, note, status)
VALUES (
  'Ironman 70.3 Subic Bay Philippines 2027',
  'Subic Bay, Philippines',
  'Philippines',
  'Jun 2027',
  '70.3mi',
  'triathlon',
  '',
  'https://www.ironman.com/races/im703-subic-bay-philippines',
  'Predicted Jun 2027. Runs same weekend as full Ironman Subic Bay.',
  'watchlist'
);

-- =============================================
-- ADD: IRONMAN 70.3 LANGKAWI 2027 (Malaysia)
-- 2026: Nov 21 confirmed
-- =============================================
INSERT OR IGNORE INTO races (name, location, country, date, distance, type, team, url, note, status)
VALUES (
  'Ironman Langkawi',
  'Langkawi, Malaysia',
  'Malaysia',
  'Nov 21, 2026',
  '140.6mi',
  'triathlon',
  '',
  'https://www.ironman.com',
  'Full Ironman Langkawi, Malaysia. Confirmed Nov 21, 2026.',
  'active'
);

INSERT OR IGNORE INTO races (name, location, country, date, distance, type, team, url, note, status)
VALUES (
  'Ironman Langkawi 2027',
  'Langkawi, Malaysia',
  'Malaysia',
  'Nov 2027',
  '140.6mi',
  'triathlon',
  '',
  'https://www.ironman.com',
  'Predicted Nov 2027 from 2026 (Nov 21). Exact date TBC.',
  'watchlist'
);

-- =============================================
-- ADD: IRONMAN 70.3 PHUKET PHU QUOC (Vietnam)
-- Phu Quoc island Ironman 70.3 2026/2027
-- =============================================
INSERT OR IGNORE INTO races (name, location, country, date, distance, type, team, url, note, status)
VALUES (
  'Ironman 70.3 Phu Quoc 2027',
  'Phu Quoc Island, Vietnam',
  'Vietnam',
  'Nov 2027',
  '70.3mi',
  'triathlon',
  '',
  'https://www.ironman.com/races/im703-phu-quoc',
  'Predicted Nov 2027. Ironman 70.3 on Phu Quoc island, Vietnam.',
  'watchlist'
);

-- =============================================
-- ADD: HYROX AUCKLAND (New Zealand) — confirmed Jan 29-Feb 1, 2027
-- =============================================
INSERT OR IGNORE INTO races (name, location, country, date, distance, type, team, url, note, status)
VALUES (
  'HYROX Auckland 2027',
  'Auckland, New Zealand',
  'New Zealand',
  'Jan 29, 2027',
  '8km+8 stations',
  'hyrox',
  '',
  'https://hyrox.com',
  'Confirmed Jan 29–Feb 1, 2027. BYD HYROX Auckland.',
  'active'
);

-- =============================================
-- ADD: HYROX INCHEON Korea 2027
-- 2026 (Season 8): May 15-17
-- Season 9 (2026/27): TBC — announced city
-- =============================================
INSERT OR IGNORE INTO races (name, location, country, date, distance, type, team, url, note, status)
VALUES (
  'HYROX Incheon 2026',
  'Incheon, South Korea',
  'South Korea',
  'May 15, 2026',
  '8km+8 stations',
  'hyrox',
  '',
  'https://hyrox.com',
  'Confirmed May 15-17, 2026 Incheon. AirAsia HYROX Incheon.',
  'active'
);

INSERT OR IGNORE INTO races (name, location, country, date, distance, type, team, url, note, status)
VALUES (
  'HYROX Incheon 2027',
  'Incheon, South Korea',
  'South Korea',
  'May 2027',
  '8km+8 stations',
  'hyrox',
  '',
  'https://hyrox.com',
  'Predicted May 2027 from 2026 (May 15-17). Exact date TBC.',
  'watchlist'
);

-- =============================================
-- ADD: HYROX WUHAN China 2026 (confirmed hyresult.com has Wuhan)
-- =============================================
INSERT OR IGNORE INTO races (name, location, country, date, distance, type, team, url, note, status)
VALUES (
  'HYROX Wuhan',
  'Wuhan, Hubei, China',
  'China',
  'Apr 11, 2026',
  '8km+8 stations',
  'hyrox',
  '',
  'https://hyrox.com',
  'Confirmed Apr 11, 2026, Wuhan China. freeleticsgoals.com schedule.',
  'active'
);

-- =============================================
-- ADD: HYROX HONG KONG 2026 (Cigna Healthcare)
-- May 8-10, 2026 confirmed from hyroxmap.xyz
-- =============================================
INSERT OR IGNORE INTO races (name, location, country, date, distance, type, team, url, note, status)
VALUES (
  'HYROX Hong Kong 2026',
  'Hong Kong',
  'China',
  'May 8, 2026',
  '8km+8 stations',
  'hyrox',
  '',
  'https://hyrox.com',
  'Confirmed May 8-10, 2026. Cigna Healthcare HYROX Hong Kong.',
  'active'
);

INSERT OR IGNORE INTO races (name, location, country, date, distance, type, team, url, note, status)
VALUES (
  'HYROX Hong Kong 2027',
  'Hong Kong',
  'China',
  'May 2027',
  '8km+8 stations',
  'hyrox',
  '',
  'https://hyrox.com',
  'Predicted May 2027 from 2026 (May 8-10). Separate from World Champs Jun 10-13.',
  'watchlist'
);

-- =============================================
-- ADD: HYROX TAIPEI 2026
-- Feb 28–Mar 1, 2026 confirmed (freeleticsgoals.com)
-- =============================================
INSERT OR IGNORE INTO races (name, location, country, date, distance, type, team, url, note, status)
VALUES (
  'HYROX Taipei',
  'Taipei, Taiwan',
  'Taiwan',
  'Feb 28, 2026',
  '8km+8 stations',
  'hyrox',
  '',
  'https://hyrox.com',
  'Confirmed Feb 28–Mar 1, 2026, Taipei Taiwan.',
  'active'
);

INSERT OR IGNORE INTO races (name, location, country, date, distance, type, team, url, note, status)
VALUES (
  'HYROX Taipei 2027',
  'Taipei, Taiwan',
  'Taiwan',
  'Feb 2027',
  '8km+8 stations',
  'hyrox',
  '',
  'https://hyrox.com',
  'Predicted Feb 2027 from 2026 (Feb 28–Mar 1). Exact date TBC.',
  'watchlist'
);

-- =============================================
-- ADD: HYROX OSAKA 2026 — AirAsia
-- Jan 30–Feb 1, 2026 confirmed
-- =============================================
INSERT OR IGNORE INTO races (name, location, country, date, distance, type, team, url, note, status)
VALUES (
  'HYROX Osaka',
  'Osaka, Japan',
  'Japan',
  'Jan 30, 2026',
  '8km+8 stations',
  'hyrox',
  '',
  'https://hyrox.com',
  'Confirmed Jan 30–Feb 1, 2026. AirAsia HYROX Osaka.',
  'active'
);

INSERT OR IGNORE INTO races (name, location, country, date, distance, type, team, url, note, status)
VALUES (
  'HYROX Osaka 2027',
  'Osaka, Japan',
  'Japan',
  'Jan 2027',
  '8km+8 stations',
  'hyrox',
  '',
  'https://hyrox.com',
  'Predicted Jan 2027 from 2026 (Jan 30). Exact date TBC.',
  'watchlist'
);

-- =============================================
-- ADD: HYROX BANGKOK 2027
-- 2026 (Season 8): Mar 20-22, 2026
-- Season 9 (2026/27): Announced, date TBC
-- =============================================
-- Already have HYROX Bangkok 2027 in DB (id=235, Sep 19, 2027)
-- Update it to confirmed season 8 pattern + add 2026 entry
INSERT OR IGNORE INTO races (name, location, country, date, distance, type, team, url, note, status)
VALUES (
  'HYROX Bangkok',
  'Bangkok, Thailand',
  'Thailand',
  'Mar 20, 2026',
  '8km+8 stations',
  'hyrox',
  '',
  'https://hyrox.com',
  'Confirmed Mar 20-22, 2026, Bangkok. Season 8 HYROX.',
  'active'
);

-- HYROX Bangkok 2027 already exists (id=235) — update note
UPDATE races SET note = 'Season 9 announced city. 2026 was Mar 20-22. Predicted Mar 2027.', date = 'Mar 2027' WHERE id = 235;

-- =============================================
-- ADD: HYROX SINGAPORE 2026 (Season 8)
-- Apr 3-5, 2026 confirmed (freeleticsgoals.com, hyroxmap.xyz)
-- Already in DB? Check: id=148 is AIA HYROX Singapore Apr 5, 2026 — that's correct
-- ADD Season 9 Singapore — announced TBC
-- =============================================
-- Already in DB: HYROX Singapore Sep 5, 2027 (id=294) and Apr 4, 2027 (id=292)
-- These are correct. No changes needed.

-- =============================================
-- ADD: HYROX BEIJING 2026 (Season 8)
-- Mar 21-22, 2026 confirmed (freeleticsgoals.com)
-- Already in DB? Check existing Beijing entry
-- =============================================
-- Already in DB from prior season? Let me add it
INSERT OR IGNORE INTO races (name, location, country, date, distance, type, team, url, note, status)
SELECT 'HYROX Beijing (Mar)', 'Beijing, China', 'China', 'Mar 21, 2026', '8km+8 stations', 'hyrox', '', 'https://hyrox.com', 'Confirmed Mar 21-22, 2026 Beijing. Season 8 event.', 'active'
WHERE NOT EXISTS (SELECT 1 FROM races WHERE name = 'HYROX Beijing (Mar)' AND date = 'Mar 21, 2026');

-- =============================================
-- ADD: IRONMAN 70.3 KENTING TAIWAN 2027
-- 2026: Oct 6 confirmed (tridb.net). Predicted Oct 2027
-- =============================================
INSERT OR IGNORE INTO races (name, location, country, date, distance, type, team, url, note, status)
VALUES (
  'Ironman 70.3 Kenting Taiwan',
  'Kenting, Kaohsiung, Taiwan',
  'Taiwan',
  'Oct 6, 2026',
  '70.3mi',
  'triathlon',
  '',
  'https://www.ironman.com',
  'Confirmed Oct 6, 2026. Tropical southern Taiwan triathlon.',
  'active'
);

INSERT OR IGNORE INTO races (name, location, country, date, distance, type, team, url, note, status)
VALUES (
  'Ironman 70.3 Kenting Taiwan 2027',
  'Kenting, Kaohsiung, Taiwan',
  'Taiwan',
  'Oct 2027',
  '70.3mi',
  'triathlon',
  '',
  'https://www.ironman.com',
  'Predicted Oct 2027 from 2026 (Oct 6). Exact date TBC.',
  'watchlist'
);

-- =============================================
-- ADD: IRONMAN KOREA (GURYE) 2026 — confirmed Oct 4, 2026
-- Already in DB? id=140 Ironman Korea Jul 6, 2026 — that's different race
-- Actually Ironman Korea was confirmed in gowod.app as Oct 4 2026 Gurye. The DB has Jul 6 which is wrong.
-- Let's update the Ironman Korea 2026 date to Oct 4, 2026
-- =============================================
UPDATE races SET date = 'Oct 4, 2026', location = 'Gurye, South Jeolla', note = 'Confirmed Oct 4, 2026 in Gurye from gowod.app 2026 calendar' WHERE id = 140;
-- And fix the 2027 version too
UPDATE races SET date = 'Oct 2027', note = 'Predicted Oct 2027 from 2026 (Oct 4 Gurye). Exact date TBC.', status = 'watchlist' WHERE id = 282;
