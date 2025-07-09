// Import icon system - ensure it loads before other functions
import './src/icons.js';

// Application Data and State
const appData = {
  departments: [],
  priorities: [],
  statuses: [],
  schedules: [],
  handovers: [],
  tasks: [],
  comments: []
};

// コメントを読み込む
async function loadComments() {
  try {
    const { data: comments, error } = await supabase
      .from('comments')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('コメント読み込みエラー:', error);
      appData.comments = [];
      return;
    }
    
    appData.comments = comments || [];
  } catch (error) {
    console.error('コメント読み込みエラー:', error);
    appData.comments = [];
  }
}

// データベースから基本データを読み込む
async function loadBasicData() {
  try {
    console.log('基本データの読み込み開始...');
    
    // Supabaseクライアントの確認
    if (!window.supabase) {
      console.error('Supabaseクライアントが初期化されていません');
      return;
    }
    
    console.log('Supabase URL:', SUPABASE_URL);
    console.log('Supabase接続確認:', !!supabase);

    // 部署データを取得
    console.log('部署データを取得中...');
    const { data: departments, error: deptError } = await supabase
      .from('departments')
      .select('*');
    
    if (deptError) {
      console.error('部署データ取得エラー:', deptError);
      throw deptError;
    }
    
    console.log('取得した部署データ:', departments);
    appData.departments = departments || [];

    // 優先度データを取得
    console.log('優先度データを取得中...');
    const { data: priorities, error: priorityError } = await supabase
      .from('priorities')
      .select('*')
      .order('level', { ascending: false });
    
    if (priorityError) {
      console.error('優先度データ取得エラー:', priorityError);
      throw priorityError;
    }
    
    console.log('取得した優先度データ:', priorities);
    appData.priorities = priorities || [];

    // ステータスデータを取得
    console.log('ステータスデータを取得中...');
    const { data: statuses, error: statusError } = await supabase
      .from('statuses')
      .select('*')
      .order('category', { ascending: true })
      .order('order_index', { ascending: true });
    
    if (statusError) {
      console.error('ステータスデータ取得エラー:', statusError);
      console.log('フォールバックステータスデータを使用');
      // エラーの場合はフォールバックデータを使用
      appData.statuses = getDefaultStatuses();
    } else {
      console.log('取得したステータスデータ:', statuses);
      appData.statuses = statuses && statuses.length > 0 ? statuses : getDefaultStatuses();
    }

    console.log('基本データの読み込み完了:', {
      departments: appData.departments.length,
      priorities: appData.priorities.length,
      statuses: appData.statuses.length
    });
  } catch (error) {
    console.error('基本データの読み込みエラー:', error);
    
    // フォールバック: 静的データを使用
    console.log('フォールバックデータを使用');
    appData.departments = [
      {"id": "general", "name": "庶務係", "color": "#4A90E2"},
      {"id": "fire", "name": "警防係", "color": "#E74C3C"},
      {"id": "prevention", "name": "予防係", "color": "#F39C12"},
      {"id": "emergency", "name": "救急・救助係", "color": "#27AE60"},
      {"id": "machinery", "name": "機械係", "color": "#9B59B6"},
      {"id": "general_affairs", "name": "業務全般", "color": "#6B73FF"}
    ];
    appData.priorities = [
      {"id": "urgent", "name": "緊急", "color": "#DC3545", "level": 4},
      {"id": "high", "name": "重要度高", "color": "#FD7E14", "level": 3},
      {"id": "medium", "name": "重要度中", "color": "#FFC107", "level": 2},
      {"id": "low", "name": "重要度低", "color": "#28A745", "level": 1}
    ];
    appData.statuses = getDefaultStatuses();
  }
}

// データベースからスケジュールを読み込む
async function loadSchedules() {
  try {
    const { data: schedules, error } = await supabase
      .from('schedules')
      .select('*')
      .order('date', { ascending: true });
    
    if (error) throw error;
    appData.schedules = schedules;
    console.log('スケジュールデータの読み込み完了');
  } catch (error) {
    console.error('スケジュールデータの読み込みエラー:', error);
  }
}

// データベースから申し送り事項を読み込む
async function loadHandovers() {
  try {
    const { data: handovers, error } = await supabase
      .from('handovers')
      .select('*')
      .order('timestamp', { ascending: false });
    
    if (error) throw error;
    appData.handovers = handovers;
    console.log('申し送り事項データの読み込み完了');
  } catch (error) {
    console.error('申し送り事項データの読み込みエラー:', error);
  }
}

// データベースからタスクを読み込む
async function loadTasks() {
  try {
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .order('due_date', { ascending: true });
    
    if (error) throw error;
    appData.tasks = tasks.map(task => ({
      ...task,
      dueDate: task.due_date,
      assignedBy: task.assigned_by
    }));
    console.log('タスクデータの読み込み完了');
  } catch (error) {
    console.error('タスクデータの読み込みエラー:', error);
  }
}

let currentCalendarDate = new Date();
let currentSection = 'dashboard';
let activeHandoverDept = 'general';

// Utility Functions
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });
}

function formatTime(timeStr) {
  return timeStr.slice(0, 5);
}

