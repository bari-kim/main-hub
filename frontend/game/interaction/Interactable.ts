export type InteractionKey = string;

export type InteractionPoint = {
  x: number;
  y: number;
};

export interface Interactable {
  readonly id: string;
  readonly interactionPosition: InteractionPoint;
  readonly interactionDistance: number;
  readonly interactionKeys: InteractionKey[];
  readonly mouseClickHitTest?: (pointerPosition: InteractionPoint) => boolean;
  interact(): void;
}
