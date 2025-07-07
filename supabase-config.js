// Supabase設定
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

// Supabaseクライアント初期化
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// データベース操作関数
const dbOperations = {
  // スケジュール操作
  async getSchedules() {
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .order('date', { ascending: true });
    
    if (error) {
      console.error('Error fetching schedules:', error);
      return [];
    }
    return data;
  },

  async addSchedule(schedule) {
    const { data, error } = await supabase
      .from('schedules')
      .insert([schedule])
      .select();
    
    if (error) {
      console.error('Error adding schedule:', error);
      return null;
    }
    return data[0];
  },

  // 申し送り事項操作
  async getHandovers() {
    const { data, error } = await supabase
      .from('handovers')
      .select('*')
      .order('timestamp', { ascending: false });
    
    if (error) {
      console.error('Error fetching handovers:', error);
      return [];
    }
    return data;
  },

  async addHandover(handover) {
    const { data, error } = await supabase
      .from('handovers')
      .insert([handover])
      .select();
    
    if (error) {
      console.error('Error adding handover:', error);
      return null;
    }
    return data[0];
  },

  // タスク操作
  async getTasks() {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('dueDate', { ascending: true });
    
    if (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }
    return data;
  },

  async addTask(task) {
    const { data, error } = await supabase
      .from('tasks')
      .insert([task])
      .select();
    
    if (error) {
      console.error('Error adding task:', error);
      return null;
    }
    return data[0];
  },

  async updateTask(id, updates) {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select();
    
    if (error) {
      console.error('Error updating task:', error);
      return null;
    }
    return data[0];
  }
};

// 環境変数から設定を読み込む関数
function loadSupabaseConfig() {
  // 本番環境では環境変数から読み込み
  if (typeof process !== 'undefined' && process.env) {
    return {
      url: process.env.SUPABASE_URL,
      anonKey: process.env.SUPABASE_ANON_KEY
    };
  }
  
  // 開発環境では直接設定
  return {
    url: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY
  };
}