-- ============================================================
--  BabyBloom — seed.sql
--
--  Two parents, one child each. Three days of activity data.
--  Includes alerts to exercise both resolve triggers.
--  password_hash values are bcrypt hashes of "password123"
-- ============================================================

USE babybloom;

-- ---- Users --------------------------------------------------
INSERT INTO users (id, email, password_hash, name) VALUES
(1, 'sarah@example.com', '$2b$12$KIXHq3H1G9W7Qv2v4Z5sEOtFw1mP8nL6aXjRdCuMzYbT0eVgNs3uy', 'Sarah Khan'),
(2, 'omar@example.com',  '$2b$12$KIXHq3H1G9W7Qv2v4Z5sEOtFw1mP8nL6aXjRdCuMzYbT0eVgNs3uy', 'Omar Ali');

-- ---- Children (one per user, enforced by unique key) --------
INSERT INTO child (id, user_id, name, gender, date_of_birth) VALUES
(1, 1, 'Ayla',  'female', '2024-11-10'),
(2, 2, 'Zayan', 'male',   '2025-02-01');

-- ---- Sleep logs ---------------------------------------------
INSERT INTO sleep_logs (child_id, start_time, end_time) VALUES
(1, '2025-05-14 21:00:00', '2025-05-15 05:30:00'),
(1, '2025-05-15 13:00:00', '2025-05-15 14:30:00'),
(1, '2025-05-15 21:30:00', '2025-05-16 05:00:00'),
(1, '2025-05-16 12:30:00', '2025-05-16 14:00:00'),
(1, '2025-05-16 22:00:00', '2025-05-17 05:30:00'),
(2, '2025-05-15 01:00:00', '2025-05-15 03:00:00'),
(2, '2025-05-15 06:00:00', '2025-05-15 08:30:00'),
(2, '2025-05-15 20:30:00', '2025-05-15 23:00:00'),
(2, '2025-05-16 02:00:00', '2025-05-16 04:00:00'),
(2, '2025-05-16 08:00:00', '2025-05-16 10:30:00');

-- ---- Temperature logs ---------------------------------------
-- Zayan: 38.9 on 05-15 creates an alert (inserted manually below)
--        38.1 on 05-16 fires trg_resolve_temperature_alert
INSERT INTO temperature_logs (child_id, value, logged_at) VALUES
(1, 37.1, '2025-05-15 09:00:00'),
(1, 36.9, '2025-05-16 09:00:00'),
(1, 37.2, '2025-05-17 09:00:00'),
(2, 38.9, '2025-05-15 10:00:00'),
(2, 38.1, '2025-05-16 10:00:00');

-- ---- Diaper logs --------------------------------------------
-- Zayan: count=11 on 05-15 creates an alert (inserted manually below)
--        count=4 on 05-16 fires trg_resolve_diaper_alert
INSERT INTO diaper_logs (child_id, count, logged_at) VALUES
(1, 4, '2025-05-15 08:00:00'),
(1, 3, '2025-05-15 20:00:00'),
(1, 4, '2025-05-16 08:00:00'),
(1, 3, '2025-05-16 20:00:00'),
(1, 2, '2025-05-17 08:00:00'),
(2, 11, '2025-05-15 09:00:00'),
(2, 4,  '2025-05-16 09:00:00');

-- ---- Feeding logs -------------------------------------------
INSERT INTO feeding_logs (child_id, count, logged_at) VALUES
(1, 4, '2025-05-15 08:30:00'),
(1, 5, '2025-05-16 08:30:00'),
(1, 4, '2025-05-17 08:30:00'),
(2, 7, '2025-05-15 08:30:00'),
(2, 8, '2025-05-16 08:30:00');

-- ---- Crying logs --------------------------------------------
INSERT INTO crying_logs (child_id, duration_mins, logged_at) VALUES
(1, 15, '2025-05-15 11:00:00'),
(1, 10, '2025-05-16 14:30:00'),
(2, 45, '2025-05-15 13:00:00'),
(2, 30, '2025-05-16 13:00:00');

-- ---- Alerts -------------------------------------------------
-- Inserted before the resolve-trigger readings above so the
-- triggers have something to deactivate.
-- In production these are created by the backend rule engine.
INSERT INTO alerts (child_id, rule_name, message, is_active, notification_sent, triggered_at) VALUES
(2, 'high_temperature',
 'Temperature reading of 38.9C exceeds the 38.5C threshold. Please monitor closely and consult a healthcare professional if it does not improve.',
 TRUE, FALSE, '2025-05-15 10:01:00'),
(2, 'excessive_diapers',
 '11 diaper changes logged, which exceeds the normal threshold. Consider consulting your pediatrician.',
 TRUE, FALSE, '2025-05-15 09:01:00');

-- After the temperature_logs and diaper_logs inserts above,
-- both triggers fire and set is_active = FALSE on these alerts.
-- Verify with: SELECT * FROM active_alerts;  -- should return 0 rows

-- ---- Chat sessions ------------------------------------------
INSERT INTO chat_sessions (id, user_id, title, created_at) VALUES
(1, 1, 'Sleep schedule questions', '2025-05-15 10:00:00'),
(2, 1, 'Feeding advice',           '2025-05-16 09:00:00'),
(3, 2, 'Fever guidance',           '2025-05-15 11:00:00');

-- ---- Chat messages ------------------------------------------
INSERT INTO chat_messages (session_id, role, content) VALUES
(1, 'user',      'How many hours should a 6-month-old sleep per day?'),
(1, 'assistant', 'At 6 months, most babies need 12-16 hours of sleep in a 24-hour period, including naps. This is general guidance only and not medical advice.'),
(2, 'user',      'Is 5 feedings a day enough for a 6-month-old?'),
(2, 'assistant', 'At 6 months, 4-6 feedings per day is typical as solids are being introduced. This is general guidance only and not medical advice.'),
(3, 'user',      'My baby has a temperature of 38.9, what should I do?'),
(3, 'assistant', 'A temperature above 38C in a young infant warrants prompt medical attention. Please contact your doctor or nearest clinic. This is general guidance only and not medical advice.');

-- ============================================================
--  Verification queries
-- ============================================================
-- Active alerts (should return 0 rows — both resolved by triggers):
  SELECT * FROM active_alerts;
--
-- All alerts (2 rows, both is_active=FALSE):
 SELECT id, child_id, rule_name, is_active, notification_sent FROM alerts;
--
-- Daily summary for Ayla:
 SELECT * FROM daily_summary WHERE child_id = 1 ORDER BY log_date;
--
-- Weekly summary:
   SELECT * FROM weekly_summary;