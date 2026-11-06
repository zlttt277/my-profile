/* ==========================================================================
   周乐曈 · 个人主页   交互脚本
   1) 图片灯箱（原生 <dialog>）
   2) 微信视频号链接：直跳 + 桌面端扫码提示
   3) 滚动入场动效：向下滚动时文字与卡片带一点回弹地浮现
   ========================================================================== */

/* ---------- 1. 灯箱 ---------- */
(function () {
  var lb = document.getElementById('lightbox');
  if (!lb) return;

  var img = document.getElementById('lb-img');
  var cap = document.getElementById('lb-cap');

  function open(src, text, alt) {
    img.src = src;
    img.alt = alt || text || '';
    cap.textContent = text || '';
    if (typeof lb.showModal === 'function') lb.showModal();
    else lb.setAttribute('open', '');
  }
  function close() {
    if (typeof lb.close === 'function') lb.close();
    else lb.removeAttribute('open');
    img.removeAttribute('src');
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-zoom]');
    if (t) {
      e.preventDefault();
      var capEl = t.closest('figure');
      var text = t.dataset.cap || (capEl ? capEl.querySelector('figcaption') : null);
      if (text && text.nodeType === 1) text = text.textContent.trim();
      open(t.dataset.zoom || t.src, text, t.alt);
    }
  });

  lb.addEventListener('click', function (e) {
    if (e.target === lb || e.target.classList.contains('lb__x')) close();
  });
})();

/* ---------- 2. 视频号链接 ---------- */
/* 说明：weixin.qq.com/sph/xxx 是「微信内才直接播放」的分享链接。
   在电脑浏览器里打开，往往会停在微信的中转页（提示「请在微信客户端打开」）。
   目前公认可行的两条路：
     A. 用电脑版微信打开这条链接 —— 微信内置浏览器会直接播放；
     B. 把链接发给腾讯元宝（yuanbao.tencent.com），用元宝生成的页面在
        普通浏览器里就能播放。
   这里把链接统一改成新标签打开，并在旁边补一句实话实说的提示，
   不再让读者点完一脸茫然。 */
(function () {
  var links = document.querySelectorAll('a[href*="weixin.qq.com/sph/"]');
  if (!links.length) return;

  var TIP_TEXT =
    '这是微信视频号的分享链接，在手机微信里点开可以直接播放。' +
    '电脑上想不扫码就打开，可以试试：把这条链接发给腾讯元宝（yuanbao.tencent.com），' +
    '用它生成的页面就能在浏览器里播放；或者直接用电脑版微信打开，也能正常播放。';

  for (var i = 0; i < links.length; i++) {
    var a = links[i];
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'noopener noreferrer');

    var host = a.closest('.linkbar') || a.closest('.vcard');
    if (!host || host.querySelector('.wechat-tip')) continue;

    var tip = document.createElement('p');
    tip.className = 'wechat-tip';
    tip.textContent = TIP_TEXT;
    host.appendChild(tip);
  }
})();

/* ---------- 3. 滚动入场动效 ---------- */
/* 思路：先按下面的选择器把「需要入场的元素」找出来。
   · 打开页面时已经在首屏里的（比如主视觉）—— 立即入场；
   · 在第一屏以下的 —— 先交给 .rv--wait 藏起来，等滚到附近再由
     IntersectionObserver 触发 .rv--in，播放 style.css 里的 rise-in 回弹动画。
   同一组里的元素依次错开几十毫秒，读起来像是一行行「弹」出来的。
   兜底：用户系统开了「减少动态效果」，或浏览器不支持 IntersectionObserver
   时，整个模块直接 return —— 元素不带任何类，静态呈现，绝不会出现内容消失。 */
(function () {
  var SEL = [
    '.hero__grid > *',
    '.detail-hero__grid > *',
    'section.blk > .eyebrow',
    'section.blk > .sec-lead',
    '.card',
    '.tagcard',
    '.workcard',
    '.honorlist > .honor',
    '.chips > .chip',
    '.factgrid > .fact',
    '.masonry > figure',
    '.filmstrip > figure',
    '.steps > li',
    '.prose > p',
    '.contact-card',
    '.callout',
    '.linkbar',
    '.videobox',
    '.qrcard',
    '.gallery-head',
    '.legend__item',
    '.split > *',
    '.gal > *'
  ].join(',');

  if (!('IntersectionObserver' in window)) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var raw = document.querySelectorAll(SEL);
  if (!raw.length) return;

  var list = [];
  Array.prototype.forEach.call(raw, function (el) {
    if (list.indexOf(el) !== -1) return;
    /* 卡片里的正文段落会各自入场，卡片本身就不动了，免得两层动效叠在一起 */
    if (el.classList.contains('card') && el.querySelector('.prose')) return;
    list.push(el);
  });
  if (!list.length) return;

  /* 同一父元素下的入场元素依次错开，最多错开 4 档 */
  var STEP = 70;
  function delayOf(el) {
    var p = el.parentNode;
    if (!p) return 0;
    var i = 0;
    for (var k = 0; k < p.children.length; k++) {
      if (p.children[k] === el) break;
      if (list.indexOf(p.children[k]) !== -1) i++;
    }
    return Math.min(i, 4) * STEP;
  }

  function enter(el) {
    el.style.animationDelay = delayOf(el) + 'ms';
    el.classList.remove('rv--wait');
    el.classList.add('rv--in');
  }

  var io = new IntersectionObserver(function (entries) {
    for (var i = 0; i < entries.length; i++) {
      if (!entries[i].isIntersecting) continue;
      io.unobserve(entries[i].target);
      enter(entries[i].target);
    }
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0 });

  var vh = window.innerHeight || document.documentElement.clientHeight;

  for (var n = 0; n < list.length; n++) {
    var el = list[n];
    var box = el.getBoundingClientRect();
    /* 已经在首屏里（或已经滚过的）：立刻入场 */
    if (box.top < vh * 0.92 && box.bottom > 0) {
      enter(el);
    } else {
      el.classList.add('rv--wait');
      io.observe(el);
    }
  }
})();
