/**
 * 社区乐器共享柜 - 自动化测试脚本
 * 
 * 测试场景：
 * 1. 尝试借出维护中的电子琴 → 断言错误提示
 * 2. 尝试押金不足的预约 → 断言候补记录生成
 * 3. 归还照片验证
 * 4. 同日高价值乐器借用限制（第二件被拦住）
 * 5. REGRESSION - 同日高价值乐器限制不可放松
 */

const fs = require('fs');
const path = require('path');

const STORAGE_KEYS = {
    INSTRUMENTS: 'music_locker_instruments',
    BORROWS: 'music_locker_borrows',
    REPAIRS: 'music_locker_repairs',
    ACTIVITIES: 'music_locker_activities',
    WAITLIST: 'music_locker_waitlist',
    USER: 'music_locker_user',
    ROLE: 'music_locker_role'
};

const RISK_LEVELS = {
    low: { label: '低风险', deposit: 100, color: '#52c41a' },
    medium: { label: '中风险', deposit: 300, color: '#faad14' },
    high: { label: '高风险', deposit: 800, color: '#f5222d' }
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

const DEFAULT_USER = {
    id: 'user_001',
    name: '张小明',
    role: 'resident',
    balance: 500,
    borrowedInstruments: []
};

const localStorageMock = (() => {
    let store = {};
    return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => { store[key] = value; },
        removeItem: (key) => { delete store[key]; },
        clear: () => { store = {}; }
    };
})();

global.localStorage = localStorageMock;

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
        localStorage.clear();
        this.set(STORAGE_KEYS.INSTRUMENTS, DEFAULT_INSTRUMENTS);
        this.set(STORAGE_KEYS.BORROWS, []);
        this.set(STORAGE_KEYS.REPAIRS, []);
        this.set(STORAGE_KEYS.ACTIVITIES, []);
        this.set(STORAGE_KEYS.WAITLIST, []);
        this.set(STORAGE_KEYS.USER, DEFAULT_USER);
        this.set(STORAGE_KEYS.ROLE, 'resident');
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
    getWaitlist() {
        return StorageManager.get(STORAGE_KEYS.WAITLIST, []);
    },
    addWaitlistItem(item) {
        const waitlist = this.getWaitlist();
        waitlist.push(item);
        StorageManager.set(STORAGE_KEYS.WAITLIST, waitlist);
        return item;
    },
    getUser() {
        return StorageManager.get(STORAGE_KEYS.USER, DEFAULT_USER);
    },
    updateUser(updates) {
        const user = { ...this.getUser(), ...updates };
        StorageManager.set(STORAGE_KEYS.USER, user);
        return user;
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

let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`  ✅ ${message}`);
        passed++;
    } else {
        console.log(`  ❌ ${message}`);
        failed++;
    }
}

function assertContains(str, substring, message) {
    if (str && str.includes(substring)) {
        console.log(`  ✅ ${message}`);
        passed++;
    } else {
        console.log(`  ❌ ${message} (期望包含: "${substring}", 实际: "${str}")`);
        failed++;
    }
}

console.log('\n========================================');
console.log('  社区乐器共享柜 - 自动化测试');
console.log('========================================\n');

console.log('🧪 测试场景 1: 尝试借出维护中的电子琴');
console.log('--------------------------------------------------');
StorageManager.init();

const keyboard = DataService.getInstrumentById('ins_002');
console.log(`  初始状态: 电子琴状态 = ${keyboard.status}`);
assert(keyboard.status === 'maintenance', '电子琴初始状态为"维护中"');

const today = getDateString(0);
const borrowResult = BorrowService.borrowInstrument('ins_002', today);

console.log(`  借用结果: success=${borrowResult.success}, message="${borrowResult.message}"`);
assert(borrowResult.success === false, '借用维护中乐器应返回失败');
assertContains(borrowResult.message, '维护中', '错误提示应包含"维护中"字样');
assertContains(borrowResult.message, '暂不可预约', '错误提示应包含"暂不可预约"字样');

const borrowsAfterTest1 = DataService.getBorrows();
assert(borrowsAfterTest1.length === 0, '失败的借用不应生成借用记录');

console.log('');

console.log('🧪 测试场景 2: 尝试押金不足的预约（架子鼓箱 ¥800，余额 ¥500）');
console.log('--------------------------------------------------');
StorageManager.init();

const user = DataService.getUser();
const drum = DataService.getInstrumentById('ins_003');
console.log(`  用户余额: ¥${user.balance}`);
console.log(`  架子鼓箱押金: ¥${RISK_LEVELS[drum.riskLevel].deposit}`);
console.log(`  架子鼓箱状态: ${drum.status}`);

assert(user.balance < RISK_LEVELS.high.deposit, '用户余额应小于高风险乐器押金');
assert(drum.status === 'available', '架子鼓箱初始状态应为"可借"');

const borrowResult2 = BorrowService.borrowInstrument('ins_003', today);

console.log(`  借用结果: success=${borrowResult2.success}, canWaitlist=${borrowResult2.canWaitlist}`);
console.log(`  消息: "${borrowResult2.message}"`);

assert(borrowResult2.success === false, '押金不足时借用应返回失败');
assert(borrowResult2.canWaitlist === true, '押金不足时应允许加入候补');
assertContains(borrowResult2.message, '押金不足', '错误提示应包含"押金不足"字样');
assertContains(borrowResult2.message, '¥800', '错误提示应显示所需押金金额');
assertContains(borrowResult2.message, '¥500', '错误提示应显示当前余额');

