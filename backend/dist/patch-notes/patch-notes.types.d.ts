export type PatchNote = {
    id: string;
    title: string;
    date: string;
    summary: string;
    details: string[];
};
export type PatchNotesResponse = {
    monthPatchCount: number;
    patchNotes: PatchNote[];
};
