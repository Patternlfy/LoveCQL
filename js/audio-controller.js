/**
 * audio-controller.js
 * 音频播放器 + 字幕时间轴同步
 *
 * 使用方式：
 *   const ac = new AudioController({
 *     src:       'assets/audio/voice.mp3',
 *     subtitles: [
 *       { time: 0,  text: '遇见你，是我最幸运的事' },
 *       { time: 4,  text: '从那一刻开始...' },
 *     ],
 *     onSubtitle: (text) => { ... },  // 每条字幕触发时的回调
 *     onEnd:      ()     => { ... },  // 音频结束回调
 *     onError:    ()     => { ... },  // 加载失败回调（可选）
 *   });
 */

class AudioController {
  /**
   * @param {object} options
   *   src        {string}    音频文件路径
   *   subtitles  {Array}     字幕时间轴数组 [{time, text}, ...]
   *   onSubtitle {Function}  字幕触发回调 (text) => {}
   *   onEnd      {Function}  播放结束回调
   *   onError    {Function}  加载/播放失败回调
   */
  constructor(options = {}) {
    this.subtitles   = options.subtitles   || [];
    this.onSubtitle  = options.onSubtitle  || null;
    this.onEnd       = options.onEnd       || null;
    this.onError     = options.onError     || null;

    this._curIdx     = -1;   // 当前已触发的字幕索引
    this._hasAudio   = false; // 音频是否成功加载

    /* 创建 Audio 实例 */
    this.audio = new Audio();
    this.audio.preload = 'auto';

    this._bindEvents();

    /* 设置 src（设在事件绑定后，避免 loadedmetadata 漏触发）*/
    if (options.src) {
      this.audio.src = options.src;
      this.audio.load();
    }
  }

  /* ---- 绑定原生事件 ---- */
  _bindEvents() {
    /* 元数据加载完成 */
    this.audio.addEventListener('loadedmetadata', () => {
      this._hasAudio = true;
    });

    /* 播放进度 → 比对字幕时间轴 */
    this.audio.addEventListener('timeupdate', () => {
      this._syncSubtitle();
    });

    /* 播放结束 */
    this.audio.addEventListener('ended', () => {
      if (this.onEnd) this.onEnd();
    });

    /* 加载错误（文件不存在时静默降级） */
    this.audio.addEventListener('error', () => {
      this._hasAudio = false;
      console.warn('[AudioController] 音频加载失败，已降级为无声模式');
      if (this.onError) this.onError();
    });
  }

  /* ---- 字幕时间轴同步 ---- */
  _syncSubtitle() {
    const t   = this.audio.currentTime;
    let   idx = -1;

    /* 找到当前时间对应的最新字幕 */
    for (let i = 0; i < this.subtitles.length; i++) {
      if (t >= this.subtitles[i].time) idx = i;
      else break;
    }

    /* 仅在字幕索引变化时触发回调（避免重复调用）*/
    if (idx !== this._curIdx && idx >= 0) {
      this._curIdx = idx;
      if (this.onSubtitle) {
        this.onSubtitle(this.subtitles[idx].text);
      }
    }
  }

  /* ---- 播放 ---- */
  play() {
    return this.audio.play().catch(err => {
      /* 移动端需用户手势解锁，此处静默处理 */
      console.warn('[AudioController] play() 被浏览器拦截:', err.message);
    });
  }

  /* ---- 暂停 ---- */
  pause() {
    this.audio.pause();
  }

  /* ---- 切换播放/暂停 ---- */
  toggle() {
    if (this.audio.paused) return this.play();
    this.pause();
    return Promise.resolve();
  }

  /* ---- 是否正在播放 ---- */
  isPlaying() {
    return !this.audio.paused && !this.audio.ended;
  }

  /* ---- 重置字幕状态（重播时使用）---- */
  resetSubtitle() {
    this._curIdx = -1;
    this.audio.currentTime = 0;
  }

  /* ---- 无音频时模拟字幕播放（降级模式）---- */
  /**
   * 当音频加载失败时，可调用此方法按固定间隔驱动字幕
   * @param {number} interval   字幕切换间隔毫秒（默认 4000）
   * @param {Function} onAllDone  全部字幕播完后的回调
   */
  simulateSubtitles(interval = 4000, onAllDone) {
    if (this.subtitles.length === 0) {
      if (onAllDone) onAllDone();
      return;
    }
    let i = 0;
    const next = () => {
      if (i >= this.subtitles.length) {
        if (onAllDone) onAllDone();
        return;
      }
      if (this.onSubtitle) this.onSubtitle(this.subtitles[i].text);
      i++;
      this._simTimer = setTimeout(next, interval);
    };
    next();
  }

  /* ---- 停止模拟字幕 ---- */
  stopSimulate() {
    clearTimeout(this._simTimer);
  }

  /* ---- 销毁 ---- */
  destroy() {
    this.audio.pause();
    this.stopSimulate();
    this.audio.src = '';
  }
}

/* 挂载到全局 */
window.AudioController = AudioController;