function formatDateTime(dateTimeStr) {
  const date = new Date(dateTimeStr);
  return date.toLocaleDateString('ja-JP', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getDepartmentName(id) {
  return appData.departments.find(d => d.id === id)?.name || id;
}

function getDepartmentColor(id) {
  return appData.departments.find(d => d.id === id)?.color || '#666';
}

function getPriorityName(id) {
  return appData.priorities.find(p => p.id === id)?.name || id;
}

function getPriorityColor(id) {
  return appData.priorities.find(p => p.id === id)?.color || '#666';
}

function getNextId(array) {
  return Math.max(...array.map(item => item.id), 0) + 1;
}

function getDefaultStatuses() {
  return [
    // タスク用ステータス
    {"id": "task_not_started", "name": "未着手", "color": "#6C757D", "category": "task", "order_index": 1},
    {"id": "task_in_progress", "name": "対応中", "color": "#FFC107", "category": "task", "order_index": 2},
    {"id": "task_completed", "name": "対応済", "color": "#28A745", "category": "task", "order_index": 3},
    {"id": "task_on_hold", "name": "保留中", "color": "#FD7E14", "category": "task", "order_index": 4},
    // 申し送り用ステータス
    {"id": "handover_pending", "name": "未確認", "color": "#6C757D", "category": "handover", "order_index": 1},
    {"id": "handover_acknowledged", "name": "確認済", "color": "#17A2B8", "category": "handover", "order_index": 2},
    {"id": "handover_in_progress", "name": "対応中", "color": "#FFC107", "category": "handover", "order_index": 3},
    {"id": "handover_completed", "name": "完了", "color": "#28A745", "category": "handover", "order_index": 4}
  ];
}

function getStatusName(id) {
  return appData.statuses.find(s => s.id === id)?.name || id;
}

function getStatusColor(id) {
  return appData.statuses.find(s => s.id === id)?.color || '#6C757D';
}

function getStatusesByCategory(category) {
  return appData.statuses.filter(s => s.category === category);
}

// Navigation Functions
function initializeNavigation() {
  const navLinks = document.querySelectorAll('.nav-link');
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('sidebar');

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const section = link.dataset.section;
      showSection(section);
      
      // Update active nav link
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      
      // Hide sidebar on mobile
      if (window.innerWidth <= 768) {
        sidebar.classList.remove('active');
      }
    });
  });

  sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('active');
  });
}

function showSection(section) {
  const sections = document.querySelectorAll('.content-section');
  sections.forEach(s => s.classList.remove('active'));
  
  const targetSection = document.getElementById(`${section}-section`);
  if (targetSection) {
    targetSection.classList.add('active');
    currentSection = section;
    
    // Initialize section-specific content
    switch(section) {
      case 'dashboard':
        renderDashboard();
        break;
      case 'handovers':
        renderHandovers();
        break;
      case 'tasks':
        renderTasks();
        break;
      case 'calendar':
        renderCalendar();
        break;
    }
  }
}

// Dashboard Functions
function renderDashboard() {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const todayStr = today.toISOString().split('T')[0];
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  
  document.getElementById('today-date').textContent = formatDate(todayStr);
  document.getElementById('tomorrow-date').textContent = formatDate(tomorrowStr);
  
  renderScheduleList('today-schedule', todayStr);
  renderScheduleList('tomorrow-schedule', tomorrowStr);
}

function renderScheduleList(containerId, date) {
  const container = document.getElementById(containerId);
  const schedules = appData.schedules.filter(s => s.date === date);
  
  if (schedules.length === 0) {
    container.innerHTML = '<div class="empty-state">スケジュールがありません</div>';
    return;
  }
  
  container.innerHTML = schedules.map(schedule => `
    <div class="schedule-item">
      <div class="schedule-time">${formatTime(schedule.time)}</div>
      <div class="schedule-details">
        <div class="schedule-title">${schedule.title}</div>
        <div class="schedule-description">${schedule.description}</div>
        <div class="schedule-department" style="background-color: ${getDepartmentColor(schedule.department)}">
          ${getDepartmentName(schedule.department)}
        </div>
      </div>
      <div class="schedule-actions">
        <button class="btn btn--sm btn--outline" onclick="editSchedule(${schedule.id})">${window.iconSystem ? window.iconSystem.Icon('edit', 'sm', 'base') : '編集'}</button>
        <button class="btn btn--sm btn--outline" onclick="deleteSchedule(${schedule.id})" style="color: #dc3545; border-color: #dc3545;">${window.iconSystem ? window.iconSystem.Icon('trash2', 'sm', 'base') : '削除'}</button>
      </div>
    </div>
  `).join('');
}

// Handovers Functions
async function renderHandovers() {
  await renderHandoverTabs();
  renderHandoverContent();
}

async function renderHandoverTabs() {
  const tabsContainer = document.getElementById('handover-tabs');
  
  // データが読み込まれていない場合は読み込み
  if (appData.departments.length === 0) {
    await loadBasicData();
  }
  
  tabsContainer.innerHTML = appData.departments.map(dept => `
    <button class="tab-button ${dept.id === activeHandoverDept ? 'active' : ''}" 
            data-department="${dept.id}">
      ${dept.name}
    </button>
  `).join('');
  
  // Add event listeners
  tabsContainer.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
      activeHandoverDept = button.dataset.department;
      renderHandovers();
    });
  });
}

function renderHandoverContent() {
  const contentContainer = document.getElementById('handover-content');
  const handovers = appData.handovers.filter(h => h.department === activeHandoverDept);
  
  if (handovers.length === 0) {
    contentContainer.innerHTML = '<div class="empty-state">申し送り事項がありません</div>';
    return;
  }
  
  contentContainer.innerHTML = handovers.map(handover => `
    <div class="handover-item">
      <div class="handover-priority priority-${handover.priority}">
        ${getPriorityName(handover.priority)}
      </div>
      <div class="handover-details">
        <div class="handover-title">${handover.title}</div>
        <div class="handover-description">${handover.description}</div>
        <div class="handover-status-section">
          <select class="handover-status-select" onchange="updateHandoverStatus(${handover.id}, this.value)" style="background-color: transparent; color: ${getStatusColor(handover.status)}; border: 1px solid ${getStatusColor(handover.status)}; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">
            ${getStatusesByCategory('handover').map(status => 
              `<option value="${status.id}" ${status.id === handover.status ? 'selected' : ''}>${status.name}</option>`
            ).join('')}
          </select>
        </div>
        <div class="handover-timestamp">${formatDateTime(handover.timestamp)}</div>
        <div class="handover-comments u-comment-pad">
          ${(() => {
            const comments = getCommentsForItem('handover', handover.id);
            if (comments.length === 0) return '<div class="no-comments">コメントはありません</div>';
            return comments.slice(0, 2).map(comment => `
              <div class="comment-item">
                <div class="comment-header">
                  <span class="comment-author">${comment.author_name}</span>
                  <span class="comment-time">${formatCommentDate(comment.created_at)}</span>
                </div>
                <div class="comment-content">${comment.content}</div>
              </div>
            `).join('') + (comments.length > 2 ? `<div class="more-comments">他${comments.length - 2}件のコメント</div>` : '');
          })()}
        </div>
      </div>
      <div class="handover-actions">
        <button class="btn btn--sm btn--outline" onclick="showCommentModal('handover', ${handover.id}, '${handover.title}')">${window.iconSystem ? window.iconSystem.Icon('messageSquare', 'sm', 'base') : '💬'}</button>
        <button class="btn btn--sm btn--outline" onclick="editHandover(${handover.id})">${window.iconSystem ? window.iconSystem.Icon('edit', 'sm', 'base') : '編集'}</button>
        <button class="btn btn--sm btn--outline" onclick="deleteHandover(${handover.id})" style="color: #dc3545; border-color: #dc3545;">${window.iconSystem ? window.iconSystem.Icon('trash2', 'sm', 'base') : '削除'}</button>
      </div>
    </div>
  `).join('');
}

