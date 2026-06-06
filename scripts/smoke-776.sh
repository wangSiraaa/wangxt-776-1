#!/bin/bash

echo "========================================"
echo "  社区乐器共享柜 - 冒烟测试 (776)"
echo "========================================"
echo ""

PASSED=0
FAILED=0

assert() {
    if [ "$1" -eq 0 ]; then
        echo "  ✅ $2"
        PASSED=$((PASSED + 1))
    else
        echo "  ❌ $2"
        FAILED=$((FAILED + 1))
    fi
}

assert_file_exists() {
    if [ -f "$1" ]; then
        echo "  ✅ 文件存在: $1"
        PASSED=$((PASSED + 1))
    else
        echo "  ❌ 文件不存在: $1"
        FAILED=$((FAILED + 1))
    fi
}

assert_contains() {
    if grep -q "$2" "$1"; then
        echo "  ✅ $1 包含 '$2'"
        PASSED=$((PASSED + 1))
    else
        echo "  ❌ $1 不包含 '$2'"
        FAILED=$((FAILED + 1))
    fi
}

echo "🧪 测试 1: 检查核心文件是否存在"
echo "--------------------------------------------------"
assert_file_exists "index.html"
assert_file_exists "app.js"
assert_file_exists "styles.css"
echo ""

echo "🧪 测试 2: 检查扫码录入功能 (HTML)"
echo "--------------------------------------------------"
assert_contains "index.html" '扫码录入'
assert_contains "index.html" 'data-tab="scan"'
assert_contains "index.html" 'tab-scan'
assert_contains "index.html" 'scan-container'
assert_contains "index.html" 'scan-viewport'
assert_contains "index.html" 'startScan()'
assert_contains "index.html" 'showManualInput()'
echo ""

echo "🧪 测试 3: 检查扫码录入功能 (JavaScript)"
echo "--------------------------------------------------"
assert_contains "app.js" 'SCAN_HISTORY'
assert_contains "app.js" 'getScanHistory'
assert_contains "app.js" 'addScanRecord'
assert_contains "app.js" 'clearScanHistory'
assert_contains "app.js" 'renderScanPage'
assert_contains "app.js" 'renderScanHistory'
assert_contains "app.js" 'startScan'
assert_contains "app.js" 'showManualInput'
assert_contains "app.js" 'confirmManualInput'
echo ""

echo "🧪 测试 4: 检查本地存储持久化"
echo "--------------------------------------------------"
assert_contains "app.js" 'music_locker_scan_history'
assert_contains "app.js" 'StorageManager'
assert_contains "app.js" 'localStorage'
echo ""

echo "🧪 测试 5: 检查归还缺照片不能完成的失败分支"
echo "--------------------------------------------------"
assert_contains "app.js" 'validateReturnWithPhoto'
assert_contains "app.js" '请先上传归还照片后再完成归还'
assert_contains "app.js" 'returnPhoto'
echo ""

echo "🧪 测试 6: 检查扫码录入样式"
echo "--------------------------------------------------"
assert_contains "styles.css" 'scan-container'
assert_contains "styles.css" 'scan-area'
assert_contains "styles.css" 'scan-frame'
assert_contains "styles.css" 'scan-line'
assert_contains "styles.css" 'scanMove'
assert_contains "styles.css" 'btn-scan'
assert_contains "styles.css" 'scan-history'
echo ""

echo "🧪 测试 7: 运行单元测试"
echo "--------------------------------------------------"
if command -v node &> /dev/null; then
    node test-runner.js
    TEST_EXIT=$?
    assert $TEST_EXIT "单元测试执行成功"
else
    echo "  ⚠️  Node.js 不可用，跳过单元测试"
fi
echo ""

echo "========================================"
echo "  测试结果: $PASSED 通过, $FAILED 失败"
echo "========================================"
echo ""

if [ "$FAILED" -gt 0 ]; then
    echo "❌ 部分冒烟测试未通过，请检查代码"
    exit 1
else
    echo "✅ 所有冒烟测试通过！"
    exit 0
fi
