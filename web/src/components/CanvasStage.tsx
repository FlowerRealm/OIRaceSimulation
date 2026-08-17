import { forwardRef } from 'react';

export interface CanvasStageProps {
  /** Adds the inference-mode outline the engine toggles on the wrapper. */
  inference?: boolean;
}

/**
 * The tree board.
 *
 * This is the one part of the UI React does not own: the engine sizes #treeCanvas
 * and draws every node and edge into it. React only renders the wrapper so the
 * inference outline can become a prop later.
 */
export const CanvasStage = forwardRef<HTMLCanvasElement, CanvasStageProps>(function CanvasStage(
  { inference = false },
  ref
) {
  return (
    <div className={inference ? 'canvas-wrapper inference' : 'canvas-wrapper'} id="canvasWrapper">
      <canvas id="treeCanvas" ref={ref} />
    </div>
  );
});
