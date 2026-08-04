import { Injectable } from "@nestjs/common";
import { Occurrence, OccurrenceType } from "@prisma/client";

@Injectable()
export class MatchingService {
  calculateMatchScore(source: Occurrence, candidate: Occurrence): number {
    // Apenas PERDIDO vs ENCONTRADO geram correspondências diretas
    if (
      (source.type === OccurrenceType.PERDIDO && candidate.type !== OccurrenceType.ENCONTRADO) ||
      (source.type === OccurrenceType.ENCONTRADO && candidate.type !== OccurrenceType.PERDIDO)
    ) {
      return 0;
    }

    let score = 0;

    // 1. Categoria (40%)
    if (source.category.toLowerCase() === candidate.category.toLowerCase()) {
      score += 40;
    }

    // 2. Município (20%)
    if (source.municipality.toLowerCase() === candidate.municipality.toLowerCase()) {
      score += 20;
    }

    // 3. Bairro (10%)
    if (source.neighborhood.toLowerCase() === candidate.neighborhood.toLowerCase()) {
      score += 10;
    }

    // 4. Marca / Modelo / Cor (15%)
    if (source.brand && candidate.brand && source.brand.toLowerCase() === candidate.brand.toLowerCase()) {
      score += 5;
    }
    if (source.model && candidate.model && source.model.toLowerCase() === candidate.model.toLowerCase()) {
      score += 5;
    }
    if (source.color && candidate.color && source.color.toLowerCase() === candidate.color.toLowerCase()) {
      score += 5;
    }

    // 5. Palavras-chave no título e descrição (15%)
    const sourceText = `${source.title} ${source.description}`.toLowerCase();
    const candidateText = `${candidate.title} ${candidate.description}`.toLowerCase();
    
    const sourceWords = sourceText.split(/\W+/).filter((w) => w.length > 3);
    const candidateWords = new Set(candidateText.split(/\W+/).filter((w) => w.length > 3));

    let commonWordsCount = 0;
    for (const word of sourceWords) {
      if (candidateWords.has(word)) {
        commonWordsCount++;
      }
    }

    if (sourceWords.length > 0) {
      const overlapRatio = commonWordsCount / Math.max(sourceWords.length, 1);
      score += Math.min(Math.round(overlapRatio * 15), 15);
    }

    return Math.min(score, 99);
  }
}
