import { useRef, useEffect } from 'react';
import { useTutorialContext } from '../contexts/TutorialContext';

/**
 * Custom hook to easily register an element for tutorial spotlight
 *
 * @param elementKey - Unique key to identify this element in the tutorial
 * @returns ref - Ref to attach to your component
 *
 * @example
 * ```typescript
 * const chatInputRef = useTutorialElement('chatInput');
 *
 * return (
 *   <TextInput ref={chatInputRef} ... />
 * );
 * ```
 */
export const useTutorialElement = (elementKey: string) => {
  const { registerElementRef } = useTutorialContext();
  const elementRef = useRef(null);

  useEffect(() => {
    if (elementKey && elementRef.current) {
      registerElementRef(elementKey, elementRef.current);
    }
  }, [elementKey, registerElementRef]);

  return elementRef;
};
