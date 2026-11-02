-- PrepHub schema (MySQL 8.0+). Safe to run more than once.
SET NAMES utf8mb4;

-- ---------------------------------------------------------------- content
CREATE TABLE IF NOT EXISTS tracks (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug          VARCHAR(40)  NOT NULL,
  title         VARCHAR(120) NOT NULL,
  summary       TEXT         NOT NULL,
  weeks         TINYINT UNSIGNED NOT NULL,
  default_start DATE         NOT NULL,
  highlights    TEXT         NULL,
  sort_order    INT          NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tracks_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sections (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  track_id    INT UNSIGNED NOT NULL,
  slug        VARCHAR(60)  NOT NULL,
  title       VARCHAR(120) NOT NULL,
  code_prefix VARCHAR(8)   NOT NULL,
  description VARCHAR(255) NOT NULL,
  sort_order  INT          NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_sections_track_slug (track_id, slug),
  CONSTRAINT fk_sections_track FOREIGN KEY (track_id) REFERENCES tracks (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS questions (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  section_id INT UNSIGNED NOT NULL,
  code       VARCHAR(12)  NOT NULL,
  topic      VARCHAR(80)  NOT NULL,
  level      ENUM('Medium','Hard','Expert') NOT NULL,
  question   TEXT         NOT NULL,
  answer     MEDIUMTEXT   NOT NULL,
  tips       TEXT         NULL,
  sort_order INT          NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_questions_code (code),
  KEY ix_questions_section (section_id, sort_order),
  CONSTRAINT fk_questions_section FOREIGN KEY (section_id) REFERENCES sections (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notes (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  track_id   INT UNSIGNED NOT NULL,
  code       VARCHAR(12)  NOT NULL,
  group_name VARCHAR(60)  NOT NULL,
  topic      VARCHAR(120) NOT NULL,
  body       TEXT         NOT NULL,
  example    TEXT         NULL,
  remember   TEXT         NULL,
  sort_order INT          NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_notes_code (code),
  KEY ix_notes_track (track_id, sort_order),
  CONSTRAINT fk_notes_track FOREIGN KEY (track_id) REFERENCES tracks (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS plan_days (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  track_id      INT UNSIGNED NOT NULL,
  day_number    SMALLINT UNSIGNED NOT NULL,
  week          TINYINT UNSIGNED  NOT NULL,
  week_theme    VARCHAR(120) NOT NULL,
  focus         VARCHAR(200) NOT NULL,
  notes_refs    VARCHAR(255) NOT NULL,
  qa_refs       VARCHAR(255) NOT NULL,
  practice      TEXT         NOT NULL,
  planned_hours DECIMAL(4,1) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_plan_days_track_day (track_id, day_number),
  CONSTRAINT fk_plan_days_track FOREIGN KEY (track_id) REFERENCES tracks (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS skills (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  track_id       INT UNSIGNED NOT NULL,
  skill          VARCHAR(80)  NOT NULL,
  how_ai_changes TEXT         NOT NULL,
  use_ai         TEXT         NOT NULL,
  build_this     TEXT         NOT NULL,
  talking_point  TEXT         NOT NULL,
  watch_out      TEXT         NOT NULL,
  related_notes  VARCHAR(120) NOT NULL,
  sort_order     INT          NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  CONSTRAINT fk_skills_track FOREIGN KEY (track_id) REFERENCES tracks (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------- people
CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(190) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sessions (
  id         CHAR(64)     NOT NULL,           -- SHA-256 of the cookie token
  user_id    INT UNSIGNED NOT NULL,
  expires_at DATETIME     NOT NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_sessions_user (user_id),
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Recent sign-in failures and sign-ups, for rate limiting. Rows older than a day are pruned by the app.
CREATE TABLE IF NOT EXISTS auth_attempts (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  action     ENUM('login','register') NOT NULL,
  ip         VARCHAR(45)  NOT NULL,
  email      VARCHAR(190) NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_aa_ip (action, ip, created_at),
  KEY ix_aa_email (action, email, created_at),
  KEY ix_aa_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------- progress (one row per user per item)
CREATE TABLE IF NOT EXISTS user_tracks (
  user_id    INT UNSIGNED NOT NULL,
  track_id   INT UNSIGNED NOT NULL,
  start_date DATE         NOT NULL,
  PRIMARY KEY (user_id, track_id),
  CONSTRAINT fk_user_tracks_user  FOREIGN KEY (user_id)  REFERENCES users (id)  ON DELETE CASCADE,
  CONSTRAINT fk_user_tracks_track FOREIGN KEY (track_id) REFERENCES tracks (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS question_progress (
  user_id     INT UNSIGNED NOT NULL,
  question_id INT UNSIGNED NOT NULL,
  status      ENUM('not_started','revising','confident') NOT NULL DEFAULT 'not_started',
  my_notes    TEXT NULL,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, question_id),
  KEY ix_qp_question (question_id),
  CONSTRAINT fk_qp_user     FOREIGN KEY (user_id)     REFERENCES users (id)     ON DELETE CASCADE,
  CONSTRAINT fk_qp_question FOREIGN KEY (question_id) REFERENCES questions (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS note_progress (
  user_id    INT UNSIGNED NOT NULL,
  note_id    INT UNSIGNED NOT NULL,
  status     ENUM('not_started','revising','confident') NOT NULL DEFAULT 'not_started',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, note_id),
  KEY ix_np_note (note_id),
  CONSTRAINT fk_np_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_np_note FOREIGN KEY (note_id) REFERENCES notes (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS note_videos (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    INT UNSIGNED NOT NULL,
  note_id    INT UNSIGNED NOT NULL,
  video_id   CHAR(11)     NOT NULL,           -- YouTube video id
  title      VARCHAR(200) NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_nv_user_note_video (user_id, note_id, video_id),
  KEY ix_nv_note (note_id),
  CONSTRAINT fk_nv_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_nv_note FOREIGN KEY (note_id) REFERENCES notes (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS day_progress (
  user_id      INT UNSIGNED NOT NULL,
  plan_day_id  INT UNSIGNED NOT NULL,
  status       ENUM('pending','in_progress','done','skipped') NOT NULL DEFAULT 'pending',
  actual_hours DECIMAL(4,1) NULL,
  remarks      TEXT NULL,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, plan_day_id),
  KEY ix_dp_day (plan_day_id),
  CONSTRAINT fk_dp_user FOREIGN KEY (user_id)     REFERENCES users (id)     ON DELETE CASCADE,
  CONSTRAINT fk_dp_day  FOREIGN KEY (plan_day_id) REFERENCES plan_days (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS skill_actions (
  user_id     INT UNSIGNED NOT NULL,
  skill_id    INT UNSIGNED NOT NULL,
  action_text TEXT NULL,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, skill_id),
  KEY ix_sa_skill (skill_id),
  CONSTRAINT fk_sa_user  FOREIGN KEY (user_id)  REFERENCES users (id)  ON DELETE CASCADE,
  CONSTRAINT fk_sa_skill FOREIGN KEY (skill_id) REFERENCES skills (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
