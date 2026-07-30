"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatchNotesService = void 0;
const common_1 = require("@nestjs/common");
const patch_notes_seed_1 = require("./patch-notes.seed");
let PatchNotesService = class PatchNotesService {
    getRecentPatchNotes() {
        return patch_notes_seed_1.PATCH_NOTES_SEED;
    }
};
exports.PatchNotesService = PatchNotesService;
exports.PatchNotesService = PatchNotesService = __decorate([
    (0, common_1.Injectable)()
], PatchNotesService);
//# sourceMappingURL=patch-notes.service.js.map