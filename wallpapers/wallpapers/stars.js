// stars.js
export function stars(canvas, ctx, width, height) {
  canvas.width = width;
  canvas.height = height;

  const starsCount = 100;
  const stars = [];

  for (let i = 0; i < starsCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
      twinkleSpeed: Math.random() * 0.05 + 0.01,
      opacity: Math.random(),
    });
  }

  // Planets data (simple circles moving across)
  const planets = [
    { x: -100, y: height * 0.3, radius: 20, speed: 0.2, angle: 0, color: '#FF4500' },
    { x: -200, y: height * 0.6, radius: 15, speed: 0.15, angle: 0, color: '#1E90FF' },
    { x: -300, y: height * 0.5, radius: 25, speed: 0.1, angle: 0, color: '#32CD32' }
  ];

  let milkyWayGradient;

  function draw() {
    ctx.clearRect(0, 0, width, height);

    // Background gradient
    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
    bgGradient.addColorStop(0, '#000011');
    bgGradient.addColorStop(1, '#000022');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Milky Way streak
    if (!milkyWayGradient) {
      milkyWayGradient = ctx.createLinearGradient(width * 0.4, 0, width * 0.6, height);
      milkyWayGradient.addColorStop(0, 'rgba(255,255,255,0.15)');
      milkyWayGradient.addColorStop(1, 'rgba(255,255,255,0)');
    }
    ctx.fillStyle = milkyWayGradient;
    ctx.fillRect(width * 0.4, 0, width * 0.2, height);

    // Draw stars with twinkle
    stars.forEach(star => {
      star.opacity += star.twinkleSpeed;
      if (star.opacity >= 1 || star.opacity <= 0) star.twinkleSpeed *= -1;

      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity.toFixed(2)})`;
      ctx.shadowColor = 'white';
      ctx.shadowBlur = 5;
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Draw planets with rotation and horizontal movement
    planets.forEach(planet => {
      planet.x += planet.speed;
      planet.angle += 0.01;

      if (planet.x - planet.radius > width) {
        planet.x = -planet.radius;
      }

      ctx.save();
      ctx.translate(planet.x, planet.y);
      ctx.rotate(planet.angle);
      const gradient = ctx.createRadialGradient(0, 0, planet.radius * 0.3, 0, 0, planet.radius);
      gradient.addColorStop(0, planet.color);
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, planet.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    requestAnimationFrame(draw);
  }

  draw();
}