// Tasks Functions
async function renderTasks() {
  await renderTaskFilters();
  renderTasksGrid();
}

async function renderTaskFilters() {
  const deptFilter = document.getElementById('task-department-filter');
  const priorityFilter = document.getElementById('task-priority-filter');
  
  // データが読み込まれていない場合は読み込み
  if (appData.departments.length === 0 || appData.priorities.length === 0) {
    await loadBasicData();
  }
  
  deptFilter.innerHTML = '<option value="">全部署</option>' + 
    appData.departments.map(dept => `<option value="${dept.id}">${dept.name}</option>`).join('');
  
  priorityFilter.innerHTML = '<option value="">全優先度</option>' + 
    appData.priorities.map(priority => `<option value="${priority.id}">${priority.name}</option>`).join('');
  
  // Add event listeners
  deptFilter.addEventListener('change', renderTasksGrid);
  priorityFilter.addEventListener('change', renderTasksGrid);
}

function renderTasksGrid() {
  const container = document.getElementById('tasks-grid');
  const deptFilter = document.getElementById('task-department-filter').value;
  const priorityFilter = document.getElementById('task-priority-filter').value;
  
  let filteredTasks = appData.tasks;
  
  if (deptFilter) {
    filteredTasks = filteredTasks.filter(t => t.department === deptFilter);
  }
  
  if (priorityFilter) {
    filteredTasks = filteredTasks.filter(t => t.priority === priorityFilter);
  }
  
  // 新しいタスクから順に表示（created_atで降順ソート）
  filteredTasks = filteredTasks.sort((a, b) => {
    const dateA = new Date(a.created_at || a.createdAt || 0);
    const dateB = new Date(b.created_at || b.createdAt || 0);
    return dateB - dateA; // 降順（新しい順）
  });
  
  if (filteredTasks.length === 0) {
    container.innerHTML = '<div class="empty-state">タスクがありません</div>';
    return;
  }
  
  container.innerHTML = filteredTasks.map(task => `
    <div class="task-card">
      <div class="task-header">
        <h4 class="task-title">${task.title}</h4>
        <span class="task-priority priority-${task.priority}">${getPriorityName(task.priority)}</span>
      </div>
      <div class="task-description">${task.description}</div>
      <div class="task-status-section">
        <select class="task-status-select" onchange="updateTaskStatus(${task.id}, this.value)" style="background-color: transparent; color: ${getStatusColor(task.status)}; border: 1px solid ${getStatusColor(task.status)}; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">
          ${getStatusesByCategory('task').map(status => 
            `<option value="${status.id}" ${status.id === task.status ? 'selected' : ''}>${status.name}</option>`
          ).join('')}
        </select>
      </div>
      <div class="task-meta">
        <div>
          期限: ${formatDate(task.dueDate)}
        </div>
        <div style="color: ${getDepartmentColor(task.department)}">
          ${getDepartmentName(task.department)}
        </div>
      </div>
      <div class="task-comments u-comment-pad">
        ${(() => {
          const comments = getCommentsForItem('task', task.id);
          if (comments.length === 0) return '<div class="no-comments">コメントはありません</div>';
          return comments.slice(0, 2).map(comment => `
            <div class="comment-item">
              <div class="comment-header">
                <span class="comment-author">${comment.author_name}</span>
                <span class="comment-time">${formatCommentDate(comment.created_at)}</span>
              </div>
              <div class="comment-content">${comment.content}</div>
            </div>
          `).join('') + (comments.length > 2 ? `<div class="more-comments">他${comments.length - 2}件のコメント</div>` : '');
        })()}
      </div>
      <div class="task-actions">
        <button class="btn btn--sm btn--outline" onclick="showCommentModal('task', ${task.id}, '${task.title}')">${window.iconSystem ? window.iconSystem.Icon('messageSquare', 'sm', 'base') : '💬'}</button>
        <button class="btn btn--sm btn--outline" onclick="editTask(${task.id})">${window.iconSystem ? window.iconSystem.Icon('edit', 'sm', 'base') : '編集'}</button>
        <button class="btn btn--sm btn--outline" onclick="deleteTask(${task.id})" style="color: #dc3545; border-color: #dc3545;">${window.iconSystem ? window.iconSystem.Icon('trash2', 'sm', 'base') : '削除'}</button>
      </div>
    </div>
  `).join('');
}

