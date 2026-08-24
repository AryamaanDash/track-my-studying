const subjectColors = [
  "var(--subject-blue)",
  "var(--subject-mustard)",
  "var(--subject-sage)",
  "var(--subject-orange)",
  "var(--subject-teal)",
  "var(--subject-plum)",
];

export function getSubjectColor(subject: string) {
  const normalizedSubject = subject.trim().toLowerCase();
  let hash = 0;

  for (let index = 0; index < normalizedSubject.length; index += 1) {
    hash = (hash * 31 + normalizedSubject.charCodeAt(index)) >>> 0;
  }

  return subjectColors[hash % subjectColors.length];
}
