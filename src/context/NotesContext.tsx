import React, { createContext, useContext, ReactNode } from "react";
import { useNotes, NotesState, NotesActions } from "../hooks/useNotes";

export interface NotesContextValue {
  state: NotesState;
  actions: NotesActions;
}

const NotesContext = createContext<NotesContextValue | undefined>(undefined);

export interface NotesProviderProps {
  children: ReactNode;
  autoRefreshOnFocus?: boolean;
}

export const NotesProvider: React.FC<NotesProviderProps> = ({
  children,
  autoRefreshOnFocus = true,
}) => {
  const [state, actions] = useNotes({ autoRefreshOnFocus });

  const value: NotesContextValue = {
    state,
    actions,
  };

  return (
    <NotesContext.Provider value={value}>{children}</NotesContext.Provider>
  );
};

export const useNotesContext = (): NotesContextValue => {
  const context = useContext(NotesContext);
  if (!context) {
    throw new Error(
      "useNotesContext deve essere usato all'interno di un NotesProvider"
    );
  }
  return context;
};

// Hook semplificati per accedere al contesto
export const useNotesState = (): NotesState => {
  const { state } = useNotesContext();
  return state;
};

export const useNotesActions = (): NotesActions => {
  const { actions } = useNotesContext();
  return actions;
};