async function updateTaskStatus(taskId, newStatus) {
  try {
    // ローカルデータでタスクを見つける
    const task = appData.tasks.find(t => t.id == taskId);
    if (!task) {
      console.error('タスクが見つかりません:', taskId);
      return;
    }

    // UI要素を即座に更新
    const selectElement = document.querySelector(`select[onchange="updateTaskStatus(${taskId}, this.value)"]`);
    if (selectElement) {
      selectElement.style.color = getStatusColor(newStatus);
      selectElement.style.borderColor = getStatusColor(newStatus);
    }

    // データベースでstatusカラムが存在しない場合はcompletedカラムのみ更新
    const updateData = {
      completed: newStatus === 'task_completed'
    };

    // statusカラムが存在する場合のみ追加
    if (task.hasOwnProperty('status') || newStatus) {
      updateData.status = newStatus;
    }

    const { data, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', taskId)
      .select();
    
    if (error) {
      console.error('Supabaseエラー:', error);
      // フォールバックとしてローカル更新
      task.status = newStatus;
      task.completed = newStatus === 'task_completed';
      renderTasksGrid();
      return;
    }
    
    await loadTasks();
    renderTasksGrid();
  } catch (error) {
    console.error('タスクステータス更新エラー:', error);
    // フォールバックとしてローカル更新
    const task = appData.tasks.find(t => t.id == taskId);
    if (task) {
      task.status = newStatus;
      task.completed = newStatus === 'task_completed';
      renderTasksGrid();
    }
  }
}

async function updateHandoverStatus(handoverId, newStatus) {
  try {
    // ローカルデータで申し送り事項を見つける
    const handover = appData.handovers.find(h => h.id == handoverId);
    if (!handover) {
      console.error('申し送り事項が見つかりません:', handoverId);
      return;
    }

    // UI要素を即座に更新
    const selectElement = document.querySelector(`select[onchange="updateHandoverStatus(${handoverId}, this.value)"]`);
    if (selectElement) {
      selectElement.style.color = getStatusColor(newStatus);
      selectElement.style.borderColor = getStatusColor(newStatus);
    }

    const { data, error } = await supabase
      .from('handovers')
      .update({ status: newStatus })
      .eq('id', handoverId)
      .select();
    
    if (error) {
      console.error('Supabaseエラー:', error);
      // フォールバックとしてローカル更新
      handover.status = newStatus;
      renderHandovers();
      return;
    }
    
    await loadHandovers();
    renderHandovers();
  } catch (error) {
    console.error('申し送りステータス更新エラー:', error);
    // フォールバックとしてローカル更新
    const handover = appData.handovers.find(h => h.id == handoverId);
    if (handover) {
      handover.status = newStatus;
      renderHandovers();
    }
  }
}

// Calendar Functions
function renderCalendar() {
  renderCalendarHeader();
  renderCalendarGrid();
  renderCalendarLegend();
}

function renderCalendarHeader() {
  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  const monthElement = document.getElementById('current-month');
  monthElement.textContent = `${currentCalendarDate.getFullYear()}年${monthNames[currentCalendarDate.getMonth()]}`;
  
  // Add event listeners for navigation
  document.getElementById('prev-month').addEventListener('click', () => {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
    renderCalendar();
  });
  
  document.getElementById('next-month').addEventListener('click', () => {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
    renderCalendar();
  });
}

function renderCalendarGrid() {
  const container = document.getElementById('calendar-grid');
  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());
  
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  let html = '';
  
  // Day headers
  const dayHeaders = ['日', '月', '火', '水', '木', '金', '土'];
  dayHeaders.forEach(day => {
    html += `<div class="calendar-day" style="background-color: var(--color-secondary); font-weight: bold; min-height: 40px; align-items: center; justify-content: center;">${day}</div>`;
  });
  
  // Calendar days
  for (let i = 0; i < 42; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    const dateStr = currentDate.toISOString().split('T')[0];
    
    const isCurrentMonth = currentDate.getMonth() === month;
    const isToday = dateStr === todayStr;
    const daySchedules = appData.schedules.filter(s => s.date === dateStr);
    
    let dayClass = 'calendar-day';
    if (!isCurrentMonth) dayClass += ' other-month';
    if (isToday) dayClass += ' today';
    
    html += `
      <div class="${dayClass}" data-date="${dateStr}" onclick="showDaySchedules('${dateStr}')">
        <div class="calendar-day-number">${currentDate.getDate()}</div>
        ${daySchedules.map(schedule => `
          <div class="calendar-event" style="background-color: ${getDepartmentColor(schedule.department)}">
            ${schedule.title}
          </div>
        `).join('')}
      </div>
    `;
  }
  
  container.innerHTML = html;
}

function renderCalendarLegend() {
  const container = document.getElementById('calendar-legend');
  container.innerHTML = appData.departments.map(dept => `
    <div class="legend-item">
      <div class="legend-color" style="background-color: ${dept.color}"></div>
      <span>${dept.name}</span>
    </div>
  `).join('');
}

// Modal Functions
function initializeModal() {
  const modal = document.getElementById('modal');
  const closeBtn = document.getElementById('modal-close');
  
  closeBtn.addEventListener('click', () => {
    modal.classList.remove('active');
  });
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('active');
    }
  });
}

function showModal(title, content) {
  const modal = document.getElementById('modal');
  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.getElementById('modal-body');
  
  modalTitle.textContent = title;
  modalBody.innerHTML = content;
  modal.classList.add('active');
}

async function showScheduleModal() {
  console.log('スケジュールモーダル表示開始');
  console.log('現在の部署データ:', appData.departments);
  
  // データが読み込まれていない場合は読み込み
  if (appData.departments.length === 0) {
    console.log('部署データが空のため再読み込み');
    await loadBasicData();
  }
  
  console.log('モーダル作成時の部署数:', appData.departments.length);
  
  const departmentOptions = appData.departments.map(dept => {
    console.log('部署オプション作成:', dept);
    return `<option value="${dept.id}">${dept.name}</option>`;
  }).join('');
  
  console.log('生成された部署オプション:', departmentOptions);
  
  const content = `
    <form class="modal-form" onsubmit="addSchedule(event)">
      <div class="form-group">
        <label class="form-label">タイトル</label>
        <input type="text" class="form-control" name="title" required>
      </div>
      <div class="form-group">
        <label class="form-label">部署</label>
        <select class="form-control" name="department" required>
          <option value="">部署を選択してください</option>
          ${departmentOptions}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">日付</label>
        <input type="date" class="form-control" name="date" required>
      </div>
      <div class="form-group">
        <label class="form-label">時間</label>
        <input type="time" class="form-control" name="time" required>
      </div>
      <div class="form-group">
        <label class="form-label">説明</label>
        <textarea class="form-control" name="description" rows="3"></textarea>
      </div>
      <div class="modal-buttons">
        <button type="button" class="btn btn--outline" onclick="document.getElementById('modal').classList.remove('active')">キャンセル</button>
        <button type="submit" class="btn btn--primary">追加</button>
      </div>
    </form>
  `;
  showModal('スケジュール追加', content);
}

