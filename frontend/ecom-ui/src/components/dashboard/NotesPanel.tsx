import React, { useState } from 'react';
import './NotesPanel.css';

export interface Note {
  title: string;
  body: string;
}

export const NotesPanel = ({ notes, defaultExpanded = false }: { notes: Note[], defaultExpanded?: boolean }) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className="notes-accordion">
      <div className={`notes-header ${expanded ? 'expanded' : ''}`} onClick={() => setExpanded(!expanded)}>
        <div className="notes-title">
          <span className="material-icons">lightbulb</span>
          Why these visuals / how to read this tab
        </div>
        <span className="material-icons expand-icon">{expanded ? 'expand_less' : 'expand_more'}</span>
      </div>
      
      {expanded && (
        <div className="notes-content">
          {notes.map((n, i) => (
            <div key={i} className="note">
              <div className="note-title">{n.title}</div>
              <div className="note-body">{n.body}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
