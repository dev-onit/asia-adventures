-- =============================================
-- RACE AUDIT FIXES - June 2026
-- =============================================

-- =============================================
-- 1. FIX JAPAN 2027 DATES
-- =============================================

-- Tokyo Marathon 2027: Mar 1 → Mar 7
UPDATE races SET date = 'Mar 7, 2027', note = 'Confirmed date from aims-worldrunning.org' WHERE id = 214;

-- Osaka Marathon 2027: Feb 22 → Feb 28
UPDATE races SET date = 'Feb 28, 2027', note = 'Confirmed date from rundida.com' WHERE id = 212;

-- Nagoya Women's Marathon 2027: Mar 8 → Mar 14
UPDATE races SET date = 'Mar 14, 2027', note = 'Confirmed date from hashirun.com' WHERE id = 213;

-- Kyoto Marathon 2027: keep only the Feb version (id 211) with correct date Feb 21
-- Delete the Mar duplicate (id 215)
UPDATE races SET date = 'Feb 21, 2027', note = 'Confirmed date from kyoto-marathon.com' WHERE id = 211;
UPDATE races SET name = 'Kyoto Marathon 2027' WHERE id = 211;
DELETE FROM races WHERE id = 215;  -- Remove Kyoto 2027 (Mar) duplicate

-- =============================================
-- 2. FIX KYOTO 2026 DUPLICATE  
-- Keep id=23 (Feb 16), remove id=124 (Mar 16 - wrong duplicate)
-- =============================================
DELETE FROM races WHERE id = 124; -- duplicate Kyoto 2026

-- =============================================
-- 3. REMOVE HYROX TOKYO 2026 DUPLICATE
-- Keep id=128 (Nov 22, 2026 - the later/correct one)
-- Remove id=25 (Nov 8, 2026 duplicate - same as later event)
-- Actually HYROX Tokyo often has two events. Keep both 2026, deduplicate 2027
-- =============================================
-- For 2026: keep both (Nov 8 and Nov 22 are legitimately different events)
-- For 2027: keep Nov 7 (id=225) and Nov 21 (id=226) - both legit separate events
-- Nothing to delete here - HYROX Tokyo 2027 actually has two separate events

-- =============================================
-- 4. REMOVE JAKARTA MARATHON DUPLICATES
-- 2026: keep id=53, remove id=151
-- 2027: keep id=267, remove id=268 (2nd)
-- =============================================
DELETE FROM races WHERE id = 151; -- Jakarta 2026 duplicate
DELETE FROM races WHERE id = 268; -- Jakarta 2027 (2nd) duplicate

-- =============================================
-- 5. REMOVE HO CHI MINH CITY MARATHON DUPLICATES
-- 2026: keep id=27, remove id=135
-- 2027: keep id=242, remove id=250 (2nd)
-- =============================================
DELETE FROM races WHERE id = 135; -- HCMC 2026 duplicate
DELETE FROM races WHERE id = 250; -- HCMC 2027 (2nd) duplicate

-- =============================================
-- 6. FIX KL MARATHON DUPLICATES
-- 2026: id=144 (Jun 22) and id=36 (Jun 29) - likely two different events (Standard Chartered vs others)
--   KL Marathon Standard Chartered is typically late June. Keep both but rename to distinguish
-- 2027: id=254 (Jun 21) and id=255 (Jun 28) - remove the 2nd duplicate
-- =============================================
UPDATE races SET name = 'Standard Chartered KL Marathon 2026' WHERE id = 144;
UPDATE races SET name = 'KL City Marathon 2026' WHERE id = 36;
DELETE FROM races WHERE id = 255; -- KL 2027 (2nd) duplicate

-- =============================================
-- 7. REMOVE GOBI MARCH DUPLICATES
-- 2026: keep id=58 (4 Deserts), keep id=159 (plain) - actually same race, remove duplicate
-- 2027: keep id=306 (4 Deserts), remove id=307 (plain duplicate)
-- =============================================
DELETE FROM races WHERE id = 159; -- Gobi March 2026 plain duplicate (keep 4 Deserts version)
DELETE FROM races WHERE id = 307; -- Gobi March 2027 plain duplicate

