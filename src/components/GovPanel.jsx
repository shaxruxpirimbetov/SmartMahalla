import './GovPanel.scss';

function GovPanel({ title, icon, children, className = '' }) {
  return (
    <section className={`gov-panel ${className}`.trim()}>
      <header className="gov-panel__header">
        {icon && (
          <span className="gov-panel__icon" aria-hidden="true">
            {icon}
          </span>
        )}
        {title && <h2 className="gov-panel__title">{title}</h2>}
      </header>
      <div className="gov-panel__body">{children}</div>
    </section>
  );
}

export default GovPanel;
