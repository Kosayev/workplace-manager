-- 職場管理システム データベース バックアップスクリプト
-- 実行日時: 定期的に実行してください

-- 1. 全テーブルのデータ件数確認
SELECT 
    'departments' as table_name, 
    COUNT(*) as record_count,
    NOW() as backup_date
FROM departments
UNION ALL
SELECT 'priorities', COUNT(*), NOW() FROM priorities
UNION ALL
SELECT 'statuses', COUNT(*), NOW() FROM statuses  
UNION ALL
SELECT 'schedules', COUNT(*), NOW() FROM schedules
UNION ALL
SELECT 'handovers', COUNT(*), NOW() FROM handovers
UNION ALL
SELECT 'tasks', COUNT(*), NOW() FROM tasks;

-- 2. 各テーブルの完全バックアップ
-- departments テーブル
SELECT 'departments' as table_name, to_jsonb(departments) as data FROM departments;

-- priorities テーブル
SELECT 'priorities' as table_name, to_jsonb(priorities) as data FROM priorities;

-- statuses テーブル
SELECT 'statuses' as table_name, to_jsonb(statuses) as data FROM statuses;

-- schedules テーブル
SELECT 'schedules' as table_name, to_jsonb(schedules) as data FROM schedules;

-- handovers テーブル
SELECT 'handovers' as table_name, to_jsonb(handovers) as data FROM handovers;

-- tasks テーブル
SELECT 'tasks' as table_name, to_jsonb(tasks) as data FROM tasks;

-- 3. 重要データのCSVエクスポート用クエリ
-- タスクのバックアップ
SELECT 
    id,
    title,
    department,
    description,
    priority,
    due_date,
    assigned_by,
    completed,
    status,
    created_at,
    updated_at
FROM tasks
ORDER BY created_at DESC;

-- 申し送り事項のバックアップ
SELECT 
    id,
    department,
    title,
    description,
    timestamp,
    priority,
    status,
    created_at,
    updated_at
FROM handovers
ORDER BY created_at DESC;

-- スケジュールのバックアップ
SELECT 
    id,
    title,
    department,
    date,
    time,
    description,
    duration,
    created_at,
    updated_at
FROM schedules
ORDER BY date DESC;