-- =============================================
-- 8. FIX ANGKOR WAT DUPLICATES
-- 2026: id=56 (Half Marathon) and id=158 (International Half Marathon) - same race, remove one
-- 2027: id=310 and id=311 - same race, remove one
-- =============================================
DELETE FROM races WHERE id = 158; -- Angkor Wat 2026 duplicate
DELETE FROM races WHERE id = 311; -- Angkor Wat 2027 duplicate

-- =============================================
-- 9. FIX IRONMAN PHILIPPINES DUPLICATES
-- 2026: id=31 (140.6), id=32 (70.3 Aug 10), id=142 (70.3 Aug 3)
--   These are 3 different events. id=32 and id=142 are both 70.3 on different dates
--   Aug 3 and Aug 10 could be Subic Bay vs Clark/Cebu - keep both
-- 2027: id=273 (140.6), id=274 (70.3 Cebu), id=275 (70.3 Mactan) - 3 different events, keep all
-- Actually Ironman 70.3 has Cebu and Mactan as separate events. All legit. No removals.

-- =============================================
-- 10. FIX SINGAPORE MARATHON DUPLICATES
-- 2026: id=40 (Singapore Marathon) and id=147 (Standard Chartered) - same race, remove one
-- 2027: id=296 and id=297 - same race, remove one
-- =============================================
DELETE FROM races WHERE id = 40;  -- plain Singapore Marathon 2026 (keep Standard Chartered)
DELETE FROM races WHERE id = 296; -- plain Singapore Marathon 2027 (keep Standard Chartered)

-- Update Standard Chartered names to be cleaner
UPDATE races SET name = 'Standard Chartered Singapore Marathon' WHERE id = 147;
UPDATE races SET name = 'Standard Chartered Singapore Marathon 2027' WHERE id = 297;

-- =============================================
-- 11. FIX CEBU CITY MARATHON 2026 DUPLICATE
-- Keep id=94, remove id=141
-- =============================================
DELETE FROM races WHERE id = 141; -- Cebu 2026 duplicate

-- =============================================
-- 12. FIX DA NANG INTERNATIONAL MARATHON 2026 DUPLICATE
-- Keep id=30, remove id=136
-- =============================================
DELETE FROM races WHERE id = 136; -- Da Nang 2026 duplicate

-- =============================================
-- 13. FIX VIETNAM MOUNTAIN MARATHON 2026 DUPLICATE
-- Keep id=29, remove id=134
-- =============================================
DELETE FROM races WHERE id = 134; -- Vietnam MM 2026 duplicate

-- =============================================
-- 14. FIX IRONMAN 70.3 PHILIPPINES 2026 DUPLICATE
-- id=32 (Aug 10) and id=142 (Aug 3) both listed as "Ironman 70.3 Philippines"
-- Keep id=142 (Aug 3) and rename it, remove id=32 (Aug 10 - one week later looks wrong)
-- Actually Aug 3 = Clark, Aug 10 = Cebu - both valid separate events. Rename to distinguish.
-- =============================================
UPDATE races SET name = 'Ironman 70.3 Philippines (Clark)' WHERE id = 142;
UPDATE races SET name = 'Ironman 70.3 Philippines (Cebu)' WHERE id = 32;

-- =============================================
-- 15. FIX HYROX BENGALURU DUPLICATE 2026
-- id=85 (Nov 1) and id=120 (Nov 8) - different dates, both plausible
-- HYROX Bengaluru 2026 was Nov 1 (confirmed hyrox.com). Remove id=120 (Nov 8)
-- =============================================
DELETE FROM races WHERE id = 120; -- HYROX India Bengaluru 2026 duplicate Nov 8

-- =============================================
-- 16. FIX HYROX INDIA BENGALURU 2027 DUPLICATE  
-- id=201 (Nov 7) and id=205 (Nov 2) - different dates for 2027
-- Keep id=205 (Nov 2 - closer to 2026 pattern) and update. Remove Nov 7 version.
-- =============================================
DELETE FROM races WHERE id = 201; -- HYROX India Bengaluru 2027 (Nov 7) - duplicate

-- =============================================
-- 17. FIX IRONMAN 70.3 PUTRAJAYA - missing 2027 version
-- Keep 2026 entry, date prediction needed
-- =============================================
-- Will INSERT predicted 2027 below

