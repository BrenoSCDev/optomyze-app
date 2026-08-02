/**
 * SHARED KANBAN DRAG-AND-DROP
 *
 * One configuration for every card-into-column board in the CRM — the Tasks
 * board, the lead funnel and the deal funnel. They had drifted into three
 * different setups with noticeably different feel, so the tuning lives here
 * and nowhere else.
 *
 * The rules that make a board feel right, all of which were violated somewhere
 * before this existed:
 *
 * 1. When a DragOverlay is rendered, the *source* card must never apply the
 *    draggable transform. Doing both means the original card follows the
 *    cursor underneath the overlay copy — a double image on every drag.
 * 2. The whole card is the drag handle. A grip icon is an affordance, not the
 *    only place you may grab.
 * 3. The source card is hidden (`invisible`), not faded. A 20%-opacity ghost
 *    that also scales reads as a rendering fault.
 * 4. Drop animation must not overshoot. A bouncy ease makes the card appear to
 *    miss the column and spring back.
 * 5. The move is applied optimistically and rolled back on failure. Waiting on
 *    the network before the card moves is what makes a board feel heavy.
 */

import React from 'react';
import {
  CollisionDetection, KeyboardSensor, PointerSensor, PointerSensorOptions,
  closestCorners, useSensor, useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { cn } from '@/lib/utils';

/**
 * Elements that own their own pointer behaviour. A press starting inside one
 * of these must never begin a card drag, or the funnel cards' buttons, tag
 * chips and dropdown menus stop working the moment the whole card becomes
 * draggable. Opt anything else out with `data-no-drag`.
 */
const INTERACTIVE = 'button, a, input, textarea, select, [role="menuitem"], [role="button"], [data-no-drag]';

/**
 * True when the press landed on an interactive control *inside* the card.
 *
 * `dragRoot` must be excluded rather than just searched from the target
 * upwards: useDraggable's own `attributes` put `role="button"` on the element
 * they are spread onto, so the card root matches INTERACTIVE itself. Matching
 * it would make every card permanently undraggable.
 */
const startsOnInteractiveElement = (target: EventTarget | null, dragRoot: Element | null): boolean => {
  if (!(target instanceof Element)) return false;

  const match = target.closest(INTERACTIVE);
  if (!match) return false;

  // Only a control strictly within the draggable counts.
  return !!dragRoot && match !== dragRoot && dragRoot.contains(match);
};

/**
 * PointerSensor that declines to activate on interactive children, so the card
 * root can carry the drag listeners without swallowing clicks meant for the
 * controls inside it.
 *
 * The primary-pointer / left-button checks and the onActivation callback are
 * dnd-kit's own default activator behaviour, reproduced here deliberately:
 * overriding `activators` replaces the default outright, and dropping those
 * checks would let a right-click or a second touch point start a drag.
 */
class CardPointerSensor extends PointerSensor {
  static activators = [
    {
      eventName: 'onPointerDown' as const,
      handler: (
        pointerEvent: React.PointerEvent,
        { onActivation }: PointerSensorOptions,
      ) => {
        const event = pointerEvent.nativeEvent;

        if (!event.isPrimary || event.button !== 0) {
          return false;
        }

        // currentTarget is the element the draggable listeners are attached
        // to — the card root. Read it from the synthetic event, since the
        // native one has already been dispatched and nulls it out.
        const dragRoot = pointerEvent.currentTarget as Element | null;

        if (startsOnInteractiveElement(event.target, dragRoot)) {
          return false;
        }

        onActivation?.({ event });
        return true;
      },
    },
  ];
}

/**
 * 6px before a drag begins: far enough that clicking a card to open it is
 * never mistaken for a drag, close enough that dragging feels immediate.
 * The funnels previously used 10px, which reads as a lag before the card
 * un-sticks.
 */
export const useKanbanSensors = () =>
  useSensors(
    useSensor(CardPointerSensor, { activationConstraint: { distance: 6 } }),
    // Keyboard dragging for anyone not using a pointer.
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

/**
 * Cards register as draggables only, never droppables, so the sole collision
 * candidates are the columns themselves — which is why plain closestCorners is
 * safe here and no id filtering is needed.
 *
 * closestCorners beats pointerWithin for this shape of board: it still resolves
 * a target when the cursor is past the end of a short column or in the gutter
 * between two, where pointerWithin returns nothing and the drop is silently
 * abandoned.
 */
export const kanbanCollisionDetection: CollisionDetection = closestCorners;

/** Decisive, no overshoot. */
export const KANBAN_DROP_ANIMATION = {
  duration: 180,
  easing: 'cubic-bezier(0.2, 0, 0, 1)',
};

/**
 * The card that follows the cursor. Deliberately restrained — a slight tilt
 * and a real shadow. The previous funnel overlay stacked a blurred glow, a 5%
 * upscale and a 2px accent border, which smeared during movement.
 */
export const KanbanDragPreview: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <div className={cn('pointer-events-none rotate-1 opacity-95 shadow-elevation-3', className)}>
    {children}
  </div>
);

/**
 * Wrapper for the card in its column while it is being dragged.
 *
 * Kept mounted rather than removed: unmounting collapses the column mid-drag
 * and the drop targets jump out from under the cursor.
 */
export const KanbanDragSource: React.FC<{
  isDragging: boolean;
  children: React.ReactNode;
  className?: string;
}> = ({ isDragging, children, className }) => (
  <div className={cn('touch-none', isDragging && 'invisible', className)}>
    {children}
  </div>
);
