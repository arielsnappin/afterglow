import type { GetWorkspaceResponse } from "@workspace/api-zod";

export type Workspace = ReturnType<typeof GetWorkspaceResponse.parse>;
export type Person = Workspace["people"][number];

export function normalizeDemoColors(state: Workspace): Workspace {
  const palette: Record<string, string> = {
    sage: "#527d6b", rose: "#b66f80", lavender: "#8671a6",
    gold: "#b58b3c", terracotta: "#bb6a4e", blue: "#587f9c",
  };
  for (const record of [...state.events, ...state.people]) {
    record.color = palette[record.color] ?? record.color;
  }
  return state;
}

const day = (offset: number): string => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
};

export function createDemoWorkspace(): Workspace {
  const events: Workspace["events"] = [
    {
      id: "founders-table", title: "The Founders' Table",
      date: day(-2), time: "6:00 – 9:00 PM",
      location: "The Atrium · Brooklyn, NY", host: "Gather Collective",
      description: "An intimate evening of honest conversations about building things that matter. Founders, designers, and curious people, all around one table.",
      kind: "past", source: "Synthetic demo dataset", tags: ["Founders", "Product", "Community"],
      debrief: "", color: "terracotta", attendanceLabel: "Demo registration list — actual attendance unknown unless noted",
    },
    {
      id: "design-after-hours", title: "Design, After Hours",
      date: day(-9), time: "6:30 – 8:30 PM",
      location: "Studio North · Manhattan, NY", host: "Design Assembly",
      description: "A small gathering on thoughtful product design, creative tools, and the messy middle of making something new.",
      kind: "past", source: "Synthetic demo dataset", tags: ["Design", "Creative tools", "Product"],
      debrief: "Enjoyed talking about the gap between a promising prototype and a useful product. Follow up with Maya about her research practice.",
      color: "sage", attendanceLabel: "Demo registration list — actual attendance unknown unless noted",
    },
    {
      id: "builders-breakfast", title: "Builders & Coffee",
      date: day(5), time: "9:00 – 11:00 AM",
      location: "Common Ground · Brooklyn, NY", host: "Gather Collective",
      description: "Good coffee, fresh ideas, and familiar faces. A relaxed morning for people building their next chapter.",
      kind: "upcoming", source: "Synthetic demo dataset", tags: ["Founders", "AI", "Community"],
      debrief: "", color: "gold", attendanceLabel: "Demo registrations — attendance not confirmed",
    },
  ];

  const base = {
    source: "Synthetic demo profile", linkedinUrl: null,
    notes: "", commitment: "", draft: "", nextAction: "", dueDate: "",
    status: "suggested" as const, dismissed: false, met: false,
  };
  const people: Person[] = [
    {
      ...base, id: "jordan-lee", name: "Jordan Lee", initials: "JL", color: "sage",
      role: "Co-founder", company: "Forma Labs",
      bio: "Building developer tools that make the first five minutes feel effortless. Previously a product engineer.",
      interests: ["Developer tools", "Onboarding", "AI", "Product"],
      eventIds: ["founders-table", "builders-breakfast"], met: true,
      notes: "We discussed how hard it is to make developer onboarding feel human. Jordan is experimenting with guided first-run experiences.",
      evidence: ["Demo profile: building developer tools", "Demo meeting note: discussed onboarding"],
      commitment: "Send the onboarding research article we discussed.",
      nextAction: "Send onboarding article and ask about the first-run experiment.", dueDate: day(0),
    },
    {
      ...base, id: "maya-patel", name: "Maya Patel", initials: "MP", color: "rose",
      role: "Independent product designer", company: "Fieldwork",
      bio: "Helping early-stage teams turn fuzzy questions into thoughtful products. Interested in research, community, and useful AI.",
      interests: ["Product", "Design", "User research", "AI"],
      eventIds: ["founders-table", "design-after-hours", "builders-breakfast"], met: true, status: "saved",
      notes: "Talked about lightweight research for small teams. Maya offered to compare interview guides.",
      evidence: ["Demo profile: early-stage product design", "Demo note: offered to compare interview guides"],
      commitment: "Share my interview guide.", nextAction: "Compare research approaches over coffee.", dueDate: day(1),
    },
    {
      ...base, id: "alex-rivera", name: "Alex Rivera", initials: "AR", color: "lavender",
      role: "Engineering lead", company: "Common Thread",
      bio: "Leading a small engineering team working on collaboration software. Likes practical AI and learning from other builders.",
      interests: ["AI", "Engineering", "Collaboration", "Developer tools"],
      eventIds: ["founders-table"], met: false,
      evidence: ["Demo registration: The Founders' Table", "Demo profile: engineering and collaboration tools"],
      nextAction: "Introduce myself through our shared event.",
    },
    {
      ...base, id: "sam-chen", name: "Sam Chen", initials: "SC", color: "gold",
      role: "Founder", company: "Small Hours",
      bio: "Exploring calmer ways to work. Interested in community-led products and sustainable businesses.",
      interests: ["Community", "Product", "Founders"],
      eventIds: ["founders-table", "builders-breakfast"], met: true, status: "contacted",
      notes: "Chatted about small communities and sustainable growth. I sent a note after the event.",
      evidence: ["Demo conversation note: community-led growth"],
      nextAction: "Check in next week if there is no reply.", dueDate: day(6),
      draft: "Hi Sam, I enjoyed our conversation at The Founders' Table about building smaller, more intentional communities. Would love to continue it over coffee sometime.",
    },
    {
      ...base, id: "elena-brooks", name: "Elena Brooks", initials: "EB", color: "terracotta",
      role: "Product lead", company: "Daylight",
      bio: "Working on collaboration tools for creative teams. Enjoys connecting thoughtful builders.",
      interests: ["Product", "Design", "Collaboration"],
      eventIds: ["founders-table"], met: true,
      notes: "A short conversation about product rituals. Would be good to learn more about how her team works.",
      evidence: ["Demo profile: product lead", "Demo meeting note: product rituals"],
    },
    {
      ...base, id: "noah-williams", name: "Noah Williams", initials: "NW", color: "blue",
      role: "Community builder", company: "Gather Collective",
      bio: "Bringing curious people together around shared interests. Hosts The Founders' Table and Builders & Coffee.",
      interests: ["Community", "Events", "Founders"],
      eventIds: ["founders-table", "builders-breakfast"], met: true, status: "replied",
      notes: "Thanked Noah for hosting. He replied and suggested joining the next breakfast.",
      evidence: ["Demo organizer profile", "Demo note: suggested the next breakfast"],
      nextAction: "Say hello at Builders & Coffee.", dueDate: day(5),
    },
    {
      ...base, id: "jordan-park", name: "Jordan Park", initials: "JP", color: "blue",
      role: "Founder", company: "Patchwork",
      bio: "Exploring tools for independent creators. Profile details are limited.",
      interests: ["Creative tools", "Founders"], eventIds: ["founders-table"], met: false,
      evidence: ["Demo registration only; limited profile details", "Different person from Jordan Lee — do not merge"],
    },
    {
      ...base, id: "priya-shah", name: "Priya Shah", initials: "PS", color: "sage",
      role: "Researcher", company: "Independent",
      bio: "Researching how people develop trust in new software and AI-assisted workflows.",
      interests: ["User research", "AI", "Trust"],
      eventIds: ["design-after-hours", "builders-breakfast"], met: true, status: "saved",
      notes: "We compared ways of testing trust in AI. I'd like to hear more about her qualitative research.",
      evidence: ["Demo note: conversation about trust in AI", "Demo registration for Builders & Coffee"],
      nextAction: "Prepare a question about qualitative AI research.",
    },
    {
      ...base, id: "leo-morgan", name: "Leo Morgan", initials: "LM", color: "lavender",
      role: "Creative technologist", company: "Open Studio",
      bio: "Prototyping playful interfaces and creative tools. Curious about design engineering.",
      interests: ["Design", "Creative tools", "Engineering"],
      eventIds: ["design-after-hours"], met: false,
      evidence: ["Demo event registration", "Demo profile: design engineering"],
    },
    {
      ...base, id: "avery-kim", name: "Avery Kim", initials: "AK", color: "rose",
      role: "Early-stage builder", company: "Independent",
      bio: "Working on an early-stage idea. More profile details aren't available.",
      interests: ["Founders"], eventIds: ["builders-breakfast"], met: false,
      evidence: ["Demo registration for an upcoming event; no conversation history"],
    },
  ];
  return normalizeDemoColors({
    events, people, preferences: {
      goal: "Meet thoughtful builders and explore ideas for useful AI products",
      interests: ["AI", "Product", "Community"],
    }, isDemo: true,
  });
}
