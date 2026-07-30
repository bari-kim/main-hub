import { Controller, Get } from "@nestjs/common";
import { PatchNotesService } from "./patch-notes.service";
import type { PatchNotesResponse } from "./patch-notes.types";

@Controller("patch-notes")
export class PatchNotesController {
  constructor(private readonly patchNotesService: PatchNotesService) {}

  @Get()
  public getPatchNotes(): PatchNotesResponse {
    return this.patchNotesService.getRecentPatchNotes();
  }
}