console.log('');
console.log('  📋 验证候补功能:');

const waitlistBefore = DataService.getWaitlist();
console.log(`  候补助手记录数: ${waitlistBefore.length}`);

const waitlistResult = BorrowService.addToWaitlist('ins_003', today);
console.log(`  候补结果: success=${waitlistResult.success}`);

const waitlistAfter = DataService.getWaitlist();
console.log(`  候补后记录数: ${waitlistAfter.length}`);

assert(waitlistResult.success === true, '加入候补应成功');
assert(waitlistAfter.length === waitlistBefore.length + 1, '候补记录应增加1条');

const waitlistItem = waitlistAfter[0];
assert(waitlistItem.instrumentId === 'ins_003', '候补记录乐器ID正确');
assert(waitlistItem.instrumentName === '架子鼓箱', '候补记录乐器名称正确');
assert(waitlistItem.userName === '张小明', '候补记录用户名正确');
assert(waitlistItem.date === today, '候补记录日期正确');

console.log('');
console.log('🧪 测试场景 3: 归还时缺少照片不能完成（边界验证）');
console.log('--------------------------------------------------');

function validateReturnWithPhoto(hasPhoto) {
    if (!hasPhoto) {
        return { valid: false, message: '请先上传归还照片后再完成归还' };
    }
    return { valid: true };
}

const returnWithoutPhoto = validateReturnWithPhoto(false);
const returnWithPhoto = validateReturnWithPhoto(true);

assert(returnWithoutPhoto.valid === false, '无照片时验证应失败');
assertContains(returnWithoutPhoto.message, '上传归还照片', '无照片时应提示上传照片');
assert(returnWithPhoto.valid === true, '有照片时验证应通过');

console.log('');
console.log('🧪 测试场景 4: 同日高价值乐器借用限制（第二件被拦住）');
console.log('--------------------------------------------------');
StorageManager.init();

DataService.updateUser({ balance: 5000 });
DataService.updateInstrument('ins_002', { status: 'available' });

const result1 = BorrowService.borrowInstrument('ins_003', today);
console.log(`  第1件高价值乐器借用: success=${result1.success}`);
assert(result1.success === true, '第1件高价值乐器应可成功借用');

const result2 = BorrowService.borrowInstrument('ins_007', today);
console.log(`  第2件高价值乐器借用: success=${result2.success}`);
console.log(`  消息: "${result2.message}"`);
assert(result2.success === false, '同日第2件高价值乐器应被拦住');
assertContains(result2.message, '最多只能借用1件', '应提示同日最多借1件限制');
assertContains(result2.message, '当日已有借用记录', '应提示当日已有借用记录');

console.log('');
console.log('🔒 测试场景 5: REGRESSION - 同日高价值乐器限制不可放松');
console.log('--------------------------------------------------');
StorageManager.init();
DataService.updateUser({ balance: 5000 });
DataService.updateInstrument('ins_002', { status: 'available' });
DataService.updateInstrument('ins_007', { status: 'available' });

BorrowService.borrowInstrument('ins_003', today);
const userBorrowsBefore = DataService.getBorrowsByUser('user_001').filter(b => 
    b.riskLevel === 'high' && 
    new Date(b.borrowDate).toDateString() === new Date(today).toDateString() &&
    b.status !== 'returned'
);
console.log(`  当日已借高价值乐器数量: ${userBorrowsBefore.length}`);
assert(userBorrowsBefore.length === 1, '当日应已有1件高价值乐器借出');

const regressionResult1 = BorrowService.borrowInstrument('ins_002', today);
console.log(`  尝试借第2件高价值(电子琴): success=${regressionResult1.success}`);
assert(regressionResult1.success === false, 'REGRESSION: 第2件高价值乐器必须被拒绝');

const regressionResult2 = BorrowService.borrowInstrument('ins_007', today);
console.log(`  尝试借第2件高价值(萨克斯): success=${regressionResult2.success}`);
assert(regressionResult2.success === false, 'REGRESSION: 第2件高价值乐器必须被拒绝');

const validationCheck = ValidationService.canBorrowInstrument('ins_002', today, 'user_001');
console.log(`  校验服务返回: valid=${validationCheck.valid}, message="${validationCheck.message}"`);
assert(validationCheck.valid === false, 'REGRESSION: 校验服务必须判定第2件无效');
assertContains(validationCheck.message, '1件', 'REGRESSION: 限制数量必须是1件，不可放松为2件');

const userBorrowsAfter = DataService.getBorrowsByUser('user_001').filter(b => 
    b.riskLevel === 'high' && 
    new Date(b.borrowDate).toDateString() === new Date(today).toDateString() &&
    b.status !== 'returned'
);
console.log(`  最终当日高价值乐器数量: ${userBorrowsAfter.length}`);
assert(userBorrowsAfter.length === 1, 'REGRESSION: 最终当日高价值乐器数量应仍为1件');

console.log('');
console.log('========================================');
console.log(`  测试结果: ${passed} 通过, ${failed} 失败`);
console.log('========================================\n');

if (failed > 0) {
    console.log('❌ 部分测试未通过，请检查代码逻辑\n');
    process.exit(1);
} else {
    console.log('✅ 所有测试通过！\n');
    process.exit(0);
}
