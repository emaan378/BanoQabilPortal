import { Calendar, ClipboardCheck, MessageSquare, CreditCard, Users, CheckCircle, ArrowRight } from 'lucide-react';

// Next action for a student, derived from their actual stored workflow state
// (pipeline stage + entry-test and interview subdocuments).
// `cls` maps to the existing stage-based pill/banner styles per page.
export function nextActionFor(student = {}) {
  const stage = student.stage;
  const test = student.test || {};
  const interview = student.interview || {};

  if (stage === 'enrolled') return { label: 'Completed', icon: CheckCircle, cls: 'enrolled' };
  if (stage === 'fee-verified') return { label: 'Enroll Student', icon: Users, cls: 'fee-verified' };
  if (stage === 'interview-passed') return { label: 'Verify Fee', icon: CreditCard, cls: 'interview-passed' };

  if (stage === 'test-scheduled') {
    // Interview already scheduled but not yet decided.
    if (interview.scheduledAt && interview.decision === 'Awaiting') {
      return { label: 'Record Interview Decision', icon: MessageSquare, cls: 'interview-passed' };
    }
    // Entry test passed (marks recorded) -> interview is the next step.
    if (test.result === 'Passed') {
      return { label: 'Schedule Interview', icon: MessageSquare, cls: 'interview-passed' };
    }
    if (test.result === 'Failed') {
      return { label: 'Retake Test', icon: ClipboardCheck, cls: 'test-scheduled' };
    }
    return { label: 'Conduct Test', icon: ClipboardCheck, cls: 'test-scheduled' };
  }

  if (stage === 'registered') {
    return { label: 'Schedule Entry Test', icon: Calendar, cls: 'registered' };
  }

  return { label: '—', icon: ArrowRight, cls: 'default' };
}