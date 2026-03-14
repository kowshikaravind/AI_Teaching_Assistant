function toPct(mark) {
  const total = Number(mark?.total_marks || 0);
  const scored = Number(mark?.marks_obtained || 0);
  if (!total || total <= 0) return 0;
  return Math.round((scored / total) * 100);
}

function sortByDateAsc(marks) {
  return [...marks].sort((a, b) => new Date(a.date_taken) - new Date(b.date_taken));
}

function normalizeSubject(subject) {
  const raw = String(subject || '').trim().toLowerCase();
  if (!raw) return 'general';
  return raw.replace(/\s+/g, ' ');
}

function toSubjectLabel(subject) {
  const cleaned = String(subject || '').trim().replace(/\s+/g, ' ');
  if (!cleaned) return 'General';
  return cleaned
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function groupMarksBySubject(testMarks) {
  const bySubject = {};
  (testMarks || []).forEach((m) => {
    const rawSubject = m?.subject || 'General';
    const key = normalizeSubject(rawSubject);
    if (!bySubject[key]) {
      bySubject[key] = {
        subjectLabel: toSubjectLabel(rawSubject),
        marks: [],
      };
    }
    bySubject[key].marks.push({
      ...m,
      subject: toSubjectLabel(rawSubject),
      pct: toPct(m),
    });
  });

  Object.keys(bySubject).forEach((subjectKey) => {
    bySubject[subjectKey].marks = sortByDateAsc(bySubject[subjectKey].marks);
  });

  return bySubject;
}

function analyzeSubjectTrend(subjectMarks) {
  const marks = subjectMarks || [];
  if (!marks.length) {
    return {
      suddenDrop: false,
      gradualDrop: false,
      teacherEscalation: false,
      latest: null,
      previous: null,
      dropAmount: 0,
    };
  }

  const len = marks.length;
  const latest = marks[len - 1] || null;
  const previous = marks[len - 2] || null;

  const suddenDrop =
    len >= 2 &&
    previous &&
    latest &&
    previous.pct - latest.pct >= 15;

  const gradualDrop =
    len >= 3 &&
    marks[len - 3].pct > marks[len - 2].pct &&
    marks[len - 2].pct > marks[len - 1].pct;

  // Escalate to teacher only when there was already a decline signal
  // and the next test still does not improve.
  const prevSuddenThenNoImprove =
    len >= 3 &&
    marks[len - 3].pct - marks[len - 2].pct >= 15 &&
    marks[len - 1].pct <= marks[len - 2].pct;

  const prevGradualThenNoImprove =
    len >= 4 &&
    marks[len - 4].pct > marks[len - 3].pct &&
    marks[len - 3].pct > marks[len - 2].pct &&
    marks[len - 1].pct <= marks[len - 2].pct;

  return {
    suddenDrop,
    gradualDrop,
    teacherEscalation: prevSuddenThenNoImprove || prevGradualThenNoImprove,
    latest,
    previous,
    dropAmount: previous && latest ? Math.max(0, previous.pct - latest.pct) : 0,
  };
}

export function buildStudentAlertNotifications(student, upcomingTests) {
  if (!student) return [];

  const notifications = [];

  const tests = [...(upcomingTests || [])].sort((a, b) => new Date(a.test_date) - new Date(b.test_date));
  tests.slice(0, 3).forEach((t, idx) => {
    notifications.push({
      id: `upcoming-${t.id || idx}`,
      type: 'resource',
      title: `Upcoming Test: ${t.test_name}`,
      text: `${t.topic} on ${t.test_date} for ${t.total_marks} marks. Plan revision from today.`,
      time: 'new',
      unread: true,
    });
  });

  const bySubject = groupMarksBySubject(student.test_marks || []);
  Object.values(bySubject).forEach(({ subjectLabel, marks }) => {
    const trend = analyzeSubjectTrend(marks);
    if (!trend.suddenDrop && !trend.gradualDrop) return;

    const reason = trend.suddenDrop
      ? `sudden drop detected (${trend.previous?.pct}% -> ${trend.latest?.pct}%)`
      : `gradual decrease detected over last 3 tests (${marks[marks.length - 3].pct}% -> ${marks[marks.length - 2].pct}% -> ${marks[marks.length - 1].pct}%)`;

    notifications.push({
      id: `ai-drop-${subjectLabel}`,
      type: 'urgent',
      title: `AI Alert: ${subjectLabel} needs focus`,
      text: `Your ${subjectLabel} marks are dropping (${reason}). Please concentrate and revise before the next test.`,
      time: 'ai',
      unread: true,
    });
  });

  if (!notifications.length) {
    notifications.push({
      id: 'ai-healthy',
      type: 'streak',
      title: 'AI Status: Stable',
      text: 'No drop trend detected right now. Keep your current study rhythm consistent.',
      time: 'now',
      unread: true,
    });
  }

  return notifications;
}

export function buildTeacherEscalations(students) {
  const rows = [];

  (students || []).forEach((student) => {
    const bySubject = groupMarksBySubject(student.test_marks || []);

    Object.values(bySubject).forEach(({ subjectLabel, marks }) => {
      const trend = analyzeSubjectTrend(marks);
      if (!trend.teacherEscalation) return;

      rows.push({
        id: `${student.id}-${subjectLabel}`,
        studentId: student.id,
        studentName: student.name,
        className: student.class_name,
        subject: subjectLabel,
        latest: trend.latest?.pct ?? 0,
        previous: trend.previous?.pct ?? 0,
        message:
          `No improvement after prior drop alert in ${subjectLabel}. Teacher intervention is recommended.`,
      });
    });
  });

  return rows.sort((a, b) => (b.previous - b.latest) - (a.previous - a.latest));
}
