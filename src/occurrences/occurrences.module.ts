import { Module } from "@nestjs/common";
import { OccurrencesService } from "./occurrences.service";
import { OccurrencesController } from "./occurrences.controller";
import { MatchingService } from "./matching.service";

@Module({
  controllers: [OccurrencesController],
  providers: [OccurrencesService, MatchingService],
  exports: [OccurrencesService, MatchingService],
})
export class OccurrencesModule {}
