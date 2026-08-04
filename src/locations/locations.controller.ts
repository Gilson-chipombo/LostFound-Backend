import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { LocationsService } from "./locations.service";
import { Public } from "../auth/guards/public.decorator";

@ApiTags("Localizações & Municípios")
@Controller("api/locations")
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Public()
  @ApiOperation({ summary: "Obter lista de municípios e bairros mapeados em Luanda" })
  @Get("municipalities")
  getMunicipalities() {
    return this.locationsService.getMunicipalitiesAndNeighborhoods();
  }
}
