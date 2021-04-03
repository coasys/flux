export enum JuntoLanguageTypes {
    SocialContext = "path/to/language",
    ShortForm = "path/to/language",
    SharedPerspective = "path/to/languages",
    AgentProfiles = "path/to/languages"
}

export const JuntoLanguages = {
    SocialContext: {
        name: "SocialContext",
        hash: "",
        hcDnaPath: "ad4m/languages/social-context/social-context.dna",
        hcDnaWorkDir: "ad4m/languages/social-context/social-context",
        bundlePath: "ad4m/languages/social-context/build/bundle.js",
    },
    ShortForm: {
        name: "ShortForm",
        hash: "",
        hcDnaPath: "ad4m/languages/shortform/shortform.dna",
        hcDnaWorkDir: "ad4m/languages/shortform/shortform",
        bundlePath: "ad4m/languages/shortform/build/bundle.js",
    },
    SharedPerspective: {
        name: "SharedPerspective",
        hash: "",
        hcDnaPath: "ad4m/languages/shared-perspectives/shared-perspectives.dna",
        hcDnaWorkDir: "ad4m/languages/shared-perspectives/shared-perspectives",
        bundlePath: "ad4m/languages/shared-perspectives/build/bundle.js",
    },
    AgentProfiles: {
        name: "AgentProfiles",
        hash: "",
        hcDnaPath: "ad4m/languages/agent-profiles/profiles.dna",
        hcDnaWorkDir: "ad4m/languages/agent-profiles/profiles",
        bundlePath: "ad4m/languages/agent-profiles/build/bundle.js",
    }
}