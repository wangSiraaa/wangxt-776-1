const STORAGE_KEYS = {
    INSTRUMENTS: 'music_locker_instruments',
    BORROWS: 'music_locker_borrows',
    REPAIRS: 'music_locker_repairs',
    ACTIVITIES: 'music_locker_activities',
    WAITLIST: 'music_locker_waitlist',
    USER: 'music_locker_user',
    ROLE: 'music_locker_role',
    SCAN_HISTORY: 'music_locker_scan_history'
};

const RISK_LEVELS = {
    low: { label: '低风险', deposit: 100, color: '#52c41a' },
    medium: { label: '中风险', deposit: 300, color: '#faad14' },
    high: { label: '高风险', deposit: 800, color: '#f5222d' }
};

const INSTRUMENT_STATUS = {
    available: '可借',
    borrowed: '已借出',
    maintenance: '维护中'
};

const DEFAULT_INSTRUMENTS = [
    { id: 'ins_001', name: '民谣吉他', emoji: '🎸', riskLevel: 'low', status: 'available', description: '入门级民谣吉他，适合初学者', deposit: 100, location: 'A区-01柜' },
    { id: 'ins_002', name: '电子琴', emoji: '🎹', riskLevel: 'high', status: 'maintenance', description: '61键专业电子琴，含延音踏板', deposit: 800, location: 'A区-02柜' },
    { id: 'ins_003', name: '架子鼓箱', emoji: '🥁', riskLevel: 'high', status: 'available', description: '便携鼓箱套装，含鼓棒', deposit: 800, location: 'B区-01柜' },
    { id: 'ins_004', name: '尤克里里', emoji: '🎶', riskLevel: 'low', status: 'available', description: '23寸尤克里里，桃花心木', deposit: 100, location: 'A区-03柜' },
    { id: 'ins_005', name: '小提琴', emoji: '🎻', riskLevel: 'medium', status: 'borrowed', description: '4/4标准小提琴，含琴盒', deposit: 300, location: 'B区-02柜' },
    { id: 'ins_006', name: '口琴套装', emoji: '🎵', riskLevel: 'low', status: 'available', description: '10孔布鲁斯口琴3支套装', deposit: 100, location: 'A区-04柜' },
    { id: 'ins_007', name: '萨克斯', emoji: '🎷', riskLevel: 'high', status: 'available', description: '中音萨克斯，降E调', deposit: 800, location: 'B区-03柜' },
    { id: 'ins_008', name: '非洲鼓', emoji: '🪘', riskLevel: 'medium', status: 'available', description: '12寸专业非洲鼓', deposit: 300, location: 'B区-04柜' }
];

const DEFAULT_ACTIVITIES = [
    { id: 'act_001', name: '社区吉他沙龙', date: getDateString(2), time: '19:00-21:00', location: '社区活动室A', instruments: ['ins_001', 'ins_004'], description: '吉他爱好者交流聚会' },
    { id: 'act_002', name: '儿童音乐启蒙课', date: getDateString(5), time: '10:00-11:30', location: '社区亲子室', instruments: ['ins_006', 'ins_008'], description: '专为3-6岁儿童设计' },
    { id: 'act_003', name: '爵士鼓体验日', date: getDateString(7), time: '14:00-17:00', location: '社区音乐室', instruments: ['ins_003', 'ins_007'], description: '专业老师指导体验' }
];

const DEFAULT_REPAIRS = [
    { id: 'rep_001', instrumentId: 'ins_002', description: '键盘按键失灵，需要更换导电橡胶', reporter: '社工李华', reportDate: getDateString(-1), priority: 'high', status: 'pending' }
];

const DEFAULT_USER = {
    id: 'user_001',
    name: '张小明',
    role: 'resident',
    balance: 500,
    borrowedInstruments: []
};

function getDateString(daysFromNow) {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString().split('T')[0];
}

const StorageManager = {
    get(key, defaultValue) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (e) {
            console.error('Storage read error:', e);
            return defaultValue;
        }
    },
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Storage write error:', e);
            return false;
        }
    },
    init() {
        if (!this.get(STORAGE_KEYS.INSTRUMENTS, null)) {
            this.set(STORAGE_KEYS.INSTRUMENTS, DEFAULT_INSTRUMENTS);
        }
        if (!this.get(STORAGE_KEYS.BORROWS, null)) {
            this.set(STORAGE_KEYS.BORROWS, []);
        }
        if (!this.get(STORAGE_KEYS.REPAIRS, null)) {
            this.set(STORAGE_KEYS.REPAIRS, DEFAULT_REPAIRS);
        }
        if (!this.get(STORAGE_KEYS.ACTIVITIES, null)) {
            this.set(STORAGE_KEYS.ACTIVITIES, DEFAULT_ACTIVITIES);
        }
        if (!this.get(STORAGE_KEYS.WAITLIST, null)) {
            this.set(STORAGE_KEYS.WAITLIST, []);
        }
        if (!this.get(STORAGE_KEYS.USER, null)) {
            this.set(STORAGE_KEYS.USER, DEFAULT_USER);
        }
        if (!this.get(STORAGE_KEYS.ROLE, null)) {
            this.set(STORAGE_KEYS.ROLE, 'resident');
        }
        if (!this.get(STORAGE_KEYS.SCAN_HISTORY, null)) {
            this.set(STORAGE_KEYS.SCAN_HISTORY, []);
        }
    }
};

