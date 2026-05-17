import type { ComponentType } from "react";

export type Operation =
    | "addition"
    | "subtraction"
    | "multiplication"
    | "division";

export interface Operator {
    symbol: string;
    label: Operation;
}

export interface Question {
    input1: number;
    input2: number;
    operator: Operator;
    answer: number;
    hint: string;
}

export interface GameComponentProps {
    level: number;
}

export interface GameMeta {
    slug: string;
    title: string;
    tagline: string;
    description: string;
}

export interface GameModule {
    meta: GameMeta;
    Component: ComponentType<GameComponentProps>;
}
