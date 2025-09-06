/**
 * 优化后的鼠标特效：增强点击特效，保持高性能
 * 特点：
 * 1. 点击特效增加层次感：粒子大小、速度、生命周期差异化
 * 2. 加入粒子初始爆发动画，增强视觉冲击力
 * 3. 保持对象池复用机制，性能优异
 */
document.addEventListener("DOMContentLoaded", () => {
  // 轨迹对象池配置
  const TRAIL_POOL_SIZE = 30;
  const TRAIL_LIFETIME = 500;
  const trailPool = [];

  // 粒子对象池配置 - 增加容量以支持更丰富的点击效果
  const PARTICLE_POOL_SIZE = 150;
  const particlePool = [];

  // 创建轨迹对象池
  function initTrailPool() {
    for (let i = 0; i < TRAIL_POOL_SIZE; i++) {
      const trail = document.createElement("div");
      trail.className = "cursor-trail";
      trail.style.display = "none";
      document.body.appendChild(trail);
      trailPool.push({
        element: trail,
        active: false,
        timer: null,
      });
    }
  }

  // 创建粒子对象池
  function initParticlePool() {
    for (let i = 0; i < PARTICLE_POOL_SIZE; i++) {
      const particle = document.createElement("div");
      particle.className = "particle";
      particle.style.display = "none";
      document.body.appendChild(particle);
      particlePool.push({
        element: particle,
        active: false,
        timer: null,
      });
    }
  }

  // 获取可用轨迹
  function getAvailableTrail() {
    for (let i = 0; i < trailPool.length; i++) {
      if (!trailPool[i].active) {
        return trailPool[i];
      }
    }
    return trailPool[0];
  }

  // 获取可用粒子
  function getAvailableParticle() {
    for (let i = 0; i < particlePool.length; i++) {
      if (!particlePool[i].active) {
        return particlePool[i];
      }
    }
    return particlePool[0];
  }

  // 鼠标移动轨迹效果（保持不变）
  let lastMouseX = 0;
  let lastMouseY = 0;
  const MOVE_THROTTLE = 30;
  let lastMoveTime = 0;

  document.addEventListener("mousemove", (e) => {
    const now = Date.now();
    if (now - lastMoveTime < MOVE_THROTTLE) return;
    lastMoveTime = now;

    const x = e.clientX;
    const y = e.clientY;

    const distance = Math.sqrt(
      Math.pow(x - lastMouseX, 2) + Math.pow(y - lastMouseY, 2)
    );
    if (distance < 5) return;

    lastMouseX = x;
    lastMouseY = y;

    const trailItem = getAvailableTrail();
    const trail = trailItem.element;

    if (trailItem.timer) clearTimeout(trailItem.timer);

    const size = Math.random() * 8 + 4;
    const hue = Date.now() % 360;
    trail.style.cssText = `
      display: block;
      left: ${x}px;
      top: ${y}px;
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background: hsla(${hue}, 90%, 60%, 0.7);
      transform: translate(-50%, -50%) scale(1);
      opacity: 1;
      will-change: transform, opacity;
    `;

    trailItem.active = true;

    trailItem.timer = setTimeout(() => {
      requestAnimationFrame(() => {
        trail.style.transform = `translate(-50%, -50%) scale(0)`;
        trail.style.opacity = "0";

        setTimeout(() => {
          trail.style.display = "none";
          trailItem.active = false;
        }, 300);
      });
    }, TRAIL_LIFETIME);
  });

  // 优化的鼠标点击特效
  document.addEventListener("click", (e) => {
    const x = e.clientX;
    const y = e.clientY;
    const particleCount = 25; // 增加粒子数量，提升视觉效果

    // 为每次点击生成一个主色调，使粒子颜色更协调
    const baseHue = Math.random() * 360;

    for (let i = 0; i < particleCount; i++) {
      const particleItem = getAvailableParticle();
      const particle = particleItem.element;

      if (particleItem.timer) clearTimeout(particleItem.timer);

      // 粒子大小差异化：小粒子(1-3px)和大粒子(4-7px)混合
      const isSmall = Math.random() > 0.3; // 30%概率为大粒子
      const size = isSmall ? Math.random() * 2 + 1 : Math.random() * 3 + 4;

      // 颜色基于主色调变化，保持和谐同时有差异
      const hue = baseHue + (Math.random() * 60 - 30); // ±30度变化
      const lightness = isSmall
        ? 70 + Math.random() * 10
        : 60 + Math.random() * 10;

      // 发射角度和距离
      const angle = (i / particleCount) * Math.PI * 2;
      const distance = isSmall
        ? Math.random() * 40 + 30 // 小粒子更近
        : Math.random() * 60 + 50; // 大粒子更远

      // 速度差异化：小粒子快，大粒子慢
      const speedFactor = isSmall ? 0.7 : 1.2;
      const xOffset = Math.cos(angle) * distance;
      const yOffset = Math.sin(angle) * distance;

      // 生命周期差异化：小粒子消失快，大粒子存在久
      const lifetime = isSmall
        ? 600 + Math.random() * 200
        : 900 + Math.random() * 300;

      // 设置初始样式（加入微小的随机偏移，避免过于规则）
      particle.style.cssText = `
        display: block;
        left: ${x + (Math.random() * 4 - 2)}px;
        top: ${y + (Math.random() * 4 - 2)}px;
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: hsla(${hue}, 90%, ${lightness}%, 0.9);
        transform: translate(-50%, -50%) scale(0);
        opacity: 0;
        will-change: transform, opacity;
        transition: transform ${
          lifetime * speedFactor
        }ms cubic-bezier(0.18, 0.89, 0.32, 1.28),
                    opacity ${lifetime}ms ease-out;
      `;

      particleItem.active = true;

      // 粒子爆发动画：先快速放大，再按轨迹移动
      requestAnimationFrame(() => {
        // 强制回流后应用动画
        particle.offsetWidth;
        particle.style.transform = `translate(-50%, -50%) scale(1.2)`;
        particle.style.opacity = "1";

        // 短暂延迟后开始移动
        setTimeout(() => {
          particle.style.transform = `translate(calc(-50% + ${xOffset}px), calc(-50% + ${yOffset}px)) scale(1)`;

          // 生命周期结束后淡出
          particleItem.timer = setTimeout(() => {
            particle.style.opacity = "0";

            setTimeout(() => {
              particle.style.display = "none";
              particleItem.active = false;
            }, 300);
          }, lifetime);
        }, 50);
      });
    }
  });

  // 初始化对象池
  initTrailPool();
  initParticlePool();
});
