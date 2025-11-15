// ====== 业务配置 ======
const FORBIDDEN_KEYWORDS = ['system', 'vendor', 'data', 'app']; // 小写匹配
const NAME_RULE = /^[A-Za-z0-9._-]+$/; // 仅目录名，不能含 /
const LS_KEY = 'hidden-folders-v1';

// ====== DOM ======
const $input = document.getElementById('inputName');
const $btnAdd = document.getElementById('btnAdd');
const $fabAdd = document.getElementById('fabAdd');
const $list = document.getElementById('list');
const $error = document.getElementById('error');
const $verSpan = document.getElementById('ver');

// ====== 状态 ======
/** @type {string[]} */
let items = [];

// ====== 工具 ======
function showError(msg) {
  $error.textContent = msg;
  $error.classList.add('show');
  clearTimeout(showError.tid);
  showError.tid = setTimeout(() => $error.classList.remove('show'), 2600);
}

async function save() {
  // 现在只存字符串数组，例如 ["aa","bb","cc"]
  const result = await RequestApi.setHiddenDirsJson(JSON.stringify(items));
  if (result !== 'OK') {
    alert('保存失败：' + result);
    return false;
  }
  return true;
}

async function load() {
  try {
    const raw = await RequestApi.getHiddenDirsJson();
    if (!raw) return [];
    const data = JSON.parse(raw);
    return /** @type {string[]} */ (data);
  } catch {
    return [];
  }
}

function sanitizeName(raw) {
  const s = (raw || '').trim();
  if (!s) { showError('目录名不能为空'); return null; }
  if (!NAME_RULE.test(s)) {
    showError('只允许字母/数字/点/下划线/短横线，且不要包含 /');
    return null;
  }
  const lower = s.toLowerCase();
  if (FORBIDDEN_KEYWORDS.some(k => lower.includes(k))) {
    showError(`禁止包含系统关键字：${FORBIDDEN_KEYWORDS.join(', ')}`);
    return null;
  }
  return s;
}

function exists(name) {
  const lower = name.toLowerCase();
  return items.some(n => n.toLowerCase() === lower);
}

// ====== 渲染 ======
function render() {
  $list.innerHTML = '';
  if (!items.length) {
    const empty = document.createElement('div');
    empty.className = 'row';
    empty.innerHTML =
      `<div class="name" style="color:var(--muted);font-weight:400">
         暂无数据，点击「＋新增」添加要隐藏的目录名
       </div>`;
    $list.appendChild(empty);
    return;
  }

  items.forEach((name, idx) => {
    const row = document.createElement('div');
    row.className = 'row';

    const left = document.createElement('div');
    left.className = 'name';
    left.innerHTML = `<span>${name}</span><span class="badge">/data/${name}</span>`;

    const del = document.createElement('button');
    del.className = 'del';
    del.textContent = '删除';
    del.addEventListener('click', () => {
      items.splice(idx, 1);
      if (save()) {
        showToast('删除成功', 'danger');  // 红色
        render();
      }
    });

    row.appendChild(left);
    row.appendChild(del);
    $list.appendChild(row);
  });
}

// ====== 事件 ======
function doAdd() {
  const s = sanitizeName($input.value);
  if (!s) return;
  if (exists(s)) { showError('该目录已存在'); return; }

  items.push(s);     // 只存目录名字符串
  $input.value = '';
  if (save()) {
    showToast('新增成功', 'success');  // 绿色
    render();
  }
}

$btnAdd.addEventListener('click', doAdd);
$fabAdd.addEventListener('click', doAdd);
$input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') doAdd();
});

async function initVersion() {
  try {
    const ver = await RequestApi.getVersion();
    $verSpan.textContent = ver || '未知';
  } catch (err) {
    $verSpan.textContent = '读取失败';
  }
}

// ====== 入口初始化 ======
async function onReady() {
  items = await load();
  render();
  initVersion();
}
document.addEventListener('DOMContentLoaded', onReady);

