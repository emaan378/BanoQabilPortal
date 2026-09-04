import './FormField.css';
export default function FormField({ label, error, children, required }) {
  return (
    <div>
      <label className="FormField-label-1">
        {label}{required && <span className="FormField-span-2"> *</span>}
      </label>
      {children}
      {error && <p className="FormField-p-3">{error}</p>}
    </div>
  );
}

export const inputCls = "w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 bg-white transition-all";
