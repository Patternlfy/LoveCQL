/**
 * page-transition.js
 * 职责：
 *  1. 修复安卓浏览器 100vh 高度异常（注入 --vh CSS 变量）
 *  2. 页面切换淡入/淡出
 *  3. 触控震动反馈工具
 */

/* ================================================
   修复安卓 100vh 问题
   用 window.innerHeight 动态注入 --vh 变量
   CSS 中使用 calc(var(--vh,1vh) * 100) 代替 100vh
   ================================================ */
function fixViewportHeight() {
  const set = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  };
  set();
  // 窗口大小变化时更新（横竖屏切换）
  window.addEventListener('resize', set, { passive: true });
  // 横竖屏切换后稍作延迟再次计算（部分安卓浏览器需要延迟）
  window.addEventListener('orientationchange', () => {
    setTimeout(set, 250);
  }, { passive: true });
}

/* ================================================
   页面进入时淡入（清除覆盖遮罩）
   ================================================ */
function pageEnter() {
  const overlay = document.getElementById('transition-overlay');
  if (!overlay) return;
  // rAF 确保浏览器已渲染出 DOM 后再执行过渡
  requestAnimationFrame(() => {
    overlay.style.transition = 'opacity 0.85s ease';
    overlay.style.opacity    = '0';
    overlay.style.pointerEvents = 'none';
  });
}

/* ================================================
   跳转到指定页面（先淡出再跳转）
   @param {string} url      目标路径
   @param {number} delay    额外延迟（毫秒），默认 0
   ================================================ */
function navigateTo(url, delay = 0) {
  const overlay = document.getElementById('transition-overlay');
  if (!overlay) {
    setTimeout(() => { window.location.href = url; }, delay);
    return;
  }
  // 先移除 pointer-events 限制，防止遮罩挡住点击
  overlay.style.pointerEvents = 'all';
  overlay.style.transition    = 'opacity 0.75s ease';
  overlay.style.opacity       = '1';
  setTimeout(() => {
    window.location.href = url;
  }, 750 + delay);
}

/* ================================================
   震动反馈工具（需用户手势触发才有效）
   @param {number|number[]} pattern  震动模式（毫秒）
   ================================================ */
function vibrate(pattern = 30) {
  try {
    if (navigator.vibrate) navigator.vibrate(pattern);
  } catch (e) { /* 部分浏览器屏蔽振动 */ }
}

/* ================================================
   初始化
   ================================================ */
// 立即修复视口高度
fixViewportHeight();

// DOM 就绪后执行页面淡入
document.addEventListener('DOMContentLoaded', pageEnter);

// 挂载到全局，供各页面调用
window.navigateTo = navigateTo;
window.vibrate    = vibrate;
window.pageEnter  = pageEnter;
