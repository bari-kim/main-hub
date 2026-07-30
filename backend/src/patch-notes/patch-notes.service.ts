import { Injectable } from "@nestjs/common";
import { PATCH_NOTES_SEED } from "./patch-notes.seed";
import type { PatchNotesResponse } from "./patch-notes.types";

@Injectable()
export class PatchNotesService {
  public getRecentPatchNotes(): PatchNotesResponse {
    return PATCH_NOTES_SEED;
  }
}