const DataService = {
    getInstruments() {
        return StorageManager.get(STORAGE_KEYS.INSTRUMENTS, []);
    },
    getInstrumentById(id) {
        return this.getInstruments().find(i => i.id === id);
    },
    updateInstrument(id, updates) {
        const instruments = this.getInstruments();
        const index = instruments.findIndex(i => i.id === id);
        if (index !== -1) {
            instruments[index] = { ...instruments[index], ...updates };
            StorageManager.set(STORAGE_KEYS.INSTRUMENTS, instruments);
            return instruments[index];
        }
        return null;
    },
    getBorrows() {
        return StorageManager.get(STORAGE_KEYS.BORROWS, []);
    },
    getBorrowsByUser(userId) {
        return this.getBorrows().filter(b => b.userId === userId);
    },
    addBorrow(borrow) {
        const borrows = this.getBorrows();
        borrows.push(borrow);
        StorageManager.set(STORAGE_KEYS.BORROWS, borrows);
        return borrow;
    },
    updateBorrow(id, updates) {
        const borrows = this.getBorrows();
        const index = borrows.findIndex(b => b.id === id);
        if (index !== -1) {
            borrows[index] = { ...borrows[index], ...updates };
            StorageManager.set(STORAGE_KEYS.BORROWS, borrows);
            return borrows[index];
        }
        return null;
    },
    getRepairs() {
        return StorageManager.get(STORAGE_KEYS.REPAIRS, []);
    },
    addRepair(repair) {
        const repairs = this.getRepairs();
        repairs.push(repair);
        StorageManager.set(STORAGE_KEYS.REPAIRS, repairs);
        return repair;
    },
    updateRepair(id, updates) {
        const repairs = this.getRepairs();
        const index = repairs.findIndex(r => r.id === id);
        if (index !== -1) {
            repairs[index] = { ...repairs[index], ...updates };
            StorageManager.set(STORAGE_KEYS.REPAIRS, repairs);
            return repairs[index];
        }
        return null;
    },
    getActivities() {
        return StorageManager.get(STORAGE_KEYS.ACTIVITIES, []);
    },
    getWaitlist() {
        return StorageManager.get(STORAGE_KEYS.WAITLIST, []);
    },
    addWaitlistItem(item) {
        const waitlist = this.getWaitlist();
        waitlist.push(item);
        StorageManager.set(STORAGE_KEYS.WAITLIST, waitlist);
        return item;
    },
    removeWaitlistItem(id) {
        const waitlist = this.getWaitlist().filter(w => w.id !== id);
        StorageManager.set(STORAGE_KEYS.WAITLIST, waitlist);
    },
    getUser() {
        return StorageManager.get(STORAGE_KEYS.USER, DEFAULT_USER);
    },
    updateUser(updates) {
        const user = { ...this.getUser(), ...updates };
        StorageManager.set(STORAGE_KEYS.USER, user);
        return user;
    },
    getCurrentRole() {
        return StorageManager.get(STORAGE_KEYS.ROLE, 'resident');
    },
    setCurrentRole(role) {
        StorageManager.set(STORAGE_KEYS.ROLE, role);
    },
    getScanHistory() {
        return StorageManager.get(STORAGE_KEYS.SCAN_HISTORY, []);
    },
    addScanRecord(record) {
        const history = this.getScanHistory();
        history.unshift(record);
        if (history.length > 50) {
            history.pop();
        }
        StorageManager.set(STORAGE_KEYS.SCAN_HISTORY, history);
        return record;
    },
    clearScanHistory() {
        StorageManager.set(STORAGE_KEYS.SCAN_HISTORY, []);
    }
};

const ValidationService = {
    canBorrowInstrument(instrumentId, borrowDate, userId) {
        const instrument = DataService.getInstrumentById(instrumentId);
        const user = DataService.getUser();
        
        if (!instrument) {
            return { valid: false, message: '乐器不存在' };
        }
        
        if (instrument.status === 'maintenance') {
            return { valid: false, message: '该乐器正在维护中，暂不可预约' };
        }
        
        if (instrument.status === 'borrowed') {
            return { valid: false, message: '该乐器已借出，可加入候补' };
        }
        
        const riskConfig = RISK_LEVELS[instrument.riskLevel];
        if (user.balance < riskConfig.deposit) {
            return { 
                valid: false, 
                message: `押金不足！该乐器需押金¥${riskConfig.deposit}，您当前余额¥${user.balance}`,
                canWaitlist: true
            };
        }
        
        if (instrument.riskLevel === 'high') {
            const userBorrows = DataService.getBorrowsByUser(userId || user.id);
            const sameDayHighValueBorrows = userBorrows.filter(b => {
                if (b.status === 'returned') return false;
                const borrowDateObj = new Date(b.borrowDate);
                const checkDateObj = new Date(borrowDate);
                return b.riskLevel === 'high' && 
                       borrowDateObj.toDateString() === checkDateObj.toDateString();
            });
            
            if (sameDayHighValueBorrows.length >= 1) {
                return { 
                    valid: false, 
                    message: '同一活动日最多只能借用1件高价值乐器，您当日已有借用记录' 
                };
            }
        }
        
        return { valid: true };
    },
    
    canReturnInstrument(borrowId) {
        const borrow = DataService.getBorrows().find(b => b.id === borrowId);
        if (!borrow) {
            return { valid: false, message: '借用记录不存在' };
        }
        if (borrow.status === 'returned') {
            return { valid: false, message: '该乐器已归还' };
        }
        return { valid: true };
    },
    
    validateReturnWithPhoto(borrowId, hasPhoto) {
        const baseCheck = this.canReturnInstrument(borrowId);
        if (!baseCheck.valid) return baseCheck;
        
        if (!hasPhoto) {
            return { valid: false, message: '请先上传归还照片后再完成归还' };
        }
        
        return { valid: true };
    }
};

