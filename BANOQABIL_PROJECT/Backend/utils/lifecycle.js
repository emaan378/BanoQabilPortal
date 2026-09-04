const STAGES = ['registered', 'test-scheduled', 'interview-passed', 'fee-verified', 'enrolled'];
const TEST_RESULTS = ['Awaiting', 'Passed', 'Failed'];
const INTERVIEW_DECISIONS = ['Awaiting', 'Passed', 'Failed'];
const TEST_STATUSES = ['pending', 'scheduled', 'passed', 'failed'];
const INTERVIEW_STATUSES = ['pending', 'scheduled', 'passed', 'failed'];
const BATCH_ALLOCATION_STATUSES = ['pending', 'allocated'];
const FEE_STATUSES = ['unpaid', 'partial', 'paid'];
const DOC_STATUSES = ['pending', 'verified', 'rejected'];

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const deriveTestStatus = (registration) => {
  if (registration.test?.result === 'Passed') return 'passed';
  if (registration.test?.result === 'Failed') return 'failed';
  if (registration.test?.scheduledAt) return 'scheduled';
  return 'pending';
};

const deriveInterviewStatus = (registration) => {
  if (registration.interview?.decision === 'Passed') return 'passed';
  if (registration.interview?.decision === 'Failed') return 'failed';
  if (registration.interview?.scheduledAt) return 'scheduled';
  return 'pending';
};

const deriveStatuses = (registration) => ({
  testStatus: deriveTestStatus(registration),
  interviewStatus: deriveInterviewStatus(registration),
});

module.exports = {
  STAGES,
  TEST_RESULTS,
  INTERVIEW_DECISIONS,
  TEST_STATUSES,
  INTERVIEW_STATUSES,
  BATCH_ALLOCATION_STATUSES,
  FEE_STATUSES,
  DOC_STATUSES,
  escapeRegex,
  deriveTestStatus,
  deriveInterviewStatus,
  deriveStatuses,
};
