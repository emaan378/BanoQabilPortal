import './LoadingSpinner.css';
export default function LoadingSpinner({ label = 'Loading...', size = 'md' }) {
  const dims = size === 'lg' ? 'w-8 h-8' : 'w-5 h-5';
  return (
    <div className="LoadingSpinner-div-1">
      <div className={`${dims} border-3 border-slate-200 border-t-amber-500 rounded-full animate-spin`} />
      <p className="LoadingSpinner-p-2">{label}</p>
    </div>
  );
}
