/**
 * typewriter.js
 * 打字机效果类
 * 支持：单行打字 / 多行队列 / 闪烁光标 / 完成回调
 */

class Typewriter {
  /**
   * @param {HTMLElement} element   目标 DOM 元素
   * @param {object}      options
   *   speed    {number}   每字间隔毫秒，默认 75
   *   cursor   {boolean}  是否显示光标，默认 true
   *   onDone   {Function} 全部打完后的回调
   */
  constructor(element, options = {}) {
    this.el      = element;
    this.speed   = options.speed   ?? 75;
    this.cursor  = options.cursor  ?? true;
    this.onDone  = options.onDone  || null;
    this._timer  = null;
    this._active = false;
  }

  /* ---- 打字输出单行文字 ---- */
  /**
   * @param {string}   text      要打出的文字
   * @param {Function} callback  本行打完后的回调（可选）
   */
  type(text, callback) {
    this._clear();
    this._active = true;
    let i = 0;

    const tick = () => {
      if (!this._active) return;
      if (i <= text.length) {
        const displayed = text.substring(0, i);
        if (this.cursor) {
          /* 光标用 span 包裹，通过 CSS animation 闪烁 */
          this.el.innerHTML =
            escapeHtml(displayed) +
            '<span style="animation:cursor-blink 0.7s infinite;opacity:1;color:rgba(255,107,157,0.8);">|</span>';
        } else {
          this.el.textContent = displayed;
        }
        i++;
        this._timer = setTimeout(tick, this.speed);
      } else {
        /* 打完后移除光标 */
        if (this.cursor) {
          this.el.innerHTML = escapeHtml(text);
        }
        this._active = false;
        if (callback)   callback();
        if (this.onDone) this.onDone();
      }
    };

    tick();
    return this;
  }

  /* ---- 顺序打出多行文字 ---- */
  /**
   * @param {Array<{el:HTMLElement, text:string, delay:number}>} lines
   *   每项：{ el: DOM节点, text: 文字, delay: 行间延迟(ms,可选) }
   * @param {Function} onAllDone   全部打完后的回调
   */
  typeLines(lines, onAllDone) {
    const run = (idx) => {
      if (idx >= lines.length) {
        if (onAllDone) onAllDone();
        return;
      }
      const { el, text, delay = 300 } = lines[idx];
      /* 临时切换目标元素 */
      const saved = this.el;
      this.el = el;
      this.type(text, () => {
        this.el = saved;
        setTimeout(() => run(idx + 1), delay);
      });
    };
    run(0);
    return this;
  }

  /* ---- 清除当前输出 ---- */
  _clear() {
    clearTimeout(this._timer);
    this._active = false;
    this.el.textContent = '';
  }

  /* 对外暴露清除方法 */
  clear() {
    this._clear();
    return this;
  }

  /* ---- 销毁 ---- */
  destroy() {
    this._clear();
  }
}

/* HTML 转义，防止 XSS（文字中若含 < > & 等） */
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/* 挂载到全局 */
window.Typewriter = Typewriter;
