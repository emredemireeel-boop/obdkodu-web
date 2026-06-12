const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, '../public/css/style.css');

const premiumCSS = `
/* ===================================
   PREMIUM DETAIL PAGE STYLES
   =================================== */

.detail-page-premium {
  padding: 120px 0 80px;
  position: relative;
  z-index: 1;
}

.premium-breadcrumb {
  margin-bottom: 40px;
  background: var(--bg-card);
  padding: 12px 20px;
  border-radius: var(--radius-full);
  display: inline-flex;
  border: 1px solid var(--border-subtle);
  backdrop-filter: blur(12px);
}

.premium-hero {
  position: relative;
  padding: 60px 40px;
  background: rgba(10, 10, 16, 0.6);
  border: 1px solid var(--border-hover);
  border-radius: var(--radius-xl);
  overflow: hidden;
  margin-bottom: 40px;
  text-align: center;
  box-shadow: var(--shadow-lg);
  backdrop-filter: blur(20px);
}

.premium-hero-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  height: 100%;
  background: radial-gradient(ellipse at center, rgba(59, 130, 246, 0.15) 0%, transparent 70%);
  pointer-events: none;
  z-index: 0;
}
.glow-düşük { background: radial-gradient(ellipse at center, rgba(16, 185, 129, 0.15) 0%, transparent 70%); }
.glow-orta { background: radial-gradient(ellipse at center, rgba(245, 158, 11, 0.15) 0%, transparent 70%); }
.glow-yüksek { background: radial-gradient(ellipse at center, rgba(239, 68, 68, 0.15) 0%, transparent 70%); }

.premium-hero-content {
  position: relative;
  z-index: 1;
}

.premium-hero-badges {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 24px;
}

.premium-badge {
  font-size: 0.85rem;
  padding: 6px 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.3);
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

.premium-severity-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  font-weight: 700;
  padding: 6px 16px;
  border-radius: var(--radius-full);
  letter-spacing: 0.05em;
  text-transform: uppercase;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid;
}
.sev-düşük { color: var(--severity-low); border-color: rgba(16, 185, 129, 0.3); box-shadow: 0 0 15px rgba(16, 185, 129, 0.15); }
.sev-orta { color: var(--severity-medium); border-color: rgba(245, 158, 11, 0.3); box-shadow: 0 0 15px rgba(245, 158, 11, 0.15); }
.sev-yüksek { color: var(--severity-high); border-color: rgba(239, 68, 68, 0.3); box-shadow: 0 0 15px rgba(239, 68, 68, 0.15); }

.pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: pulse 2s infinite;
}
.sev-düşük .pulse-dot { background: var(--severity-low); box-shadow: 0 0 8px var(--severity-low); }
.sev-orta .pulse-dot { background: var(--severity-medium); box-shadow: 0 0 8px var(--severity-medium); }
.sev-yüksek .pulse-dot { background: var(--severity-high); box-shadow: 0 0 8px var(--severity-high); }

.premium-code-title {
  font-size: 5rem;
  font-weight: 900;
  line-height: 1;
  letter-spacing: -0.04em;
  margin-bottom: 16px;
  background: linear-gradient(180deg, #ffffff 0%, #a1a1aa 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 10px 20px rgba(0,0,0,0.5));
}

.premium-code-name {
  font-size: 1.6rem;
  font-weight: 600;
  color: var(--text-primary);
  max-width: 800px;
  margin: 0 auto 24px;
  line-height: 1.4;
}

.premium-affected-system {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  background: var(--bg-glass);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: 0.95rem;
}
.premium-affected-system strong {
  color: var(--text-primary);
  font-weight: 600;
}

/* Layout */
.premium-content-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 40px;
}

@media (max-width: 992px) {
  .premium-content-layout {
    grid-template-columns: 1fr;
  }
}

.premium-left-col {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Cards */
.premium-card {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 32px;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(12px);
  transition: all var(--transition-normal);
  height: 100%;
}
.premium-card:hover {
  border-color: var(--border-hover);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.neon-border-top {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background: linear-gradient(90deg, transparent, var(--accent-cyan), transparent);
  opacity: 0.8;
}

.premium-card-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.premium-icon-box {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
}
.icon-blue { color: var(--accent-blue); background: rgba(59, 130, 246, 0.1); border-color: rgba(59, 130, 246, 0.2); }
.icon-orange { color: #f97316; background: rgba(249, 115, 22, 0.1); border-color: rgba(249, 115, 22, 0.2); }
.icon-green { color: #10b981; background: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.2); }

.premium-card-title {
  font-size: 1.4rem;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.premium-card-body {
  position: relative;
}

.premium-text-lead {
  font-size: 1.1rem;
  line-height: 1.8;
  color: var(--text-secondary);
  border-left: 3px solid var(--accent-purple);
  padding-left: 20px;
}

/* Lists */
.premium-list-group {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.premium-list-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: rgba(0,0,0,0.2);
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  transition: all var(--transition-fast);
  color: var(--text-secondary);
  line-height: 1.5;
}
.premium-list-item:hover {
  background: rgba(255,255,255,0.03);
  border-color: rgba(255,255,255,0.05);
  color: var(--text-primary);
  transform: translateX(4px);
}

.list-bullet {
  margin-top: 6px;
  width: 8px;
  height: 8px;
  background: #f97316;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 0 10px rgba(249, 115, 22, 0.5);
}

/* Steps */
.premium-steps {
  counter-reset: step-counter;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.premium-step {
  position: relative;
  display: flex;
  gap: 20px;
  background: linear-gradient(145deg, rgba(255,255,255,0.03) 0%, transparent 100%);
  padding: 24px;
  border-radius: var(--radius-md);
  border: 1px solid rgba(255,255,255,0.03);
  transition: all var(--transition-normal);
}
.premium-step:hover {
  border-color: rgba(16, 185, 129, 0.3);
  box-shadow: 0 8px 24px rgba(0,0,0,0.3);
  transform: translateY(-2px);
}

.step-number {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  background: rgba(16, 185, 129, 0.1);
  border: 2px solid #10b981;
  color: #10b981;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 1.2rem;
  box-shadow: 0 0 15px rgba(16, 185, 129, 0.2);
}

.step-content {
  font-size: 1.05rem;
  color: var(--text-primary);
  line-height: 1.6;
  align-self: center;
}

/* Related */
.premium-related-section {
  margin-top: 60px;
  margin-bottom: 40px;
}

.premium-section-title {
  font-size: 1.8rem;
  font-weight: 800;
  margin-bottom: 24px;
  text-align: center;
}

.premium-related-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.premium-related-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}
.premium-related-card:hover {
  background: var(--bg-glass-hover);
  border-color: var(--accent-blue);
  transform: scale(1.02);
}

.premium-actions {
  text-align: center;
  margin-top: 40px;
  margin-bottom: 60px;
}

.premium-btn {
  padding: 16px 32px;
  font-size: 1.1rem;
  background: rgba(255,255,255,0.05);
}

.premium-faq-section {
  padding-top: 40px;
  border-top: 1px solid var(--border-subtle);
}
`;

fs.appendFileSync(cssPath, premiumCSS);
console.log('Premium CSS başarıyla eklendi!');
