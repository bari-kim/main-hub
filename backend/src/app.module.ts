import { Module } from "@nestjs/common";
import { PatchNotesController } from "./patch-notes/patch-notes.controller";
import { PatchNotesService } from "./patch-notes/patch-notes.service";

@Module({
  controllers: [PatchNotesController],
  providers: [PatchNotesService],
})
export class AppModule {}
