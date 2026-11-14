export const person = (id: string, status = "suggested", extra = {}) => ({
  id, name: `Person ${id}`, role: "Designer", company: "Example", bio: "Community design",
  interests: ["community"], eventIds: ["event"], sharedEventIds: ["event"],
  met: false, notes: "", commitment: "", draft: "", nextAction: "", dueDate: "",
  dismissed: false, evidence: [], source: "Synthetic", linkedinUrl: "", status, ...extra,
});
export const workspace = {
  preferences: { goal: "Build community", interests: ["community"] },
  events: [{
    id: "event", title: "Community workshop", date: "2026-11-03", time: "18:00",
    kind: "past", location: "Example", host: "Example", debrief: "", source: "Synthetic",
  }, {
    id: "next", title: "Next workshop", date: "2026-11-10", time: "18:00",
    kind: "upcoming", location: "Example", host: "Example", debrief: "", source: "Synthetic",
  }],
  people: [
    person("suggested"), person("saved", "saved"), person("contacted", "contacted"),
    person("replied", "replied"), person("registration", "suggested", { sharedEventIds: [] }),
    person("dismissed", "saved", { dismissed: true }),
  ],
};
export const useGetWorkspace = () => ({ data: workspace, isLoading: false, refetch() {} });
export const useGetSummary = () => ({ data: {
  eventsAttended: 1, peopleMet: 0, openFollowups: 3, dueCount: 0, conversationsStarted: 2,
} });
const mutation = () => ({ isPending: false, mutate() {}, reset() {} });
export const useUpdatePerson = mutation;
export const useUpdatePreferences = mutation;
export const useSuggestDraft = mutation;
export const useAdvanceDemo = mutation;
export const useResetDemo = mutation;
export const usePreviewSyntheticImport = mutation;
export const useCommitSyntheticImport = mutation;
export const getGetWorkspaceQueryKey = () => ["workspace"];
export const getGetSummaryQueryKey = () => ["summary"];
