import type { InputManager } from "../input/InputManager";
import type { Interactable, InteractionPoint } from "./Interactable";

type InteractionSystemUpdateArgs = {
  playerPosition: InteractionPoint;
  input: InputManager;
  interactables: Interactable[];
};

export class InteractionSystem {
  public update({
    playerPosition,
    input,
    interactables,
  }: InteractionSystemUpdateArgs) {
    const pressedKeys = new Set<string>();

    for (const interactable of interactables) {
      for (const key of interactable.interactionKeys) {
        const normalizedKey = key.toLowerCase();

        if (input.wasPressed(normalizedKey)) {
          pressedKeys.add(normalizedKey);
        }
      }
    }

    for (const key of pressedKeys) {
      const closestInteractable = this.findClosestInteractable(
        playerPosition,
        interactables,
        key,
      );

      closestInteractable?.interact();
    }
  }

  private findClosestInteractable(
    playerPosition: InteractionPoint,
    interactables: Interactable[],
    key: string,
  ) {
    let closestInteractable: Interactable | null = null;
    let closestDistance = Number.POSITIVE_INFINITY;

    for (const interactable of interactables) {
      if (!interactable.interactionKeys.some((interactionKey) => interactionKey.toLowerCase() === key)) {
        continue;
      }

      const distance = this.getDistance(
        playerPosition,
        interactable.interactionPosition,
      );

      if (distance > interactable.interactionDistance) {
        continue;
      }

      if (distance < closestDistance) {
        closestDistance = distance;
        closestInteractable = interactable;
      }
    }

    return closestInteractable;
  }

  private getDistance(a: InteractionPoint, b: InteractionPoint) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }
}
