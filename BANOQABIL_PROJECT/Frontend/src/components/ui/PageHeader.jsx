import './PageHeader.css';
export default function PageHeader({ title, subtitle, action }) {
  return (
    <div className="PageHeader-div-1">
      <div>
        <h1 className="PageHeader-h1-2">{title}</h1>
        {subtitle && <p className="PageHeader-p-3">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
