import './LoginShell.css';

export default function LoginShell({ title, subtitle, children }) {
  return (
    <div className="LoginShell-div-1">
      <div className="LoginShell-div-2">
        <div className="LoginShell-div-3">
          <img src="/logo.png" alt="Bano Qabil" className="LoginShell-logo-5" />
          <div>
            <p className="LoginShell-p-6">Bano Qabil</p>
            <p className="LoginShell-p-7">FSD Campus ERP</p>
          </div>
        </div>

        <div className="LoginShell-div-8">
        <div className="LoginShell-div-9">
          <h1 className="LoginShell-h1-11">{title}</h1>
            <p className="LoginShell-p-12">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
