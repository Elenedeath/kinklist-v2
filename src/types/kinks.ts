export interface ExKink {
    name: string;
    ratings: Record<string, string>;
    comment?: string;
    name_fr?: string;
    comment_fr?: string;
}

export interface ExKinkCategory {
    name: string;
    subcategories: string[];
    kinks: ExKink[];
    name_fr?: string;
    subcategories_fr?: string[];
}

export interface InKink extends ExKink {
    id: string;
}

export interface InKinkCategory extends ExKinkCategory {
    id: string;
    kinks: InKink[];
}