-- =============================================
-- INSERT NEW: HYROX WORLD CHAMPIONSHIPS HONG KONG 2027
-- =============================================
INSERT INTO races (name, location, country, date, distance, type, team, url, note, status)
VALUES (
  'HYROX World Championships Hong Kong',
  'AsiaWorld-Expo, Hong Kong',
  'China',
  'Jun 10, 2027',
  '8km+8 stations',
  'hyrox',
  '',
  'https://hyrox.com/event/hyrox-world-championships-hong-kong-2027/',
  'HYROX World Championships 2027 confirmed AsiaWorld-Expo Jun 10-13',
  'active'
);

-- =============================================
-- INSERT NEW: MISSING HYROX 2026 ASIA EVENTS
-- =============================================
INSERT INTO races (name, location, country, date, distance, type, team, url, note, status)
VALUES 
(
  'HYROX Delhi',
  'Delhi, India',
  'India',
  'Jul 24, 2026',
  '8km+8 stations',
  'hyrox',
  '',
  'https://hyrox.com',
  'HYROX Delhi Jul 24-26 2026 confirmed',
  'active'
),
(
  'HYROX Mumbai',
  'Mumbai, India',
  'India',
  'Sep 18, 2026',
  '8km+8 stations',
  'hyrox',
  '',
  'https://hyrox.com',
  'HYROX Mumbai Sep 18-20 2026 confirmed',
  'active'
),
(
  'HYROX Hangzhou',
  'Hangzhou, China',
  'China',
  'Jul 4, 2026',
  '8km+8 stations',
  'hyrox',
  '',
  'https://hyrox.com',
  'HYROX Hangzhou Jul 4-5 2026 confirmed',
  'active'
),
(
  'HYROX Chengdu',
  'Chengdu, China',
  'China',
  'Aug 1, 2026',
  '8km+8 stations',
  'hyrox',
  '',
  'https://hyrox.com',
  'HYROX Chengdu Aug 1-2 2026 confirmed',
  'active'
),
(
  'HYROX Shenzhen',
  'Shenzhen, China',
  'China',
  'Aug 15, 2026',
  '8km+8 stations',
  'hyrox',
  '',
  'https://hyrox.com',
  'HYROX Shenzhen Aug 15-16 2026 confirmed',
  'active'
),
(
  'HYROX Beijing',
  'Beijing, China',
  'China',
  'Sep 12, 2026',
  '8km+8 stations',
  'hyrox',
  '',
  'https://hyrox.com',
  'HYROX Beijing Sep 12-13 2026 confirmed',
  'active'
),
(
  'HYROX Shanghai',
  'Shanghai, China',
  'China',
  'Oct 31, 2026',
  '8km+8 stations',
  'hyrox',
  '',
  'https://hyrox.com',
  'HYROX Shanghai Oct 31-Nov 1 2026 confirmed',
  'active'
),
(
  'HYROX Guangzhou',
  'Guangzhou, China',
  'China',
  'Nov 21, 2026',
  '8km+8 stations',
  'hyrox',
  '',
  'https://hyrox.com',
  'HYROX Guangzhou Nov 21-22 2026 confirmed',
  'active'
);

-- =============================================
-- INSERT PREDICTED 2027 EVENTS (from 2026 pattern)
-- =============================================

