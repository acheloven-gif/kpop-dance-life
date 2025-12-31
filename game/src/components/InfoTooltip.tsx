import React from 'react';
import './InfoTooltip.css';

/**
 * InfoTooltip — универсальный компонент тултипа с хвостиком.
 * Используйте <InfoTooltip text="...">...</InfoTooltip>
 * placement: 'top' (по умолчанию) или 'bottom'.
 */
const InfoTooltip: React.FC<{
  text: string;
  children: React.ReactNode;
  placement?: 'top' | 'bottom';
}> = ({ text, children, placement = 'top' }) => {
  const [show, setShow] = React.useState(false);
  const triggerRef = React.useRef<HTMLDivElement | null>(null);
  const tooltipRef = React.useRef<HTMLDivElement | null>(null);
  const [arrowLeft, setArrowLeft] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (!show) return;
    const t = triggerRef.current;
    const tt = tooltipRef.current;
    if (!t || !tt) return;
    // вычисляем положение стрелки
    const tr = t.getBoundingClientRect();
    const ttr = tt.getBoundingClientRect();
    let left = tr.left + tr.width / 2 - ttr.left;
    left = Math.max(16, Math.min(left, ttr.width - 16));
    setArrowLeft(left);
  }, [show, text]);

  return (
    <div className="info-tooltip-container" style={{ position: 'relative', display: 'inline-block' }}>
      <div
        className="info-tooltip-trigger"
        ref={triggerRef}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        style={{ display: 'inline-flex', alignItems: 'center' }}
      >
        {children}
      </div>
      {show && (
        <div
          ref={tooltipRef}
          className={`info-tooltip-box${placement === 'bottom' ? ' bottom' : ''}`}
          style={{ ['--arrow-left' as any]: arrowLeft !== null ? `${arrowLeft}px` : undefined }}
        >
          {text}
        </div>
      )}
    </div>
  );
};

export default InfoTooltip;
