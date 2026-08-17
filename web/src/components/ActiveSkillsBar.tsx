import type { ReactNode } from 'react';

export interface ActiveSkillTagProps {
  children: ReactNode;
}

/** One owned-skill chip. */
export function ActiveSkillTag({ children }: ActiveSkillTagProps) {
  return <span className="active-skill-tag">{children}</span>;
}

export interface ActiveSkillsBarProps {
  children?: ReactNode;
}

/** Row of owned-skill chips. The engine fills #activeSkillsBar. */
export function ActiveSkillsBar({ children }: ActiveSkillsBarProps) {
  return (
    <div className="active-skills-bar" id="activeSkillsBar">
      {children}
    </div>
  );
}
