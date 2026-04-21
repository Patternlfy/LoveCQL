# 地球Online · 部署说明

## 项目结构

```
/
├── index.html        第一幕：进入游戏
├── choice.html       第二幕：命运选择
├── memory.html       第三幕：回忆杀
├── ending.html       第四/五幕：高潮收束
├── hidden.html       隐藏彩蛋
├── css/
│   ├── style.css     全局样式（移动端优先）
│   └── animations.css 动画定义
├── js/
│   ├── page-transition.js  页面切换 + 安卓高度修复
│   ├── particles.js        星空 + 爱心粒子系统
│   ├── typewriter.js       打字机效果
│   └── audio-controller.js 音频 + 字幕同步
└── assets/
    ├── images/       放入 photo1.jpg ~ photo9.jpg
    └── audio/        放入 voice.mp3
```

---

## 部署到 Nginx

1. 将整个项目目录上传到服务器，例如：`/var/www/earth-online/`

2. 配置 Nginx（`/etc/nginx/conf.d/earth-online.conf`）：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /var/www/earth-online;
    index index.html;

    # 开启 Gzip 压缩
    gzip on;
    gzip_types text/css application/javascript text/html;

    # 静态资源缓存
    location ~* \.(css|js|jpg|jpeg|png|mp3|woff2)$ {
        expires 7d;
        add_header Cache-Control "public";
    }

    # 防止直接访问上层目录
    location / {
        try_files $uri $uri/ =404;
    }
}
```

3. 重载 Nginx：`nginx -s reload`

---

## 素材替换

### 照片（9 张）
- 位置：`assets/images/`
- 文件名：`photo1.jpg` ~ `photo9.jpg`
- 推荐：1080×1920 竖屏，JPG 格式
- 未放图片时显示紫色渐变占位背景，不影响运行

### 录音
- 位置：`assets/audio/voice.mp3`
- 格式：MP3，推荐 128kbps+
- 未放音频时自动降级为「无声模式」，字幕自动逐条播放

---

## 字幕时间轴修改

编辑 `memory.html` 中的 `SUBTITLES` 数组：

```javascript
const SUBTITLES = [
  { time:  0, text: '遇见你，是我最幸运的事' },
  { time:  4, text: '从那一刻开始...' },
  // ...按录音时间修改 time 值（单位：秒）
];
```

---

## 时间线文案修改

编辑 `memory.html` 中的 `CAPTIONS` 数组（9 条，对应 9 张照片）：

```javascript
const CAPTIONS = [
  '那天我其实紧张到不敢看你',
  '你笑的时候我真的愣住了',
  // ...
];
```

---

## 名字修改（结局页）

编辑 `ending.html` 中对应 DOM 元素的文本内容：

```html
<span id="name-left">赖方瑜</span>
<span id="name-right">陈清莲</span>
```

---

## 移动端优化说明

| 问题                  | 解决方案                                |
|-----------------------|----------------------------------------|
| 安卓 100vh 高度异常   | JS 动态注入 `--vh` CSS 变量             |
| 刘海屏遮挡内容        | `env(safe-area-inset-*)` 安全区域内边距 |
| 页面切换卡顿          | `opacity` 渐变 + `will-change: opacity` |
| 触控响应延迟          | `touch-action: manipulation` 去除 300ms 延迟 |
| 动画卡顿              | `transform: translateZ(0)` GPU 加速     |