const BorrowService = {
    borrowInstrument(instrumentId, borrowDate, activityId = null) {
        const user = DataService.getUser();
        const validation = ValidationService.canBorrowInstrument(instrumentId, borrowDate, user.id);
        
        if (!validation.valid) {
            if (validation.canWaitlist) {
                return { success: false, canWaitlist: true, message: validation.message };
            }
            return { success: false, message: validation.message };
        }
        
        const instrument = DataService.getInstrumentById(instrumentId);
        const riskConfig = RISK_LEVELS[instrument.riskLevel];
        
        const borrow = {
            id: 'borrow_' + Date.now(),
            instrumentId: instrumentId,
            instrumentName: instrument.name,
            userId: user.id,
            userName: user.name,
            borrowDate: borrowDate,
            dueDate: getDateString(7),
            status: 'active',
            deposit: riskConfig.deposit,
            riskLevel: instrument.riskLevel,
            activityId: activityId,
            returnPhoto: null,
            returnDate: null
        };
        
        DataService.addBorrow(borrow);
        DataService.updateInstrument(instrumentId, { status: 'borrowed' });
        DataService.updateUser({ balance: user.balance - riskConfig.deposit });
        
        return { success: true, borrow: borrow };
    },
    
    returnInstrument(borrowId, photoData = null) {
        const validation = ValidationService.validateReturnWithPhoto(borrowId, !!photoData);
        if (!validation.valid) {
            return { success: false, message: validation.message };
        }
        
        const borrow = DataService.getBorrows().find(b => b.id === borrowId);
        const user = DataService.getUser();
        
        DataService.updateBorrow(borrowId, {
            status: 'returned',
            returnDate: getDateString(0),
            returnPhoto: photoData
        });
        DataService.updateInstrument(borrow.instrumentId, { status: 'available' });
        DataService.updateUser({ balance: user.balance + borrow.deposit });
        
        return { success: true };
    },
    
    addToWaitlist(instrumentId, date) {
        const user = DataService.getUser();
        const instrument = DataService.getInstrumentById(instrumentId);
        
        const item = {
            id: 'wait_' + Date.now(),
            instrumentId: instrumentId,
            instrumentName: instrument.name,
            userId: user.id,
            userName: user.name,
            date: date,
            timestamp: Date.now()
        };
        
        DataService.addWaitlistItem(item);
        return { success: true, item: item };
    }
};

