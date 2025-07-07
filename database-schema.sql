-- 部署テーブル
CREATE TABLE IF NOT EXISTS departments (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) NOT NULL
);

-- 優先度テーブル
CREATE TABLE IF NOT EXISTS priorities (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) NOT NULL,
    level INTEGER NOT NULL
);

-- スケジュールテーブル
CREATE TABLE IF NOT EXISTS schedules (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    department VARCHAR(50) REFERENCES departments(id),
    date DATE NOT NULL,
    time TIME NOT NULL,
    description TEXT,
    duration INTEGER DEFAULT 60,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 申し送り事項テーブル
CREATE TABLE IF NOT EXISTS handovers (
    id SERIAL PRIMARY KEY,
    department VARCHAR(50) REFERENCES departments(id),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    priority VARCHAR(50) REFERENCES priorities(id),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- タスクテーブル
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    department VARCHAR(50) REFERENCES departments(id),
    description TEXT NOT NULL,
    priority VARCHAR(50) REFERENCES priorities(id),
    due_date DATE NOT NULL,
    assigned_by VARCHAR(100) NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 初期データ挿入
INSERT INTO departments (id, name, color) VALUES
('general', '庶務係', '#4A90E2'),
('fire', '警防係', '#E74C3C'),
('prevention', '予防係', '#F39C12'),
('emergency', '救急・救助係', '#27AE60'),
('machinery', '機械係', '#9B59B6')
ON CONFLICT (id) DO NOTHING;

INSERT INTO priorities (id, name, color, level) VALUES
('urgent', '緊急', '#DC3545', 4),
('high', '重要度高', '#FD7E14', 3),
('medium', '重要度中', '#FFC107', 2),
('low', '重要度低', '#28A745', 1)
ON CONFLICT (id) DO NOTHING;

-- サンプルデータ
INSERT INTO schedules (title, department, date, time, description, duration) VALUES
('月次会議', 'general', '2025-07-03', '09:00', '月次業務報告会議', 120),
('設備点検', 'machinery', '2025-07-03', '14:00', '消防設備定期点検', 180),
('防火訓練', 'fire', '2025-07-04', '10:00', '避難訓練および消火訓練', 90),
('予防査察', 'prevention', '2025-07-04', '13:30', '事業所の予防査察実施', 60);

INSERT INTO handovers (department, title, description, priority, status) VALUES
('general', '書類確認', '月次報告書の確認が必要です。期限は明日まで。', 'high', 'pending'),
('emergency', '救急車両点検', '救急車両の日常点検を実施。バッテリー交換が必要。', 'urgent', 'completed'),
('fire', '消防設備確認', '消防設備の定期点検結果を確認してください。', 'medium', 'pending');

INSERT INTO tasks (title, department, description, priority, due_date, assigned_by, completed) VALUES
('予算資料作成', 'general', '来月の予算資料を作成する', 'medium', '2025-07-10', '田中係長', FALSE),
('緊急設備修理', 'machinery', 'ポンプ設備の緊急修理対応', 'urgent', '2025-07-04', '佐藤主任', FALSE),
('訓練計画立案', 'fire', '来月の防火訓練計画を立案', 'high', '2025-07-08', '山田主任', FALSE);