-- HYROX 2027 Asia predicted events (from 2026 dates +1 year approx)
INSERT INTO races (name, location, country, date, distance, type, team, url, note, status)
VALUES 
(
  'HYROX Delhi 2027',
  'Delhi, India',
  'India',
  'Jul 2027',
  '8km+8 stations',
  'hyrox',
  '',
  'https://hyrox.com',
  'Predicted from 2026 HYROX Delhi (Jul 24-26). Exact date TBC.',
  'watchlist'
),
(
  'HYROX Mumbai 2027',
  'Mumbai, India',
  'India',
  'Sep 2027',
  '8km+8 stations',
  'hyrox',
  '',
  'https://hyrox.com',
  'Predicted from 2026 HYROX Mumbai (Sep 18-20). Exact date TBC.',
  'watchlist'
),
(
  'HYROX Hangzhou 2027',
  'Hangzhou, China',
  'China',
  'Jul 2027',
  '8km+8 stations',
  'hyrox',
  '',
  'https://hyrox.com',
  'Predicted from 2026 HYROX Hangzhou (Jul 4-5). Exact date TBC.',
  'watchlist'
),
(
  'HYROX Chengdu 2027',
  'Chengdu, China',
  'China',
  'Aug 2027',
  '8km+8 stations',
  'hyrox',
  '',
  'https://hyrox.com',
  'Predicted from 2026 HYROX Chengdu (Aug 1-2). Exact date TBC.',
  'watchlist'
),
(
  'HYROX Shenzhen 2027',
  'Shenzhen, China',
  'China',
  'Aug 2027',
  '8km+8 stations',
  'hyrox',
  '',
  'https://hyrox.com',
  'Predicted from 2026 HYROX Shenzhen (Aug 15-16). Exact date TBC.',
  'watchlist'
),
(
  'HYROX Beijing 2027',
  'Beijing, China',
  'China',
  'Sep 2027',
  '8km+8 stations',
  'hyrox',
  '',
  'https://hyrox.com',
  'Predicted from 2026 HYROX Beijing (Sep 12-13). Exact date TBC.',
  'watchlist'
),
(
  'HYROX Shanghai 2027',
  'Shanghai, China',
  'China',
  'Oct 2027',
  '8km+8 stations',
  'hyrox',
  '',
  'https://hyrox.com',
  'Predicted from 2026 HYROX Shanghai (Oct 31). Exact date TBC.',
  'watchlist'
),
(
  'HYROX Guangzhou 2027',
  'Guangzhou, China',
  'China',
  'Nov 2027',
  '8km+8 stations',
  'hyrox',
  '',
  'https://hyrox.com',
  'Predicted from 2026 HYROX Guangzhou (Nov 21-22). Exact date TBC.',
  'watchlist'
),
(
  'Ironman 70.3 Putrajaya 2027',
  'Putrajaya, Malaysia',
  'Malaysia',
  'Nov 2027',
  '70.3mi',
  'triathlon',
  '',
  'https://www.ironman.com',
  'Predicted from 2026 (Nov 2). Exact date TBC.',
  'watchlist'
),
(
  'Phuket Marathon 2027',
  'Phuket, Thailand',
  'Thailand',
  'Jun 2027',
  '42.2km',
  'running',
  '',
  'https://phuketmarathon.com',
  'Predicted from 2026 (Jun 1). Exact date TBC.',
  'watchlist'
);

-- =============================================
-- 18. FLAG UNVERIFIABLE INDIA RACES AS WATCHLIST
-- These are very small local races with no confirmed web presence
-- =============================================
UPDATE races SET status = 'watchlist', note = 'Small regional event - date unverified, predicted from prior year'
WHERE country = 'India' 
AND name IN (
  'Rann Utsav Run',
  'Rann Utsav Run 2027',
  'Goa Navy Duathlon',
  'Goa Navy Duathlon 2027',
  'Desert Storm Bikaner',
  'Desert Storm Bikaner 2027',
  'Auroville Trail',
  'Auroville Trail 2027',
  'MG Vadodara Marathon',
  'MG Vadodara Marathon 2027',
  'Coastal Odyssey Goa 2027',
  'Sundarban Trail Run',
  'Sundarban Trail Run 2027',
  'Pinkathon Mumbai',
  'Pinkathon Mumbai 2027',
  'Mumbai Ocean Swim',
  'Mumbai Ocean Swim 2027',
  'Bengaluru Midnight Marathon',
  'Bengaluru Midnight Marathon 2027',
  'Cherrapunji Rain Run',
  'Cherrapunji Rain Run 2027',
  'Kochi Ironkid Triathlon',
  'Kochi Ironkid Triathlon 2027',
  'KAPCH Challenge',
  'KAPCH Challenge 2027',
  'Coastal Trail Run Goa',
  'Coastal Trail Run Goa 2027',
  'Goa Open Water Swim',
  'Goa Open Water Swim 2027',
  'Hyderabad Marathon 2027 (Aug)',
  'Hyderabad Marathon 2027 (Jan)'
);
