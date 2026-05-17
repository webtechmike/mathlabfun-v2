export type Profile = {
    id: string;
    display_name: string | null;
    email: string | null;
    daily_streak: number;
    super_streak: number;
    score_streak: number;
    best_score_streak: number;
    total_correct_answers: number;
    total_questions_answered: number;
    spacebucks: number;
    last_login_date: string | null;
    created_at: string;
    updated_at: string;
};

export type ProfileInsert = Omit<Profile, "created_at" | "updated_at"> &
    Partial<Pick<Profile, "created_at" | "updated_at">>;

export type ProfileUpdate = Partial<
    Omit<Profile, "id" | "created_at" | "updated_at">
>;

export type Answer = {
    id: number;
    user_id: string;
    game_slug: string;
    operation: string;
    input1: number;
    input2: number;
    submitted_answer: number | null;
    correct: boolean;
    spacebucks_awarded: number;
    answered_at: string;
};

export type AnswerInsert = Omit<Answer, "id" | "answered_at"> &
    Partial<Pick<Answer, "id" | "answered_at">>;

export type AnswerUpdate = Partial<Omit<Answer, "id" | "user_id">>;

export type Database = {
    public: {
        Tables: {
            profiles: {
                Row: Profile;
                Insert: ProfileInsert;
                Update: ProfileUpdate;
                Relationships: [];
            };
            answers: {
                Row: Answer;
                Insert: AnswerInsert;
                Update: AnswerUpdate;
                Relationships: [];
            };
        };
        Views: { [_ in never]: never };
        Functions: { [_ in never]: never };
        Enums: { [_ in never]: never };
        CompositeTypes: { [_ in never]: never };
    };
};