async function showHandoverModal() {
  // データが読み込まれていない場合は読み込み
  if (appData.departments.length === 0 || appData.priorities.length === 0) {
    await loadBasicData();
  }
  
  const content = `
    <form class="modal-form" onsubmit="addHandover(event)">
      <div class="form-group">
        <label class="form-label">タイトル</label>
        <input type="text" class="form-control" name="title" required>
      </div>
      <div class="form-group">
        <label class="form-label">部署</label>
        <select class="form-control" name="department" required>
          ${appData.departments.map(dept => `<option value="${dept.id}">${dept.name}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">優先度</label>
        <select class="form-control" name="priority" required>
          ${appData.priorities.map(priority => `<option value="${priority.id}">${priority.name}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">内容</label>
        <textarea class="form-control" name="description" rows="4" required></textarea>
      </div>
      <div class="modal-buttons">
        <button type="button" class="btn btn--outline" onclick="document.getElementById('modal').classList.remove('active')">キャンセル</button>
        <button type="submit" class="btn btn--primary">追加</button>
      </div>
    </form>
  `;
  showModal('申し送り追加', content);
}

async function showTaskModal() {
  // データが読み込まれていない場合は読み込み
  if (appData.departments.length === 0 || appData.priorities.length === 0) {
    await loadBasicData();
  }
  
  const content = `
    <form class="modal-form" onsubmit="addTask(event)">
      <div class="form-group">
        <label class="form-label">タイトル</label>
        <input type="text" class="form-control" name="title" required>
      </div>
      <div class="form-group">
        <label class="form-label">部署</label>
        <select class="form-control" name="department" required>
          ${appData.departments.map(dept => `<option value="${dept.id}">${dept.name}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">優先度</label>
        <select class="form-control" name="priority" required>
          ${appData.priorities.map(priority => `<option value="${priority.id}">${priority.name}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">期限</label>
        <input type="date" class="form-control" name="dueDate" required>
      </div>
      <div class="form-group">
        <label class="form-label">内容</label>
        <textarea class="form-control" name="description" rows="3" required></textarea>
      </div>
      <div class="form-group">
        <label class="form-label">担当者</label>
        <input type="text" class="form-control" name="assignedBy" required>
      </div>
      <div class="modal-buttons">
        <button type="button" class="btn btn--outline" onclick="document.getElementById('modal').classList.remove('active')">キャンセル</button>
        <button type="submit" class="btn btn--primary">追加</button>
      </div>
    </form>
  `;
  showModal('タスク追加', content);
}

// Edit Functions
async function editSchedule(id) {
  const schedule = appData.schedules.find(s => s.id === id);
  if (!schedule) return;
  
  // データが読み込まれていない場合は読み込み
  if (appData.departments.length === 0) {
    await loadBasicData();
  }
  
  const content = `
    <form class="modal-form" onsubmit="updateSchedule(event, ${id})">
      <div class="form-group">
        <label class="form-label">タイトル</label>
        <input type="text" class="form-control" name="title" value="${schedule.title}" required>
      </div>
      <div class="form-group">
        <label class="form-label">部署</label>
        <select class="form-control" name="department" required>
          ${appData.departments.map(dept => 
            `<option value="${dept.id}" ${dept.id === schedule.department ? 'selected' : ''}>${dept.name}</option>`
          ).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">日付</label>
        <input type="date" class="form-control" name="date" value="${schedule.date}" required>
      </div>
      <div class="form-group">
        <label class="form-label">時間</label>
        <input type="time" class="form-control" name="time" value="${schedule.time}" required>
      </div>
      <div class="form-group">
        <label class="form-label">説明</label>
        <textarea class="form-control" name="description" rows="3">${schedule.description || ''}</textarea>
      </div>
      <div class="modal-buttons">
        <button type="button" class="btn btn--outline" onclick="document.getElementById('modal').classList.remove('active')">キャンセル</button>
        <button type="submit" class="btn btn--primary">更新</button>
      </div>
    </form>
  `;
  showModal('スケジュール編集', content);
}

async function editTask(id) {
  const task = appData.tasks.find(t => t.id === id);
  if (!task) return;
  
  // データが読み込まれていない場合は読み込み
  if (appData.departments.length === 0 || appData.priorities.length === 0) {
    await loadBasicData();
  }
  
  const content = `
    <form class="modal-form" onsubmit="updateTask(event, ${id})">
      <div class="form-group">
        <label class="form-label">タイトル</label>
        <input type="text" class="form-control" name="title" value="${task.title}" required>
      </div>
      <div class="form-group">
        <label class="form-label">部署</label>
        <select class="form-control" name="department" required>
          ${appData.departments.map(dept => 
            `<option value="${dept.id}" ${dept.id === task.department ? 'selected' : ''}>${dept.name}</option>`
          ).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">優先度</label>
        <select class="form-control" name="priority" required>
          ${appData.priorities.map(priority => 
            `<option value="${priority.id}" ${priority.id === task.priority ? 'selected' : ''}>${priority.name}</option>`
          ).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">期限</label>
        <input type="date" class="form-control" name="dueDate" value="${task.dueDate}" required>
      </div>
      <div class="form-group">
        <label class="form-label">内容</label>
        <textarea class="form-control" name="description" rows="3" required>${task.description}</textarea>
      </div>
      <div class="form-group">
        <label class="form-label">担当者</label>
        <input type="text" class="form-control" name="assignedBy" value="${task.assignedBy}" required>
      </div>
      <div class="modal-buttons">
        <button type="button" class="btn btn--outline" onclick="document.getElementById('modal').classList.remove('active')">キャンセル</button>
        <button type="submit" class="btn btn--primary">更新</button>
      </div>
    </form>
  `;
  showModal('タスク編集', content);
}

async function editHandover(id) {
  const handover = appData.handovers.find(h => h.id === id);
  if (!handover) return;
  
  // データが読み込まれていない場合は読み込み
  if (appData.departments.length === 0 || appData.priorities.length === 0) {
    await loadBasicData();
  }
  
  const content = `
    <form class="modal-form" onsubmit="updateHandover(event, ${id})">
      <div class="form-group">
        <label class="form-label">タイトル</label>
        <input type="text" class="form-control" name="title" value="${handover.title}" required>
      </div>
      <div class="form-group">
        <label class="form-label">部署</label>
        <select class="form-control" name="department" required>
          ${appData.departments.map(dept => 
            `<option value="${dept.id}" ${dept.id === handover.department ? 'selected' : ''}>${dept.name}</option>`
          ).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">優先度</label>
        <select class="form-control" name="priority" required>
          ${appData.priorities.map(priority => 
            `<option value="${priority.id}" ${priority.id === handover.priority ? 'selected' : ''}>${priority.name}</option>`
          ).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">内容</label>
        <textarea class="form-control" name="description" rows="4" required>${handover.description}</textarea>
      </div>
      <div class="modal-buttons">
        <button type="button" class="btn btn--outline" onclick="document.getElementById('modal').classList.remove('active')">キャンセル</button>
        <button type="submit" class="btn btn--primary">更新</button>
      </div>
    </form>
  `;
  showModal('申し送り編集', content);
}

// Update Functions
async function updateSchedule(event, id) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const updatedSchedule = {
    title: formData.get('title'),
    department: formData.get('department'),
    date: formData.get('date'),
    time: formData.get('time'),
    description: formData.get('description') || '',
    duration: 60
  };
  
  try {
    const { data, error } = await supabase
      .from('schedules')
      .update(updatedSchedule)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    
    await loadSchedules();
    document.getElementById('modal').classList.remove('active');
    
    if (currentSection === 'dashboard') {
      renderDashboard();
    } else if (currentSection === 'calendar') {
      renderCalendar();
    }
  } catch (error) {
    console.error('スケジュール更新エラー:', error);
    alert('スケジュールの更新に失敗しました');
  }
}

async function updateTask(event, id) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const updatedTask = {
    title: formData.get('title'),
    department: formData.get('department'),
    description: formData.get('description'),
    priority: formData.get('priority'),
    due_date: formData.get('dueDate'),
    assigned_by: formData.get('assignedBy')
  };
  
  try {
    const { data, error } = await supabase
      .from('tasks')
      .update(updatedTask)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    
    await loadTasks();
    document.getElementById('modal').classList.remove('active');
    
    if (currentSection === 'tasks') {
      renderTasks();
    }
  } catch (error) {
    console.error('タスク更新エラー:', error);
    alert('タスクの更新に失敗しました');
  }
}

async function updateHandover(event, id) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const updatedHandover = {
    department: formData.get('department'),
    title: formData.get('title'),
    description: formData.get('description'),
    priority: formData.get('priority')
  };
  
  try {
    const { data, error } = await supabase
      .from('handovers')
      .update(updatedHandover)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    
    await loadHandovers();
    document.getElementById('modal').classList.remove('active');
    
    if (currentSection === 'handovers') {
      renderHandovers();
    }
  } catch (error) {
    console.error('申し送り更新エラー:', error);
    alert('申し送り事項の更新に失敗しました');
  }
}

// Day Schedule Modal Functions
async function showDaySchedules(dateStr) {
  console.log('日別予定表示:', dateStr);
  
  // データが読み込まれていない場合は読み込み
  if (appData.schedules.length === 0) {
    await loadSchedules();
  }
  
  if (appData.departments.length === 0) {
    await loadBasicData();
  }
  
  const daySchedules = appData.schedules.filter(s => s.date === dateStr);
  const formattedDate = formatDate(dateStr);
  
  const schedulesList = daySchedules.length > 0 
    ? daySchedules.map(schedule => `
        <div class="day-schedule-item">
          <div class="day-schedule-time">${formatTime(schedule.time)}</div>
          <div class="day-schedule-details">
            <div class="day-schedule-title">${schedule.title}</div>
            <div class="day-schedule-description">${schedule.description || ''}</div>
            <div class="day-schedule-department" style="background-color: ${getDepartmentColor(schedule.department)}">
              ${getDepartmentName(schedule.department)}
            </div>
          </div>
          <div class="day-schedule-actions">
            <button class="btn btn--sm btn--outline" onclick="editScheduleFromDay(${schedule.id})">${window.iconSystem ? window.iconSystem.Icon('edit', 'sm', 'base') : '編集'}</button>
            <button class="btn btn--sm btn--outline" onclick="deleteScheduleFromDay(${schedule.id})" style="color: #dc3545; border-color: #dc3545;">${window.iconSystem ? window.iconSystem.Icon('trash2', 'sm', 'base') : '削除'}</button>
          </div>
        </div>
      `).join('')
    : '<div class="empty-state">この日の予定はありません</div>';

  const content = `
    <div class="day-schedule-modal">
      <div class="day-schedule-header">
        <h3>${formattedDate}の予定</h3>
        <button class="btn btn--primary btn--sm" onclick="addScheduleForDay('${dateStr}')">
          <span>➕</span>
          予定追加
        </button>
      </div>
      <div class="day-schedule-list">
        ${schedulesList}
      </div>
      <div class="modal-buttons">
        <button type="button" class="btn btn--outline" onclick="document.getElementById('modal').classList.remove('active')">閉じる</button>
      </div>
    </div>
  `;
  
  showModal(`${formattedDate}の予定`, content);
}

async function addScheduleForDay(dateStr) {
  // データが読み込まれていない場合は読み込み
  if (appData.departments.length === 0) {
    await loadBasicData();
  }
  
  const content = `
    <form class="modal-form" onsubmit="addScheduleForSpecificDay(event, '${dateStr}')">
      <div class="form-group">
        <label class="form-label">タイトル</label>
        <input type="text" class="form-control" name="title" required>
      </div>
      <div class="form-group">
        <label class="form-label">部署</label>
        <select class="form-control" name="department" required>
          <option value="">部署を選択してください</option>
          ${appData.departments.map(dept => `<option value="${dept.id}">${dept.name}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">日付</label>
        <input type="date" class="form-control" name="date" value="${dateStr}" required readonly>
      </div>
      <div class="form-group">
        <label class="form-label">時間</label>
        <input type="time" class="form-control" name="time" required>
      </div>
      <div class="form-group">
        <label class="form-label">説明</label>
        <textarea class="form-control" name="description" rows="3"></textarea>
      </div>
      <div class="modal-buttons">
        <button type="button" class="btn btn--outline" onclick="showDaySchedules('${dateStr}')">戻る</button>
        <button type="submit" class="btn btn--primary">追加</button>
      </div>
    </form>
  `;
  showModal(`${formatDate(dateStr)}に予定追加`, content);
}

async function addScheduleForSpecificDay(event, dateStr) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const newSchedule = {
    title: formData.get('title'),
    department: formData.get('department'),
    date: dateStr,
    time: formData.get('time'),
    description: formData.get('description') || '',
    duration: 60
  };
  
  try {
    const { data, error } = await supabase
      .from('schedules')
      .insert([newSchedule])
      .select();
    
    if (error) throw error;
    
    await loadSchedules();
    
    // カレンダーを更新
    if (currentSection === 'calendar') {
      renderCalendar();
    }
    
    // 日別予定モーダルに戻る
    showDaySchedules(dateStr);
  } catch (error) {
    console.error('スケジュール追加エラー:', error);
    alert('スケジュールの追加に失敗しました');
  }
}

async function editScheduleFromDay(id) {
  const schedule = appData.schedules.find(s => s.id === id);
  if (!schedule) return;
  
  // データが読み込まれていない場合は読み込み
  if (appData.departments.length === 0) {
    await loadBasicData();
  }
  
  const content = `
    <form class="modal-form" onsubmit="updateScheduleFromDay(event, ${id}, '${schedule.date}')">
      <div class="form-group">
        <label class="form-label">タイトル</label>
        <input type="text" class="form-control" name="title" value="${schedule.title}" required>
      </div>
      <div class="form-group">
        <label class="form-label">部署</label>
        <select class="form-control" name="department" required>
          ${appData.departments.map(dept => 
            `<option value="${dept.id}" ${dept.id === schedule.department ? 'selected' : ''}>${dept.name}</option>`
          ).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">日付</label>
        <input type="date" class="form-control" name="date" value="${schedule.date}" required>
      </div>
      <div class="form-group">
        <label class="form-label">時間</label>
        <input type="time" class="form-control" name="time" value="${schedule.time}" required>
      </div>
      <div class="form-group">
        <label class="form-label">説明</label>
        <textarea class="form-control" name="description" rows="3">${schedule.description || ''}</textarea>
      </div>
      <div class="modal-buttons">
        <button type="button" class="btn btn--outline" onclick="showDaySchedules('${schedule.date}')">戻る</button>
        <button type="submit" class="btn btn--primary">更新</button>
      </div>
    </form>
  `;
  showModal('予定編集', content);
}

async function updateScheduleFromDay(event, id, originalDate) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const updatedSchedule = {
    title: formData.get('title'),
    department: formData.get('department'),
    date: formData.get('date'),
    time: formData.get('time'),
    description: formData.get('description') || '',
    duration: 60
  };
  
  try {
    const { data, error } = await supabase
      .from('schedules')
      .update(updatedSchedule)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    
    await loadSchedules();
    
    // カレンダーを更新
    if (currentSection === 'calendar') {
      renderCalendar();
    }
    
    // 日別予定モーダルに戻る（日付が変更された場合は新しい日付で表示）
    const newDate = formData.get('date');
    showDaySchedules(newDate);
  } catch (error) {
    console.error('スケジュール更新エラー:', error);
    alert('スケジュールの更新に失敗しました');
  }
}

async function deleteScheduleFromDay(id) {
  if (!confirm('この予定を削除しますか？')) return;
  
  const schedule = appData.schedules.find(s => s.id === id);
  const originalDate = schedule?.date;
  
  try {
    const { error } = await supabase
      .from('schedules')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    await loadSchedules();
    
    // カレンダーを更新
    if (currentSection === 'calendar') {
      renderCalendar();
    }
    
    // 日別予定モーダルを更新
    if (originalDate) {
      showDaySchedules(originalDate);
    }
  } catch (error) {
    console.error('スケジュール削除エラー:', error);
    alert('スケジュールの削除に失敗しました');
  }
}

// Delete Functions
async function deleteSchedule(id) {
  if (!confirm('このスケジュールを削除しますか？')) return;
  
  try {
    const { error } = await supabase
      .from('schedules')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    await loadSchedules();
    
    if (currentSection === 'dashboard') {
      renderDashboard();
    } else if (currentSection === 'calendar') {
      renderCalendar();
    }
  } catch (error) {
    console.error('スケジュール削除エラー:', error);
    alert('スケジュールの削除に失敗しました');
  }
}

async function deleteTask(id) {
  if (!confirm('このタスクを削除しますか？')) return;
  
  try {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    await loadTasks();
    
    if (currentSection === 'tasks') {
      renderTasks();
    }
  } catch (error) {
    console.error('タスク削除エラー:', error);
    alert('タスクの削除に失敗しました');
  }
}

async function deleteHandover(id) {
  if (!confirm('この申し送り事項を削除しますか？')) return;
  
  try {
    const { error } = await supabase
      .from('handovers')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    await loadHandovers();
    
    if (currentSection === 'handovers') {
      renderHandovers();
    }
  } catch (error) {
    console.error('申し送り削除エラー:', error);
    alert('申し送り事項の削除に失敗しました');
  }
}

// Add Functions
async function addSchedule(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const newSchedule = {
    title: formData.get('title'),
    department: formData.get('department'),
    date: formData.get('date'),
    time: formData.get('time'),
    description: formData.get('description') || '',
    duration: 60
  };
  
  try {
    const { data, error } = await supabase
      .from('schedules')
      .insert([newSchedule])
      .select();
    
    if (error) throw error;
    
    await loadSchedules();
    document.getElementById('modal').classList.remove('active');
    
    if (currentSection === 'dashboard') {
      renderDashboard();
    } else if (currentSection === 'calendar') {
      renderCalendar();
    }
  } catch (error) {
    console.error('スケジュール追加エラー:', error);
    alert('スケジュールの追加に失敗しました');
  }
}

async function addHandover(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const newHandover = {
    department: formData.get('department'),
    title: formData.get('title'),
    description: formData.get('description'),
    priority: formData.get('priority'),
    status: 'pending'
  };
  
  try {
    const { data, error } = await supabase
      .from('handovers')
      .insert([newHandover])
      .select();
    
    if (error) throw error;
    
    await loadHandovers();
    document.getElementById('modal').classList.remove('active');
    
    if (currentSection === 'handovers') {
      renderHandovers();
    }
  } catch (error) {
    console.error('申し送り追加エラー:', error);
    alert('申し送り事項の追加に失敗しました');
  }
}

async function addTask(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const newTask = {
    title: formData.get('title'),
    department: formData.get('department'),
    description: formData.get('description'),
    priority: formData.get('priority'),
    due_date: formData.get('dueDate'),
    assigned_by: formData.get('assignedBy'),
    completed: false
  };
  
  try {
    const { data, error } = await supabase
      .from('tasks')
      .insert([newTask])
      .select();
    
    if (error) throw error;
    
    await loadTasks();
    document.getElementById('modal').classList.remove('active');
    
    if (currentSection === 'tasks') {
      renderTasks();
    }
  } catch (error) {
    console.error('タスク追加エラー:', error);
    alert('タスクの追加に失敗しました');
  }
}

// Comment Functions
function getCommentsForItem(itemType, itemId) {
  return appData.comments.filter(c => c.item_type === itemType && c.item_id == itemId);
}

async function addComment(itemType, itemId, authorName, content) {
  try {
    const { data, error } = await supabase
      .from('comments')
      .insert([{
        item_type: itemType,
        item_id: itemId,
        author_name: authorName,
        content: content
      }])
      .select();
    
    if (error) throw error;
    
    await loadComments();
    
    // 該当セクションを再描画
    if (itemType === 'task') {
      renderTasksGrid();
    } else if (itemType === 'handover') {
      renderHandovers();
    }
    
    return true;
  } catch (error) {
    console.error('コメント追加エラー:', error);
    return false;
  }
}

function showCommentModal(itemType, itemId, itemTitle) {
  const content = `
    <form class="modal-form" onsubmit="submitComment(event, '${itemType}', ${itemId})">
      <div class="form-group">
        <label class="form-label">コメント対象</label>
        <input type="text" class="form-control" value="${itemTitle}" readonly>
      </div>
      <div class="form-group">
        <label class="form-label">担当者名</label>
        <input type="text" class="form-control" name="authorName" placeholder="担当者名を入力" required>
      </div>
      <div class="form-group">
        <label class="form-label">コメント</label>
        <textarea class="form-control" name="content" rows="4" placeholder="コメントを入力してください" required></textarea>
      </div>
      <div class="modal-buttons">
        <button type="button" class="btn btn--outline" onclick="document.getElementById('modal').classList.remove('active')">キャンセル</button>
        <button type="submit" class="btn btn--primary">コメント追加</button>
      </div>
    </form>
  `;
  showModal('コメント追加', content);
}

async function submitComment(event, itemType, itemId) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const authorName = formData.get('authorName');
  const content = formData.get('content');
  
  const success = await addComment(itemType, itemId, authorName, content);
  
  if (success) {
    document.getElementById('modal').classList.remove('active');
  } else {
    alert('コメントの追加に失敗しました');
  }
}

function formatCommentDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return '今';
  if (diffMins < 60) return `${diffMins}分前`;
  if (diffHours < 24) return `${diffHours}時間前`;
  if (diffDays < 7) return `${diffDays}日前`;
  
  return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
}

// Initialize Application
async function initializeApp() {
  try {
    // データベースからデータを読み込み
    await loadBasicData();
    await loadSchedules();
    await loadHandovers();
    await loadTasks();
    await loadComments();
    
    initializeNavigation();
    initializeModal();
    
    // Add event listeners for add buttons
    document.getElementById('add-schedule-btn').addEventListener('click', showScheduleModal);
    document.getElementById('add-handover-btn').addEventListener('click', showHandoverModal);
    document.getElementById('add-task-btn').addEventListener('click', showTaskModal);
    
    // Show initial section
    showSection('dashboard');
  } catch (error) {
    console.error('アプリケーション初期化エラー:', error);
    // フォールバック: ローカルデータで動作
    showSection('dashboard');
  }
}

// Auto-resize textarea functionality
function autoResizeTextarea() {
  const textareas = document.querySelectorAll('textarea');
  textareas.forEach(textarea => {
    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';
    // Set height to scrollHeight to fit content
    textarea.style.height = textarea.scrollHeight + 'px';
  });
}

// Initialize textarea auto-resize
function initializeTextareaAutoResize() {
  // Add event listener to all existing textareas
  document.addEventListener('input', (e) => {
    if (e.target.tagName === 'TEXTAREA') {
      e.target.style.height = 'auto';
      e.target.style.height = e.target.scrollHeight + 'px';
    }
  });
  
  // Auto-resize on page load
  autoResizeTextarea();
}

// Initialize sidebar icons
function initializeSidebarIcons() {
  // Retry mechanism in case iconSystem isn't loaded yet
  let retryCount = 0;
  const maxRetries = 10;
  
  function tryInitIcons() {
    if (window.iconSystem && window.iconSystem.Icon) {
      const dashboardIcon = document.getElementById('dashboard-icon');
      const handoversIcon = document.getElementById('handovers-icon');
      const tasksIcon = document.getElementById('tasks-icon');
      const calendarIcon = document.getElementById('calendar-icon');
      
      if (dashboardIcon) dashboardIcon.innerHTML = window.iconSystem.Icon('barChart2', 'md', 'base');
      if (handoversIcon) handoversIcon.innerHTML = window.iconSystem.Icon('notebookPen', 'md', 'base');
      if (tasksIcon) tasksIcon.innerHTML = window.iconSystem.Icon('checkSquare', 'md', 'base');
      if (calendarIcon) calendarIcon.innerHTML = window.iconSystem.Icon('calendar', 'md', 'base');
      
      console.log('Sidebar icons initialized successfully');
    } else if (retryCount < maxRetries) {
      retryCount++;
      console.log(`Retrying icon initialization (${retryCount}/${maxRetries})`);
      setTimeout(tryInitIcons, 100);
    } else {
      console.error('Failed to initialize sidebar icons - iconSystem not available');
    }
  }
  
  tryInitIcons();
}

// Expose functions globally for onclick handlers
window.showCommentModal = showCommentModal;
window.editSchedule = editSchedule;
window.deleteSchedule = deleteSchedule;
window.editHandover = editHandover;
window.deleteHandover = deleteHandover;
window.editTask = editTask;
window.deleteTask = deleteTask;
window.editScheduleFromDay = editScheduleFromDay;
window.deleteScheduleFromDay = deleteScheduleFromDay;
window.updateTaskStatus = updateTaskStatus;
window.updateHandoverStatus = updateHandoverStatus;

// Start the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Small delay to ensure all modules are loaded
  setTimeout(() => {
    initializeApp();
    initializeTextareaAutoResize();
    initializeSidebarIcons();
  }, 50);
});