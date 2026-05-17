-- ============================================================
--  BabyBloom — schema.sql
-- ============================================================

DROP DATABASE IF EXISTS babybloom;
CREATE DATABASE babybloom;
USE babybloom;

-- ---- Drop triggers -----------------------------------------
DROP TRIGGER IF EXISTS trg_resolve_temperature_alert;
DROP TRIGGER IF EXISTS trg_resolve_diaper_alert;

-- ---- Drop views ---------------------------------------------
DROP VIEW IF EXISTS active_alerts;
DROP VIEW IF EXISTS weekly_summary;
DROP VIEW IF EXISTS daily_summary;

-- ---- Drop tables (reverse FK order) ------------------------
DROP TABLE IF EXISTS chat_messages;
DROP TABLE IF EXISTS chat_sessions;
DROP TABLE IF EXISTS alerts;
DROP TABLE IF EXISTS crying_logs;
DROP TABLE IF EXISTS feeding_logs;
DROP TABLE IF EXISTS diaper_logs;
DROP TABLE IF EXISTS temperature_logs;
DROP TABLE IF EXISTS sleep_logs;
DROP TABLE IF EXISTS child;
DROP TABLE IF EXISTS users;

-- ---- Users --------------------------------------------------
CREATE TABLE users (
    id            INT           PRIMARY KEY AUTO_INCREMENT,
    email         VARCHAR(255)  UNIQUE NOT NULL,
    password_hash VARCHAR(255)  NOT NULL,
    name          VARCHAR(100)  NOT NULL,
    created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

-- ---- Child --------------------------------------------------
CREATE TABLE child (
    id            INT           PRIMARY KEY AUTO_INCREMENT,
    user_id       INT           NOT NULL,
    name          VARCHAR(100)  NOT NULL,
    gender        ENUM('male', 'female', 'other') NOT NULL,
    date_of_birth DATE          NOT NULL,
    created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uq_one_child_per_user (user_id)
);

-- ---- Sleep logs ---------------------------------------------
CREATE TABLE sleep_logs (
    id          INT       PRIMARY KEY AUTO_INCREMENT,
    child_id    INT       NOT NULL,
    start_time  TIMESTAMP NOT NULL,
    end_time    TIMESTAMP NOT NULL,
    logged_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (child_id) REFERENCES child(id) ON DELETE CASCADE,
    CONSTRAINT chk_sleep_times    CHECK (end_time > start_time),
    CONSTRAINT chk_sleep_duration CHECK (TIMESTAMPDIFF(HOUR, start_time, end_time) <= 24)
);

-- ---- Temperature logs ---------------------------------------
CREATE TABLE temperature_logs (
    id          INT       PRIMARY KEY AUTO_INCREMENT,
    child_id    INT       NOT NULL,
    value       FLOAT     NOT NULL,
    logged_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (child_id) REFERENCES child(id) ON DELETE CASCADE,
    CONSTRAINT chk_temperature CHECK (value >= 34.0 AND value <= 42.0)
);

-- ---- Diaper logs --------------------------------------------
CREATE TABLE diaper_logs (
    id          INT       PRIMARY KEY AUTO_INCREMENT,
    child_id    INT       NOT NULL,
    count       INT       NOT NULL,
    logged_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (child_id) REFERENCES child(id) ON DELETE CASCADE,
    CONSTRAINT chk_diaper_count CHECK (count > 0 AND count <= 20)
);

-- ---- Feeding logs -------------------------------------------
CREATE TABLE feeding_logs (
    id          INT       PRIMARY KEY AUTO_INCREMENT,
    child_id    INT       NOT NULL,
    count       INT       NOT NULL,
    logged_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (child_id) REFERENCES child(id) ON DELETE CASCADE,
    CONSTRAINT chk_feeding_count CHECK (count > 0 AND count <= 20)
);

-- ---- Crying logs --------------------------------------------
CREATE TABLE crying_logs (
    id            INT       PRIMARY KEY AUTO_INCREMENT,
    child_id      INT       NOT NULL,
    duration_mins INT       NOT NULL,
    logged_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (child_id) REFERENCES child(id) ON DELETE CASCADE,
    CONSTRAINT chk_crying_duration CHECK (duration_mins > 0 AND duration_mins <= 300)
);

-- ---- Alerts -------------------------------------------------
CREATE TABLE alerts (
    id                INT           PRIMARY KEY AUTO_INCREMENT,
    child_id          INT           NOT NULL,
    rule_name         VARCHAR(100)  NOT NULL,
    message           TEXT          NOT NULL,
    is_active         BOOLEAN       DEFAULT TRUE,
    notification_sent BOOLEAN       DEFAULT FALSE,
    triggered_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (child_id) REFERENCES child(id) ON DELETE CASCADE
);

-- ---- Chat sessions ------------------------------------------
CREATE TABLE chat_sessions (
    id          INT           PRIMARY KEY AUTO_INCREMENT,
    user_id     INT           NOT NULL,
    title       VARCHAR(255)  DEFAULT 'New Chat',
    created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ---- Chat messages ------------------------------------------
CREATE TABLE chat_messages (
    id          INT       PRIMARY KEY AUTO_INCREMENT,
    session_id  INT       NOT NULL,
    role        ENUM('user', 'assistant') NOT NULL,
    content     TEXT      NOT NULL,
    sent_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
);


-- ============================================================
--  TRIGGERS
-- ============================================================

-- Auto-deactivate old temperature alerts when a normal reading comes in
DELIMITER //
CREATE TRIGGER trg_resolve_temperature_alert
AFTER INSERT ON temperature_logs
FOR EACH ROW
BEGIN
    IF NEW.value <= 38.5 THEN
        UPDATE alerts
        SET is_active = FALSE
        WHERE child_id = NEW.child_id
          AND rule_name = 'high_temperature'
          AND is_active = TRUE;
    END IF;
END;//
DELIMITER ;

-- Auto-deactivate diaper alerts when count goes back to normal
DELIMITER //
CREATE TRIGGER trg_resolve_diaper_alert
AFTER INSERT ON diaper_logs
FOR EACH ROW
BEGIN
    IF NEW.count <= 10 THEN
        UPDATE alerts
        SET is_active = FALSE
        WHERE child_id = NEW.child_id
          AND rule_name = 'excessive_diapers'
          AND is_active = TRUE;
    END IF;
END;//
DELIMITER ;


-- ============================================================
--  VIEWS
-- ============================================================

-- Daily summary view: aggregates all categories for a child for any given day
CREATE VIEW daily_summary AS
SELECT
    c.id                                          AS child_id,
    c.name                                        AS child_name,
    DATE(sl.start_time)                           AS log_date,
    ROUND(SUM(TIMESTAMPDIFF(MINUTE, sl.start_time, sl.end_time)) / 60, 1)
                                                  AS total_sleep_hours,
    ROUND(AVG(tl.value), 1)                       AS avg_temperature,
    SUM(dl.count)                                 AS total_diapers,
    SUM(fl.count)                                 AS total_feedings,
    SUM(cl.duration_mins)                         AS total_crying_mins
FROM child c
LEFT JOIN sleep_logs       sl ON sl.child_id = c.id
LEFT JOIN temperature_logs tl ON tl.child_id = c.id AND DATE(tl.logged_at)  = DATE(sl.start_time)
LEFT JOIN diaper_logs      dl ON dl.child_id = c.id AND DATE(dl.logged_at)  = DATE(sl.start_time)
LEFT JOIN feeding_logs     fl ON fl.child_id = c.id AND DATE(fl.logged_at)  = DATE(sl.start_time)
LEFT JOIN crying_logs      cl ON cl.child_id = c.id AND DATE(cl.logged_at)  = DATE(sl.start_time)
GROUP BY c.id, c.name, DATE(sl.start_time);

-- Weekly overview view: used for dashboard graphs
CREATE VIEW weekly_summary AS
SELECT
    child_id,
    YEARWEEK(log_date)      AS week,
    AVG(total_sleep_hours)  AS avg_sleep_hours,
    AVG(avg_temperature)    AS avg_temperature,
    SUM(total_diapers)      AS total_diapers,
    SUM(total_feedings)     AS total_feedings,
    SUM(total_crying_mins)  AS total_crying_mins
FROM daily_summary
GROUP BY child_id, YEARWEEK(log_date);

-- Active alerts view: only shows unresolved alerts
CREATE VIEW active_alerts AS
SELECT
    a.id,
    a.child_id,
    c.name      AS child_name,
    a.rule_name,
    a.message,
    a.notification_sent,
    a.triggered_at
FROM alerts a
JOIN child c ON c.id = a.child_id
WHERE a.is_active = TRUE;