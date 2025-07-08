# 職場管理システム バックアップ手順

## 概要
このドキュメントでは、職場管理システムのデータバックアップ手順を説明します。

## 1. 日常的なバックアップ（推奨頻度: 週1回）

### Supabase SQL Editorでの簡単チェック
```sql
-- データ件数の確認
SELECT 
    'tasks' as table_name, COUNT(*) as count FROM tasks
UNION ALL
SELECT 'handovers' as table_name, COUNT(*) as count FROM handovers
UNION ALL  
SELECT 'schedules' as table_name, COUNT(*) as count FROM schedules;
```

## 2. 完全バックアップ（推奨頻度: 月1回）

### 手順
1. **Supabase ダッシュボード** にアクセス
2. **SQL Editor** を開く
3. 以下のSQLを実行してCSVでダウンロード

### 重要データのバックアップ SQL

#### タスクデータ
```sql
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
```

#### 申し送り事項データ
```sql
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
```

#### スケジュールデータ
```sql
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
```

#### マスターデータ
```sql
-- 部署データ
SELECT * FROM departments;

-- 優先度データ  
SELECT * FROM priorities;

-- ステータスデータ
SELECT * FROM statuses;
```

## 3. ローカル保存推奨フォルダ構成

```
backups/
├── 2025-07/
│   ├── tasks_20250708.csv
│   ├── handovers_20250708.csv
│   ├── schedules_20250708.csv
│   └── master_data_20250708.csv
├── 2025-08/
│   └── ...
└── README.md (このファイル)
```

## 4. 緊急時の復旧手順

### データベースの再作成が必要な場合
1. `database-schema.sql` をSupabase SQL Editorで実行
2. 保存したCSVファイルからデータを復旧
3. アプリケーションの動作確認

### 個別データの復旧
1. 対象テーブルのバックアップCSVを確認
2. 必要なレコードをSupabaseで手動追加
3. ステータスと整合性の確認

## 5. バックアップチェックリスト

### 月次バックアップ（月初めに実施）
- [ ] タスクデータのCSVダウンロード
- [ ] 申し送りデータのCSVダウンロード  
- [ ] スケジュールデータのCSVダウンロード
- [ ] マスターデータのCSVダウンロード
- [ ] ローカルフォルダに日付別保存
- [ ] データ件数の確認
- [ ] 古いバックアップの整理（3ヶ月以上前は削除）

### 重要変更時のバックアップ
以下の場合は即座にバックアップを実施：
- 大量のデータ削除前
- システム設定変更前
- 新機能の実装前
- 重要な申し送り事項の追加時

## 6. 注意事項

- **個人情報の取り扱い**: バックアップファイルには個人情報が含まれる可能性があります
- **保存場所**: 安全な場所に保存し、第三者がアクセスできないようにしてください
- **定期確認**: バックアップファイルが正常に保存されているか定期的に確認してください
- **複数箇所保存**: 重要なデータは複数の場所にバックアップすることを推奨します

## 7. 問題が発生した場合

1. **Supabaseにアクセスできない場合**
   - インターネット接続を確認
   - Supabaseのステータスページを確認
   - しばらく時間をおいて再試行

2. **データが見つからない場合**
   - 最新のバックアップファイルを確認
   - データベースの整合性を確認
   - 必要に応じて管理者に連絡

3. **CSVダウンロードできない場合**
   - ブラウザを変更して試行
   - SQL文を分割して実行
   - 小さなデータセットから開始