import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

function LoginType() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  // Animated particle background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2 + 0.5,
      dx: (Math.random() - 0.5) * 0.4,
      dy: (Math.random() - 0.5) * 0.4,
      opacity: Math.random() * 0.5 + 0.1,
    }));

    let animId;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(196, 164, 100, ${p.opacity})`;
        ctx.fill();
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
      });
      animId = requestAnimationFrame(draw);
    };
    draw();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', handleResize); };
  }, []);

  return (
    <>
      <div className="lt-root">
        <canvas ref={canvasRef} className="lt-canvas" />
        <div className="lt-glow" />
        <div className="lt-rule" />

        <div className="lt-wrapper">

          {/* Seal */}
          <div className="lt-seal">
            <span className="lt-seal-icon">🎓</span>
          </div>

          {/* Heading */}
          <p className="lt-eyebrow">Est. 2026 · Academic Portal</p>
          <h1 className="lt-title">Academic <em>Performance</em><br />Tracker</h1>
          <p className="lt-subtitle">Empowering educators and learners alike</p>

          {/* Ornament */}
          <div className="lt-ornament">
            <div className="lt-ornament-line" />
            <div className="lt-ornament-diamond" />
            <div className="lt-ornament-line right" />
          </div>

          {/* Portal Cards */}
          <div className="lt-cards">

            {/* Student Card */}
            <div className="lt-card" onClick={() => navigate('/student-login')}>
              <div className="lt-card-accent" />
              <div className="lt-card-img-wrap">
                <img
                  src="https://images.unsplash.com/photo-1529390079861-591de354faf5?w=160&h=160&fit=crop&crop=face"
                  alt="Student"
                />
              </div>
              <p className="lt-card-label">Portal I</p>
              <h2 className="lt-card-title">Student<br />Access</h2>
              <p className="lt-card-desc">View your marks, attendance & personalised AI insights</p>
              <button className="lt-card-btn">
                Enter Portal <span className="lt-card-btn-arrow">→</span>
              </button>
            </div>

            {/* Teacher Card */}
            <div className="lt-card" onClick={() => navigate('/login')}>
              <div className="lt-card-accent" />
              <div className="lt-card-img-wrap">
                <img
                  src="https://images.unsplash.com/photo-1544717305-2782549b5136?w=160&h=160&fit=crop&crop=face"
                  alt="Teacher"
                />
              </div>
              <p className="lt-card-label">Portal II</p>
              <h2 className="lt-card-title">Faculty<br />Access</h2>
              <p className="lt-card-desc">Manage students, track performance & generate reports</p>
              <button className="lt-card-btn">
                Enter Portal <span className="lt-card-btn-arrow">→</span>
              </button>
            </div>

          </div>

          {/* Footer link */}
          <p className="lt-footer-link">
            New to the system?{' '}
            <button onClick={() => navigate('/create-account')}>Create an account</button>
          </p>

        </div>

        <p className="lt-copyright">&copy; 2026 Academic Performance Tracker · All rights reserved</p>
      </div>
    </>
  );
}

export default LoginType;