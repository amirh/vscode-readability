import * as rs from 'text-readability';

export interface AnalysisResult {
    textStandard: string;
    fleschReadingEase: string;
    fleschKincaidGrade: string;
    gunningFog: string;
    smogIndex: string;
    automatedReadabilityIndex: string;
    colemanLiauIndex: string;
    linsearWriteFormula: string;
    daleChallReadabilityScore: string;
}

export function analyzeText(text: string) : AnalysisResult {
    return {
        textStandard: rs.textStandard(text, false),
        fleschReadingEase: rs.fleschReadingEase(text),
        fleschKincaidGrade: rs.fleschKincaidGrade(text),
        gunningFog: rs.gunningFog(text),
        smogIndex: rs.smogIndex(text),
        automatedReadabilityIndex: rs.automatedReadabilityIndex(text),
        colemanLiauIndex: rs.colemanLiauIndex(text),
        linsearWriteFormula: rs.linsearWriteFormula(text),
        daleChallReadabilityScore: rs.daleChallReadabilityScore(text)
    };
}