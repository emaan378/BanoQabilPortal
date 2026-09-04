import { GraduationCap, Shield, Settings, ArrowLeft, ArrowRight } from 'lucide-react';
import './PortalSelector.css';

const portals = [
  {
    key: 'student-login',
    icon: GraduationCap,
    title: 'Student Portal',
    desc: 'Dashboard, courses, attendance, and assignments.',
    color: 'emerald',
    features: ['Attendance Calendar', 'Course Progress', 'Assignment Tracking', 'Fee & Payments'],
  },
  {
    key: 'teacher-login',
    icon: Shield,
    title: 'Teacher Portal',
    desc: 'My batches, attendance marking, assignments, timetable, and records.',
    color: 'teal',
    features: ['Mark Attendance', 'Grade Assignments', 'Weekly Timetable', 'Course Material'],
  },
  {
    key: 'admin-login',
    icon: Settings,
    title: 'Admin Portal',
    desc: 'Dashboard, registrations, tests & interviews, batch allocation, fees, reports.',
    color: 'amber',
    features: ['Admissions Pipeline', 'Batch Allocation', 'Fee Management', 'Center Reports'],
  },
];

export default function PortalSelector({ navigate }) {
  return (
    <div className="PortalSelector-div-1">
      <div className="PortalSelector-div-2">
        <button
          onClick={() => navigate('landing')}
          className="PortalSelector-button-3"
        >
          <ArrowLeft className="PortalSelector-arrowleft-4" />
          Back to Website
        </button>
        <div className="PortalSelector-div-5">
          <img src="/logo.png" alt="Bano Qabil" className="PortalSelector-logo-6" />
          <span className="PortalSelector-span-8">Bano Qabil ERP</span>
        </div>
      </div>

      <div className="PortalSelector-div-9">
        <p className="PortalSelector-p-10">Bano Qabil FSD Campus</p>
        <h1 className="PortalSelector-h1-11">
          Choose a Portal
        </h1>
        <p className="PortalSelector-p-12">
          Select your role to access your personalized dashboard. Each portal is secured and role-specific.
        </p>

        <div className="PortalSelector-div-13">
          {portals.map((p) => (
            <button
              key={p.title}
              onClick={() => navigate(p.key)}
              className={`PortalSelector-button-14 PortalSelector-button-14--${p.color}`}
            >
              <div className={`w-12 h-12 rounded-xl mb-5 flex items-center justify-center ${
                p.color === 'emerald'
                  ? 'bg-emerald-600'
                  : p.color === 'teal'
                  ? 'bg-teal-600'
                  : 'bg-amber-500'
              } group-hover:scale-110 transition-transform`}>
                <p.icon className="PortalSelector-picon-15" />
              </div>
              <h2 className="PortalSelector-h2-16">{p.title}</h2>
              <p className="PortalSelector-p-17">{p.desc}</p>
              <ul className="PortalSelector-ul-18">
                {p.features.map((f) => (
                  <li key={f} className="PortalSelector-li-19">
                    <span className="PortalSelector-span-20" />
                    {f}
                  </li>
                ))}
              </ul>
                <div className="PortalSelector-div-21">
                  Enter Portal
                  <ArrowRight className="PortalSelector-arrowright-22" />
                </div>
            </button>
          ))}
        </div>

        <div className="PortalSelector-div-23">
          <span>75,000+ Students Trained</span>
          <span className="PortalSelector-span-24" />
          <span>50+ Active Centers</span>
          <span className="PortalSelector-span-24" />
          <span>29+ Courses Offered</span>
        </div>
      </div>
    </div>
  );
}
