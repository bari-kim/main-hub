import { PatchNotesService } from "./patch-notes.service";
import type { PatchNotesResponse } from "./patch-notes.types";
export declare class PatchNotesController {
    private readonly patchNotesService;
    constructor(patchNotesService: PatchNotesService);
    getPatchNotes(): PatchNotesResponse;
}
