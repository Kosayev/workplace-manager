// Application Data and State
const appData = {
  departments: [],
  priorities: [],
  schedules: [],
  handovers: [],
  tasks: []
};

// データベースから基本データを読み込む
async function loadBasicData() {
  try {
    // 部署データを取得
    const { data: departments, error: deptError } = await supabase
      .from('departments')
      .select('*');
    
    if (deptError) throw deptError;
    appData.departments = departments;

    // 優先度データを取得
    const { data: priorities, error: priorityError } = await supabase
      .from('priorities')
      .select('*')
      .order('level', { ascending: false });
    
    if (priorityError) throw priorityError;
    appData.priorities = priorities;

    console.log('基本データの読み込み完了');
  } catch (error) {
    console.error('基本データの読み込みエラー:', error);
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
    </div>
  `).join('');
}

// Handovers Functions
function renderHandovers() {
  renderHandoverTabs();
  renderHandoverContent();
}

function renderHandoverTabs() {
  const tabsContainer = document.getElementById('handover-tabs');
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
        <div class="handover-timestamp">${formatDateTime(handover.timestamp)}</div>
      </div>
    </div>
  `).join('');
}

// Tasks Functions
function renderTasks() {
  renderTaskFilters();
  renderTasksGrid();
}

function renderTaskFilters() {
  const deptFilter = document.getElementById('task-department-filter');
  const priorityFilter = document.getElementById('task-priority-filter');
  
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
      <div class="task-meta">
        <div>
          <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} 
                 onchange="toggleTaskCompletion(${task.id})">
          期限: ${formatDate(task.dueDate)}
        </div>
        <div style="color: ${getDepartmentColor(task.department)}">
          ${getDepartmentName(task.department)}
        </div>
      </div>
    </div>
  `).join('');
}

async function toggleTaskCompletion(taskId) {
  try {
    const task = appData.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const { data, error } = await supabase
      .from('tasks')
      .update({ completed: !task.completed })
      .eq('id', taskId)
      .select();
    
    if (error) throw error;
    
    await loadTasks();
    renderTasksGrid();
  } catch (error) {
    console.error('タスク更新エラー:', error);
    alert('タスクの更新に失敗しました');
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
      <div class="${dayClass}" data-date="${dateStr}">
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

function showScheduleModal() {
  const content = `
    <form class="modal-form" onsubmit="addSchedule(event)">
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

function showHandoverModal() {
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

function showTaskModal() {
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

// Initialize Application
async function initializeApp() {
  try {
    // データベースからデータを読み込み
    await loadBasicData();
    await loadSchedules();
    await loadHandovers();
    await loadTasks();
    
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

// Start the application when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);