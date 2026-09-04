import './EmptyState.css';
export default function EmptyState({ icon: Icon, message }) {
  return (
    <div className="EmptyState-div-1">
      {Icon && <Icon className="EmptyState-icon-2" />}
      <p className="EmptyState-p-3">{message}</p>
    </div>
  );
}