const UIController = {
    currentTab: 'instruments',
    calendarDate: new Date(),
    selectedDate: null,
    
    init() {
        StorageManager.init();
        this.bindEvents();
        this.renderUserInfo();
        this.renderRoleView();
        this.switchTab('instruments');
    },
    
    bindEvents() {
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });
        
        document.getElementById('roleSelector').addEventListener('change', (e) => {
            DataService.setCurrentRole(e.target.value);
            this.renderRoleView();
            this.renderCurrentTab();
        });
        
        document.getElementById('riskFilter').addEventListener('change', () => this.renderInstruments());
        document.getElementById('statusFilter').addEventListener('change', () => this.renderInstruments());
        
        document.getElementById('prevMonth').addEventListener('click', () => {
            this.calendarDate.setMonth(this.calendarDate.getMonth() - 1);
            this.renderCalendar();
        });
        document.getElementById('nextMonth').addEventListener('click', () => {
            this.calendarDate.setMonth(this.calendarDate.getMonth() + 1);
            this.renderCalendar();
        });
        
        document.querySelector('.close-btn').addEventListener('click', () => this.closeModal());
        document.getElementById('modal').addEventListener('click', (e) => {
            if (e.target.id === 'modal') this.closeModal();
        });
        
        document.getElementById('addRepairBtn').addEventListener('click', () => this.showAddRepairModal());
    },
    
    switchTab(tabName) {
        this.currentTab = tabName;
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `tab-${tabName}`);
        });
        this.renderCurrentTab();
    },
    
    renderCurrentTab() {
        switch (this.currentTab) {
            case 'instruments':
                this.renderInstruments();
                break;
            case 'scan':
                this.renderScanPage();
                break;
            case 'calendar':
                this.renderCalendar();
                break;
            case 'myborrows':
                this.renderMyBorrows();
                break;
            case 'repair':
                this.renderRepairQueue();
                break;
            case 'activities':
                this.renderActivities();
                break;
            case 'waitlist':
                this.renderWaitlist();
                break;
        }
    },
    
    renderUserInfo() {
        const user = DataService.getUser();
        const role = DataService.getCurrentRole();
        const roleNames = { resident: '居民', socialworker: '社工', volunteer: '维修志愿者' };
        
        document.getElementById('userName').textContent = `${roleNames[role]}：${user.name}`;
        document.getElementById('userBalance').textContent = `押金余额：¥${user.balance}`;
        document.getElementById('roleSelector').value = role;
    },
    
    renderRoleView() {
        const role = DataService.getCurrentRole();
        const repairTab = document.getElementById('repairTab');
        const waitlistTab = document.getElementById('waitlistTab');
        const addRepairBtn = document.getElementById('addRepairBtn');
        
        if (role === 'volunteer') {
            repairTab.style.display = 'inline-block';
            addRepairBtn.style.display = 'inline-block';
            waitlistTab.style.display = 'inline-block';
        } else if (role === 'socialworker') {
            repairTab.style.display = 'inline-block';
            addRepairBtn.style.display = 'none';
            waitlistTab.style.display = 'inline-block';
        } else {
            repairTab.style.display = 'none';
            waitlistTab.style.display = 'none';
        }
        
        this.renderUserInfo();
    },
    
    renderInstruments() {
        const grid = document.getElementById('instrumentsGrid');
        const riskFilter = document.getElementById('riskFilter').value;
        const statusFilter = document.getElementById('statusFilter').value;
        const role = DataService.getCurrentRole();
        
        let instruments = DataService.getInstruments();
        
        if (riskFilter !== 'all') {
            instruments = instruments.filter(i => i.riskLevel === riskFilter);
        }
        if (statusFilter !== 'all') {
            instruments = instruments.filter(i => i.status === statusFilter);
        }
        
        grid.innerHTML = instruments.map(instrument => {
            const riskConfig = RISK_LEVELS[instrument.riskLevel];
            const statusClass = `status-${instrument.status}`;
            const isDisabled = instrument.status === 'maintenance';
            
            let actionBtn = '';
            if (role === 'resident') {
                if (instrument.status === 'available') {
                    actionBtn = `<button class="btn-borrow" onclick="UIController.showBorrowModal('${instrument.id}')">立即借用</button>`;
                } else if (instrument.status === 'borrowed') {
                    actionBtn = `<button class="btn-waitlist" onclick="UIController.showWaitlistModal('${instrument.id}')">加入候补</button>`;
                } else {
                    actionBtn = `<button class="btn-disabled" disabled>维护中</button>`;
                }
            } else if (role === 'socialworker' || role === 'volunteer') {
                actionBtn = `<button class="btn-view" onclick="UIController.showInstrumentDetail('${instrument.id}')">查看详情</button>`;
            }
            
            return `
                <div class="instrument-card ${isDisabled ? 'card-disabled' : ''}" data-id="${instrument.id}">
                    <div class="card-header">
                        <span class="instrument-emoji">${instrument.emoji}</span>
                        <span class="instrument-status ${statusClass}">${INSTRUMENT_STATUS[instrument.status]}</span>
                    </div>
                    <h3 class="instrument-name">${instrument.name}</h3>
                    <div class="risk-badge" style="background-color: ${riskConfig.color}">
                        ${riskConfig.label} · 押金¥${riskConfig.deposit}
                    </div>
                    <p class="instrument-desc">${instrument.description}</p>
                    <p class="instrument-location">📍 ${instrument.location}</p>
                    <div class="card-actions">
                        ${actionBtn}
                    </div>
                </div>
            `;
        }).join('');
    },
    
    showBorrowModal(instrumentId) {
        const instrument = DataService.getInstrumentById(instrumentId);
        const user = DataService.getUser();
        const riskConfig = RISK_LEVELS[instrument.riskLevel];
        
        const today = new Date().toISOString().split('T')[0];
        const activities = DataService.getActivities().filter(a => a.instruments.includes(instrumentId));
        
        this.showModal(`
            <h2>借用 ${instrument.name}</h2>
            <div class="modal-info">
                <p><strong>风险等级：</strong><span style="color:${riskConfig.color}">${riskConfig.label}</span></p>
                <p><strong>所需押金：</strong>¥${riskConfig.deposit}</p>
                <p><strong>当前余额：</strong>¥${user.balance}</p>
            </div>
            <div class="form-group">
                <label>借用日期：</label>
                <input type="date" id="borrowDate" value="${today}" min="${today}">
            </div>
            ${activities.length > 0 ? `
            <div class="form-group">
                <label>关联活动（可选）：</label>
                <select id="borrowActivity">
                    <option value="">不关联活动</option>
                    ${activities.map(a => `<option value="${a.id}">${a.name} (${a.date})</option>`).join('')}
                </select>
            </div>
            ` : ''}
            <div class="modal-actions">
                <button class="btn-cancel" onclick="UIController.closeModal()">取消</button>
                <button class="btn-confirm" onclick="UIController.confirmBorrow('${instrumentId}')">确认借用</button>
            </div>
        `);
    },
    
    confirmBorrow(instrumentId) {
        const borrowDate = document.getElementById('borrowDate').value;
        const activitySelect = document.getElementById('borrowActivity');
        const activityId = activitySelect ? activitySelect.value : null;
        
        if (!borrowDate) {
            this.showToast('请选择借用日期', 'error');
            return;
        }
        
        const result = BorrowService.borrowInstrument(instrumentId, borrowDate, activityId);
        
        if (result.success) {
            this.showToast('借用成功！', 'success');
            this.closeModal();
            this.renderUserInfo();
            this.renderInstruments();
        } else if (result.canWaitlist) {
            this.showModal(`
                <h2>押金不足</h2>
                <p>${result.message}</p>
                <p>您可以选择加入候补队列，待有乐器可用时通知您。</p>
                <div class="modal-actions">
                    <button class="btn-cancel" onclick="UIController.closeModal()">取消</button>
                    <button class="btn-confirm" onclick="UIController.confirmWaitlist('${instrumentId}', '${borrowDate}')">加入候补</button>
                </div>
            `);
        } else {
            this.showToast(result.message, 'error');
        }
    },
    
    showWaitlistModal(instrumentId) {
        const instrument = DataService.getInstrumentById(instrumentId);
        const today = new Date().toISOString().split('T')[0];
        
        this.showModal(`
            <h2>加入候补 - ${instrument.name}</h2>
            <p>该乐器当前已借出，您可以加入候补队列。</p>
            <div class="form-group">
                <label>期望借用日期：</label>
                <input type="date" id="waitlistDate" value="${today}" min="${today}">
            </div>
            <div class="modal-actions">
                <button class="btn-cancel" onclick="UIController.closeModal()">取消</button>
                <button class="btn-confirm" onclick="UIController.confirmWaitlist('${instrumentId}')">确认候补</button>
            </div>
        `);
    },
    
    confirmWaitlist(instrumentId, preDate = null) {
        const dateInput = document.getElementById('waitlistDate');
        const date = preDate || (dateInput ? dateInput.value : getDateString(0));
        
        if (!date) {
            this.showToast('请选择期望日期', 'error');
            return;
        }
        
        const result = BorrowService.addToWaitlist(instrumentId, date);
        if (result.success) {
            this.showToast('已加入候补队列！', 'success');
            this.closeModal();
            this.renderWaitlist();
        }
    },
    
    renderCalendar() {
        const grid = document.getElementById('calendarGrid');
        const monthLabel = document.getElementById('currentMonth');
        
        const year = this.calendarDate.getFullYear();
        const month = this.calendarDate.getMonth();
        
        monthLabel.textContent = `${year}年${month + 1}月`;
        
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
        
        let html = weekDays.map(d => `<div class="calendar-weekday">${d}</div>`).join('');
        
        for (let i = 0; i < firstDay; i++) {
            html += '<div class="calendar-day empty"></div>';
        }
        
        const today = new Date().toISOString().split('T')[0];
        
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = dateStr === today;
            const isSelected = dateStr === this.selectedDate;
            
            const dayActivities = DataService.getActivities().filter(a => a.date === dateStr);
            const hasActivity = dayActivities.length > 0;
            
            html += `
                <div class="calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${hasActivity ? 'has-activity' : ''}"
                     onclick="UIController.selectDate('${dateStr}')">
                    <span class="day-number">${day}</span>
                    ${hasActivity ? '<span class="activity-dot"></span>' : ''}
                </div>
            `;
        }
        
        grid.innerHTML = html;
        
        if (this.selectedDate) {
            this.renderCalendarDetail();
        }
    },
    
    selectDate(dateStr) {
        this.selectedDate = dateStr;
        this.renderCalendar();
    },
    
    renderCalendarDetail() {
        const detail = document.getElementById('calendarDetail');
        const dateStr = this.selectedDate;
        const dateObj = new Date(dateStr);
        const formattedDate = `${dateObj.getFullYear()}年${dateObj.getMonth() + 1}月${dateObj.getDate()}日`;
        
        const activities = DataService.getActivities().filter(a => a.date === dateStr);
        const availableInstruments = DataService.getInstruments().filter(i => i.status === 'available');
        
        detail.innerHTML = `
            <h3>${formattedDate} 可用乐器</h3>
            ${activities.length > 0 ? `
                <div class="day-activities">
                    <h4>📅 当天活动：</h4>
                    ${activities.map(a => `
                        <div class="activity-item-small">
                            <strong>${a.name}</strong> - ${a.time}
                            <button class="btn-small" onclick="UIController.showActivityDetail('${a.id}')">查看</button>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
            <div class="available-instruments">
                ${availableInstruments.map(ins => `
                    <div class="instrument-mini">
                        <span class="mini-emoji">${ins.emoji}</span>
                        <span>${ins.name}</span>
                        <span class="mini-risk" style="background:${RISK_LEVELS[ins.riskLevel].color}">${RISK_LEVELS[ins.riskLevel].label}</span>
                        <button class="btn-small" onclick="UIController.showBorrowModalWithDate('${ins.id}', '${dateStr}')">借用</button>
                    </div>
                `).join('')}
            </div>
        `;
    },
    
    showBorrowModalWithDate(instrumentId, date) {
        this.showBorrowModal(instrumentId);
        setTimeout(() => {
            const dateInput = document.getElementById('borrowDate');
            if (dateInput) dateInput.value = date;
        }, 50);
    },
    
    renderMyBorrows() {
        const list = document.getElementById('myBorrowsList');
        const user = DataService.getUser();
        const borrows = DataService.getBorrowsByUser(user.id).sort((a, b) => new Date(b.borrowDate) - new Date(a.borrowDate));
        
        if (borrows.length === 0) {
            list.innerHTML = '<p class="empty-state">暂无借用记录</p>';
            return;
        }
        
        list.innerHTML = borrows.map(borrow => {
            const instrument = DataService.getInstrumentById(borrow.instrumentId);
            const riskConfig = RISK_LEVELS[borrow.riskLevel];
            const isReturned = borrow.status === 'returned';
            
            return `
                <div class="borrow-card">
                    <div class="borrow-header">
                        <span class="borrow-emoji">${instrument ? instrument.emoji : '🎵'}</span>
                        <div>
                            <h4>${borrow.instrumentName}</h4>
                            <span class="risk-tag" style="background:${riskConfig.color}">${riskConfig.label}</span>
                        </div>
                        <span class="borrow-status ${borrow.status}">${isReturned ? '已归还' : '借用中'}</span>
                    </div>
                    <div class="borrow-info">
                        <p><strong>借用日期：</strong>${borrow.borrowDate}</p>
                        <p><strong>应还日期：</strong>${borrow.dueDate}</p>
                        <p><strong>押金：</strong>¥${borrow.deposit}</p>
                        ${borrow.activityId ? `<p><strong>关联活动：</strong>${this.getActivityName(borrow.activityId)}</p>` : ''}
                        ${borrow.returnDate ? `<p><strong>归还日期：</strong>${borrow.returnDate}</p>` : ''}
                    </div>
                    ${!isReturned ? `
                        <div class="borrow-actions">
                            <div class="photo-upload">
                                <input type="file" id="photo_${borrow.id}" accept="image/*" capture="environment" style="display:none;" 
                                       onchange="UIController.handlePhotoUpload('${borrow.id}', this)">
                                <button class="btn-photo" onclick="document.getElementById('photo_${borrow.id}').click()">
                                    📷 ${borrow.returnPhoto ? '重新拍照' : '上传归还照片'}
                                </button>
                                <span id="photoStatus_${borrow.id}">${borrow.returnPhoto ? '✅ 已上传' : ''}</span>
                            </div>
                            <button class="btn-return" onclick="UIController.confirmReturn('${borrow.id}')">完成归还</button>
                        </div>
                    ` : `
                        <div class="returned-info">
                            ${borrow.returnPhoto ? `<img src="${borrow.returnPhoto}" class="return-photo-thumb" alt="归还照片">` : ''}
                        </div>
                    `}
                </div>
            `;
        }).join('');
    },
    
    getActivityName(activityId) {
        const activity = DataService.getActivities().find(a => a.id === activityId);
        return activity ? activity.name : '未知活动';
    },
    
    handlePhotoUpload(borrowId, input) {
        const file = input.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const photoData = e.target.result;
            DataService.updateBorrow(borrowId, { returnPhoto: photoData });
            document.getElementById(`photoStatus_${borrowId}`).textContent = '✅ 已上传';
            this.showToast('照片上传成功', 'success');
        };
        reader.readAsDataURL(file);
    },
    
    confirmReturn(borrowId) {
        const borrow = DataService.getBorrows().find(b => b.id === borrowId);
        
        const validation = ValidationService.validateReturnWithPhoto(borrowId, !!borrow.returnPhoto);
        if (!validation.valid) {
            this.showModal(`
                <h2>归还失败</h2>
                <p class="error-text">${validation.message}</p>
                <div class="modal-actions">
                    <button class="btn-confirm" onclick="UIController.closeModal()">知道了</button>
                </div>
            `);
            return;
        }
        
        this.showModal(`
            <h2>确认归还</h2>
            <p>确认归还 ${borrow.instrumentName}？</p>
            <p>押金 ¥${borrow.deposit} 将退还至您的账户。</p>
            <div class="modal-actions">
                <button class="btn-cancel" onclick="UIController.closeModal()">取消</button>
                <button class="btn-confirm" onclick="UIController.completeReturn('${borrowId}')">确认归还</button>
            </div>
        `);
    },
    
    completeReturn(borrowId) {
        const result = BorrowService.returnInstrument(borrowId);
        if (result.success) {
            this.showToast('归还成功！押金已退还', 'success');
            this.closeModal();
            this.renderUserInfo();
            this.renderMyBorrows();
            this.renderInstruments();
        } else {
            this.showToast(result.message, 'error');
        }
    },
    
    renderRepairQueue() {
        const queue = document.getElementById('repairQueue');
        const repairs = DataService.getRepairs();
        const role = DataService.getCurrentRole();
        
        if (repairs.length === 0) {
            queue.innerHTML = '<p class="empty-state">暂无维修任务</p>';
            return;
        }
        
        queue.innerHTML = repairs.map(repair => {
            const instrument = DataService.getInstrumentById(repair.instrumentId);
            const priorityColors = { high: '#f5222d', medium: '#faad14', low: '#52c41a' };
            const statusLabels = { pending: '待处理', in_progress: '维修中', completed: '已完成' };
            
            return `
                <div class="repair-card">
                    <div class="repair-header">
                        <span class="repair-emoji">${instrument ? instrument.emoji : '🔧'}</span>
                        <div>
                            <h4>${instrument ? instrument.name : '未知乐器'}</h4>
                            <span class="repair-priority" style="background:${priorityColors[repair.priority]}">
                                ${repair.priority === 'high' ? '紧急' : repair.priority === 'medium' ? '普通' : '低优先级'}
                            </span>
                        </div>
                        <span class="repair-status ${repair.status}">${statusLabels[repair.status]}</span>
                    </div>
                    <p class="repair-desc"><strong>问题描述：</strong>${repair.description}</p>
                    <p class="repair-meta">
                        <span>上报人：${repair.reporter}</span>
                        <span>上报时间：${repair.reportDate}</span>
                    </p>
                    ${role === 'volunteer' ? `
                        <div class="repair-actions">
                            ${repair.status === 'pending' ? `
                                <button class="btn-start" onclick="UIController.startRepair('${repair.id}')">开始维修</button>
                            ` : ''}
                            ${repair.status === 'in_progress' ? `
                                <button class="btn-complete" onclick="UIController.completeRepair('${repair.id}')">完成维修</button>
                            ` : ''}
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    },
    
    startRepair(repairId) {
        DataService.updateRepair(repairId, { status: 'in_progress' });
        this.showToast('已开始维修', 'success');
        this.renderRepairQueue();
    },
    
    completeRepair(repairId) {
        const repair = DataService.getRepairs().find(r => r.id === repairId);
        DataService.updateRepair(repairId, { status: 'completed' });
        DataService.updateInstrument(repair.instrumentId, { status: 'available' });
        this.showToast('维修完成，乐器已恢复可用', 'success');
        this.renderRepairQueue();
        this.renderInstruments();
    },
    
    showAddRepairModal() {
        const instruments = DataService.getInstruments();
        
        this.showModal(`
            <h2>添加维修任务</h2>
            <div class="form-group">
                <label>选择乐器：</label>
                <select id="repairInstrument">
                    ${instruments.map(i => `<option value="${i.id}">${i.name} (${i.location})</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>问题描述：</label>
                <textarea id="repairDesc" rows="3" placeholder="请描述乐器的问题..."></textarea>
            </div>
            <div class="form-group">
                <label>优先级：</label>
                <select id="repairPriority">
                    <option value="low">低</option>
                    <option value="medium" selected>普通</option>
                    <option value="high">紧急</option>
                </select>
            </div>
            <div class="modal-actions">
                <button class="btn-cancel" onclick="UIController.closeModal()">取消</button>
                <button class="btn-confirm" onclick="UIController.submitRepair()">提交</button>
            </div>
        `);
    },
    
    submitRepair() {
        const instrumentId = document.getElementById('repairInstrument').value;
        const description = document.getElementById('repairDesc').value;
        const priority = document.getElementById('repairPriority').value;
        const user = DataService.getUser();
        
        if (!description.trim()) {
            this.showToast('请填写问题描述', 'error');
            return;
        }
        
        DataService.addRepair({
            id: 'rep_' + Date.now(),
            instrumentId: instrumentId,
            description: description,
            reporter: user.name,
            reportDate: getDateString(0),
            priority: priority,
            status: 'pending'
        });
        
        DataService.updateInstrument(instrumentId, { status: 'maintenance' });
        
        this.showToast('维修任务已添加', 'success');
        this.closeModal();
        this.renderRepairQueue();
        this.renderInstruments();
    },
    
    showInstrumentDetail(instrumentId) {
        const instrument = DataService.getInstrumentById(instrumentId);
        const riskConfig = RISK_LEVELS[instrument.riskLevel];
        const borrows = DataService.getBorrows().filter(b => b.instrumentId === instrumentId);
        const repairs = DataService.getRepairs().filter(r => r.instrumentId === instrumentId);
        
        this.showModal(`
            <h2>${instrument.emoji} ${instrument.name}</h2>
            <div class="modal-info">
                <p><strong>状态：</strong><span class="detail-status">${INSTRUMENT_STATUS[instrument.status]}</span></p>
                <p><strong>风险等级：</strong><span style="color:${riskConfig.color}">${riskConfig.label}</span></p>
                <p><strong>押金：</strong>¥${riskConfig.deposit}</p>
                <p><strong>位置：</strong>${instrument.location}</p>
                <p><strong>描述：</strong>${instrument.description}</p>
            </div>
            <div class="detail-section">
                <h4>借用记录 (${borrows.length})</h4>
                ${borrows.length > 0 ? borrows.map(b => `
                    <div class="detail-item">
                        <span>${b.userName}</span>
                        <span>${b.borrowDate} - ${b.returnDate || '未归还'}</span>
                    </div>
                `).join('') : '<p class="empty-text">暂无记录</p>'}
            </div>
            <div class="detail-section">
                <h4>维修记录 (${repairs.length})</h4>
                ${repairs.length > 0 ? repairs.map(r => `
                    <div class="detail-item">
                        <span>${r.description}</span>
                        <span>${r.reportDate}</span>
                    </div>
                `).join('') : '<p class="empty-text">暂无记录</p>'}
            </div>
            <div class="modal-actions">
                <button class="btn-cancel" onclick="UIController.closeModal()">关闭</button>
            </div>
        `);
    },
    
    renderActivities() {
        const list = document.getElementById('activitiesList');
        const activities = DataService.getActivities();
        
        if (activities.length === 0) {
            list.innerHTML = '<p class="empty-state">暂无社区活动</p>';
            return;
        }
        
        list.innerHTML = activities.map(activity => {
            const instruments = activity.instruments.map(id => {
                const ins = DataService.getInstrumentById(id);
                return ins ? `${ins.emoji} ${ins.name}` : '';
            }).filter(Boolean).join('、');
            
            return `
                <div class="activity-card">
                    <div class="activity-header">
                        <h3>🎉 ${activity.name}</h3>
                        <span class="activity-date">${activity.date}</span>
                    </div>
                    <p class="activity-desc">${activity.description}</p>
                    <div class="activity-meta">
                        <p><strong>⏰ 时间：</strong>${activity.time}</p>
                        <p><strong>📍 地点：</strong>${activity.location}</p>
                        <p><strong>🎵 涉及乐器：</strong>${instruments}</p>
                    </div>
                    <div class="activity-actions">
                        <button class="btn-view" onclick="UIController.showActivityDetail('${activity.id}')">查看详情</button>
                    </div>
                </div>
            `;
        }).join('');
    },
    
    showActivityDetail(activityId) {
        const activity = DataService.getActivities().find(a => a.id === activityId);
        const instruments = activity.instruments.map(id => DataService.getInstrumentById(id)).filter(Boolean);
        const role = DataService.getCurrentRole();
        
        this.showModal(`
            <h2>🎉 ${activity.name}</h2>
            <div class="modal-info">
                <p><strong>📅 日期：</strong>${activity.date}</p>
                <p><strong>⏰ 时间：</strong>${activity.time}</p>
                <p><strong>📍 地点：</strong>${activity.location}</p>
                <p><strong>📝 描述：</strong>${activity.description}</p>
            </div>
            <div class="detail-section">
                <h4>🎵 活动可用乐器：</h4>
                <div class="activity-instruments">
                    ${instruments.map(ins => `
                        <div class="activity-instrument">
                            <span class="ins-emoji">${ins.emoji}</span>
                            <span>${ins.name}</span>
                            <span class="ins-status status-${ins.status}">${INSTRUMENT_STATUS[ins.status]}</span>
                            ${role === 'resident' && ins.status === 'available' ? `
                                <button class="btn-small" onclick="UIController.showBorrowModalWithDate('${ins.id}', '${activity.date}')">为活动借用</button>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="modal-actions">
                <button class="btn-cancel" onclick="UIController.closeModal()">关闭</button>
            </div>
        `);
    },
    
    renderWaitlist() {
        const content = document.getElementById('waitlistContent');
        const waitlist = DataService.getWaitlist();
        const role = DataService.getCurrentRole();
        const user = DataService.getUser();
        
        let displayList = waitlist;
        if (role === 'resident') {
            displayList = waitlist.filter(w => w.userId === user.id);
        }
        
        if (displayList.length === 0) {
            content.innerHTML = '<p class="empty-state">暂无候补记录</p>';
            return;
        }
        
        content.innerHTML = displayList.map(item => {
            const instrument = DataService.getInstrumentById(item.instrumentId);
            const isAvailable = instrument && instrument.status === 'available';
            
            return `
                <div class="waitlist-item">
                    <div class="waitlist-info">
                        <span class="waitlist-emoji">${instrument ? instrument.emoji : '🎵'}</span>
                        <div>
                            <h4>${item.instrumentName}</h4>
                            <p>期望日期：${item.date}</p>
                            <p>候补人：${item.userName}</p>
                        </div>
                        ${isAvailable ? '<span class="waitlist-notify">🔔 可借用</span>' : '<span class="waitlist-wait">⏳ 等待中</span>'}
                    </div>
                    ${role !== 'resident' && isAvailable ? `
                        <button class="btn-notify" onclick="UIController.notifyWaitlist('${item.id}')">通知用户</button>
                    ` : ''}
                    ${role === 'resident' ? `
                        <button class="btn-cancel-wait" onclick="UIController.cancelWaitlist('${item.id}')">取消候补</button>
                    ` : ''}
                </div>
            `;
        }).join('');
    },
    
    notifyWaitlist(itemId) {
        DataService.removeWaitlistItem(itemId);
        this.showToast('已通知用户', 'success');
        this.renderWaitlist();
    },
    
    cancelWaitlist(itemId) {
        DataService.removeWaitlistItem(itemId);
        this.showToast('已取消候补', 'success');
        this.renderWaitlist();
    },
    
    renderScanPage() {
        this.renderScanHistory();
    },
    
    renderScanHistory() {
        const historyContainer = document.getElementById('scanHistory');
        const history = DataService.getScanHistory();
        
        if (history.length === 0) {
            historyContainer.innerHTML = '<p class="empty-state">暂无扫码记录</p>';
            return;
        }
        
        historyContainer.innerHTML = history.map(record => {
            const instrument = record.instrumentId ? DataService.getInstrumentById(record.instrumentId) : null;
            const statusColors = {
                success: '#52c41a',
                warning: '#faad14',
                error: '#f5222d'
            };
            
            return `
                <div class="scan-record">
                    <div class="scan-record-header">
                        <span class="scan-record-emoji">${instrument ? instrument.emoji : '📱'}</span>
                        <div class="scan-record-info">
                            <h4>${instrument ? instrument.name : record.code}</h4>
                            <p>${record.time}</p>
                        </div>
                        <span class="scan-record-status" style="background: ${statusColors[record.status] || '#999'}">
                            ${record.status === 'success' ? '成功' : record.status === 'warning' ? '警告' : '失败'}
                        </span>
                    </div>
                    ${record.message ? `<p class="scan-record-message">${record.message}</p>` : ''}
                    ${instrument ? `
                        <div class="scan-record-actions">
                            ${instrument.status === 'available' ? 
                                `<button class="btn-small" onclick="UIController.showBorrowModal('${instrument.id}')">立即借用</button>` : 
                                instrument.status === 'borrowed' ?
                                `<button class="btn-small" onclick="UIController.showInstrumentDetail('${instrument.id}')">查看详情</button>` :
                                `<button class="btn-small" onclick="UIController.showInstrumentDetail('${instrument.id}')">查看详情</button>`
                            }
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    },
    
    startScan() {
        this.showToast('正在扫描...', 'info');
        
        setTimeout(() => {
            const instruments = DataService.getInstruments().filter(i => i.status !== 'maintenance');
            const randomInstrument = instruments[Math.floor(Math.random() * instruments.length)];
            
            const record = {
                id: 'scan_' + Date.now(),
                code: randomInstrument.id,
                instrumentId: randomInstrument.id,
                time: new Date().toLocaleString('zh-CN'),
                status: 'success',
                message: `已识别：${randomInstrument.name}`
            };
            
            DataService.addScanRecord(record);
            this.renderScanHistory();
            this.showToast(`扫码成功：${randomInstrument.name}`, 'success');
            
            this.showModal(`
                <h2>扫码成功</h2>
                <div class="scan-result">
                    <div class="scan-result-instrument">
                        <span class="scan-result-emoji">${randomInstrument.emoji}</span>
                        <div>
                            <h3>${randomInstrument.name}</h3>
                            <p>${randomInstrument.description}</p>
                            <p class="scan-result-location">📍 ${randomInstrument.location}</p>
                            <span class="risk-badge" style="background: ${RISK_LEVELS[randomInstrument.riskLevel].color}">
                                ${RISK_LEVELS[randomInstrument.riskLevel].label} · 押金¥${RISK_LEVELS[randomInstrument.riskLevel].deposit}
                            </span>
                        </div>
                    </div>
                    <div class="scan-result-status">
                        <span class="instrument-status status-${randomInstrument.status}">
                            ${INSTRUMENT_STATUS[randomInstrument.status]}
                        </span>
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="btn-cancel" onclick="UIController.closeModal()">关闭</button>
                    ${randomInstrument.status === 'available' ? 
                        `<button class="btn-confirm" onclick="UIController.showBorrowModal('${randomInstrument.id}')">立即借用</button>` : 
                        randomInstrument.status === 'borrowed' ?
                        `<button class="btn-confirm" onclick="UIController.showInstrumentDetail('${randomInstrument.id}')">查看详情</button>` :
                        ''
                    }
                </div>
            `);
        }, 1500);
    },
    
    showManualInput() {
        this.showModal(`
            <h2>手动输入乐器编码</h2>
            <div class="form-group">
                <label>乐器编号：</label>
                <input type="text" id="manualInstrumentCode" placeholder="请输入乐器编号，如 ins_001">
            </div>
            <div class="modal-actions">
                <button class="btn-cancel" onclick="UIController.closeModal()">取消</button>
                <button class="btn-confirm" onclick="UIController.confirmManualInput()">确认查询</button>
            </div>
        `);
    },
    
    confirmManualInput() {
        const code = document.getElementById('manualInstrumentCode').value.trim();
        
        if (!code) {
            this.showToast('请输入乐器编号', 'error');
            return;
        }
        
        const instrument = DataService.getInstrumentById(code);
        
        const record = {
            id: 'scan_' + Date.now(),
            code: code,
            instrumentId: instrument ? instrument.id : null,
            time: new Date().toLocaleString('zh-CN'),
            status: instrument ? 'success' : 'error',
            message: instrument ? `已识别：${instrument.name}` : `未找到编号为 ${code} 的乐器`
        };
        
        DataService.addScanRecord(record);
        this.renderScanHistory();
        this.closeModal();
        
        if (instrument) {
            this.showToast(`查询成功：${instrument.name}`, 'success');
            this.showModal(`
                <h2>查询结果</h2>
                <div class="scan-result">
                    <div class="scan-result-instrument">
                        <span class="scan-result-emoji">${instrument.emoji}</span>
                        <div>
                            <h3>${instrument.name}</h3>
                            <p>${instrument.description}</p>
                            <p class="scan-result-location">📍 ${instrument.location}</p>
                            <span class="risk-badge" style="background: ${RISK_LEVELS[instrument.riskLevel].color}">
                                ${RISK_LEVELS[instrument.riskLevel].label} · 押金¥${RISK_LEVELS[instrument.riskLevel].deposit}
                            </span>
                        </div>
                    </div>
                    <div class="scan-result-status">
                        <span class="instrument-status status-${instrument.status}">
                            ${INSTRUMENT_STATUS[instrument.status]}
                        </span>
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="btn-cancel" onclick="UIController.closeModal()">关闭</button>
                    ${instrument.status === 'available' ? 
                        `<button class="btn-confirm" onclick="UIController.showBorrowModal('${instrument.id}')">立即借用</button>` : 
                        instrument.status === 'borrowed' ?
                        `<button class="btn-confirm" onclick="UIController.showInstrumentDetail('${instrument.id}')">查看详情</button>` :
                        ''
                    }
                </div>
            `);
        } else {
            this.showToast(`未找到编号为 ${code} 的乐器`, 'error');
        }
    },
    
    showModal(content) {
        document.getElementById('modalBody').innerHTML = content;
        document.getElementById('modal').classList.remove('hidden');
    },
    
    closeModal() {
        document.getElementById('modal').classList.add('hidden');
    },
    
    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast toast-${type}`;
        toast.classList.remove('hidden');
        
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    UIController.init();
});
